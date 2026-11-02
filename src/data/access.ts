/**
 * Access rules (RN02, RN04, RN06, RN07, RN08, RN09, RN10).
 * Every screen reads data through these functions, so a profile never sees
 * what its role does not allow.
 */
import type {
  Authorization,
  Certificate,
  DbState,
  Notice,
  Role,
  Student,
  SupportTarget,
  Ticket,
  User,
} from './types';

export const STAFF_ROLES: Role[] = ['professor', 'coordenador', 'diretor', 'secretaria'];
const MANAGEMENT: Role[] = ['coordenador', 'diretor', 'secretaria'];

export const isStaff = (u: User) => STAFF_ROLES.includes(u.role);
export const isFamily = (u: User) => u.role === 'aluno' || u.role === 'responsavel';
export const isManagement = (u: User) => MANAGEMENT.includes(u.role);

export const MAX_GUARDIANS = 2;

/** Students this user may see. Family: linked ones. Professor: their turmas. Management: all. */
export function visibleStudents(db: DbState, u: User): Student[] {
  if (isFamily(u)) return db.students.filter((s) => u.studentIds.includes(s.id));
  if (u.role === 'professor') return db.students.filter((s) => u.turmas?.includes(s.turma));
  return db.students;
}

export function canSeeStudent(db: DbState, u: User, studentId: string) {
  return visibleStudents(db, u).some((s) => s.id === studentId);
}

export function canSeeNotice(db: DbState, u: User, n: Notice): boolean {
  if (n.authorId === u.id) return true;
  const a = n.audience;
  if (a.kind === 'geral') {
    if (a.to === 'todos') return true;
    if (a.to === 'alunos') return u.role === 'aluno' || isStaff(u);
    if (a.to === 'responsaveis') return u.role === 'responsavel' || isStaff(u);
    return isStaff(u);
  }
  if (a.kind === 'turma') {
    if (isManagement(u)) return true;
    if (u.role === 'professor') return !!u.turmas?.includes(a.turma);
    return visibleStudents(db, u).some((s) => s.turma === a.turma);
  }
  // Individual notice: only the student, their guardians, and management (RN06).
  if (isManagement(u)) return true;
  return isFamily(u) && u.studentIds.includes(a.studentId);
}

export function visibleNotices(db: DbState, u: User): Notice[] {
  return db.notices
    .filter((n) => canSeeNotice(db, u, n))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Users who should receive a notice (used for notifications). */
export function noticeRecipients(db: DbState, n: Notice): User[] {
  return db.users.filter((u) => u.id !== n.authorId && canSeeNotice(db, u, n) && !(isManagement(u) && n.audience.kind !== 'geral'));
}

/** RN05: who can publish, and to which audiences. */
export function canPublish(u: User) {
  return isStaff(u);
}

export function publishableTurmas(db: DbState, u: User): string[] {
  if (u.role === 'professor') return u.turmas ?? [];
  return Array.from(new Set(db.students.map((s) => s.turma))).sort();
}

export function canPublishGeneral(u: User) {
  return isManagement(u);
}

// Certificates (RN07): guardian sends; student sees own; secretaria and coordenação review.
export function canSendCertificate(u: User) {
  return u.role === 'responsavel';
}
export function canReviewCertificate(u: User) {
  return u.role === 'secretaria' || u.role === 'coordenador';
}
export function visibleCertificates(db: DbState, u: User): Certificate[] {
  const list = isFamily(u)
    ? db.certificates.filter((c) => u.studentIds.includes(c.studentId))
    : canReviewCertificate(u) || u.role === 'diretor'
      ? db.certificates
      : [];
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Authorizations (RN08)
export function visibleAuthorizations(db: DbState, u: User): Authorization[] {
  const list = isFamily(u)
    ? db.authorizations.filter((a) => u.studentIds.includes(a.studentId))
    : u.role === 'professor'
      ? db.authorizations.filter((a) => a.createdById === u.id || canSeeStudent(db, u, a.studentId))
      : db.authorizations;
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Who decides: school requests are answered by a guardian; family requests by management. */
export function canDecideAuthorization(u: User, a: Authorization) {
  if (a.status !== 'pendente') return false;
  if (a.origin === 'escola') return u.role === 'responsavel' && u.studentIds.includes(a.studentId);
  return isManagement(u);
}

export function canRequestRelease(u: User) {
  return u.role === 'responsavel';
}
export function canRequestAuthorizationFromFamily(u: User) {
  return isStaff(u);
}

// Support (RN09)
export const SUPPORT_TARGETS: { id: SupportTarget; label: string; hint: string }[] = [
  { id: 'secretaria', label: 'Secretaria', hint: 'Documentos, matrícula, carteirinha' },
  { id: 'coordenador', label: 'Coordenação', hint: 'Frequência, conduta, reuniões' },
  { id: 'professor', label: 'Professor', hint: 'Aulas, atividades e notas' },
  { id: 'diretor', label: 'Direção', hint: 'Assuntos institucionais' },
];

export function ticketHandledBy(u: User, t: Ticket) {
  if (t.target === 'professor') return u.id === t.targetUserId;
  return u.role === t.target;
}

export function visibleTickets(db: DbState, u: User): Ticket[] {
  return db.tickets
    .filter((t) => t.createdById === u.id || ticketHandledBy(u, t))
    .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
}

export function lastActivity(t: Ticket) {
  return t.messages[t.messages.length - 1]?.at ?? t.createdAt;
}

/** Guardian linking (RF04 / RN03): secretaria manages links; max 2 guardians. */
export function canLinkGuardian(u: User) {
  return u.role === 'secretaria';
}
