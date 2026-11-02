/**
 * LAYOUT RAIZ — primeira coisa que o app carrega.
 * Carrega a fonte Roboto, os dados salvos e mostra a splash até tudo ficar pronto.
 */
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, useFonts } from '@expo-google-fonts/roboto';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProvedorMensagem } from '../componentes/mensagem';
import { ProvedorBanco, useBanco } from '../dados/banco';
import { cor } from '../tema';

SplashScreen.preventAutoHideAsync().catch(() => {});

// No navegador: seleção de texto, foco e barra de rolagem com as cores do app.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const css = document.createElement('style');
  css.textContent = `
    ::selection { background: ${cor.primariaClara}; color: ${cor.sobrePrimariaClara}; }
    :focus-visible { outline: 3px solid ${cor.primaria}; outline-offset: 2px; }
    * { scrollbar-width: thin; scrollbar-color: ${cor.bordaForte} transparent; }
    input, textarea { outline: none; caret-color: ${cor.primaria}; }
    body { background: ${cor.fundo}; }
  `;
  document.head.appendChild(css);
}

/** Espera fonte + dados; depois mostra as telas. */
function Carregamento() {
  const { pronto } = useBanco();
  const [fonteCarregada] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const tudoPronto = pronto && fonteCarregada;

  useEffect(() => {
    if (tudoPronto) SplashScreen.hideAsync().catch(() => {});
  }, [tudoPronto]);

  if (!tudoPronto) return null;
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo }, animation: 'fade_from_bottom' }} />
    </>
  );
}

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <ProvedorBanco>
        <ProvedorMensagem>
          <Carregamento />
        </ProvedorMensagem>
      </ProvedorBanco>
    </SafeAreaProvider>
  );
}
