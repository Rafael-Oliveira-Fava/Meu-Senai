import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { FadeIn } from '../../../components/motion';
import { useSnackbar } from '../../../components/snackbar';
import { AppBar, Button, Card, EmptyState, ErrorBanner, Field, Icon, InfoRow, Screen, StatusBadge } from '../../../components/ui';
import { canDecideAuthorization, visibleAuthorizations } from '../../../data/access';
import { studentById, userById } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';
import { AUTH_TYPE_LABEL, formatDateTime, formatDay, ROLE_LABEL } from '../../../lib/format';
import { color, space, type } from '../../../theme';

export default function AuthorizationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, decideAuthorization } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = visibleAuthorizations(db, user).find((a) => a.id === id); // RN08

  if (!auth) {
    return (
      <>
        <AppBar title="Autorização" />
        <Screen>
          <EmptyState icon="lock-outline" title="Autorização indisponível" text="Este pedido não existe ou não está disponível para sua conta." />
        </Screen>
      </>
    );
  }

  const student = studentById(db, auth.studentId);
  const creator = userById(db, auth.createdById);
  const decider = auth.decidedById ? userById(db, auth.decidedById) : undefined;
  const fromSchool = auth.origin === 'escola';
  const canDecide = canDecideAuthorization(user, auth);
  const labels = fromSchool ? { aprovado: 'Autorizado pelo responsável', recusado: 'Não autorizado', pendente: 'Aguardando o responsável' } : { aprovado: 'Aprovado · liberado na portaria', recusado: 'Recusado', pendente: 'Em análise pela coordenação' };

  const decide = (status: 'aprovado' | 'recusado') => {
    const r = decideAuthorization(auth.id, status, note);
    if (!r.ok) return setError(r.error);
    setError(null);
    snack(fromSchool ? (status === 'aprovado' ? 'Você autorizou. A escola foi avisada.' : 'Resposta enviada à escola.') : status === 'aprovado' ? 'Saída aprovada. A família foi avisada.' : 'Pedido recusado. A família foi avisada.');
  };

  return (
    <>
      <AppBar title={AUTH_TYPE_LABEL[auth.type]} subtitle={`Nº ${auth.protocol}`} />
      <Screen
        footer={
          canDecide ? (
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <Button label={fromSchool ? 'Não autorizo' : 'Recusar'} variant="dangerOutlined" icon="close" onPress={() => decide('recusado')} full />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={fromSchool ? 'Autorizo' : 'Aprovar saída'} icon="check" onPress={() => decide('aprovado')} full />
              </View>
            </View>
          ) : undefined
        }
      >
        <FadeIn>
          <Card style={{ gap: space.md }}>
            <StatusBadge status={auth.status} labels={labels} />
            <Text style={[type.headline, { color: color.ink }]}>{auth.title}</Text>
            {auth.details ? <Text style={[type.body, { color: color.text }]}>{auth.details}</Text> : null}
          </Card>
        </FadeIn>
        <FadeIn index={1}>
          <Card style={{ paddingVertical: space.xs }}>
            <InfoRow icon="account-outline" label="Aluno" value={`${student?.name} · ${student?.turma}`} />
            <InfoRow icon="calendar" label="Data" value={formatDay(auth.date)} />
            {auth.time ? <InfoRow icon="clock-outline" label="Horário" value={auth.time} /> : null}
            {auth.pickupBy ? <InfoRow icon="account-arrow-right-outline" label="Quem busca" value={auth.pickupBy} /> : null}
            <InfoRow icon="send-outline" label="Pedido por" value={`${creator?.name} (${creator ? ROLE_LABEL[creator.role] : ''}) · ${formatDateTime(auth.createdAt)}`} last />
          </Card>
        </FadeIn>

        {auth.status !== 'pendente' && decider ? (
          <FadeIn index={2}>
            <Card style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Icon name={auth.status === 'aprovado' ? 'check-decagram' : 'close-octagon-outline'} tint={auth.status === 'aprovado' ? color.green : color.red} />
                <Text style={[type.label, { color: color.ink, flex: 1 }]}>
                  {fromSchool ? 'Respondido' : 'Decidido'} por {decider.name} · {auth.decidedAt ? formatDateTime(auth.decidedAt) : ''}
                </Text>
              </View>
              {auth.decisionNote ? <Text style={[type.body, { color: color.text }]}>{auth.decisionNote}</Text> : null}
            </Card>
          </FadeIn>
        ) : null}

        {canDecide ? (
          <>
            <ErrorBanner message={error} />
            <Field
              label={fromSchool ? 'Observação para a escola' : 'Mensagem para a família'}
              value={note}
              onChangeText={setNote}
              placeholder={fromSchool ? 'Opcional' : 'Obrigatória ao recusar. Ex.: liberado na portaria com documento.'}
              multiline
            />
          </>
        ) : null}
      </Screen>
    </>
  );
}
