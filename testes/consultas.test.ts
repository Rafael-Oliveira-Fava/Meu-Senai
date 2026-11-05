/**
 * Testes das consultas usadas pelas telas: pendências, contadores das abas
 * e quem recebe cada aviso. Usa os dados de demonstração.
 */
import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';

import {
  contarAvisosNaoLidos,
  contarChamadosAguardando,
  contarNotificacoesNaoLidas,
  naoLido,
  pendencias,
  precisaCiencia,
} from '../src/dados/consultas';
import { criarDadosDemonstracao } from '../src/dados/demonstracao';
import { chamadosVisiveis, destinatariosDoAviso } from '../src/dados/permissoes';
import type { BancoDados } from '../src/dados/tipos';

let db: BancoDados;
beforeEach(() => {
  db = criarDadosDemonstracao(); // cada teste começa com os dados limpos
});
const u = (id: string) => db.usuarios.find((x) => x.id === id)!;
const aviso = (id: string) => db.avisos.find((x) => x.id === id)!;
const ids = (lista: { id: string }[]) => lista.map((x) => x.id).sort();

describe('pendências ("Precisa da sua atenção")', () => {
  test('responsável vê o pedido da escola esperando a resposta dele', () => {
    const p = pendencias(db, u('u-larissa'));
    assert.deepEqual(ids(p.autorizacoes), ['a-visita']);
    assert.equal(p.atestados.length, 0);
  });

  test('responsável de outro aluno não vê pendência alheia', () => {
    assert.equal(pendencias(db, u('u-claudia')).total, 0);
  });

  test('secretaria e coordenação veem atestado pendente e pedido de saída da família', () => {
    for (const id of ['u-juliana', 'u-fernanda']) {
      const p = pendencias(db, u(id));
      assert.deepEqual(ids(p.atestados), ['c-2']);
      assert.deepEqual(ids(p.autorizacoes), ['a-ana']);
      assert.equal(p.total, 2);
    }
  });

  test('direção decide saída, mas não analisa atestado', () => {
    const p = pendencias(db, u('u-paulo'));
    assert.deepEqual(ids(p.autorizacoes), ['a-ana']);
    assert.equal(p.atestados.length, 0);
  });

  test('professor e aluno não têm decisões pendentes', () => {
    assert.equal(pendencias(db, u('u-ricardo')).total, 0);
    assert.equal(pendencias(db, u('u-pedro')).total, 0);
  });

  test('pedido decidido sai das pendências', () => {
    db.autorizacoes.find((a) => a.id === 'a-visita')!.situacao = 'aprovado';
    assert.equal(pendencias(db, u('u-larissa')).total, 0);
  });
});

describe('avisos', () => {
  test('aviso individual vai só para o aluno e os responsáveis dele', () => {
    assert.deepEqual(ids(destinatariosDoAviso(db, aviso('n-suspensao'))), ['u-larissa', 'u-marcos', 'u-pedro']);
  });

  test('aviso de turma não chega a outra turma', () => {
    const destinos = ids(destinatariosDoAviso(db, aviso('n-elt-epi')));
    assert.deepEqual(destinos, ['u-ana', 'u-claudia']);
  });

  test('quem publicou não recebe o próprio aviso', () => {
    for (const a of db.avisos) assert.ok(!destinatariosDoAviso(db, a).some((x) => x.id === a.autorId), a.id);
  });

  test('comunicado só para responsáveis não chega aos alunos', () => {
    const destinos = ids(destinatariosDoAviso(db, aviso('n-rematricula')));
    assert.ok(!destinos.includes('u-pedro') && !destinos.includes('u-ana'));
    assert.ok(destinos.includes('u-larissa') && destinos.includes('u-claudia'));
  });

  test('naoLido: o autor nunca conta, e ler tira da contagem', () => {
    const feriado = aviso('n-feriado');
    assert.ok(!naoLido(feriado, u(feriado.autorId)));
    const antes = contarAvisosNaoLidos(db, u('u-larissa'));
    feriado.lidoPor.push('u-larissa');
    assert.equal(contarAvisosNaoLidos(db, u('u-larissa')), antes - 1);
  });

  test('precisaCiencia: só responsável, só enquanto não confirmou', () => {
    const suspensao = aviso('n-suspensao');
    assert.ok(precisaCiencia(suspensao, u('u-larissa')));
    assert.ok(!precisaCiencia(suspensao, u('u-pedro'))); // aluno não confirma
    suspensao.cientes.push({ usuarioId: 'u-larissa', em: new Date().toISOString() });
    assert.ok(!precisaCiencia(suspensao, u('u-larissa')));
    assert.ok(precisaCiencia(suspensao, u('u-marcos'))); // o outro responsável ainda precisa
  });
});

describe('suporte e notificações', () => {
  test('conversa respondida espera quem abriu; conversa aberta espera quem atende', () => {
    assert.equal(contarChamadosAguardando(db, u('u-larissa')), 1); // t-1 respondida pela secretaria
    assert.equal(contarChamadosAguardando(db, u('u-ricardo')), 1); // t-2 aberta para ele
    assert.equal(contarChamadosAguardando(db, u('u-juliana')), 0);
  });

  test('conversa encerrada não conta como aguardando', () => {
    for (const c of db.chamados) c.situacao = 'encerrado';
    assert.equal(contarChamadosAguardando(db, u('u-larissa')), 0);
    assert.equal(contarChamadosAguardando(db, u('u-ricardo')), 0);
  });

  test('cada um só vê as conversas que abriu ou que atende', () => {
    assert.deepEqual(ids(chamadosVisiveis(db, u('u-larissa'))), ['t-1']);
    assert.deepEqual(ids(chamadosVisiveis(db, u('u-juliana'))), ['t-1']);
    assert.deepEqual(ids(chamadosVisiveis(db, u('u-fernanda'))), []);
  });

  test('contador de notificações conta só as não lidas da própria pessoa', () => {
    const antes = contarNotificacoesNaoLidas(db, u('u-larissa'));
    assert.ok(antes > 0);
    db.notificacoes.filter((n) => n.usuarioId === 'u-larissa').forEach((n) => (n.lida = true));
    assert.equal(contarNotificacoesNaoLidas(db, u('u-larissa')), 0);
    assert.ok(contarNotificacoesNaoLidas(db, u('u-marcos')) > 0);
  });
});
