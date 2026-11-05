/**
 * Testes das funções de formatação (datas, máscaras dos campos e nomes).
 * O relógio é fixado em 05/11/2026 10:00 para os resultados não dependerem do dia em que rodam.
 */
import assert from 'node:assert/strict';
import { after, before, describe, mock, test } from 'node:test';

import {
  dataCompleta,
  dataCurta,
  dataRelativa,
  diaMais,
  horaValida,
  idade,
  iniciais,
  lerDataDigitada,
  mascaraData,
  mascaraHora,
  mascaraTelefone,
  primeiroNome,
  tamanhoArquivo,
  tempoAtras,
} from '../src/utilidades/formatar';

before(() => mock.timers.enable({ apis: ['Date'], now: new Date(2026, 10, 5, 10, 0) }));
after(() => mock.timers.reset());

describe('datas', () => {
  test('dataCompleta e dataCurta', () => {
    assert.equal(dataCompleta('2026-11-01'), '01/11/2026');
    assert.equal(dataCurta('2026-11-01'), '1 nov');
  });

  test('dataRelativa usa Hoje, Amanhã e Ontem', () => {
    assert.equal(dataRelativa('2026-11-05'), 'Hoje');
    assert.equal(dataRelativa('2026-11-06'), 'Amanhã');
    assert.equal(dataRelativa('2026-11-04'), 'Ontem');
    assert.equal(dataRelativa('2026-12-25'), '25 dez');
  });

  test('tempoAtras', () => {
    const atras = (minutos: number) => new Date(Date.now() - minutos * 60000).toISOString();
    assert.equal(tempoAtras(atras(0)), 'agora');
    assert.equal(tempoAtras(atras(5)), 'há 5 min');
    assert.equal(tempoAtras(atras(180)), 'há 3 h');
    assert.equal(tempoAtras(atras(24 * 60)), 'ontem');
    assert.equal(tempoAtras(atras(4 * 24 * 60)), 'há 4 dias');
  });

  test('diaMais devolve a data no formato do campo', () => {
    assert.equal(diaMais(0), '05/11/2026');
    assert.equal(diaMais(1), '06/11/2026');
    assert.equal(diaMais(-5), '31/10/2026');
  });

  test('idade conta o aniversário do ano', () => {
    assert.equal(idade('2010-11-05'), 16); // faz aniversário hoje
    assert.equal(idade('2010-11-06'), 15); // faz amanhã
  });
});

describe('máscaras dos campos', () => {
  test('mascaraData vai formatando enquanto digita', () => {
    assert.equal(mascaraData('01'), '01');
    assert.equal(mascaraData('0111'), '01/11');
    assert.equal(mascaraData('01112026'), '01/11/2026');
    assert.equal(mascaraData('01/11/2026999'), '01/11/2026');
  });

  test('lerDataDigitada recusa datas que não existem', () => {
    assert.equal(lerDataDigitada('01/11/2026'), '2026-11-01');
    assert.equal(lerDataDigitada('31/02/2026'), null);
    assert.equal(lerDataDigitada('1/11/2026'), null);
    assert.equal(lerDataDigitada(''), null);
  });

  test('mascaraHora e horaValida', () => {
    assert.equal(mascaraHora('1030'), '10:30');
    assert.ok(horaValida('23:59'));
    assert.ok(!horaValida('24:00'));
    assert.ok(!horaValida('10:60'));
    assert.ok(!horaValida('9:30'));
  });

  test('mascaraTelefone', () => {
    assert.equal(mascaraTelefone(''), '');
    assert.equal(mascaraTelefone('11'), '(11');
    assert.equal(mascaraTelefone('1198765'), '(11) 98765');
    assert.equal(mascaraTelefone('11987654321'), '(11) 98765-4321');
  });
});

describe('nomes e tamanhos', () => {
  test('iniciais e primeiroNome', () => {
    assert.equal(iniciais('Larissa Santos'), 'LS');
    assert.equal(iniciais('  pedro henrique santos '), 'PS');
    assert.equal(iniciais('Ana'), 'A');
    assert.equal(primeiroNome(' Juliana Costa'), 'Juliana');
  });

  test('tamanhoArquivo', () => {
    assert.equal(tamanhoArquivo(undefined), '');
    assert.equal(tamanhoArquivo(184320), '180 KB');
    assert.equal(tamanhoArquivo(5 * 1024 * 1024 + 512 * 1024), '5,5 MB');
  });
});
