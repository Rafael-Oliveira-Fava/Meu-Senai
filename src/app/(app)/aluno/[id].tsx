import { useLocalSearchParams } from 'expo-router';

import { StudentProfile } from '../../../components/student';
import { AppBar, EmptyState, Screen } from '../../../components/ui';
import { canSeeStudent } from '../../../data/access';
import { studentById } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';

export default function StudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useStore();
  const user = useUser();
  const student = studentById(db, id);
  const allowed = !!student && canSeeStudent(db, user, student.id); // RN04

  return (
    <>
      <AppBar title={allowed ? student!.name : 'Aluno'} subtitle={allowed ? `Turma ${student!.turma}` : undefined} />
      <Screen>
        {allowed ? (
          <StudentProfile db={db} user={user} student={student!} />
        ) : (
          <EmptyState icon="lock-outline" title="Acesso restrito" text="Este perfil não está disponível para a sua conta." />
        )}
      </Screen>
    </>
  );
}
