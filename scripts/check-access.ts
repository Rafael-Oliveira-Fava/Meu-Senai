/// <reference types="node" />
/**
 * Verifies the business rules (RN02–RN10) against the demo data.
 * Run: npm run check
 */
import assert from 'node:assert/strict';

import {
  canDecideAuthorization,
  canLinkGuardian,
  canPublish,
  canPublishGeneral,
  canReviewCertificate,
  canSendCertificate,
  MAX_GUARDIANS,
  publishableTurmas,
  visibleAuthorizations,
  visibleCertificates,
  visibleNotices,
  visibleStudents,
  visibleTickets,
} from '../src/data/access';
import { createSeed } from '../src/data/seed';

const db = createSeed();
const u = (id: string) => db.users.find((x) => x.id === id)!;
const ids = <T extends { id: string }>(xs: T[]) => xs.map((x) => x.id).sort();

let passed = 0;
function rule(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

console.log('Regras de negócio — Meu SENAI\n');

rule('RN02 família só vê os próprios alunos', () => {
  assert.deepEqual(ids(visibleStudents(db, u('u-larissa'))), ['s-pedro']);
  assert.deepEqual(ids(visibleStudents(db, u('u-ana'))), ['s-ana']);
});

rule('RN02 professor só vê alunos das suas turmas', () => {
  assert.deepEqual(ids(visibleStudents(db, u('u-ricardo'))), ['s-pedro']);
  assert.deepEqual(ids(visibleStudents(db, u('u-sonia'))), ['s-ana']);
});

rule('RN03 no máximo 2 responsáveis por aluno', () => {
  assert.equal(MAX_GUARDIANS, 2);
  for (const s of db.students) assert.ok(s.guardianIds.length <= MAX_GUARDIANS);
});

rule('RN05 só a equipe publica; comunicado geral só a gestão', () => {
  assert.equal(canPublish(u('u-larissa')), false);
  assert.equal(canPublish(u('u-pedro')), false);
  assert.equal(canPublish(u('u-ricardo')), true);
  assert.equal(canPublishGeneral(u('u-ricardo')), false);
  assert.equal(canPublishGeneral(u('u-paulo')), true);
  assert.deepEqual(publishableTurmas(db, u('u-ricardo')), ['MEC-2B']);
});

rule('RN06 aviso individual chega só ao aluno e aos responsáveis dele', () => {
  const see = (id: string) => visibleNotices(db, u(id)).some((n) => n.id === 'n-suspensao');
  assert.ok(see('u-pedro'));
  assert.ok(see('u-larissa'));
  assert.ok(see('u-marcos'));
  assert.ok(!see('u-ana'));
  assert.ok(!see('u-claudia'));
  assert.ok(!see('u-sonia'));
});

rule('RN06 aviso de turma não vaza para outra turma', () => {
  const see = (id: string) => visibleNotices(db, u(id)).some((n) => n.id === 'n-elt-epi');
  assert.ok(see('u-ana') && see('u-claudia') && see('u-sonia'));
  assert.ok(!see('u-pedro') && !see('u-larissa') && !see('u-ricardo'));
});

rule('RN06 comunicado só para responsáveis não aparece para alunos', () => {
  assert.ok(visibleNotices(db, u('u-larissa')).some((n) => n.id === 'n-rematricula'));
  assert.ok(!visibleNotices(db, u('u-pedro')).some((n) => n.id === 'n-rematricula'));
});

rule('RN07 atestado: responsável envia, secretaria/coordenação analisam, professor não vê', () => {
  assert.ok(canSendCertificate(u('u-larissa')));
  assert.ok(!canSendCertificate(u('u-pedro')));
  assert.ok(canReviewCertificate(u('u-juliana')) && canReviewCertificate(u('u-fernanda')));
  assert.ok(!canReviewCertificate(u('u-ricardo')));
  assert.deepEqual(visibleCertificates(db, u('u-ricardo')), []);
  assert.deepEqual(ids(visibleCertificates(db, u('u-larissa'))), ['c-1']);
  assert.deepEqual(ids(visibleCertificates(db, u('u-claudia'))), ['c-2']);
});

rule('RN08 autorização da escola é decidida pelo responsável; pedido da família pela gestão', () => {
  const visita = db.authorizations.find((a) => a.id === 'a-visita')!;
  const anaSaida = db.authorizations.find((a) => a.id === 'a-ana')!;
  assert.ok(canDecideAuthorization(u('u-larissa'), visita));
  assert.ok(!canDecideAuthorization(u('u-pedro'), visita));
  assert.ok(!canDecideAuthorization(u('u-claudia'), visita));
  assert.ok(!canDecideAuthorization(u('u-fernanda'), visita));
  assert.ok(canDecideAuthorization(u('u-fernanda'), anaSaida));
  assert.ok(!canDecideAuthorization(u('u-claudia'), anaSaida));
  assert.ok(!visibleAuthorizations(db, u('u-claudia')).some((a) => a.studentId === 's-pedro'));
});

rule('RN09 suporte chega só ao setor/professor escolhido', () => {
  assert.ok(visibleTickets(db, u('u-juliana')).some((t) => t.id === 't-1'));
  assert.ok(!visibleTickets(db, u('u-fernanda')).some((t) => t.id === 't-1'));
  assert.ok(visibleTickets(db, u('u-ricardo')).some((t) => t.id === 't-2'));
  assert.ok(!visibleTickets(db, u('u-sonia')).some((t) => t.id === 't-2'));
  assert.ok(!visibleTickets(db, u('u-claudia')).length);
});

rule('RN10 só a secretaria vincula responsáveis', () => {
  assert.ok(canLinkGuardian(u('u-juliana')));
  for (const id of ['u-larissa', 'u-pedro', 'u-ricardo', 'u-fernanda', 'u-paulo']) assert.ok(!canLinkGuardian(u(id)));
});

console.log(`\n${passed} regras verificadas.`);
