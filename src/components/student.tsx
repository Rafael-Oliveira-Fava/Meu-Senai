import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { canLinkGuardian, MAX_GUARDIANS } from '../data/access';
import { userById } from '../data/selectors';
import type { DbState, Student, User } from '../data/types';
import { age, formatDay, todayWeekday, WEEKDAYS } from '../lib/format';
import { color, radius, space, type } from '../theme';
import { FadeIn } from './motion';
import { Avatar, Badge, Button, Card, Divider, Icon, InfoRow, SectionTitle } from './ui';

/** RF03 + RF04: student data, weekly schedule and linked access profiles. */
export function StudentProfile({ db, user, student }: { db: DbState; user: User; student: Student }) {
  const today = todayWeekday();
  const guardians = student.guardianIds.map((id) => userById(db, id)).filter(Boolean) as User[];
  const studentUser = userById(db, student.userId);
  const slotsLeft = MAX_GUARDIANS - guardians.length;
  const days = WEEKDAYS.filter((w) => w.id !== 'sab' || student.schedule.some((s) => s.day === 'sab'));

  return (
    <View style={{ gap: space.lg }}>
      <FadeIn>
        <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxl }}>
          <Avatar name={student.name} size={72} tone="blue" ring />
          <Text style={[type.headline, { color: color.ink, textAlign: 'center' }]}>{student.name}</Text>
          <Text style={[type.body, { color: color.muted, textAlign: 'center' }]}>
            {student.course} · Turma {student.turma}
          </Text>
          <Badge tone="blue" icon="card-account-details-outline" label={`Matrícula ${student.registration}`} style={{ alignSelf: 'center' }} />
        </Card>
      </FadeIn>

      <FadeIn index={1}>
        <Card style={{ paddingVertical: space.xs }}>
          <InfoRow icon="account-outline" label="Nome completo" value={student.name} />
          <InfoRow icon="cake-variant-outline" label="Nascimento" value={`${formatDay(student.birthDate)} (${age(student.birthDate)} anos)`} />
          <InfoRow icon="school-outline" label="Curso" value={student.course} />
          <InfoRow icon="google-classroom" label="Turma" value={student.turma} />
          <InfoRow icon="weather-sunset-up" label="Turno" value={student.shift} last />
        </Card>
      </FadeIn>

      <SectionTitle>Dias e horários</SectionTitle>
      <FadeIn index={2}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={[st.schedRow, st.schedHead]}>
            <Text style={[type.labelSm, st.colDay, { color: color.muted }]}>Dia</Text>
            <Text style={[type.labelSm, st.colTime, { color: color.muted }]}>Entrada</Text>
            <Text style={[type.labelSm, st.colTime, { color: color.muted }]}>Saída</Text>
          </View>
          {days.map((d, i) => {
            const e = student.schedule.find((s) => s.day === d.id);
            const isToday = d.id === today;
            return (
              <View key={d.id}>
                {i > 0 ? <Divider /> : null}
                <View style={[st.schedRow, isToday && { backgroundColor: color.primaryContainer }]} accessibilityLabel={`${d.long}: ${e ? `entrada ${e.entry}, saída ${e.exit}` : 'sem aula'}${isToday ? ', hoje' : ''}`}>
                  <View style={[st.colDay, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Text style={[type.titleSm, { color: e ? color.ink : color.muted }]}>{d.long}</Text>
                    {isToday ? <Badge tone="dark" label="Hoje" /> : null}
                  </View>
                  {e ? (
                    <>
                      <Text style={[type.titleSm, type.numeric, st.colTime, { color: color.ink }]}>{e.entry}</Text>
                      <Text style={[type.titleSm, type.numeric, st.colTime, { color: color.ink }]}>{e.exit}</Text>
                    </>
                  ) : (
                    <Text style={[type.bodySm, { color: color.muted, flex: 2 }]}>Sem aula</Text>
                  )}
                </View>
              </View>
            );
          })}
        </Card>
      </FadeIn>

      <SectionTitle>Perfis vinculados</SectionTitle>
      <FadeIn index={3}>
        <Card style={{ gap: space.md }}>
          <Text style={[type.bodySm, { color: color.muted }]}>
            Até 3 perfis de acesso por aluno: o próprio aluno e até {MAX_GUARDIANS} responsáveis.
          </Text>
          <View style={{ gap: space.xs }}>
            {studentUser ? <ProfileLine name={studentUser.name} detail="Aluno" email={studentUser.email} /> : null}
            {guardians.map((g) => (
              <ProfileLine key={g.id} name={g.name} detail={`${g.kinship ?? 'Responsável'}${g.phone ? ` · ${g.phone}` : ''}`} email={g.email} />
            ))}
            {Array.from({ length: slotsLeft }).map((_, i) => (
              <View key={`empty-${i}`} style={st.emptySlot}>
                <Icon name="account-plus-outline" size={20} tint={color.muted} />
                <Text style={[type.bodySm, { color: color.muted, flex: 1 }]}>Vaga para responsável disponível</Text>
              </View>
            ))}
          </View>
          <View style={st.counter}>
            <Text style={[type.labelSm, { color: color.muted }]}>
              {1 + guardians.length} de {1 + MAX_GUARDIANS} perfis em uso
            </Text>
          </View>
          {canLinkGuardian(user) && slotsLeft > 0 ? (
            <Button label="Vincular responsável" icon="account-plus" variant="tonal" onPress={() => router.push({ pathname: '/aluno/vincular', params: { id: student.id } })} full />
          ) : null}
        </Card>
      </FadeIn>
    </View>
  );
}

function ProfileLine({ name, detail, email }: { name: string; detail: string; email: string }) {
  return (
    <View style={st.profile}>
      <Avatar name={name} size={40} tone="blue" />
      <View style={{ flex: 1 }}>
        <Text style={[type.titleSm, { color: color.ink }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[type.bodySm, { color: color.muted }]} numberOfLines={1}>
          {detail}
        </Text>
        <Text style={[type.bodySm, { color: color.muted }]} numberOfLines={1}>
          {email}
        </Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  schedHead: { backgroundColor: color.surfaceAlt, minHeight: 40 },
  schedRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, minHeight: 52 },
  colDay: { flex: 1.4 },
  colTime: { flex: 1, textAlign: 'right' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  emptySlot: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderStyle: 'dashed', borderColor: color.outlineStrong, borderRadius: radius.field, padding: space.md, minHeight: 52 },
  counter: { flexDirection: 'row', justifyContent: 'flex-end' },
});
