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
 *   POST /arquivos     → recebe a foto ou o PDF de um atestado e devolve o endereço
 *   GET  /arquivos/:id → devolve o arquivo
 *   POST /trocar-senha → troca a senha de quem confirma a senha atual
 *
 * As regras de negócio (quem pode o quê) ficam no app, em src/dados/banco.tsx.
 */
import { randomUUID } from 'node:crypto';

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

/** Colunas novas em bancos criados antes delas: acrescenta sem apagar nada. */
async function atualizarTabelas() {
  const [foto] = await banco.query<RowDataPacket[]>("SHOW COLUMNS FROM alunos LIKE 'foto'");
  if (!foto.length) await banco.query('ALTER TABLE alunos ADD COLUMN foto VARCHAR(100) NULL');
}

/** Banco vazio (primeira vez): grava os dados iniciais. */
async function colocarDemonstracaoSeVazio() {
  const [linhas] = await banco.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM usuarios');
  if (Number(linhas[0].total) > 0) return;
  const vazio = Object.fromEntries(NOMES_TABELAS.map((t) => [t, new Map()])) as Foto;
  await gravar(diferencas(vazio, criarDadosDemonstracao()));
  console.log('Banco vazio: dados iniciais gravados.');
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

/* ── Arquivos dos atestados (guardados na tabela arquivos) ── */

const TIPOS_ACEITOS = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/;
const LIMITE_ARQUIVO = 10 * 1024 * 1024; // 10 MB, o mesmo limite da tela

// O corpo da requisição é o próprio arquivo; o nome vai em ?nome=
app.post('/arquivos', express.raw({ type: () => true, limit: LIMITE_ARQUIVO }), async (req, res) => {
  const tipo = String(req.headers['content-type'] ?? '').split(';')[0];
  const nome = String(req.query.nome ?? '').slice(0, 200);
  const conteudo = req.body as Buffer;
  if (!TIPOS_ACEITOS.test(tipo)) {
    res.status(400).json({ ok: false, erro: 'Envie uma foto (JPG, PNG) ou um PDF.' });
    return;
  }
  if (!nome || !Buffer.isBuffer(conteudo) || conteudo.length === 0) {
    res.status(400).json({ ok: false, erro: 'Arquivo vazio.' });
    return;
  }
  const id = randomUUID();
  await banco.query('INSERT INTO arquivos (id, nome, tipo, tamanho, conteudo, enviadoEm) VALUES (?, ?, ?, ?, ?, ?)', [
    id,
    nome,
    tipo,
    conteudo.length,
    conteudo,
    new Date().toISOString(),
  ]);
  res.json({ ok: true, uri: `/arquivos/${id}` });
});

app.get('/arquivos/:id', async (req, res) => {
  const [linhas] = await banco.query<RowDataPacket[]>('SELECT nome, tipo, conteudo FROM arquivos WHERE id = ?', [req.params.id]);
  const arquivo = linhas[0];
  if (!arquivo) {
    res.status(404).json({ ok: false, erro: 'Arquivo não encontrado.' });
    return;
  }
  res.type(arquivo.tipo).set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(arquivo.nome)}`);
  res.send(arquivo.conteudo);
});

/* ── Senha ── */

app.post('/trocar-senha', async (req, res) => {
  const { usuarioId, senhaAtual, novaSenha } = req.body ?? {};
  if (typeof usuarioId !== 'string' || typeof senhaAtual !== 'string' || typeof novaSenha !== 'string') {
    res.status(400).json({ ok: false, erro: 'Preencha a senha atual e a nova.' });
    return;
  }
  if (novaSenha.length < 6) {
    res.status(400).json({ ok: false, erro: 'A nova senha precisa ter pelo menos 6 caracteres.' });
    return;
  }
  if (novaSenha === senhaAtual) {
    res.status(400).json({ ok: false, erro: 'A nova senha precisa ser diferente da atual.' });
    return;
  }
  const [linhas] = await banco.query<RowDataPacket[]>('SELECT senha FROM usuarios WHERE id = ?', [usuarioId]);
  if (!linhas[0] || linhas[0].senha !== senhaAtual) {
    res.status(400).json({ ok: false, erro: 'A senha atual está incorreta.' });
    return;
  }
  await banco.query('UPDATE usuarios SET senha = ? WHERE id = ?', [novaSenha, usuarioId]);
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
  if (erro.name === 'PayloadTooLargeError') res.status(400).json({ ok: false, erro: 'O arquivo passa de 10 MB.' });
  else if (erro.code === 'ER_NO_SUCH_TABLE')
    res.status(500).json({ ok: false, erro: 'Falta uma tabela no banco. Rode servidor/banco.sql de novo no MySQL Workbench.' });
  else if (erro.code === 'ER_DUP_ENTRY')
    res.status(400).json({ ok: false, erro: 'Já existe um registro com esse valor (ex.: e-mail repetido).' });
  else res.status(500).json({ ok: false, erro: 'Erro no servidor. Tente de novo.' });
});

atualizarTabelas()
  .then(colocarDemonstracaoSeVazio)
  .then(() => app.listen(PORTA, '0.0.0.0', () => console.log(`Servidor do Meu SENAI em http://localhost:${PORTA}`)))
  .catch((erro) => {
    console.error('Não consegui conectar ao MySQL. Confira servidor/.env e se você rodou servidor/banco.sql.\n', erro.message);
    process.exit(1);
  });
