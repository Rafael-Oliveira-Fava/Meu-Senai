/**
 * MENSAGEM RÁPIDA — a faixa escura que aparece embaixo depois de uma ação
 * ("Atestado enviado", "Ciência registrada"...). Some sozinha em 3,2 s.
 * Uso nas telas: const mostrar = useMensagem(); mostrar('Texto');
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { animacao, cor, espaco, raio, tipografia } from '../tema';
import { useMovimentoReduzido } from './animacao';
import { Icone } from './icone';

type Tom = 'ok' | 'erro';
type Mensagem = { id: number; texto: string; tom: Tom };

const ContextoMensagem = createContext<(texto: string, tom?: Tom) => void>(() => {});

export const useMensagem = () => useContext(ContextoMensagem);

export function ProvedorMensagem({ children }: { children: ReactNode }) {
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const [visivel] = useState(() => new Animated.Value(0));
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const margens = useSafeAreaInsets();
  const reduzido = useMovimentoReduzido();

  // Entra em 240 ms, espera 3,2 s e sai em 160 ms (sair é mais rápido que entrar).
  useEffect(() => {
    if (!mensagem) return;
    const animar = (valor: number, duracao: number, depois?: () => void) =>
      Animated.timing(visivel, { toValue: valor, duration: duracao, easing: animacao.curva, useNativeDriver: animacao.nativo }).start(
        depois,
      );
    visivel.setValue(0);
    animar(1, animacao.entrada);
    temporizador.current = setTimeout(() => animar(0, animacao.saida, () => setMensagem(null)), 3200);
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [mensagem, visivel]);

  const mostrar = (texto: string, tom: Tom = 'ok') => setMensagem({ id: Date.now(), texto, tom });
  const subida = visivel.interpolate({ inputRange: [0, 1], outputRange: [reduzido ? 0 : 24, 0] });

  return (
    <ContextoMensagem.Provider value={mostrar}>
      {children}
      {mensagem ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center' }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[estilos.faixa, { marginBottom: margens.bottom + 88, opacity: visivel, transform: [{ translateY: subida }] }]}
          >
            <Icone
              nome={mensagem.tom === 'ok' ? 'check-circle' : 'alert-circle'}
              tamanho={20}
              cor={mensagem.tom === 'ok' ? '#8FD6A8' : '#FF9AA0'}
            />
            <Text style={[tipografia.corpoPequeno, { color: '#fff', flex: 1 }]}>{mensagem.texto}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ContextoMensagem.Provider>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    maxWidth: 560,
    width: '92%',
    backgroundColor: cor.tinta,
    borderRadius: raio.campo,
    paddingVertical: espaco[3],
    paddingHorizontal: espaco[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
  },
});
