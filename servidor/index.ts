/// <reference types="node" />
/**
 * SERVIDOR — API simples entre o app e o banco MySQL.
 * Rodar: npm run servidor   (antes, execute servidor/banco.sql no MySQL Workbench)
 *
 * Rotas:
 *   GET  /saude       → o servidor e o banco estão no ar?
 *   GET  /dados       → todos os dados (sem as senhas)
 *   POST /entrar      → confere e-mail e senha
 *   POST /sincronizar → grava o que mudou no app (numa transação: tudo ou nada)
 *
 * As regras de negócio (quem pode o quê) ficam no app, em src/dados/banco.tsx.
 */
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import mysql, { type PoolConnection, type RowDataPacket } from 'mysql2/promise';

import { criarDadosDemonstracao } from '../src/dados/demonstracao';
import {
  colunasDe,
  deLinha,
  diferencas,
  ehTabela,
  NOMES_TABELAS,
  paraLinha,
  resumo,
  TABELAS,
  type Foto,
  type Mudancas,
  type Tabela,
} from '../src/dados/esquema';
import type { BancoDados, Usuario } from '../src/dados/tipos';

// Configuração: servidor/.env (copie de servidor/.env.exemplo). Sem o arquivo, usa os valores padrão.
try {
  process.loadEnvFile('servidor/.env');
} catch {
  /* sem .env: segue com os padrões */
}

const PORTA = Number(process.env.PORTA ?? 3333);
const banco = mysql.createPool({
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: Number(process.env.MYSQL_PORTA ?? 3306),
  user: process.env.MYSQL_USUARIO ?? 'root',
  password: process.env.MYSQL_SENHA ?? '',
  database: process.env.MYSQL_BANCO ?? 'meusenai',
  charset: 'utf8mb4',
});

/* ───────── Leitura ───────── */

/** Ordem de leitura: o que tem data vem do mais novo para o mais antigo. */
const ordem = (tabela: Tabela) => ('criadoEm' in TABELAS[tabela] ? 'criadoEm DESC' : 'nome');

async function lerTudo(): Promise<BancoDados> {
  const dados = {} as BancoDados;
  for (const tabela of NOMES_TABELAS) {
    const [linhas] = await banco.query<RowDataPacket[]>(`SELECT * FROM ${tabela} ORDER BY ${ordem(tabela)}`);
    (dados[tabela] as object[]) = linhas.map((l) => deLinha(tabela, l));
  }
  dados.contadorProtocolo = await lerContador(banco);
  return dados;
}

async function lerContador(con: Pick<PoolConnection, 'query'>) {
  const [linhas] = await con.query<RowDataPacket[]>("SELECT valor FROM config WHERE chave = 'contadorProtocolo'");
  return Number(linhas[0]?.valor ?? 0);
}

/* ───────── Gravação ───────── */

/** Outro aparelho mudou a mesma linha antes: o app precisa buscar a versão nova. */
class Conflito extends Error {}

/** Grava as mudanças numa transação. Se algo falhar, nada é gravado. */
async function gravar(mudancas: Mudancas) {
  const con = await banco.getConnection();
  try {
    await con.beginTransaction();
    for (const { tabela, objeto, antes } of mudancas.gravar) {
      const campos = colunasDe(tabela);
      const valores = paraLinha(tabela, objeto);
      // FOR UPDATE trava a linha até o fim da transação (ninguém grava nela no meio).
      const [existe] = await con.query<RowDataPacket[]>(`SELECT * FROM ${tabela} WHERE id = ? FOR UPDATE`, [objeto.id]);
      const noBanco = existe[0] ? resumo(tabela, deLinha(tabela, existe[0])) : undefined;
      if (noBanco !== antes) throw new Conflito(`${tabela} ${objeto.id} mudou em outro aparelho`);
      if (existe.length) {
        // A senha não vem do app (GET /dados não a envia): só muda se vier preenchida.
        const pares = campos.map((c, i) => ({ c, v: valores[i] })).filter((p) => p.c !== 'id' && !(p.c === 'senha' && p.v === null));
        await con.query(`UPDATE ${tabela} SET ${pares.map((p) => `${p.c} = ?`).join(', ')} WHERE id = ?`, [
          ...pares.map((p) => p.v),
          objeto.id,
        ]);
      } else {
        await con.query(`INSERT INTO ${tabela} (${campos.join(', ')}) VALUES (?)`, [valores]);
      }
    }
    for (const { tabela, id } of mudancas.apagar) {
      await con.query(`DELETE FROM ${tabela} WHERE id = ?`, [id]);
    }
    // Contador de protocolo: fica com o maior valor, para dois aparelhos não repetirem número.
    const contador = String(Math.max(await lerContador(con), mudancas.contadorProtocolo));
    await con.query("INSERT INTO config (chave, valor) VALUES ('contadorProtocolo', ?) ON DUPLICATE KEY UPDATE valor = ?", [
      contador,
      contador,
    ]);
    await con.commit();
  } catch (erro) {
    await con.rollback();
    throw erro;
  } finally {
    con.release();
  }
}

