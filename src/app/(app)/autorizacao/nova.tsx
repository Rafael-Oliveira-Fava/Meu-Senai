import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useSnackbar } from '../../../components/snackbar';
import { AppBar, Button, Chip, ChipRow, EmptyState, ErrorBanner, Field, OptionList, Screen } from '../../../components/ui';
import { canRequestAuthorizationFromFamily, canRequestRelease, visibleStudents } from '../../../data/access';
import { useStore, useUser } from '../../../data/store';
import type { AuthorizationType } from '../../../data/types';
import { firstName, formatDay, maskDate, maskTime, parseMaskedDate, toDayString, validTime } from '../../../lib/format';
import { space } from '../../../theme';

const plus = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatDay(toDayString(d));
};

export default function NewAuthorization() {
  const { db, createAuthorization } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const family = canRequestRelease(user);
  const students = visibleStudents(db, user);

  const [studentId, setStudentId] = useState<string | null>(family ? (students[0]?.id ?? null) : null);
  const [kind, setKind] = useState<AuthorizationType>(family ? 'saida_antecipada' : 'atividade_externa');
  const [title, setTitle] = useState(family ? 'Saída antecipada' : '');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(plus(0));
  const [time, setTime] = useState('');
  const [pickupBy, setPickupBy] = useState(family ? `${user.name} (${(user.kinship ?? 'responsável').toLowerCase()})` : '');
  const [error, setError] = useState<string | null>(null);

  if (!family && !canRequestAuthorizationFromFamily(user)) {
    return (
      <>
        <AppBar title="Autorização" />
        <Screen>
          <EmptyState icon="lock-outline" title="Sem permissão" text="Pedidos de saída são feitos pelo responsável no aplicativo." />
        </Screen>
      </>
    );
  }

  const submit = () => {
    setError(null);
    const d = parseMaskedDate(date);
    if (!studentId) return setError('Escolha o aluno.');
    if (!d) return setError('Confira a data no formato dd/mm/aaaa.');
    if (time && !validTime(time)) return setError('Confira o horário no formato hh:mm.');
    const r = createAuthorization({ studentId, type: kind, title, details, date: d, time: time || undefined, pickupBy: kind === 'saida_antecipada' ? pickupBy : undefined });
    if (!r.ok) return setError(r.error);
    snack(family ? 'Pedido enviado para a coordenação.' : 'Pedido enviado aos responsáveis.');
    router.replace(`/autorizacao/${r.id}`);
  };

  return (
    <>
      <AppBar title={family ? 'Pedir saída antecipada' : 'Pedir autorização'} subtitle={family ? 'A coordenação libera o aluno na portaria' : 'Os responsáveis respondem pelo aplicativo'} />
      <Screen footer={<Button label="Enviar pedido" icon="send" onPress={submit} full />}>
        <ErrorBanner message={error} />
        {students.length > 1 || !family ? (
          <OptionList label="Aluno" value={studentId} onChange={setStudentId} options={students.map((s) => ({ id: s.id, label: s.name, hint: s.turma, icon: 'account-outline' as const }))} />
        ) : null}

        {!family ? (
          <OptionList<AuthorizationType>
            label="Tipo"
            value={kind}
            onChange={setKind}
            options={[
              { id: 'atividade_externa', label: 'Atividade externa', hint: 'Visita técnica, evento fora da unidade', icon: 'bus-school' },
              { id: 'saida_antecipada', label: 'Saída antecipada', hint: 'Liberar o aluno antes do horário', icon: 'exit-run' },
              { id: 'outro', label: 'Outro', hint: 'Uso de imagem, participação em projeto', icon: 'file-sign' },
            ]}
          />
        ) : null}

        <Field label="Título" required value={title} onChangeText={setTitle} placeholder={family ? 'Saída antecipada' : 'Ex.: Visita técnica à fábrica parceira'} />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Data" required value={date} onChangeText={(t) => setDate(maskDate(t))} keyboardType="number-pad" placeholder="dd/mm/aaaa" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Horário" required={kind === 'saida_antecipada'} value={time} onChangeText={(t) => setTime(maskTime(t))} keyboardType="number-pad" placeholder="hh:mm" />
          </View>
        </View>
        <ChipRow>
          <Chip label="Hoje" selected={date === plus(0)} onPress={() => setDate(plus(0))} />
          <Chip label="Amanhã" selected={date === plus(1)} onPress={() => setDate(plus(1))} />
        </ChipRow>
        {kind === 'saida_antecipada' ? (
          <Field label="Quem vai buscar" required value={pickupBy} onChangeText={setPickupBy} placeholder="Nome e parentesco" helper={`A portaria confere o documento de quem buscar ${studentId ? firstName(students.find((s) => s.id === studentId)?.name ?? '') : 'o aluno'}.`} />
        ) : null}
        <Field label={family ? 'Motivo' : 'Detalhes'} value={details} onChangeText={setDetails} placeholder={family ? 'Ex.: consulta médica às 11h' : 'Local, transporte, responsável pela atividade, o que levar'} multiline />
      </Screen>
    </>
  );
}
