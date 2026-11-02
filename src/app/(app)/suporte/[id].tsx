import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn } from '../../../components/motion';
import { useSnackbar } from '../../../components/snackbar';
import { AppBar, Button, Card, EmptyState, Icon, Screen, TicketBadge } from '../../../components/ui';
import { visibleTickets } from '../../../data/access';
import { studentById, userById } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';
import { formatDateTime, ROLE_LABEL, TARGET_LABEL } from '../../../lib/format';
import { color, radius, space, type } from '../../../theme';

export default function TicketThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, replyTicket, closeTicket } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const ticket = visibleTickets(db, user).find((t) => t.id === id); // RN09

  if (!ticket) {
    return (
      <>
        <AppBar title="Solicitação" />
        <Screen>
          <EmptyState icon="lock-outline" title="Conversa indisponível" text="Esta solicitação não existe ou não foi enviada para você." />
        </Screen>
      </>
    );
  }

  const target = ticket.target === 'professor' ? `Prof. ${userById(db, ticket.targetUserId ?? '')?.name}` : TARGET_LABEL[ticket.target];
  const student = ticket.studentId ? studentById(db, ticket.studentId) : undefined;
  const closed = ticket.status === 'encerrado';

  const send = () => {
    const r = replyTicket(ticket.id, text);
    if (!r.ok) return snack(r.error, 'error');
    setText('');
  };

  return (
    <View style={{ flex: 1 }}>
      <AppBar
        title={ticket.subject}
        subtitle={`Nº ${ticket.protocol} · ${target}`}
        right={
          !closed ? (
            <Pressable
              onPress={() => {
                const r = closeTicket(ticket.id);
                snack(r.ok ? 'Solicitação encerrada.' : r.error, r.ok ? 'ok' : 'error');
              }}
              accessibilityRole="button"
              accessibilityLabel="Encerrar solicitação"
              style={st.closeBtn}
            >
              <Icon name="check-circle-outline" tint={color.onPrimary} />
            </Pressable>
          ) : null
        }
      />
      <Screen
        footer={
          closed ? (
            <Text style={[type.bodySm, { color: color.muted, textAlign: 'center' }]}>Conversa encerrada. Abra uma nova solicitação se precisar.</Text>
          ) : (
            <View style={st.composer}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Escreva uma mensagem"
                placeholderTextColor="#7A8494"
                accessibilityLabel="Mensagem"
                multiline
                style={st.input}
                selectionColor={color.primary}
              />
              <Pressable onPress={send} disabled={!text.trim()} accessibilityRole="button" accessibilityLabel="Enviar mensagem" style={[st.send, !text.trim() && { opacity: 0.4 }]}>
                <Icon name="send" tint={color.onPrimary} />
              </Pressable>
            </View>
          )
        }
        contentStyle={{ paddingBottom: space.xl + insets.bottom * 0 }}
      >
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' }}>
          <TicketBadge status={ticket.status} />
          <Text style={[type.bodySm, { color: color.muted, flex: 1 }]}>
            Aberta em {formatDateTime(ticket.createdAt)}
            {student ? ` · sobre ${student.name}` : ''}
          </Text>
        </Card>
        {ticket.messages.map((m, i) => {
          const author = userById(db, m.authorId);
          const mine = m.authorId === user.id;
          return (
            <FadeIn key={m.id} index={i} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <View style={[st.bubble, mine ? st.mine : st.theirs]}>
                {!mine ? (
                  <Text style={[type.labelSm, { color: color.primary }]}>
                    {author?.name} · {author ? ROLE_LABEL[author.role] : ''}
                  </Text>
                ) : null}
                <Text style={[type.body, { color: mine ? color.onPrimary : color.ink }]} selectable>
                  {m.body}
                </Text>
                <Text style={[type.labelSm, { color: mine ? color.onPrimaryMuted : color.muted, alignSelf: 'flex-end' }]}>{formatDateTime(m.at)}</Text>
              </View>
            </FadeIn>
          );
        })}
        {closed ? null : ticket.status === 'aberto' && ticket.createdById === user.id ? (
          <Text style={[type.bodySm, { color: color.muted, textAlign: 'center' }]}>Enviado para {target}. Você recebe uma notificação quando responderem.</Text>
        ) : null}
        {!closed && ticket.createdById === user.id && ticket.status === 'respondido' ? (
          <Button label="Minha dúvida foi resolvida" variant="outlined" icon="check" onPress={() => closeTicket(ticket.id).ok && snack('Obrigado! Solicitação encerrada.')} />
        ) : null}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.14)' },
  bubble: { maxWidth: '86%', borderRadius: radius.card, paddingHorizontal: space.lg, paddingVertical: space.md, gap: 4 },
  mine: { backgroundColor: color.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: color.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: color.outline },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderRadius: radius.sheet, borderWidth: 1, borderColor: color.outlineStrong, paddingHorizontal: space.lg, paddingTop: 12, paddingBottom: 12, fontFamily: type.body.fontFamily, fontSize: 16, color: color.ink, backgroundColor: color.surface },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
});
