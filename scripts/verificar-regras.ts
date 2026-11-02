/// <reference types="node" />
/**
 * VERIFICAR REGRAS — testa as regras de negócio (RN02 a RN10) com os dados de demonstração.
 * Rodar: npm run verificar
 */
import assert from 'node:assert/strict';

import { criarDadosDemonstracao } from '../src/dados/demonstracao';
import {
  atestadosVisiveis,
  autorizacoesVisiveis,
  avisosVisiveis,
  chamadosVisiveis,
  MAX_RESPONSAVEIS,
  podeAnalisarAtestado,
  podeDecidir,
  podeEnviarAtestado,
  podePublicar,
  podePublicarGeral,
  podeVincularResponsavel,
  turmasPermitidas,
  alunosVisiveis,
} from '../src/dados/permissoes';

const db = criarDadosDemonstracao();
const u = (id: string) => db.usuarios.find((x) => x.id === id)!;
const ids = (lista: { id: string }[]) => lista.map((x) => x.id).sort();
const autorizacao = (id: string) => db.autorizacoes.find((a) => a.id === id)!;

let aprovadas = 0;
function regra(nome: string, teste: () => void) {
  teste();
  aprovadas++;
  console.log(`  ok  ${nome}`);
}

console.log('Regras de negócio — Meu SENAI\n');

regra('RN02 família só vê os próprios alunos', () => {
  assert.deepEqual(ids(alunosVisiveis(db, u('u-larissa'))), ['s-pedro']);
  assert.deepEqual(ids(alunosVisiveis(db, u('u-ana'))), ['s-ana']);
});

regra('RN02 professor só vê alunos das suas turmas', () => {
  assert.deepEqual(ids(alunosVisiveis(db, u('u-ricardo'))), ['s-pedro']);
  assert.deepEqual(ids(alunosVisiveis(db, u('u-sonia'))), ['s-ana']);
});

regra('RN03 no máximo 2 responsáveis por aluno', () => {
  assert.equal(MAX_RESPONSAVEIS, 2);
  for (const a of db.alunos) assert.ok(a.responsavelIds.length <= MAX_RESPONSAVEIS);
});

regra('RN05 só a equipe publica; comunicado geral só a gestão', () => {
  assert.equal(podePublicar(u('u-larissa')), false);
  assert.equal(podePublicar(u('u-pedro')), false);
  assert.equal(podePublicar(u('u-ricardo')), true);
  assert.equal(podePublicarGeral(u('u-ricardo')), false);
  assert.equal(podePublicarGeral(u('u-paulo')), true);
  assert.deepEqual(turmasPermitidas(db, u('u-ricardo')), ['MEC-2B']);
});

regra('RN06 aviso individual chega só ao aluno e aos responsáveis dele', () => {
  const ve = (id: string) => avisosVisiveis(db, u(id)).some((a) => a.id === 'n-suspensao');
  assert.ok(ve('u-pedro') && ve('u-larissa') && ve('u-marcos'));
  assert.ok(!ve('u-ana') && !ve('u-claudia') && !ve('u-sonia'));
});

regra('RN06 aviso de turma não vaza para outra turma', () => {
  const ve = (id: string) => avisosVisiveis(db, u(id)).some((a) => a.id === 'n-elt-epi');
  assert.ok(ve('u-ana') && ve('u-claudia') && ve('u-sonia'));
  assert.ok(!ve('u-pedro') && !ve('u-larissa') && !ve('u-ricardo'));
});

regra('RN06 comunicado só para responsáveis não aparece para alunos', () => {
  assert.ok(avisosVisiveis(db, u('u-larissa')).some((a) => a.id === 'n-rematricula'));
  assert.ok(!avisosVisiveis(db, u('u-pedro')).some((a) => a.id === 'n-rematricula'));
});

regra('RN07 atestado: responsável envia, secretaria/coordenação analisam, professor não vê', () => {
  assert.ok(podeEnviarAtestado(u('u-larissa')));
  assert.ok(!podeEnviarAtestado(u('u-pedro')));
  assert.ok(podeAnalisarAtestado(u('u-juliana')) && podeAnalisarAtestado(u('u-fernanda')));
  assert.ok(!podeAnalisarAtestado(u('u-ricardo')));
  assert.deepEqual(atestadosVisiveis(db, u('u-ricardo')), []);
  assert.deepEqual(ids(atestadosVisiveis(db, u('u-larissa'))), ['c-1']);
  assert.deepEqual(ids(atestadosVisiveis(db, u('u-claudia'))), ['c-2']);
});

regra('RN08 pedido da escola é decidido pelo responsável; pedido da família, pela gestão', () => {
  assert.ok(podeDecidir(u('u-larissa'), autorizacao('a-visita')));
  assert.ok(!podeDecidir(u('u-pedro'), autorizacao('a-visita')));
  assert.ok(!podeDecidir(u('u-claudia'), autorizacao('a-visita')));
  assert.ok(!podeDecidir(u('u-fernanda'), autorizacao('a-visita')));
  assert.ok(podeDecidir(u('u-fernanda'), autorizacao('a-ana')));
  assert.ok(!podeDecidir(u('u-claudia'), autorizacao('a-ana')));
  assert.ok(!autorizacoesVisiveis(db, u('u-claudia')).some((a) => a.alunoId === 's-pedro'));
});

regra('RN09 suporte chega só ao setor/professor escolhido', () => {
  assert.ok(chamadosVisiveis(db, u('u-juliana')).some((c) => c.id === 't-1'));
  assert.ok(!chamadosVisiveis(db, u('u-fernanda')).some((c) => c.id === 't-1'));
  assert.ok(chamadosVisiveis(db, u('u-ricardo')).some((c) => c.id === 't-2'));
  assert.ok(!chamadosVisiveis(db, u('u-sonia')).some((c) => c.id === 't-2'));
  assert.equal(chamadosVisiveis(db, u('u-claudia')).length, 0);
});

regra('RN10 só a secretaria vincula responsáveis', () => {
  assert.ok(podeVincularResponsavel(u('u-juliana')));
  for (const id of ['u-larissa', 'u-pedro', 'u-ricardo', 'u-fernanda', 'u-paulo']) assert.ok(!podeVincularResponsavel(u(id)));
});

console.log(`\n${aprovadas} regras verificadas.`);
