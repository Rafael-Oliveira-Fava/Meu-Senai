import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { isUnread, needsAck, studentById, userById } from '../data/selectors';
import type { Authorization, Certificate, DbState, Notice, Ticket, User } from '../data/types';
import { AUTH_TYPE_LABEL, CATEGORY_LABEL, firstName, formatDayShort, relativeDay, TARGET_LABEL, timeAgo } from '../lib/format';
import { color, radius, space, type } from '../theme';
import { Badge, Card, Icon, StatusBadge, TicketBadge, UnreadDot, type IconName } from './ui';

export function audienceLabel(db: DbState, n: Notice) {
  const a = n.audience;
  if (a.kind === 'individual') return `Individual · ${firstName(studentById(db, a.studentId)?.name ?? 'Aluno')}`;
  if (a.kind === 'turma') return `Turma ${a.turma}`;
  return { todos: 'Todos', alunos: 'Alunos', responsaveis: 'Responsáveis', equipe: 'Equipe' }[a.to];
}

const CATEGORY_ICON: Record<Notice['category'], IconName> = {
  informativo: 'information-outline',
  evento: 'calendar-star',
  calendario: 'calendar-blank-outline',
  pedagogico: 'book-open-variant',
  disciplinar: 'alert-octagon-outline',
  urgente: 'alert-outline',
};

export function NoticeRow({ db, user, notice }: { db: DbState; user: User; notice: Notice }) {
  const unread = isUnread(notice, user);
  const ack = needsAck(notice, user);
  const hot = notice.category === 'urgente' || notice.category === 'disciplinar';
  const author = userById(db, notice.authorId);
  return (
    <Card onPress={() => router.push(`/aviso/${notice.id}`)} accessibilityLabel={`${unread ? 'Não lido. ' : ''}${notice.title}`} style={{ gap: space.sm }}>
      <View style={st.top}>
        <View style={[st.catIcon, hot && { backgroundColor: color.redContainer }]}>
          <Icon name={CATEGORY_ICON[notice.category]} size={18} tint={hot ? color.red : color.primary} />
        </View>
        <Text style={[type.labelSm, { color: hot ? color.onRedContainer : color.muted, flex: 1 }]} numberOfLines={1}>
          {CATEGORY_LABEL[notice.category]} · {audienceLabel(db, notice)}
        </Text>
        <Text style={[type.labelSm, { color: color.muted }]}>{timeAgo(notice.createdAt)}</Text>
        {unread ? <UnreadDot /> : null}
      </View>
      <Text style={[type.titleSm, { color: color.ink, fontFamily: unread ? type.title.fontFamily : type.titleSm.fontFamily }]} numberOfLines={2}>
        {notice.title}
      </Text>
      <Text style={[type.bodySm, { color: color.muted }]} numberOfLines={2}>
        {notice.body.replace(/\n+/g, ' ')}
      </Text>
      <View style={st.meta}>
        <Text style={[type.labelSm, { color: color.muted }]}>{author ? `${author.name}` : ''}</Text>
        {ack ? <Badge tone="red" icon="draw-pen" label="Confirme a ciência" /> : null}
      </View>
    </Card>
  );
}

export function CertificateRow({ db, cert, showStudent }: { db: DbState; cert: Certificate; showStudent?: boolean }) {
  const range = cert.startDate === cert.endDate ? formatDayShort(cert.startDate) : `${formatDayShort(cert.startDate)} a ${formatDayShort(cert.endDate)}`;
  return (
    <Card onPress={() => router.push(`/atestado/${cert.id}`)} accessibilityLabel={`Atestado ${range}`} style={st.row}>
      <View style={st.leadIcon}>
        <Icon name="medical-bag" size={22} tint={color.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.titleSm, { color: color.ink }]} numberOfLines={1}>
          Atestado · {range}
        </Text>
        <Text style={[type.bodySm, { color: color.muted }]} numberOfLines={1}>
          {showStudent ? `${studentById(db, cert.studentId)?.name} · ` : ''}
          {cert.reason || cert.fileName}
        </Text>
        <View style={st.meta}>
          <StatusBadge status={cert.status} labels={{ aprovado: 'Aceito', recusado: 'Recusado', pendente: 'Em análise' }} />
          <Text style={[type.labelSm, { color: color.muted }]}>Nº {cert.protocol}</Text>
        </View>
      </View>
    </Card>
  );
}

