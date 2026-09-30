import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { resorteMagnesia } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const FUNDIDO_REDUCIDO_MS = 150;

type Resorte = { damping: number; stiffness: number; mass?: number };

/**
 * Entrada con resorte: aparece y se desplaza desde (x, y) hasta su sitio.
 * Con movimiento reducido solo hay un fundido de 150 ms; con `animar=false`
 * aparece ya puesta.
 */
export function Entrada({ children, activo, animar = true, retraso = 0, x = 0, y = 0, escala = 1, resorte = resorteMagnesia, estilo }: {
  children: React.ReactNode;
  activo: boolean;
  animar?: boolean;
  retraso?: number;
  x?: number;
  y?: number;
  /** Escala inicial (0.96 crece a 1; 1.02 baja a 1). */
  escala?: number;
  resorte?: Resorte;
  estilo?: StyleProp<ViewStyle>;
}) {
  const reducido = useReducedMotion();
  const estatico = !animar;
  const t = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { t.set(1); return; }
    if (!activo) { t.set(0); return; }
    t.set(withDelay(
      reducido ? 0 : retraso,
      reducido ? withTiming(1, { duration: FUNDIDO_REDUCIDO_MS }) : withSpring(1, resorte),
    ));
    return () => cancelAnimation(t);
  }, [estatico, activo, reducido]);

  const animado = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 2),
    transform: [
      { translateX: reducido ? 0 : (1 - t.value) * x },
      { translateY: reducido ? 0 : (1 - t.value) * y },
      { scale: reducido ? 1 : escala + (1 - escala) * t.value },
    ],
  }));

  return <Animated.View style={[estilo, animado]}>{children}</Animated.View>;
}
