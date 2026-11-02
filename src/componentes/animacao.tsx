/**
 * ANIMAÇÃO — dois efeitos usados no app inteiro:
 *  - Tocavel: encolhe um pouco ao tocar (mostra que o app "ouviu" o toque);
 *  - Aparecer: o item sobe 8 px enquanto aparece, um depois do outro.
 * Se o celular estiver com "reduzir movimento" ligado, só a transparência anima.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { animacao } from '../tema';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/** Lê a opção "reduzir movimento" do sistema. */
export function useMovimentoReduzido() {
  const [reduzido, setReduzido] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduzido)
      .catch(() => {});
    const inscricao = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzido);
    return () => inscricao.remove();
  }, []);
  return reduzido;
}

type PropsTocavel = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; escala?: number; children: ReactNode };

/** Área tocável que encolhe para `escala` (padrão 97%) em 160 ms. */
export function Tocavel({ style, escala = 0.97, children, ...resto }: PropsTocavel) {
  const [tamanho] = useState(() => new Animated.Value(1));
  const reduzido = useMovimentoReduzido();

  const animarPara = (valor: number) =>
    Animated.timing(tamanho, {
      toValue: valor,
      duration: animacao.toque,
      easing: animacao.curva,
      useNativeDriver: animacao.nativo,
    }).start();

  return (
    <PressableAnimado
      {...resto}
      style={[style, { transform: [{ scale: tamanho }] }]}
      onPressIn={(e) => {
        if (!reduzido) animarPara(escala);
        resto.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animarPara(1);
        resto.onPressOut?.(e);
      }}
    >
      {children}
    </PressableAnimado>
  );
}

/** Mostra o conteúdo com uma entrada suave; `ordem` atrasa 40 ms por item (até 6). */
export function Aparecer({ ordem = 0, children, style }: { ordem?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [progresso] = useState(() => new Animated.Value(0));
  const reduzido = useMovimentoReduzido();

  useEffect(() => {
    Animated.timing(progresso, {
      toValue: 1,
      duration: animacao.entrada,
      delay: Math.min(ordem, 6) * animacao.intervalo,
      easing: animacao.curva,
      useNativeDriver: animacao.nativo,
    }).start();
  }, [progresso, ordem]);

  const subida = progresso.interpolate({ inputRange: [0, 1], outputRange: [reduzido ? 0 : 8, 0] });
  return <Animated.View style={[style, { opacity: progresso, transform: [{ translateY: subida }] }]}>{children}</Animated.View>;
}
