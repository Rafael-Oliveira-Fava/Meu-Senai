/**
 * LAYOUT RAIZ — primeira coisa que o app carrega.
 * Carrega a fonte Roboto e os dados do servidor, e mostra a splash até tudo ficar pronto.
 */
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, useFonts } from '@expo-google-fonts/roboto';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Botao } from '../componentes/controles';
import { Icone } from '../componentes/icone';
import { ProvedorMensagem } from '../componentes/mensagem';
import { ProvedorBanco, useBanco } from '../dados/banco';
import { cor, espaco, tipografia } from '../tema';

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
  const { pronto, erroConexao, tentarDeNovo } = useBanco();
  const [fonteCarregada] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const tudoPronto = pronto && fonteCarregada;

  useEffect(() => {
    if (tudoPronto || erroConexao) SplashScreen.hideAsync().catch(() => {});
  }, [tudoPronto, erroConexao]);

  if (erroConexao) return <SemConexao mensagem={erroConexao} aoTentar={tentarDeNovo} />;
  if (!tudoPronto) return null;
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo }, animation: 'fade_from_bottom' }} />
    </>
  );
}

/** Servidor desligado ou fora da rede: explica e deixa tentar de novo. */
function SemConexao({ mensagem, aoTentar }: { mensagem: string; aoTentar: () => void }) {
  return (
    <View
      style={{ flex: 1, backgroundColor: cor.fundo, alignItems: 'center', justifyContent: 'center', padding: espaco[6], gap: espaco[4] }}
    >
      <Icone nome="cloud-off-outline" tamanho={48} cor={cor.suave} />
      <Text style={[tipografia.titulo, { color: cor.tinta, textAlign: 'center' }]}>Sem conexão com o servidor</Text>
      <Text style={[tipografia.corpo, { color: cor.suave, textAlign: 'center', maxWidth: 420 }]}>{mensagem}</Text>
      <Botao texto="Tentar de novo" icone="refresh" aoTocar={aoTentar} />
    </View>
  );
}

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <ProvedorMensagem>
        <ProvedorBanco>
          <Carregamento />
        </ProvedorBanco>
      </ProvedorMensagem>
    </SafeAreaProvider>
  );
}
