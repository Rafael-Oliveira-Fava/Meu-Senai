import { router } from 'expo-router';
import { useState } from 'react';

import { useSnackbar } from '../../../components/snackbar';
import { AppBar, Button, ErrorBanner, Field, OptionList, Screen } from '../../../components/ui';
import { isFamily, SUPPORT_TARGETS, visibleStudents } from '../../../data/access';
import { useStore, useUser } from '../../../data/store';
import type { SupportTarget } from '../../../data/types';

const TARGET_ICON = { secretaria: 'file-document-outline', coordenador: 'clipboard-account-outline', professor: 'human-male-board', diretor: 'office-building-outline' } as const;

export default function NewTicket() {
  const { db, createTicket } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const family = isFamily(user);
  const students = visibleStudents(db, user);
  const studentTurmas = new Set(students.map((s) => s.turma));
  // RF11: teachers offered are the ones of the student's classes (family) or all (staff).
  const teachers = db.users.filter((u) => u.role === 'professor' && u.id !== user.id && (!family || u.turmas?.some((t) => studentTurmas.has(t))));
  const targets = SUPPORT_TARGETS.filter((t) => t.id !== user.role && (t.id !== 'professor' || teachers.length > 0));

  const [target, setTarget] = useState<SupportTarget | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(family ? (students[0]?.id ?? null) : null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!target) return setError('Escolha para quem enviar.');
    const r = createTicket({ subject, body, target, targetUserId: teacherId ?? undefined, studentId: studentId ?? undefined });
    if (!r.ok) return setError(r.error);
    snack('Solicitação enviada. Acompanhe a resposta na Central de suporte.');
    router.replace(`/suporte/${r.id}`);
  };

  return (
    <>
      <AppBar title="Nova solicitação" subtitle="Central de suporte" />
      <Screen footer={<Button label="Enviar" icon="send" onPress={submit} full />}>
        <ErrorBanner message={error} />
        <OptionList<SupportTarget>
          label="Para quem"
          value={target}
          onChange={(t) => {
            setTarget(t);
            if (t !== 'professor') setTeacherId(null);
          }}
          options={targets.map((t) => ({ id: t.id, label: t.label, hint: t.hint, icon: TARGET_ICON[t.id] }))}
        />
        {target === 'professor' ? (
          <OptionList
            label="Professor"
            value={teacherId}
            onChange={setTeacherId}
            options={teachers.map((t) => ({ id: t.id, label: t.name, hint: `Turmas ${t.turmas?.join(', ')}`, icon: 'account-tie-outline' as const }))}
          />
        ) : null}
        {family && students.length > 1 ? (
          <OptionList label="Sobre qual aluno" value={studentId} onChange={setStudentId} options={students.map((s) => ({ id: s.id, label: s.name, hint: s.turma }))} />
        ) : null}
        <Field label="Assunto" required value={subject} onChangeText={setSubject} placeholder="Ex.: Segunda via do boletim" maxLength={80} />
        <Field label="Mensagem" required value={body} onChangeText={setBody} placeholder="Descreva sua dúvida ou pedido." multiline />
      </Screen>
    </>
  );
}
