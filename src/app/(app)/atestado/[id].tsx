import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { FadeIn } from '../../../components/motion';
import { useSnackbar } from '../../../components/snackbar';
import { AppBar, Button, Card, EmptyState, ErrorBanner, Field, Icon, InfoRow, Screen, StatusBadge } from '../../../components/ui';
import { canReviewCertificate, visibleCertificates } from '../../../data/access';
import { studentById, userById } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';
import { fileSize, formatDateTime, formatDay } from '../../../lib/format';
import { color, space, type } from '../../../theme';

export default function CertificateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, reviewCertificate } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const cert = visibleCertificates(db, user).find((c) => c.id === id); // RN07

  if (!cert) {
    return (
      <>
        <AppBar title="Atestado" />
        <Screen>
          <EmptyState icon="lock-outline" title="Atestado indisponível" text="Este documento não existe ou não está disponível para sua conta." />
        </Screen>
      </>
    );
  }

  const student = studentById(db, cert.studentId);
  const sender = userById(db, cert.senderId);
  const reviewer = cert.reviewerId ? userById(db, cert.reviewerId) : undefined;
  const canReview = canReviewCertificate(user) && cert.status === 'pendente';

  const decide = (status: 'aprovado' | 'recusado') => {
    const r = reviewCertificate(cert.id, status, note);
    if (!r.ok) return setError(r.error);
    setError(null);
    snack(status === 'aprovado' ? 'Atestado aceito. A família foi avisada.' : 'Atestado recusado. A família foi avisada.');
  };

  return (
    <>
      <AppBar title="Atestado médico" subtitle={`Nº ${cert.protocol}`} />
      <Screen
        footer={
          canReview ? (
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <Button label="Recusar" variant="dangerOutlined" icon="close" onPress={() => decide('recusado')} full />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Aceitar" icon="check" onPress={() => decide('aprovado')} full />
              </View>
            </View>
          ) : undefined
        }
      >
        <FadeIn>
          <Card style={{ gap: space.md }}>
            <StatusBadge status={cert.status} labels={{ aprovado: 'Aceito · faltas abonadas', recusado: 'Recusado', pendente: 'Em análise pela secretaria' }} />
            <Text style={[type.headline, { color: color.ink }]}>{student?.name}</Text>
            <Text style={[type.bodySm, { color: color.muted }]}>Enviado por {sender?.name} em {formatDateTime(cert.createdAt)}</Text>
          </Card>
        </FadeIn>
        <FadeIn index={1}>
          <Card style={{ paddingVertical: space.xs }}>
            <InfoRow icon="calendar-start" label="Primeiro dia" value={formatDay(cert.startDate)} />
            <InfoRow icon="calendar-end" label="Último dia" value={formatDay(cert.endDate)} />
            <InfoRow icon="text" label="Observação" value={cert.reason || 'Sem observação'} />
            <InfoRow icon="paperclip" label="Arquivo" value={`${cert.fileName}${cert.fileSize ? ` · ${fileSize(cert.fileSize)}` : ''}`} last />
          </Card>
        </FadeIn>
        {cert.fileUri ? <Button label="Abrir arquivo" icon="open-in-new" variant="outlined" onPress={() => Linking.openURL(cert.fileUri!).catch(() => snack('Não foi possível abrir o arquivo.', 'error'))} /> : null}

        {cert.status !== 'pendente' ? (
          <FadeIn index={2}>
            <Card style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Icon name="account-check-outline" tint={color.muted} />
                <Text style={[type.label, { color: color.ink }]}>
                  Analisado por {reviewer?.name} · {cert.reviewedAt ? formatDateTime(cert.reviewedAt) : ''}
                </Text>
              </View>
              {cert.reviewNote ? <Text style={[type.body, { color: color.text }]}>{cert.reviewNote}</Text> : null}
            </Card>
          </FadeIn>
        ) : null}

        {canReview ? (
          <>
            <ErrorBanner message={error} />
            <Field label="Mensagem para a família" value={note} onChangeText={setNote} placeholder="Obrigatória ao recusar. Ex.: o atestado está ilegível, envie nova foto." multiline />
          </>
        ) : null}
      </Screen>
    </>
  );
}
