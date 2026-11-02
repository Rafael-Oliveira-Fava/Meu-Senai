import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { motion } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Tracks the OS "reduce motion" setting; movement is dropped, opacity stays. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

type PressScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Pressed scale; subtle by default so the UI feels like it heard the tap. */
  scaleTo?: number;
  children: ReactNode;
};

/** Pressable with 0.97 scale feedback on press (160ms strong ease-out). */
export function PressScale({ style, scaleTo = 0.97, children, onPressIn, onPressOut, disabled, ...rest }: PressScaleProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();

  const to = (v: number) =>
    Animated.timing(scale, { toValue: v, duration: motion.press, easing: motion.easeOut, useNativeDriver: motion.nativeDriver }).start();

  return (
    <AnimatedPressable
      {...rest}
      style={[style, { transform: [{ scale }] }]}
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduced) to(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Enters from 8px below with opacity; staggered by index (40ms, capped). */
export function FadeIn({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [progress] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.enter,
      delay: Math.min(index, 6) * motion.stagger,
      easing: motion.easeOut,
      useNativeDriver: motion.nativeDriver,
    }).start();
  }, [progress, index]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 8, 0] });
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