export function AuthorizationRow({ db, auth, user }: { db: DbState; auth: Authorization; user: User }) {
  const student = studentById(db, auth.studentId);
  const fromSchool = auth.origin === 'escola';
  const waitingMe = auth.status === 'pendente' && ((fromSchool && user.role === 'responsavel') || (!fromSchool && ['coordenador', 'diretor', 'secretaria'].includes(user.role)));
  const labels = fromSchool ? { aprovado: 'Autorizado', recusado: 'Não autorizado', pendente: 'Aguardando responsável' } : { aprovado: 'Aprovado', recusado: 'Recusado', pendente: 'Em análise' };
  return (
    <Card onPress={() => router.push(`/autorizacao/${auth.id}`)} accessibilityLabel={auth.title} style={st.row}>
      <View style={[st.leadIcon, waitingMe && { backgroundColor: color.redContainer }]}>
        <Icon name={auth.type === 'saida_antecipada' ? 'exit-run' : 'bus-school'} size={22} tint={waitingMe ? color.red : color.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.labelSm, { color: color.muted }]}>
          {AUTH_TYPE_LABEL[auth.type]} · {relativeDay(auth.date)}
          {auth.time ? `, ${auth.time}` : ''}
        </Text>
        <Text style={[type.titleSm, { color: color.ink }]} numberOfLines={1}>
          {auth.title}
        </Text>
        <Text style={[type.bodySm, { color: color.muted }]} numberOfLines={1}>
          {student?.name} · {fromSchool ? 'Pedido da escola' : 'Pedido da família'}
        </Text>
        <View style={st.meta}>
          {waitingMe ? <Badge tone="red" icon="hand-pointing-right" label="Sua resposta" /> : <StatusBadge status={auth.status} labels={labels} />}
          <Text style={[type.labelSm, { color: color.muted }]}>Nº {auth.protocol}</Text>
        </View>
      </View>
    </Card>
  );
}

export function TicketRow({ db, ticket, user }: { db: DbState; ticket: Ticket; user: User }) {
  const last = ticket.messages[ticket.messages.length - 1];
  const lastAuthor = last ? userById(db, last.authorId) : undefined;
  const mine = ticket.createdById === user.id;
  const target = ticket.target === 'professor' ? `Prof. ${userById(db, ticket.targetUserId ?? '')?.name ?? ''}` : TARGET_LABEL[ticket.target];
  const from = userById(db, ticket.createdById);
  return (
    <Card onPress={() => router.push(`/suporte/${ticket.id}`)} accessibilityLabel={ticket.subject} style={st.row}>
      <View style={st.leadIcon}>
        <Icon name="forum-outline" size={22} tint={color.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.labelSm, { color: color.muted }]} numberOfLines={1}>
          {mine ? `Para ${target}` : `De ${from?.name ?? ''}`} · {timeAgo(last?.at ?? ticket.createdAt)}
        </Text>
        <Text style={[type.titleSm, { color: color.ink }]} numberOfLines={1}>
          {ticket.subject}
        </Text>
        <Text style={[type.bodySm, { color: color.muted }]} numberOfLines={1}>
          {lastAuthor?.id === user.id ? 'Você: ' : lastAuthor ? `${firstName(lastAuthor.name)}: ` : ''}
          {last?.body}
        </Text>
        <View style={st.meta}>
          <TicketBadge status={ticket.status} />
          <Text style={[type.labelSm, { color: color.muted }]}>Nº {ticket.protocol}</Text>
        </View>
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  catIcon: { width: 28, height: 28, borderRadius: radius.pill, backgroundColor: color.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, marginTop: 4 },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  leadIcon: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: color.primaryContainer, alignItems: 'center', justifyContent: 'center' },
});
