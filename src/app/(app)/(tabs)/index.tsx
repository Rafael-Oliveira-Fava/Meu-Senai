import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn, PressScale } from '../../../components/motion';
import { AuthorizationRow, CertificateRow, NoticeRow } from '../../../components/rows';
import { Avatar, Card, Chip, ChipRow, EmptyState, Icon, SectionTitle, Wordmark, type IconName } from '../../../components/ui';
import { isFamily, isStaff, visibleNotices, visibleStudents } from '../../../data/access';
import { needsAck, pendingActions, ticketsAwaitingMe, unreadNoticeCount, unreadNotifications } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';
import type { Student, User } from '../../../data/types';
import { firstName, ROLE_LABEL, todayWeekday, WEEKDAYS } from '../../../lib/format';
import { color, radius, shadowRaised, space, type } from '../../../theme';

type Shortcut = { label: string; icon: IconName; href: Href; count?: number };
type Counts = { notices: number; pending: number; tickets: number; bell: number };

function shortcutsFor(u: User, c: Counts): Shortcut[] {
  switch (u.role) {
    case 'responsavel':
      return [
        { label: 'Comunicados', icon: 'bullhorn-outline', href: '/avisos', count: c.notices },
        { label: 'Enviar atestado', icon: 'medical-bag', href: '/atestado/novo' },
        { label: 'Pedir saída', icon: 'exit-run', href: '/autorizacao/nova' },
        { label: 'Falar com a escola', icon: 'chat-question-outline', href: '/suporte/novo', count: c.tickets },
      ];
    case 'aluno':
      return [
        { label: 'Comunicados', icon: 'bullhorn-outline', href: '/avisos', count: c.notices },
        { label: 'Meu horário', icon: 'clock-time-four-outline', href: '/aluno' },
        { label: 'Notificações', icon: 'bell-outline', href: '/notificacoes', count: c.bell },
        { label: 'Falar com a escola', icon: 'chat-question-outline', href: '/suporte/novo', count: c.tickets },
      ];
    case 'professor':
      return [
        { label: 'Novo aviso', icon: 'bullhorn-outline', href: '/aviso/novo' },
        { label: 'Pedir autorização', icon: 'file-sign', href: '/autorizacao/nova' },
        { label: 'Minhas turmas', icon: 'account-group-outline', href: '/aluno' },
        { label: 'Mensagens', icon: 'forum-outline', href: '/suporte', count: c.tickets },
      ];
    default:
      return [
        { label: 'Novo comunicado', icon: 'bullhorn-outline', href: '/aviso/novo' },
        { label: 'Pedidos', icon: 'file-document-multiple-outline', href: '/pedidos', count: c.pending },
        { label: 'Alunos', icon: 'account-group-outline', href: '/aluno' },
        { label: 'Mensagens', icon: 'forum-outline', href: '/suporte', count: c.tickets },
      ];
  }
}

