import { router, type Href } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { FadeIn } from '../../components/motion';
import { AppBar, EmptyState, Icon, UnreadDot, type IconName } from '../../components/ui';
import { useStore, useUser } from '../../data/store';
import type { NotificationKind } from '../../data/types';
import { timeAgo } from '../../lib/format';
import { color, radius, space, type } from '../../theme';

const KIND_ICON: Record<NotificationKind, IconName> = {
  aviso: 'bullhorn-outline',
  atestado: 'medical-bag',
  autorizacao: 'file-sign',
  suporte: 'forum-outline',
  vinculo: 'account-plus-outline',
};

/** RF07: in-app notifications for new notices, decisions and replies. */
export default function Notifications() {
  const { db, markNotificationRead, markAllNotificationsRead } = useStore();
  const user = useUser();
  const list = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = list.filter((n) => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <AppBar
        title="Notificações"
        subtitle={unread ? `${unread} não ${unread === 1 ? 'lida' : 'lidas'}` : 'Tudo lido'}
        right={
          unread ? (
            <Pressable onPress={markAllNotificationsRead} accessibilityRole="button" style={st.allBtn}>
              <Text style={[type.label, { color: color.onPrimary }]}>Marcar todas</Text>
            </Pressable>
          ) : null
        }
      />
      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxxl, width: '100%', maxWidth: 672, alignSelf: 'center' }}
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
        renderItem={({ item, index }) => (
          <FadeIn index={index}>
            <Pressable
              onPress={() => {
                markNotificationRead(item.id);
                router.push(item.href as Href);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.read ? '' : 'Não lida. '}${item.title}: ${item.body}`}
              style={({ pressed }) => [st.row, !item.read && st.unread, pressed && { opacity: 0.85 }]}
            >
              <View style={[st.icon, !item.read && { backgroundColor: color.primary }]}>
                <Icon name={KIND_ICON[item.kind]} size={20} tint={item.read ? color.primary : color.onPrimary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.titleSm, { color: color.ink, fontFamily: item.read ? type.titleSm.fontFamily : type.title.fontFamily }]}>{item.title}</Text>
                <Text style={[type.bodySm, { color: color.muted }]} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={[type.labelSm, { color: color.muted }]}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.read ? <UnreadDot label="Não lida" /> : null}
            </Pressable>
          </FadeIn>
        )}
        ListEmptyComponent={<EmptyState icon="bell-check-outline" title="Sem notificações" text="Você é avisado aqui quando chegar um comunicado, uma resposta ou uma decisão sobre seus pedidos." />}
      />
    </View>
  );
}

const st = StyleSheet.create({
  allBtn: { minHeight: 40, justifyContent: 'center', paddingHorizontal: space.lg, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.14)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.surface, borderRadius: radius.card, padding: space.lg, borderWidth: 1, borderColor: color.outline },
  unread: { borderColor: '#BBD0EE', backgroundColor: '#F7FAFF' },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.primaryContainer, alignItems: 'center', justifyContent: 'center' },
});
