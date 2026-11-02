import { canDecideAuthorization, canReviewCertificate, ticketHandledBy, visibleAuthorizations, visibleCertificates, visibleNotices, visibleTickets } from './access';
import type { DbState, Notice, User } from './types';

export const userById = (db: DbState, id: string) => db.users.find((u) => u.id === id);
export const studentById = (db: DbState, id: string) => db.students.find((s) => s.id === id);

export function isUnread(n: Notice, u: User) {
  return n.authorId !== u.id && !n.readBy.includes(u.id);
}

/** Guardian still has to confirm "Ciente" on an individual notice. */
export function needsAck(n: Notice, u: User) {
  return n.requiresAck && u.role === 'responsavel' && !n.ackBy.some((a) => a.userId === u.id);
}

export function unreadNoticeCount(db: DbState, u: User) {
  return visibleNotices(db, u).filter((n) => isUnread(n, u)).length;
}

/** Items waiting for this user's action in Pedidos (certificates + authorizations). */
export function pendingActions(db: DbState, u: User) {
  const auths = visibleAuthorizations(db, u).filter((a) => canDecideAuthorization(u, a));
  const certs = canReviewCertificate(u) ? visibleCertificates(db, u).filter((c) => c.status === 'pendente') : [];
  return { auths, certs, total: auths.length + certs.length };
}

export function ticketsAwaitingMe(db: DbState, u: User) {
  return visibleTickets(db, u).filter((t) => {
    if (t.status === 'encerrado') return false;
    const last = t.messages[t.messages.length - 1];
    if (ticketHandledBy(u, t)) return t.status === 'aberto';
    return t.createdById === u.id && last?.authorId !== u.id && t.status === 'respondido';
  }).length;
}

export function unreadNotifications(db: DbState, u: User) {
  return db.notifications.filter((n) => n.userId === u.id && !n.read).length;
}
