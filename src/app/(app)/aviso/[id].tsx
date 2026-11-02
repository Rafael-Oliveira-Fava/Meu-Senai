import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FadeIn } from '../../../components/motion';
import { audienceLabel } from '../../../components/rows';
import { useSnackbar } from '../../../components/snackbar';
import { AppBar, Avatar, Badge, Button, Card, Divider, EmptyState, Icon, Screen } from '../../../components/ui';
import { canSeeNotice, isStaff, noticeRecipients } from '../../../data/access';
import { needsAck, studentById, userById } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';
import { CATEGORY_LABEL, formatDateTime, ROLE_LABEL } from '../../../lib/format';
import { color, radius, space, type } from '../../../theme';

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, markNoticeRead, ackNotice } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const notice = db.notices.find((n) => n.id === id);
  const allowed = !!notice && canSeeNotice(db, user, notice); // RN06

  useEffect(() => {
    if (allowed) markNoticeRead(id);
  }, [allowed, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!notice || !allowed) {
    return (
      <>
        <AppBar title="Aviso" />
        <Screen>
          <EmptyState icon="lock-outline" title="Aviso indisponível" text="Este aviso não existe ou não foi enviado para você." />
        </Screen>
      </>
    );
  }

  const author = userById(db, notice.authorId);
  const pendingAck = needsAck(notice, user);
  const myAck = notice.ackBy.find((a) => a.userId === user.id);
  const hot = notice.category === 'disciplinar' || notice.category === 'urgente';
  const showTracking = isStaff(user);
  const recipients = noticeRecipients(db, notice);
  const guardians = notice.audience.kind === 'individual' ? (studentById(db, notice.audience.studentId)?.guardianIds ?? []) : [];

  return (
    <>
      <AppBar title={notice.audience.kind === 'individual' ? 'Aviso individual' : 'Comunicado'} subtitle={`Nº ${notice.protocol}`} />
      <Screen
        footer={
          pendingAck ? (
            <View style={{ gap: space.sm }}>
              <Text style={[type.bodySm, { color: color.muted, textAlign: 'center' }]}>A escola pede que você confirme que leu este aviso.</Text>
              <Button
                label="Estou ciente"
                icon="draw-pen"
                onPress={() => {
                  ackNotice(notice.id);
                  snack('Ciência registrada. A escola foi avisada.');
                }}
                full
              />
            </View>
          ) : undefined
        }
      >
        <FadeIn>
          <Card style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              <Badge tone={hot ? 'red' : 'blue'} icon={hot ? 'alert-octagon-outline' : 'tag-outline'} label={CATEGORY_LABEL[notice.category]} />
              <Badge tone="neutral" icon={notice.audience.kind === 'individual' ? 'account-lock-outline' : 'account-multiple-outline'} label={audienceLabel(db, notice)} />
            </View>
            <Text style={[type.headline, { color: color.ink }]} accessibilityRole="header">
              {notice.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar name={author?.name ?? '?'} size={36} tone="blue" />
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: color.ink }]}>{author?.name}</Text>
                <Text style={[type.bodySm, { color: color.muted }]}>
                  {author ? ROLE_LABEL[author.role] : ''} · {formatDateTime(notice.createdAt)}
                </Text>
              </View>
            </View>
            <Divider />
            <Text style={[type.body, { color: color.text }]} selectable>
              {notice.body}
            </Text>
          </Card>
        </FadeIn>

        {myAck ? (
          <FadeIn index={1}>
            <View style={st.ackDone}>
              <Icon name="check-decagram" tint={color.green} />
              <Text style={[type.bodySm, { color: color.green, flex: 1 }]}>Você confirmou ciência em {formatDateTime(myAck.at)}.</Text>
            </View>
          </FadeIn>
        ) : null}

        {showTracking ? (
          <FadeIn index={2}>
            <Card style={{ gap: space.md }}>
              <Text style={[type.titleSm, { color: color.ink }]}>Acompanhamento</Text>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <Stat label="Destinatários" value={recipients.length} />
                <Stat label="Leram" value={notice.readBy.filter((r) => recipients.some((u) => u.id === r)).length} />
                {notice.requiresAck ? <Stat label="Confirmaram" value={`${notice.ackBy.length}/${guardians.length}`} /> : null}
              </View>
              {notice.requiresAck
                ? guardians.map((gid) => {
                    const g = userById(db, gid);
                    const a = notice.ackBy.find((x) => x.userId === gid);
                    return (
                      <View key={gid} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                        <Icon name={a ? 'check-circle' : 'clock-outline'} size={18} tint={a ? color.green : color.amber} />
                        <Text style={[type.bodySm, { color: color.text, flex: 1 }]}>
                          {g?.name} ({g?.kinship}) · {a ? `ciente em ${formatDateTime(a.at)}` : 'ainda não confirmou'}
                        </Text>
                      </View>
                    );
                  })
                : null}
            </Card>
          </FadeIn>
        ) : null}
      </Screen>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={st.stat}>
      <Text style={[type.headline, type.numeric, { color: color.ink }]}>{value}</Text>
      <Text style={[type.labelSm, { color: color.muted }]}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  ackDone: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: color.greenContainer, borderRadius: radius.field, padding: space.md },
  stat: { flex: 1, backgroundColor: color.surfaceAlt, borderRadius: radius.field, padding: space.md, borderWidth: 1, borderColor: color.outline },
});
