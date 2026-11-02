import { Redirect, Stack } from 'expo-router';

import { useStore } from '../../data/store';
import { color } from '../../theme';

/** RN01: every screen in this group requires a signed-in user. */
export default function AppLayout() {
  const { user } = useStore();
  if (!user) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg }, animation: 'slide_from_right' }} />;
}