/** Confere se o corpo de /sincronizar tem o formato certo (só tabelas conhecidas). */
function validarMudancas(corpo: unknown): Mudancas | null {
  const m = corpo as Partial<Mudancas> | null;
  if (!m || !Array.isArray(m.gravar) || !Array.isArray(m.apagar) || typeof m.contadorProtocolo !== 'number') return null;
  const okGravar = m.gravar.every(
    (g) => ehTabela(g?.tabela) && typeof g.objeto?.id === 'string' && (g.antes === undefined || typeof g.antes === 'string'),
  );
  const okApagar = m.apagar.every((a) => ehTabela(a?.tabela) && typeof a.id === 'string');
  return okGravar && okApagar ? (m as Mudancas) : null;
}

/** Banco vazio (primeira vez): grava os dados de demonstração. */
async function colocarDemonstracaoSeVazio() {
  const [linhas] = await banco.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM usuarios');
  if (Number(linhas[0].total) > 0) return;
  const vazio = Object.fromEntries(NOMES_TABELAS.map((t) => [t, new Map()])) as Foto;
  await gravar(diferencas(vazio, criarDadosDemonstracao()));
  console.log('Banco vazio: dados de demonstração gravados.');
}

/* ───────── Rotas ───────── */

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/saude', async (_req, res) => {
  await banco.query('SELECT 1');
  res.json({ ok: true });
});

app.get('/dados', async (_req, res) => {
  const dados = await lerTudo();
  // Nunca envia as senhas para o aparelho.
  dados.usuarios = dados.usuarios.map(({ senha: _senha, ...u }) => u as Usuario);
  res.json(dados);
});

app.post('/entrar', async (req, res) => {
  const { email, senha } = req.body ?? {};
  if (typeof email !== 'string' || typeof senha !== 'string') {
    res.status(400).json({ ok: false, erro: 'Informe e-mail e senha.' });
    return;
  }
  const [linhas] = await banco.query<RowDataPacket[]>('SELECT id, senha FROM usuarios WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (!linhas[0] || linhas[0].senha !== senha) {
    res.status(401).json({ ok: false, erro: 'E-mail ou senha incorretos. Confira e tente de novo.' });
    return;
  }
  res.json({ ok: true, usuarioId: linhas[0].id });
});

app.post('/sincronizar', async (req, res) => {
  const mudancas = validarMudancas(req.body);
  if (!mudancas) {
    res.status(400).json({ ok: false, erro: 'Dados em formato inválido.' });
    return;
  }
  await gravar(mudancas);
  res.json({ ok: true });
});

// Qualquer erro nas rotas cai aqui.
app.use((erro: Error & { code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (erro instanceof Conflito) {
    console.warn('Conflito:', erro.message);
    res
      .status(409)
      .json({ ok: false, conflito: true, erro: 'Outra pessoa alterou isso ao mesmo tempo. Os dados foram atualizados; faça de novo.' });
    return;
  }
  console.error(erro);
  if (erro.code === 'ER_DUP_ENTRY')
    res.status(400).json({ ok: false, erro: 'Já existe um registro com esse valor (ex.: e-mail repetido).' });
  else res.status(500).json({ ok: false, erro: 'Erro no servidor. Tente de novo.' });
});

colocarDemonstracaoSeVazio()
  .then(() => app.listen(PORTA, '0.0.0.0', () => console.log(`Servidor do Meu SENAI em http://localhost:${PORTA}`)))
  .catch((erro) => {
    console.error('Não consegui conectar ao MySQL. Confira servidor/.env e se você rodou servidor/banco.sql.\n', erro.message);
    process.exit(1);
  });
