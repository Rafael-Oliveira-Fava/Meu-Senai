/**
 * Testes do servidor com um MySQL de verdade.
 *
 * Cria o banco "meusenai_teste" com servidor/banco.sql, liga o servidor numa porta
 * separada e conversa com ele pela API, como o app faz. No fim, apaga o banco de teste.
 * Usa a mesma configuração do servidor (servidor/.env ou variáveis MYSQL_*).
 * Sem MySQL disponível, o teste é pulado; no GitHub (CI) ele é obrigatório.
 */
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import mysql from 'mysql2/promise';

import { diferencas, tirarFoto, type Mudancas } from '../src/dados/esquema';
import type { BancoDados } from '../src/dados/tipos';

try {
  process.loadEnvFile('servidor/.env');
} catch {
  /* sem .env: usa as variáveis do ambiente ou os padrões */
}

const BANCO_TESTE = 'meusenai_teste';
const PORTA = 3399;
const URL = `http://localhost:${PORTA}`;
const conexao = {
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: Number(process.env.MYSQL_PORTA ?? 3306),
  user: process.env.MYSQL_USUARIO ?? 'root',
  password: process.env.MYSQL_SENHA ?? '',
};

/* ── Ajudantes ── */

async function chamar<T = Record<string, unknown>>(caminho: string, corpo?: unknown) {
  const resposta = await fetch(URL + caminho, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return { status: resposta.status, json: (await resposta.json()) as T };
}
const buscarDados = async () => (await chamar<BancoDados>('/dados')).json;
const sincronizar = (m: Mudancas) => chamar('/sincronizar', m);

/** Simula um aparelho: pega os dados, aplica uma mudança e envia só o que mudou. */
async function mudar(antes: BancoDados, alteracao: (d: BancoDados) => void) {
  const depois = structuredClone(antes);
  alteracao(depois);
  return sincronizar(diferencas(tirarFoto(antes), depois));
}

async function esperarServidor(servidor: ChildProcess) {
  for (let i = 0; i < 60; i++) {
    if (servidor.exitCode !== null) throw new Error('O servidor parou ao iniciar.');
    try {
      if ((await fetch(`${URL}/saude`)).ok) return;
    } catch {
      /* ainda ligando */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('O servidor não respondeu em 30 s.');
}

/* ── Teste ── */

test('servidor + MySQL', async (t) => {
  // Sem MySQL na máquina: pula (no CI, falha).
  let admin: mysql.Connection;
  try {
    admin = await mysql.createConnection({ ...conexao, multipleStatements: true });
  } catch (erro) {
    if (process.env.CI) throw erro;
    t.skip(`MySQL indisponível (${(erro as Error).message}). Configure servidor/.env para rodar este teste.`);
    return;
  }

  // Banco de teste novo, criado pelo mesmo banco.sql que o Workbench usa.
  const script = readFileSync('servidor/banco.sql', 'utf8').replace(/\bmeusenai\b/g, BANCO_TESTE);
  await admin.query(`DROP DATABASE IF EXISTS ${BANCO_TESTE}`);
  await admin.query(script);
  // Simula um banco criado antes da coluna "foto": o servidor deve criá-la sozinho.
  await admin.query(`ALTER TABLE ${BANCO_TESTE}.usuarios DROP COLUMN foto`);

  const servidor = spawn(process.execPath, ['--import', 'tsx', 'servidor/index.ts'], {
    env: { ...process.env, ...envDoServidor() },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let saida = '';
  servidor.stdout?.on('data', (d) => (saida += d));
  servidor.stderr?.on('data', (d) => (saida += d));

  try {
    await esperarServidor(servidor).catch((erro) => {
      throw new Error(`${erro.message}\nSaída do servidor:\n${saida}`);
    });

    await t.test('primeiro uso grava os dados de demonstração', async () => {
      const dados = await buscarDados();
      assert.equal(dados.usuarios.length, 10);
      assert.ok(dados.avisos.length > 0 && dados.notificacoes.length > 0);
      assert.match(saida, /dados iniciais gravados/);
    });

    await t.test('servidor cria colunas novas em banco antigo (foto do usuário)', async () => {
      const [colunas] = await admin.query<mysql.RowDataPacket[]>(`SHOW COLUMNS FROM ${BANCO_TESTE}.usuarios LIKE 'foto'`);
      assert.equal(colunas.length, 1);
    });

    await t.test('todo usuário inicial já tem foto, e a foto abre', async () => {
      const dados = await buscarDados();
      assert.ok(dados.usuarios.every((u) => u.foto?.startsWith('/arquivos/foto-')));
      const resposta = await fetch(URL + dados.usuarios[0].foto);
      assert.equal(resposta.headers.get('content-type'), 'image/png');
    });

    await t.test('a troca de foto é gravada', async () => {
      const antes = await buscarDados();
      assert.equal((await mudar(antes, (d) => (d.usuarios[0].foto = '/arquivos/selfie-teste'))).status, 200);
      assert.equal((await buscarDados()).usuarios[0].foto, '/arquivos/selfie-teste');
    });

    await t.test('GET /dados nunca envia senhas', async () => {
      const dados = await buscarDados();
      assert.ok(dados.usuarios.every((u) => u.senha === undefined));
    });

    await t.test('login confere e-mail (sem diferenciar maiúsculas) e senha', async () => {
      const certo = await chamar('/entrar', { email: ' LARISSA@familia.demo ', senha: 'senai123' });
      assert.equal(certo.status, 200);
      assert.equal(certo.json.usuarioId, 'u-larissa');
      const errado = await chamar('/entrar', { email: 'larissa@familia.demo', senha: 'errada' });
      assert.equal(errado.status, 401);
      assert.equal((await chamar('/entrar', {})).status, 400);
    });

    await t.test('grava só o que mudou e devolve na próxima leitura', async () => {
      const antes = await buscarDados();
      const r = await mudar(antes, (d) => {
        d.notificacoes.filter((n) => n.usuarioId === 'u-larissa').forEach((n) => (n.lida = true));
        d.chamados[0].mensagens.push({ id: 'm-teste', autorId: 'u-larissa', texto: 'Olá, ação ção!', em: new Date().toISOString() });
      });
      assert.equal(r.status, 200);
      const depois = await buscarDados();
      assert.ok(depois.notificacoes.filter((n) => n.usuarioId === 'u-larissa').every((n) => n.lida));
      const chamado = depois.chamados.find((c) => c.id === antes.chamados[0].id)!;
      assert.equal(chamado.mensagens.at(-1)?.texto, 'Olá, ação ção!'); // acentos preservados
    });

    await t.test('as senhas continuam no banco depois das gravações', async () => {
      const [linhas] = await admin.query<mysql.RowDataPacket[]>(`SELECT senha FROM ${BANCO_TESTE}.usuarios WHERE id = 'u-larissa'`);
      assert.equal(linhas[0].senha, 'senai123');
    });

    await t.test('duas pessoas mudando o mesmo registro: a segunda recebe conflito (409)', async () => {
      const copiaA = await buscarDados();
      const copiaB = structuredClone(copiaA);
      const id = copiaA.chamados[0].id;
      const responder = (texto: string) => (d: BancoDados) =>
        d.chamados
          .find((c) => c.id === id)!
          .mensagens.push({ id: `m-${texto}`, autorId: 'u-juliana', texto, em: new Date().toISOString() });
      assert.equal((await mudar(copiaA, responder('primeira'))).status, 200);
      const segunda = await mudar(copiaB, responder('segunda'));
      assert.equal(segunda.status, 409);
      assert.equal(segunda.json.conflito, true);
      const textos = (await buscarDados()).chamados.find((c) => c.id === id)!.mensagens.map((m) => m.texto);
      assert.ok(textos.includes('primeira') && !textos.includes('segunda'));
    });

    await t.test('erro no meio desfaz tudo (transação) e e-mail repetido é recusado', async () => {
      const antes = await buscarDados();
      const r = await mudar(antes, (d) => {
        d.avisos[0].titulo = 'Título que não pode ficar';
        d.usuarios.push({ ...d.usuarios[0], id: 'u-copia', senha: 'x' }); // mesmo e-mail
      });
      assert.equal(r.status, 400);
      const depois = await buscarDados();
      assert.equal(depois.avisos[0].titulo, antes.avisos[0].titulo);
      assert.ok(!depois.usuarios.some((u) => u.id === 'u-copia'));
    });

    await t.test('apagar remove a linha', async () => {
      const antes = await buscarDados();
      const alvo = antes.notificacoes[0].id;
      assert.equal((await mudar(antes, (d) => (d.notificacoes = d.notificacoes.filter((n) => n.id !== alvo)))).status, 200);
      assert.ok(!(await buscarDados()).notificacoes.some((n) => n.id === alvo));
    });

    await t.test('contador de protocolo nunca volta para trás', async () => {
      const antes = await buscarDados();
      await mudar(antes, (d) => {
        d.contadorProtocolo = antes.contadorProtocolo + 5;
        d.avisos[0].titulo = 'Aviso com protocolo novo';
      });
      const atrasado = await buscarDados();
      await mudar(atrasado, (d) => {
        d.contadorProtocolo = antes.contadorProtocolo + 1; // aparelho com dados antigos
        d.avisos[1].titulo = 'Outro aviso';
      });
      assert.equal((await buscarDados()).contadorProtocolo, antes.contadorProtocolo + 5);
    });

    await t.test('recusa dados em formato inválido (ex.: nome de tabela inventado)', async () => {
      const r = await sincronizar({
        gravar: [{ tabela: 'usuarios; DROP TABLE avisos' as never, objeto: { id: 'x' } }],
        apagar: [],
        contadorProtocolo: 1,
      });
      assert.equal(r.status, 400);
      assert.ok((await buscarDados()).avisos.length > 0);
    });
  } finally {
    servidor.kill();
    await admin.query(`DROP DATABASE IF EXISTS ${BANCO_TESTE}`);
    await admin.end();
  }
});

/** Variáveis para o servidor de teste: mesmo MySQL, banco e porta de teste. */
function envDoServidor() {
  return {
    MYSQL_HOST: conexao.host,
    MYSQL_PORTA: String(conexao.port),
    MYSQL_USUARIO: conexao.user,
    MYSQL_SENHA: conexao.password,
    MYSQL_BANCO: BANCO_TESTE,
    PORTA: String(PORTA),
  };
}