export default function Home() {
  const { db } = useStore();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const students = visibleStudents(db, user);
  const [studentId, setStudentId] = useState(students[0]?.id);
  const student = isFamily(user) ? students.find((s) => s.id === studentId) ?? students[0] : undefined;

  const notices = useMemo(() => visibleNotices(db, user), [db, user]);
  const ackPending = notices.filter((n) => needsAck(n, user));
  const pending = pendingActions(db, user);
  const bell = unreadNotifications(db, user);
  const shortcuts = shortcutsFor(user, { notices: unreadNoticeCount(db, user), pending: pending.total, tickets: ticketsAwaitingMe(db, user), bell });
  const latest = notices.filter((n) => !ackPending.includes(n)).slice(0, 3);
  const actionCount = ackPending.length + pending.total;

  const subtitle =
    user.role === 'responsavel' && student
      ? `Responsável por ${firstName(student.name)}`
      : user.role === 'aluno' && student
        ? `${student.course} · ${student.turma}`
        : user.role === 'professor'
          ? `Professor · ${user.turmas?.join(', ')}`
          : ROLE_LABEL[user.role];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ paddingBottom: space.xxxl }}>
      <View style={[st.header, { paddingTop: insets.top + space.md }]}>
        <View style={st.column}>
          <View style={st.brandRow}>
            <Wordmark size={18} />
            <Pressable
              onPress={() => router.push('/notificacoes')}
              accessibilityRole="button"
              accessibilityLabel={bell ? `Notificações, ${bell} não lidas` : 'Notificações'}
              style={({ pressed }) => [st.bell, pressed && { backgroundColor: 'rgba(255,255,255,0.18)' }]}
            >
              <Icon name="bell-outline" tint={color.onPrimary} size={24} />
              {bell ? (
                <View style={st.bellBadge}>
                  <Text style={[type.labelSm, { color: '#fff', fontSize: 11 }]}>{bell > 9 ? '9+' : bell}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
          <View style={st.headRow}>
            <Pressable onPress={() => router.push('/conta')} accessibilityRole="button" accessibilityLabel="Minha conta" hitSlop={6}>
              <Avatar name={user.name} size={52} ring />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[type.headline, { color: color.onPrimary }]} numberOfLines={1}>
                Olá, {firstName(user.name)}
              </Text>
              <Text style={[type.bodySm, { color: color.onPrimaryMuted }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
          {user.role === 'responsavel' && students.length > 1 ? (
            <View style={{ marginTop: space.lg }}>
              <ChipRow>
                {students.map((s) => (
                  <Chip key={s.id} label={firstName(s.name)} selected={s.id === student?.id} onPress={() => setStudentId(s.id)} />
                ))}
              </ChipRow>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[st.column, { paddingHorizontal: space.lg }]}>
        <FadeIn style={st.shortcuts}>
          {shortcuts.map((sc) => (
            <PressScale key={sc.label} onPress={() => router.push(sc.href)} accessibilityRole="button" accessibilityLabel={sc.label} style={st.shortcut} scaleTo={0.95}>
              <View style={st.shortcutIcon}>
                <Icon name={sc.icon} size={24} tint={color.primary} />
                {sc.count ? (
                  <View style={st.shortcutBadge}>
                    <Text style={[type.labelSm, { color: '#fff', fontSize: 11 }]}>{sc.count > 9 ? '9+' : sc.count}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[type.labelSm, { color: color.text, textAlign: 'center', width: '100%' }]} numberOfLines={2}>
                {sc.label}
              </Text>
            </PressScale>
          ))}
        </FadeIn>

        {student ? (
          <FadeIn index={1}>
            <TodayCard student={student} />
          </FadeIn>
        ) : null}

        {actionCount > 0 ? (
          <View style={{ gap: space.md }}>
            <SectionTitle count={actionCount}>Precisa da sua atenção</SectionTitle>
            {ackPending.map((n, i) => (
              <FadeIn key={n.id} index={i + 2}>
                <NoticeRow db={db} user={user} notice={n} />
              </FadeIn>
            ))}
            {pending.auths.slice(0, 3).map((a, i) => (
              <FadeIn key={a.id} index={i + 3}>
                <AuthorizationRow db={db} auth={a} user={user} />
              </FadeIn>
            ))}
            {pending.certs.slice(0, 3).map((c, i) => (
              <FadeIn key={c.id} index={i + 4}>
                <CertificateRow db={db} cert={c} showStudent />
              </FadeIn>
            ))}
          </View>
        ) : (
          <FadeIn index={2} style={st.allClear}>
            <Icon name="check-circle-outline" size={22} tint={color.green} />
            <Text style={[type.bodySm, { color: color.text, flex: 1 }]}>Tudo em dia. Nada esperando sua resposta.</Text>
          </FadeIn>
        )}

        <View style={{ gap: space.md }}>
          <SectionTitle action={{ label: 'Ver todos', onPress: () => router.push('/avisos') }}>Últimos comunicados</SectionTitle>
          {latest.length ? (
            latest.map((n, i) => (
              <FadeIn key={n.id} index={i + 3}>
                <NoticeRow db={db} user={user} notice={n} />
              </FadeIn>
            ))
          ) : (
            <Card>
              <EmptyState icon="bullhorn-outline" title="Nenhum comunicado ainda" text={isStaff(user) ? 'Publique o primeiro comunicado para sua turma ou para toda a escola.' : 'Quando a escola publicar um aviso, ele aparece aqui.'} />
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function TodayCard({ student }: { student: Student }) {
  const today = todayWeekday();
  const entry = student.schedule.find((d) => d.day === today);
  const next = entry ? null : nextClass(student);
  return (
    <Card onPress={() => router.push(`/aluno/${student.id}`)} accessibilityLabel="Ver perfil e horários do aluno" style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Avatar name={student.name} size={40} tone="blue" />
        <View style={{ flex: 1 }}>
          <Text style={[type.titleSm, { color: color.ink }]} numberOfLines={1}>
            {student.name}
          </Text>
          <Text style={[type.bodySm, { color: color.muted }]} numberOfLines={1}>
            {student.course} · Turma {student.turma}
          </Text>
        </View>
        <Icon name="chevron-right" tint={color.outlineStrong} />
      </View>
      <View style={st.today}>
        {entry ? (
          <>
            <TimeCell label="Hoje · entrada" value={entry.entry} />
            <View style={st.todayDivider} />
            <TimeCell label="Saída" value={entry.exit} />
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1, paddingVertical: space.xs }}>
            <Icon name="calendar-blank-outline" size={20} tint={color.muted} />
            <Text style={[type.bodySm, { color: color.muted, flex: 1 }]}>
              Sem aula hoje.{next ? ` Próxima: ${next.label}, ${next.entry}.` : ''}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

function TimeCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[type.labelSm, { color: color.muted }]}>{label}</Text>
      <Text style={[type.headline, type.numeric, { color: color.ink }]}>{value}</Text>
    </View>
  );
}

function nextClass(student: Student) {
  const order = WEEKDAYS.map((w) => w.id);
  const today = new Date().getDay(); // 0 = domingo
  for (let i = 1; i <= 7; i++) {
    const idx = (today + i) % 7;
    if (idx === 0) continue;
    const day = order[idx - 1];
    const e = student.schedule.find((d) => d.day === day);
    if (e) return { label: WEEKDAYS[idx - 1].long, entry: e.entry };
  }
  return null;
}

const st = StyleSheet.create({
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: space.lg },
  header: {
    backgroundColor: color.primary,
    paddingHorizontal: space.lg,
    paddingBottom: 64,
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  shortcutBadge: { position: 'absolute', top: -2, right: -4, minWidth: 20, height: 20, borderRadius: radius.pill, backgroundColor: color.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: color.surface },
  allClear: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.greenContainer, borderRadius: radius.field, paddingHorizontal: space.lg, paddingVertical: space.md },
  bell: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  bellBadge: { position: 'absolute', top: 6, right: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: color.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: color.primary },
  shortcuts: { marginTop: -40, backgroundColor: color.surface, borderRadius: radius.sheet, paddingVertical: space.lg, paddingHorizontal: space.sm, flexDirection: 'row', ...shadowRaised },
  shortcut: { flex: 1, minWidth: 0, alignItems: 'center', gap: space.sm, paddingHorizontal: 2, minHeight: 88 },
  shortcutIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: color.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  today: { flexDirection: 'row', alignItems: 'center', backgroundColor: color.surfaceAlt, borderRadius: radius.field, padding: space.md, borderWidth: 1, borderColor: color.outline },
  todayDivider: { width: 1, alignSelf: 'stretch', backgroundColor: color.outline, marginHorizontal: space.md },
});
