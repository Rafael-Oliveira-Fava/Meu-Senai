import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { useSnackbar } from '../../../components/snackbar';
import { AppBar, Button, Card, EmptyState, ErrorBanner, Field, OptionList, Screen } from '../../../components/ui';
import { canLinkGuardian, MAX_GUARDIANS } from '../../../data/access';
import { studentById } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';
import { maskPhone } from '../../../lib/format';
import { color, type } from '../../../theme';

type Kinship = 'Mãe' | 'Pai' | 'Avó/Avô' | 'Responsável legal';

export default function LinkGuardian() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, linkGuardian } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const student = studentById(db, id);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [kinship, setKinship] = useState<Kinship | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!student || !canLinkGuardian(user)) {
    return (
      <>
        <AppBar title="Vincular responsável" />
        <Screen>
          <EmptyState icon="lock-outline" title="Acesso restrito" text="Somente a secretaria vincula responsáveis aos alunos." />
        </Screen>
      </>
    );
  }

  const full = student.guardianIds.length >= MAX_GUARDIANS;

  const submit = () => {
    if (!kinship) return setError('Escolha o parentesco.');
    const r = linkGuardian(student.id, { name, email, phone, kinship });
    if (!r.ok) return setError(r.error);
    snack(`${name.split(' ')[0]} vinculado a ${student.name.split(' ')[0]}.`);
    if (router.canGoBack()) router.back();
    else router.replace(`/aluno/${student.id}`);
  };

  return (
    <>
      <AppBar title="Vincular responsável" subtitle={student.name} />
      <Screen footer={full ? undefined : <Button label="Vincular" icon="account-plus" onPress={submit} full />}>
        {full ? (
          <EmptyState icon="account-multiple-check" title="Limite atingido" text={`Este aluno já tem ${MAX_GUARDIANS} responsáveis vinculados.`} />
        ) : (
          <>
            <Card>
              <Text style={[type.bodySm, { color: color.muted }]}>
                O responsável recebe acesso aos comunicados, atestados, autorizações e suporte deste aluno. Vagas restantes: {MAX_GUARDIANS - student.guardianIds.length}.
              </Text>
            </Card>
            <ErrorBanner message={error} />
            <Field label="Nome completo" required value={name} onChangeText={setName} placeholder="Ex.: Marcos Santos" autoCapitalize="words" />
            <Field label="E-mail" required value={email} onChangeText={setEmail} placeholder="email@exemplo.com" autoCapitalize="none" keyboardType="email-address" helper="Usado para entrar no aplicativo. Senha inicial de demonstração: senai123." />
            <Field label="Telefone" value={phone} onChangeText={(t) => setPhone(maskPhone(t))} placeholder="(11) 90000-0000" keyboardType="phone-pad" />
            <OptionList<Kinship>
              label="Parentesco"
              value={kinship}
              onChange={setKinship}
              options={[
                { id: 'Mãe', label: 'Mãe' },
                { id: 'Pai', label: 'Pai' },
                { id: 'Avó/Avô', label: 'Avó ou avô' },
                { id: 'Responsável legal', label: 'Responsável legal' },
              ]}
            />
          </>
        )}
      </Screen>
    </>
  );
}
