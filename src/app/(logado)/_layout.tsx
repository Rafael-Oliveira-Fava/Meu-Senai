/**
 * ÁREA LOGADA (RN01) — toda tela dentro de (logado) exige usuário logado.
 * Quem não entrou é mandado para a tela de login.
 * Também mostra no celular as notificações que chegam (AvisosNoCelular).
 */
import { Redirect, Stack } from 'expo-router';

import { AvisosNoCelular } from '../../componentes/avisos-no-celular';
import { useBanco } from '../../dados/banco';
import { cor } from '../../tema';

export default function LayoutLogado() {
  const { usuario } = useBanco();
  if (!usuario) return <Redirect href="/entrar" />;
  return (
    <>
      <AvisosNoCelular />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo }, animation: 'slide_from_right' }} />
    </>
  );
}
