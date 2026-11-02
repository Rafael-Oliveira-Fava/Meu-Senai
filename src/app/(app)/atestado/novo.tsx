import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSnackbar } from '../../../components/snackbar';
import { AppBar, Button, Chip, EmptyState, ErrorBanner, Field, Icon, OptionList, Screen } from '../../../components/ui';
import { canSendCertificate, visibleStudents } from '../../../data/access';
import { useStore, useUser } from '../../../data/store';
import { fileSize, formatDay, maskDate, parseMaskedDate, toDayString } from '../../../lib/format';
import { color, radius, space, type } from '../../../theme';

type Picked = { name: string; size?: number; uri: string };

const today = () => formatDay(toDayString(new Date()));
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDay(toDayString(d));
};

export default function NewCertificate() {
  const { db, sendCertificate } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const students = visibleStudents(db, user);
  const [studentId, setStudentId] = useState<string | null>(students[0]?.id ?? null);
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<Picked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!canSendCertificate(user)) {
    return (
      <>
        <AppBar title="Enviar atestado" />
        <Screen>
          <EmptyState icon="lock-outline" title="Só responsáveis enviam atestados" text="Peça ao seu responsável para enviar o atestado pelo aplicativo." />
        </Screen>
      </>
    );
  }

  const pick = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true, multiple: false });
      if (r.canceled || !r.assets?.length) return;
      const a = r.assets[0];
      if (a.size && a.size > 10 * 1024 * 1024) return setError('O arquivo passa de 10 MB. Envie uma foto menor ou um PDF.');
      setFile({ name: a.name, size: a.size ?? undefined, uri: a.uri });
      setError(null);
    } catch {
      setError('Não foi possível abrir o arquivo. Tente de novo.');
    }
  };

  const submit = () => {
    setError(null);
    const s = parseMaskedDate(start);
    const e = parseMaskedDate(end);
    if (!studentId) return setError('Escolha o aluno.');
    if (!s || !e) return setError('Confira as datas no formato dd/mm/aaaa.');
    if (!file) return setError('Anexe a foto ou o PDF do atestado.');
    setSending(true);
    setTimeout(() => {
      const r = sendCertificate({ studentId, startDate: s, endDate: e, reason, fileName: file.name, fileSize: file.size, fileUri: file.uri });
      setSending(false);
      if (!r.ok) return setError(r.error);
      snack('Atestado enviado para a secretaria.');
      router.replace(`/atestado/${r.id}`);
    }, 400);
  };

  return (
    <>
      <AppBar title="Enviar atestado" subtitle="A secretaria analisa e abona as faltas" />
      <Screen footer={<Button label={sending ? 'Enviando…' : 'Enviar atestado'} icon="send" onPress={submit} loading={sending} full />}>
        <ErrorBanner message={error} />
        {students.length > 1 ? (
          <OptionList label="Aluno" value={studentId} onChange={setStudentId} options={students.map((s) => ({ id: s.id, label: s.name, hint: s.turma }))} />
        ) : null}

        <View style={{ gap: 6 }}>
          <Text style={[type.label, { color: color.text }]}>
            Arquivo do atestado<Text style={{ color: color.red }}> *</Text>
          </Text>
          <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel={file ? `Arquivo ${file.name}. Toque para trocar.` : 'Anexar foto ou PDF'} style={({ pressed }) => [st.drop, file && st.dropFilled, pressed && { opacity: 0.85 }]}>
            <View style={[st.dropIcon, file && { backgroundColor: color.greenContainer }]}>
              <Icon name={file ? 'file-check-outline' : 'paperclip'} tint={file ? color.green : color.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.titleSm, { color: color.ink }]} numberOfLines={1}>
                {file ? file.name : 'Anexar foto ou PDF'}
              </Text>
              <Text style={[type.bodySm, { color: color.muted }]}>{file ? `${fileSize(file.size)} · toque para trocar` : 'JPG, PNG ou PDF até 10 MB'}</Text>
            </View>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Primeiro dia" required value={start} onChangeText={(t) => setStart(maskDate(t))} keyboardType="number-pad" placeholder="dd/mm/aaaa" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Último dia" required value={end} onChangeText={(t) => setEnd(maskDate(t))} keyboardType="number-pad" placeholder="dd/mm/aaaa" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip label="Hoje" selected={start === today() && end === today()} onPress={() => (setStart(today()), setEnd(today()))} />
          <Chip label="Ontem" selected={start === yesterday() && end === yesterday()} onPress={() => (setStart(yesterday()), setEnd(yesterday()))} />
        </View>

        <Field label="Observação" value={reason} onChangeText={setReason} placeholder="Ex.: consulta médica, repouso de 2 dias" multiline helper="Não é preciso informar o diagnóstico." />
      </Screen>
    </>
  );
}

const st = StyleSheet.create({
  drop: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.field, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.outlineStrong, backgroundColor: color.surface, minHeight: 72 },
  dropFilled: { borderStyle: 'solid', borderColor: '#9FD3B3', backgroundColor: '#F6FBF8' },
  dropIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.primaryContainer, alignItems: 'center', justifyContent: 'center' },
});
