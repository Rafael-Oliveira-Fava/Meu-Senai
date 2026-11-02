import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useSnackbar } from '../../../components/snackbar';
import { AppBar, Button, Chip, EmptyState, ErrorBanner, Field, OptionList, Screen, SwitchRow } from '../../../components/ui';
import { canPublish, canPublishGeneral, publishableTurmas, visibleStudents } from '../../../data/access';
import { useStore, useUser } from '../../../data/store';
import type { NoticeAudience, NoticeCategory } from '../../../data/types';
import { CATEGORY_LABEL } from '../../../lib/format';
import { color, space, type } from '../../../theme';

type Target = 'todos' | 'responsaveis' | 'alunos' | 'turma' | 'individual';

export default function NewNotice() {
  const { db, publishNotice } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const general = canPublishGeneral(user);
  const turmas = publishableTurmas(db, user);
  const students = visibleStudents(db, user);

  const [target, setTarget] = useState<Target | null>(general ? 'todos' : 'turma');
  const [turma, setTurma] = useState<string | null>(turmas[0] ?? null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [category, setCategory] = useState<NoticeCategory>('informativo');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [requiresAck, setRequiresAck] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!canPublish(user)) {
    return (
      <>
        <AppBar title="Novo aviso" />
        <Screen>
          <EmptyState icon="lock-outline" title="Sem permissão" text="Somente a equipe da escola publica comunicados." />
        </Screen>
      </>
    );
  }

  const targets: { id: Target; label: string; hint: string; icon: 'school-outline' | 'account-heart-outline' | 'account-school-outline' | 'google-classroom' | 'account-lock-outline' }[] = [
    ...(general
      ? [
          { id: 'todos' as const, label: 'Toda a escola', hint: 'Alunos, responsáveis e equipe', icon: 'school-outline' as const },
          { id: 'responsaveis' as const, label: 'Somente responsáveis', hint: 'Pais e responsáveis de todos os alunos', icon: 'account-heart-outline' as const },
          { id: 'alunos' as const, label: 'Somente alunos', hint: 'Todos os alunos matriculados', icon: 'account-school-outline' as const },
        ]
      : []),
    { id: 'turma', label: 'Uma turma', hint: 'Alunos e responsáveis da turma', icon: 'google-classroom' },
    { id: 'individual', label: 'Um aluno (aviso individual)', hint: 'Só o aluno e seus responsáveis recebem', icon: 'account-lock-outline' },
  ];

  const submit = () => {
    setError(null);
    let audience: NoticeAudience;
    if (target === 'turma') {
      if (!turma) return setError('Escolha a turma.');
      audience = { kind: 'turma', turma };
    } else if (target === 'individual') {
      if (!studentId) return setError('Escolha o aluno que vai receber o aviso.');
      audience = { kind: 'individual', studentId };
    } else if (target) {
      audience = { kind: 'geral', to: target };
    } else return setError('Escolha para quem enviar.');
    const r = publishNotice({ title, body, category, audience, requiresAck });
    if (!r.ok) return setError(r.error);
    snack(target === 'individual' ? 'Aviso individual enviado.' : 'Comunicado publicado.');
    router.replace(`/aviso/${r.id}`);
  };

  return (
    <>
      <AppBar title="Novo aviso" subtitle="Publicar comunicado ou aviso individual" />
      <Screen footer={<Button label="Publicar" icon="send" onPress={submit} full />}>
        <ErrorBanner message={error} />
        <OptionList<Target> label="Para quem" value={target} onChange={setTarget} options={targets} />

        {target === 'turma' ? (
          <View style={{ gap: 6 }}>
            <Text style={[type.label, { color: color.text }]}>Turma</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {turmas.map((t) => (
                <Chip key={t} label={t} selected={turma === t} onPress={() => setTurma(t)} />
              ))}
            </View>
          </View>
        ) : null}

        {target === 'individual' ? (
          <>
            <OptionList
              label="Aluno"
              value={studentId}
              onChange={setStudentId}
              options={students.map((s) => ({ id: s.id, label: s.name, hint: `${s.turma} · ${s.guardianIds.length} responsável(is)`, icon: 'account-outline' as const }))}
            />
            <SwitchRow label="Pedir confirmação de ciência" hint="Os responsáveis tocam em 'Estou ciente' e você acompanha quem confirmou." value={requiresAck} onChange={setRequiresAck} />
          </>
        ) : null}

        <View style={{ gap: 6 }}>
          <Text style={[type.label, { color: color.text }]}>Categoria</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {(Object.keys(CATEGORY_LABEL) as NoticeCategory[]).map((c) => (
              <Chip key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
        </View>

        <Field label="Título" required value={title} onChangeText={setTitle} placeholder="Ex.: Reunião de pais na quinta-feira" maxLength={90} helper={`${title.length}/90`} />
        <Field label="Mensagem" required value={body} onChangeText={setBody} placeholder="Escreva o comunicado com data, horário e o que a família precisa fazer." multiline />
      </Screen>
    </>
  );
}
