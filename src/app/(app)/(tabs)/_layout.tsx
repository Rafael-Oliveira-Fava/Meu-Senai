import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { Platform, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isFamily, isStaff } from '../../../data/access';
import { pendingActions, ticketsAwaitingMe, unreadNoticeCount } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';
import { color, font, radius } from '../../../theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const icon = (on: IconName, off: IconName) =>
  function TabIcon({ color: tint, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View style={{ width: 56, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? color.primaryContainer : 'transparent' }}>
        <MaterialCommunityIcons name={focused ? on : off} size={22} color={tint as string} />
      </View>
    );
  };

const badge = (n: number) => (n > 0 ? (n > 9 ? '9+' : n) : undefined);

export default function TabsLayout() {
  const { db } = useStore();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const staff = isStaff(user);
  const showPedidos = user.role !== 'aluno';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 12, marginTop: 2 },
        tabBarIconStyle: { width: 56 },
        tabBarBadgeStyle: { backgroundColor: color.red, fontFamily: font.medium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.outline,
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 8),
        },
        sceneStyle: { backgroundColor: color.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icon('home-variant', 'home-variant-outline') }} />
      <Tabs.Screen
        name="avisos"
        options={{ title: 'Avisos', tabBarIcon: icon('bullhorn', 'bullhorn-outline'), tabBarBadge: badge(unreadNoticeCount(db, user)) }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          href: showPedidos ? undefined : null,
          tabBarIcon: icon('file-document-multiple', 'file-document-multiple-outline'),
          tabBarBadge: badge(pendingActions(db, user).total),
        }}
      />
      <Tabs.Screen
        name="aluno"
        options={{ title: isFamily(user) ? (user.role === 'aluno' ? 'Meu perfil' : 'Aluno') : 'Alunos', tabBarIcon: icon(staff ? 'account-group' : 'card-account-details', staff ? 'account-group-outline' : 'card-account-details-outline') }}
      />
      <Tabs.Screen
        name="suporte"
        options={{ title: 'Suporte', tabBarIcon: icon('chat-question', 'chat-question-outline'), tabBarBadge: badge(ticketsAwaitingMe(db, user)) }}
      />
    </Tabs>
  );
}
