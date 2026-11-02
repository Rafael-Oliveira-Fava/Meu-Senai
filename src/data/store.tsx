import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  canDecideAuthorization,
  canLinkGuardian,
  canPublish,
  canPublishGeneral,
  canReviewCertificate,
  canSeeStudent,
  canSendCertificate,
  isManagement,
  MAX_GUARDIANS,
  noticeRecipients,
  publishableTurmas,
  ticketHandledBy,
} from './access';
import { createSeed, DEMO_PASSWORD } from './seed';
import type {
  AppNotification,
  Authorization,
  AuthorizationType,
  Certificate,
  DbState,
  Notice,
  NoticeAudience,
  NoticeCategory,
  ReviewStatus,
  SupportTarget,
  Ticket,
  User,
} from './types';

const DB_KEY = 'meusenai:db:v1';
const SESSION_KEY = 'meusenai:session:v1';

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

type Result = { ok: true; id?: string } | { ok: false; error: string };

interface Store {
  ready: boolean;
  db: DbState;
  user: User | null;
  login(email: string, password: string): Result;
  logout(): void;
  resetDemo(): void;
  markNoticeRead(id: string): void;
  ackNotice(id: string): void;
  publishNotice(input: { title: string; body: string; category: NoticeCategory; audience: NoticeAudience; requiresAck: boolean }): Result;
  sendCertificate(input: { studentId: string; startDate: string; endDate: string; reason: string; fileName: string; fileSize?: number; fileUri?: string }): Result;
  reviewCertificate(id: string, status: Exclude<ReviewStatus, 'pendente'>, note: string): Result;
  createAuthorization(input: { studentId: string; type: AuthorizationType; title: string; details: string; date: string; time?: string; pickupBy?: string }): Result;
  decideAuthorization(id: string, status: Exclude<ReviewStatus, 'pendente'>, note: string): Result;
  createTicket(input: { subject: string; target: SupportTarget; targetUserId?: string; studentId?: string; body: string }): Result;
  replyTicket(id: string, body: string): Result;
  closeTicket(id: string): Result;
  markNotificationRead(id: string): void;
  markAllNotificationsRead(): void;
  linkGuardian(studentId: string, input: { name: string; email: string; kinship: string; phone: string }): Result;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DbState>(createSeed);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    (async () => {
      try {
        const [rawDb, rawSession] = await Promise.all([AsyncStorage.getItem(DB_KEY), AsyncStorage.getItem(SESSION_KEY)]);
        if (rawDb) {
          const parsed = JSON.parse(rawDb) as DbState;
          if (parsed.version === 1) setDb(parsed);
        }
        if (rawSession) setSessionId(rawSession);
      } catch {
        // Corrupt storage: fall back to fresh demo data.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(DB_KEY, JSON.stringify(db)).catch(() => {});
  }, [db, ready]);

  useEffect(() => {
    if (!ready) return;
    if (sessionId) AsyncStorage.setItem(SESSION_KEY, sessionId).catch(() => {});
    else AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, [sessionId, ready]);

  const user = useMemo(() => db.users.find((u) => u.id === sessionId) ?? null, [db.users, sessionId]);

  /** Applies a mutation that also allocates a protocol number when asked. */
  const mutate = useCallback((fn: (draft: DbState, nextProtocol: () => string) => void) => {
    setDb((prev) => {
      const draft: DbState = structuredClone(prev);
      const nextProtocol = () => {
        draft.counters.protocol += 1;
        return `${new Date().getFullYear()}/${String(draft.counters.protocol).padStart(4, '0')}`;
      };
      fn(draft, nextProtocol);
      return draft;
    });
  }, []);

  const notify = (draft: DbState, userIds: string[], n: Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'read'>) => {
    const unique = Array.from(new Set(userIds));
    for (const userId of unique) {
      draft.notifications.unshift({ ...n, id: uid('nt'), userId, createdAt: now(), read: false });
    }
  };

  const familyOf = (draft: DbState, studentId: string) => {
    const s = draft.students.find((x) => x.id === studentId);
    return s ? [s.userId, ...s.guardianIds] : [];
  };
  const guardiansOf = (draft: DbState, studentId: string) => draft.students.find((x) => x.id === studentId)?.guardianIds ?? [];
  const usersWithRole = (draft: DbState, ...roles: User['role'][]) => draft.users.filter((u) => roles.includes(u.role)).map((u) => u.id);
  const studentName = (draft: DbState, id: string) => draft.students.find((s) => s.id === id)?.name ?? 'Aluno';

  const store: Store = {
    ready,
    db,
    user,

    login(email, password) {
      const found = dbRef.current.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found || found.password !== password) return { ok: false, error: 'E-mail ou senha incorretos. Confira e tente de novo.' };
      setSessionId(found.id);
      return { ok: true };
    },

    logout() {
      setSessionId(null);
    },

    resetDemo() {
      setDb(createSeed());
    },

    markNoticeRead(id) {
      if (!user) return;
      const n = dbRef.current.notices.find((x) => x.id === id);
      if (!n || n.readBy.includes(user.id)) return;
      mutate((d) => {
        d.notices.find((x) => x.id === id)?.readBy.push(user.id);
        d.notifications.forEach((nt) => {
          if (nt.userId === user.id && nt.href === `/aviso/${id}`) nt.read = true;
        });
      });
    },

    ackNotice(id) {
      if (!user) return;
      const target = dbRef.current.notices.find((x) => x.id === id);
      // Only a guardian linked to the notice's student can confirm "Ciente".
      if (!target || target.audience.kind !== 'individual' || user.role !== 'responsavel' || !user.studentIds.includes(target.audience.studentId)) return;
      mutate((d) => {
        const n = d.notices.find((x) => x.id === id);
        if (!n || n.ackBy.some((a) => a.userId === user.id)) return;
        n.ackBy.push({ userId: user.id, at: now() });
        if (!n.readBy.includes(user.id)) n.readBy.push(user.id);
        notify(d, [n.authorId], { kind: 'aviso', title: 'Ciência confirmada', body: `${user.name} confirmou: ${n.title}`, href: `/aviso/${n.id}` });
      });
    },

    publishNotice(input) {
      if (!user || !canPublish(user)) return { ok: false, error: 'Seu perfil não pode publicar comunicados.' };
      if (input.title.trim().length < 4) return { ok: false, error: 'Escreva um título com pelo menos 4 letras.' };
      if (input.body.trim().length < 10) return { ok: false, error: 'Escreva a mensagem com pelo menos 10 letras.' };
      const a = input.audience;
      if (a.kind === 'geral' && !canPublishGeneral(user)) return { ok: false, error: 'Comunicados gerais são publicados pela gestão.' };
      if (a.kind === 'turma' && !publishableTurmas(dbRef.current, user).includes(a.turma)) return { ok: false, error: 'Você não pode publicar para esta turma.' };
      if (a.kind === 'individual' && !canSeeStudent(dbRef.current, user, a.studentId)) return { ok: false, error: 'Este aluno não está nas suas turmas.' };
      const id = uid('n');
      mutate((d, next) => {
        const notice: Notice = {
          id,
          protocol: next(),
          title: input.title.trim(),
          body: input.body.trim(),
          category: input.category,
          audience: input.audience,
          authorId: user.id,
          createdAt: now(),
          requiresAck: input.audience.kind === 'individual' && input.requiresAck,
          readBy: [],
          ackBy: [],
        };
        d.notices.unshift(notice);
        const recipients = noticeRecipients(d, notice).map((u) => u.id);
        notify(d, recipients, {
          kind: 'aviso',
          title: notice.audience.kind === 'individual' ? 'Aviso individual' : 'Novo comunicado',
          body: notice.title,
          href: `/aviso/${id}`,
        });
      });
      return { ok: true, id };
    },

    sendCertificate(input) {
      if (!user || !canSendCertificate(user) || !user.studentIds.includes(input.studentId)) return { ok: false, error: 'Apenas responsáveis vinculados podem enviar atestados deste aluno.' };
      if (!input.fileName) return { ok: false, error: 'Anexe a foto ou o PDF do atestado.' };
      if (input.endDate < input.startDate) return { ok: false, error: 'A data final não pode ser antes da data inicial.' };
      const id = uid('c');
      mutate((d, next) => {
        const c: Certificate = { id, protocol: next(), senderId: user.id, createdAt: now(), status: 'pendente', ...input, reason: input.reason.trim() };
        d.certificates.unshift(c);
        notify(d, usersWithRole(d, 'secretaria', 'coordenador'), {
          kind: 'atestado',
          title: 'Novo atestado',
          body: `${studentName(d, c.studentId)} · ${c.reason || 'Sem observação'}`,
          href: `/atestado/${id}`,
        });
      });
      return { ok: true, id };
    },

    reviewCertificate(id, status, note) {
      if (!user || !canReviewCertificate(user)) return { ok: false, error: 'Seu perfil não pode analisar atestados.' };
      if (status === 'recusado' && note.trim().length < 5) return { ok: false, error: 'Explique o motivo da recusa para a família.' };
      mutate((d) => {
        const c = d.certificates.find((x) => x.id === id);
        if (!c || c.status !== 'pendente') return;
        Object.assign(c, { status, reviewerId: user.id, reviewNote: note.trim() || undefined, reviewedAt: now() });
        notify(d, familyOf(d, c.studentId), {
          kind: 'atestado',
          title: status === 'aprovado' ? 'Atestado aceito' : 'Atestado recusado',
          body: `Protocolo ${c.protocol}`,
          href: `/atestado/${id}`,
        });
      });
      return { ok: true, id };
    },

    createAuthorization(input) {
      if (!user) return { ok: false, error: 'Entre novamente.' };
      const origin = user.role === 'responsavel' ? 'responsavel' : user.role === 'aluno' ? null : 'escola';
      if (!origin) return { ok: false, error: 'Alunos não podem criar autorizações.' };
      if (!canSeeStudent(dbRef.current, user, input.studentId)) return { ok: false, error: 'Aluno não vinculado à sua conta ou turma.' };
      if (input.title.trim().length < 4) return { ok: false, error: 'Dê um título ao pedido.' };
      if (input.type === 'saida_antecipada' && !input.time) return { ok: false, error: 'Informe o horário de saída.' };
      if (input.type === 'saida_antecipada' && !input.pickupBy?.trim()) return { ok: false, error: 'Informe quem vai buscar o aluno.' };
      const id = uid('a');
      mutate((d, next) => {
        const a: Authorization = { id, protocol: next(), origin, createdById: user.id, createdAt: now(), status: 'pendente', ...input, title: input.title.trim(), details: input.details.trim() };
        d.authorizations.unshift(a);
        const targets = origin === 'escola' ? guardiansOf(d, a.studentId) : usersWithRole(d, 'coordenador', 'secretaria');
        notify(d, targets, {
          kind: 'autorizacao',
          title: origin === 'escola' ? 'Autorização solicitada' : 'Pedido de saída antecipada',
          body: `${studentName(d, a.studentId)} · ${a.title}`,
          href: `/autorizacao/${id}`,
        });
      });
      return { ok: true, id };
    },

    decideAuthorization(id, status, note) {
      const a = dbRef.current.authorizations.find((x) => x.id === id);
      if (!user || !a || !canDecideAuthorization(user, a)) return { ok: false, error: 'Você não pode decidir esta autorização.' };
      if (status === 'recusado' && a.origin === 'responsavel' && note.trim().length < 5) return { ok: false, error: 'Explique o motivo para a família.' };
      mutate((d) => {
        const x = d.authorizations.find((y) => y.id === id)!;
        Object.assign(x, { status, decidedById: user.id, decidedAt: now(), decisionNote: note.trim() || undefined });
        const word = x.origin === 'escola' ? (status === 'aprovado' ? 'autorizou' : 'não autorizou') : status === 'aprovado' ? 'aprovou' : 'recusou';
        const targets = x.origin === 'escola' ? [x.createdById, ...usersWithRole(d, 'coordenador')] : familyOf(d, x.studentId);
        notify(d, targets, {
          kind: 'autorizacao',
          title: `${user.name.split(' ')[0]} ${word}`,
          body: `${studentName(d, x.studentId)} · ${x.title}`,
          href: `/autorizacao/${id}`,
        });
      });
      return { ok: true, id };
    },

    createTicket(input) {
      if (!user) return { ok: false, error: 'Entre novamente.' };
      if (input.target === 'professor' && !input.targetUserId) return { ok: false, error: 'Escolha o professor.' };
      if (input.subject.trim().length < 4) return { ok: false, error: 'Escreva o assunto.' };
      if (input.body.trim().length < 10) return { ok: false, error: 'Descreva sua dúvida com pelo menos 10 letras.' };
      const id = uid('t');
      mutate((d, next) => {
        const t: Ticket = {
          id,
          protocol: next(),
          subject: input.subject.trim(),
          target: input.target,
          targetUserId: input.target === 'professor' ? input.targetUserId : undefined,
          studentId: input.studentId,
          createdById: user.id,
          createdAt: now(),
          status: 'aberto',
          messages: [{ id: uid('m'), authorId: user.id, body: input.body.trim(), at: now() }],
        };
        d.tickets.unshift(t);
        const handlers = d.users.filter((u) => ticketHandledBy(u, t)).map((u) => u.id);
        notify(d, handlers, { kind: 'suporte', title: 'Nova solicitação', body: t.subject, href: `/suporte/${id}` });
      });
      return { ok: true, id };
    },

    replyTicket(id, body) {
      const t = dbRef.current.tickets.find((x) => x.id === id);
      if (!user || !t) return { ok: false, error: 'Solicitação não encontrada.' };
      const handler = ticketHandledBy(user, t);
      if (!handler && t.createdById !== user.id) return { ok: false, error: 'Você não participa desta conversa.' };
      if (t.status === 'encerrado') return { ok: false, error: 'Esta solicitação foi encerrada.' };
      if (body.trim().length < 2) return { ok: false, error: 'Escreva a mensagem.' };
      mutate((d) => {
        const x = d.tickets.find((y) => y.id === id)!;
        x.messages.push({ id: uid('m'), authorId: user.id, body: body.trim(), at: now() });
        x.status = handler ? 'respondido' : 'aberto';
        const targets = handler ? [x.createdById] : d.users.filter((u) => ticketHandledBy(u, x)).map((u) => u.id);
        notify(d, targets, { kind: 'suporte', title: handler ? 'Nova resposta' : 'Nova mensagem', body: x.subject, href: `/suporte/${id}` });
      });
      return { ok: true, id };
    },

    closeTicket(id) {
      const t = dbRef.current.tickets.find((x) => x.id === id);
      if (!user || !t || (t.createdById !== user.id && !ticketHandledBy(user, t))) return { ok: false, error: 'Você não pode encerrar esta solicitação.' };
      mutate((d) => {
        d.tickets.find((y) => y.id === id)!.status = 'encerrado';
      });
      return { ok: true, id };
    },

    markNotificationRead(id) {
      mutate((d) => {
        const n = d.notifications.find((x) => x.id === id);
        if (n) n.read = true;
      });
    },

    markAllNotificationsRead() {
      if (!user) return;
      mutate((d) => d.notifications.forEach((n) => n.userId === user.id && (n.read = true)));
    },

    linkGuardian(studentId, input) {
      if (!user || !canLinkGuardian(user)) return { ok: false, error: 'Somente a secretaria vincula responsáveis.' };
      const s = dbRef.current.students.find((x) => x.id === studentId);
      if (!s) return { ok: false, error: 'Aluno não encontrado.' };
      if (s.guardianIds.length >= MAX_GUARDIANS) return { ok: false, error: `Limite de ${MAX_GUARDIANS} responsáveis por aluno atingido.` };
      if (input.name.trim().split(' ').length < 2) return { ok: false, error: 'Informe nome e sobrenome.' };
      if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) return { ok: false, error: 'Informe um e-mail válido.' };
      const existing = dbRef.current.users.find((u) => u.email.toLowerCase() === input.email.trim().toLowerCase());
      if (existing && existing.role !== 'responsavel') return { ok: false, error: 'Este e-mail pertence a outro tipo de perfil.' };
      if (existing && s.guardianIds.includes(existing.id)) return { ok: false, error: 'Este responsável já está vinculado.' };
      mutate((d) => {
        const st = d.students.find((x) => x.id === studentId)!;
        let guardian = d.users.find((u) => u.email.toLowerCase() === input.email.trim().toLowerCase());
        if (!guardian) {
          guardian = {
            id: uid('u'),
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            password: DEMO_PASSWORD,
            role: 'responsavel',
            studentIds: [],
            kinship: input.kinship.trim() || 'Responsável',
            phone: input.phone.trim() || undefined,
          };
          d.users.push(guardian);
        }
        guardian.studentIds.push(studentId);
        st.guardianIds.push(guardian.id);
        notify(d, [guardian.id, st.userId], { kind: 'vinculo', title: 'Responsável vinculado', body: `${guardian.name} agora acompanha ${st.name}`, href: `/aluno/${st.id}` });
      });
      return { ok: true };
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

/** For screens behind auth: the signed-in user is guaranteed by the root layout redirect. */
export function useUser(): User {
  const { user } = useStore();
  if (!user) throw new Error('No session');
  return user;
}

export { isManagement };
