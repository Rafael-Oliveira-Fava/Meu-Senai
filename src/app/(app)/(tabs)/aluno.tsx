import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, Text, TextInput, View } from 'react-native';

import { FadeIn } from '../../../components/motion';
import { StudentProfile } from '../../../components/student';
import { AppBar, Avatar, Card, Chip, ChipRow, EmptyState, Icon, Screen } from '../../../components/ui';
import { isFamily, visibleStudents } from '../../../data/access';
import { useStore, useUser } from '../../../data/store';
import { firstName } from '../../../lib/format';
import { color, radius, space, type } from '../../../theme';

export default function AlunoTab() {
  const { db } = useStore();
  const user = useUser();
  const students = visibleStudents(db, user);
  const [selected, setSelected] = useState(students[0]?.id);
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = students.filter((s) => !q || s.name.toLowerCase().includes(q) || s.turma.toLowerCase().includes(q) || s.registration.includes(q));
    const byTurma = new Map<string, typeof students>();
    filtered.forEach((s) => byTurma.set(s.turma, [...(byTurma.get(s.turma) ?? []), s]));
    return Array.from(byTurma.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));
  }, [students, query]);

  if (isFamily(user)) {
    const student = students.find((s) => s.id === selected) ?? students[0];
    return (
      <View style={{ flex: 1 }}>
        <AppBar title={user.role === 'aluno' ? 'Meu perfil' : 'Aluno'} subtitle={student ? `${student.course}` : undefined} back={false} />
        <Screen>
          {students.length > 1 ? (
            <ChipRow>
              {students.map((s) => (
                <Chip key={s.id} label={firstName(s.name)} selected={s.id === student?.id} onPress={() => setSelected(s.id)} />
              ))}
            </ChipRow>
          ) : null}
          {student ? (
            <StudentProfile db={db} user={user} student={student} />
          ) : (
            <EmptyState icon="account-question-outline" title="Nenhum aluno vinculado" text="Peça à secretaria para vincular sua conta ao aluno." />
          )}
        </Screen>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <AppBar title={user.role === 'professor' ? 'Minhas turmas' : 'Alunos'} subtitle={`${students.length} ${students.length === 1 ? 'aluno' : 'alunos'}`} back={false} />
      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: space.xxxl, width: '100%', maxWidth: 672, alignSelf: 'center' }}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: color.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: color.outline, paddingHorizontal: space.lg, minHeight: 52, marginBottom: space.sm }}>
            <Icon name="magnify" tint={color.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nome, turma ou matrícula"
              placeholderTextColor="#7A8494"
              accessibilityLabel="Buscar aluno"
              style={{ flex: 1, fontFamily: type.body.fontFamily, fontSize: 16, color: color.ink, minHeight: 48 }}
            />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[type.label, { color: color.muted, marginTop: space.md, marginBottom: space.xs }]} accessibilityRole="header">
            Turma {section.title}
          </Text>
        )}
        renderItem={({ item, index }) => (
          <FadeIn index={index}>
            <Card onPress={() => router.push(`/aluno/${item.id}`)} accessibilityLabel={`${item.name}, turma ${item.turma}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md }}>
              <Avatar name={item.name} size={44} tone="blue" />
              <View style={{ flex: 1 }}>
                <Text style={[type.titleSm, { color: color.ink }]}>{item.name}</Text>
                <Text style={[type.bodySm, { color: color.muted }]}>
                  {item.course} · {item.guardianIds.length} {item.guardianIds.length === 1 ? 'responsável' : 'responsáveis'}
                </Text>
              </View>
              <Icon name="chevron-right" tint={color.outlineStrong} />
            </Card>
          </FadeIn>
        )}
        ListEmptyComponent={<EmptyState icon="account-search-outline" title="Nenhum aluno encontrado" text="Confira a grafia ou busque pela turma, por exemplo MEC-2B." />}
      />
    </View>
  );
}
