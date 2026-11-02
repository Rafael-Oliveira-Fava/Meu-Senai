import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, motion, radius, space, type } from '../theme';
import { useReducedMotion } from './motion';
import { Icon } from './ui';

type Msg = { id: number; text: string; tone: 'ok' | 'error' };
const Ctx = createContext<(text: string, tone?: Msg['tone']) => void>(() => {});

/** Snackbar: enters from the bottom (240ms ease-out), leaves faster (160ms). */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<Msg | null>(null);
  const [y] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const show = useCallback((text: string, tone: Msg['tone'] = 'ok') => {
    setMsg({ id: Date.now(), text, tone });
  }, []);

  useEffect(() => {
    if (!msg) return;
    y.setValue(0);
    Animated.timing(y, { toValue: 1, duration: motion.enter, easing: motion.easeOut, useNativeDriver: motion.nativeDriver }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      Animated.timing(y, { toValue: 0, duration: motion.exit, easing: motion.easeOut, useNativeDriver: motion.nativeDriver }).start(() => setMsg(null));
    }, 3200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [msg, y]);

  return (
    <Ctx.Provider value={show}>
      {children}
      {msg ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center' }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[
              st.bar,
              { marginBottom: insets.bottom + 88 },
              { opacity: y, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 24, 0] }) }] },
            ]}
          >
            <Icon name={msg.tone === 'ok' ? 'check-circle' : 'alert-circle'} size={20} tint={msg.tone === 'ok' ? '#8FD6A8' : '#FF9AA0'} />
            <Text style={[type.bodySm, { color: '#fff', flex: 1 }]}>{msg.text}</Text>
          </Animated.View>
        </View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useSnackbar = () => useContext(Ctx);

const st = StyleSheet.create({
  bar: {
    maxWidth: 560,
    width: '92%',
    backgroundColor: color.ink,
    borderRadius: radius.field,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
});
