/// <reference types="node" />
/**
 * VERIFICAR BANCO — testa a conversão objeto ⇄ linha e a detecção do que mudou (src/dados/esquema.ts).
 * Não precisa do MySQL ligado. Rodar: npm run verificar
 */
import assert from 'node:assert/strict';

import { criarDadosDemonstracao } from '../src/dados/demonstracao';
import { colunasDe, deLinha, diferencas, NOMES_TABELAS, paraLinha, resumo, tirarFoto, type Foto } from '../src/dados/esquema';

let aprovados = 0;
function teste(nome: string, fn: () => void) {
  fn();
  aprovados++;
  console.log(`  ok  ${nome}`);
}

/** Imita o que o MySQL devolve: uma linha { coluna: valor }. */
const comoLinhaDoBanco = (tabela: (typeof NOMES_TABELAS)[number], objeto: object) =>
  Object.fromEntries(colunasDe(tabela).map((c, i) => [c, paraLinha(tabela, objeto)[i]]));

console.log('\nBanco (esquema) — Meu SENAI\n');
const demo = criarDadosDemonstracao();

teste('todo registro vira linha e volta igual', () => {
  for (const tabela of NOMES_TABELAS) {
    for (const objeto of demo[tabela]) assert.deepEqual(deLinha(tabela, comoLinhaDoBanco(tabela, objeto)), objeto);
  }
});

teste('JSON já convertido (MySQL) ou como texto (MariaDB) dá o mesmo resultado', () => {
  const aluno = demo.alunos[0];
  const linha = comoLinhaDoBanco('alunos', aluno);
  assert.deepEqual(deLinha('alunos', { ...linha, horarios: aluno.horarios, responsavelIds: aluno.responsavelIds }), aluno);
});

teste('sem mudanças, nada é enviado', () => {
  const m = diferencas(tirarFoto(demo), structuredClone(demo));
  assert.equal(m.gravar.length + m.apagar.length, 0);
});

teste('só o que mudou é enviado (inserir, alterar, apagar)', () => {
  const depois = structuredClone(demo);
  depois.notificacoes[0].lida = !depois.notificacoes[0].lida;
  depois.avisos.unshift({ ...depois.avisos[0], id: 'n-teste' });
  depois.chamados = depois.chamados.slice(1);
  const m = diferencas(tirarFoto(demo), depois);
  assert.deepEqual(m.gravar.map((g) => g.objeto.id).sort(), [demo.notificacoes[0].id, 'n-teste'].sort());
  assert.deepEqual(m.apagar, [{ tabela: 'chamados', id: demo.chamados[0].id }]);
});

teste('banco vazio recebe todos os dados de demonstração', () => {
  const vazio = Object.fromEntries(NOMES_TABELAS.map((t) => [t, new Map()])) as Foto;
  const total = NOMES_TABELAS.reduce((s, t) => s + demo[t].length, 0);
  assert.equal(diferencas(vazio, demo).gravar.length, total);
});

teste('cada mudança leva a versão que o app conhecia (para detectar conflito)', () => {
  const depois = structuredClone(demo);
  depois.chamados[0].mensagens.push({ id: 'm-x', autorId: 'u-larissa', texto: 'Oi', em: '2026-11-05T10:00:00.000Z' });
  depois.avisos.unshift({ ...depois.avisos[0], id: 'n-novo' });
  const m = diferencas(tirarFoto(demo), depois);
  assert.equal(m.gravar.find((g) => g.objeto.id === demo.chamados[0].id)?.antes, resumo('chamados', demo.chamados[0]));
  assert.equal(m.gravar.find((g) => g.objeto.id === 'n-novo')?.antes, undefined);
});

teste('resumo ignora a ordem das chaves do JSON e a senha', () => {
  const aviso = demo.avisos[0];
  const reordenado = { ...aviso, publico: Object.fromEntries(Object.entries(aviso.publico).reverse()) } as typeof aviso;
  assert.equal(resumo('avisos', reordenado), resumo('avisos', aviso));
  const { senha: _senha, ...semSenha } = demo.usuarios[0];
  assert.equal(resumo('usuarios', semSenha), resumo('usuarios', demo.usuarios[0]));
});

console.log(`\n${aprovados} testes do banco aprovados.`);
