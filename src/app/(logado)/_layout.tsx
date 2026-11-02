/**
 * ÁREA LOGADA (RN01) — toda tela dentro de (logado) exige usuário logado.
 * Quem não entrou é mandado para a tela de login.
 */
import { Redirect, Stack } from 'expo-router';

import { useBanco } from '../../dados/banco';
import { cor } from '../../tema';

export default function LayoutLogado() {
  const { usuario } = useBanco();
  if (!usuario) return <Redirect href="/entrar" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo }, animation: 'slide_from_right' }} />;
}
