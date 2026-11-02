export type Role =
  | 'aluno'
  | 'responsavel'
  | 'professor'
  | 'coordenador'
  | 'diretor'
  | 'secretaria';

export type StaffRole = Exclude<Role, 'aluno' | 'responsavel'>;

export interface User {
  id: string;
  name: string;
  email: string;
  /** Demo only: plain text so the TCC demo can log in offline. Never do this in production. */
  password: string;
  role: Role;
  /** Students linked to this account (aluno: self; responsavel: up to N children). */
  studentIds: string[];
  /** Turmas a professor teaches. */
  turmas?: string[];
  /** Relationship shown on the student profile, e.g. "Mãe". */
  kinship?: string;
  phone?: string;
}

export type Weekday = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';

export interface ScheduleEntry {
  day: Weekday;
  entry: string; // HH:mm
  exit: string; // HH:mm
}

export interface Student {
  id: string;
  name: string;
  birthDate: string; // ISO yyyy-mm-dd
  registration: string; // matrícula
  course: string;
  turma: string;
  shift: string;
  schedule: ScheduleEntry[];
  /** Guardian user ids, max 2 (RN03). */
  guardianIds: string[];
  /** Student's own account id. */
  userId: string;
}

export type NoticeAudience =
  | { kind: 'geral'; to: 'todos' | 'alunos' | 'responsaveis' | 'equipe' }
  | { kind: 'turma'; turma: string }
  | { kind: 'individual'; studentId: string };

export type NoticeCategory =
  | 'informativo'
  | 'evento'
  | 'calendario'
  | 'pedagogico'
  | 'disciplinar'
  | 'urgente';

export interface Notice {
  id: string;
  protocol: string;
  title: string;
  body: string;
  category: NoticeCategory;
  audience: NoticeAudience;
  authorId: string;
  createdAt: string; // ISO
  /** Individual notices may require guardians to confirm they read it ("Ciente"). */
  requiresAck: boolean;
  readBy: string[];
  ackBy: { userId: string; at: string }[];
}

export type ReviewStatus = 'pendente' | 'aprovado' | 'recusado';

export interface Certificate {
  id: string;
  protocol: string;
  studentId: string;
  senderId: string;
  startDate: string;
  endDate: string;
  reason: string;
  fileName: string;
  fileSize?: number;
  fileUri?: string;
  createdAt: string;
  status: ReviewStatus;
  reviewerId?: string;
  reviewNote?: string;
  reviewedAt?: string;
}

export type AuthorizationOrigin = 'responsavel' | 'escola';
export type AuthorizationType = 'saida_antecipada' | 'atividade_externa' | 'outro';

export interface Authorization {
  id: string;
  protocol: string;
  studentId: string;
  origin: AuthorizationOrigin;
  type: AuthorizationType;
  title: string;
  details: string;
  date: string; // yyyy-mm-dd
  time?: string; // HH:mm
  /** Who picks the student up, for early release. */
  pickupBy?: string;
  createdById: string;
  createdAt: string;
  /**
   * origin=responsavel: school decides (pendente → aprovado/recusado).
   * origin=escola: guardian decides (pendente → aprovado = "autorizado", recusado = "não autorizado").
   */
  status: ReviewStatus;
  decidedById?: string;
  decidedAt?: string;
  decisionNote?: string;
}

export type SupportTarget = 'coordenador' | 'diretor' | 'secretaria' | 'professor';
export type TicketStatus = 'aberto' | 'respondido' | 'encerrado';

export interface TicketMessage {
  id: string;
  authorId: string;
  body: string;
  at: string;
}

export interface Ticket {
  id: string;
  protocol: string;
  subject: string;
  target: SupportTarget;
  /** When target is professor, the chosen teacher. */
  targetUserId?: string;
  studentId?: string;
  createdById: string;
  createdAt: string;
  status: TicketStatus;
  messages: TicketMessage[];
}

export type NotificationKind = 'aviso' | 'atestado' | 'autorizacao' | 'suporte' | 'vinculo';

export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Route to open, e.g. /aviso/n1 */
  href: string;
  createdAt: string;
  read: boolean;
}

export interface DbState {
  version: number;
  users: User[];
  students: Student[];
  notices: Notice[];
  certificates: Certificate[];
  authorizations: Authorization[];
  tickets: Ticket[];
  notifications: AppNotification[];
  counters: { protocol: number };
}
