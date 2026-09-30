import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { resorteTap, haptico } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const ESCALA_PRESIONADO = 0.03;

/**
 * Envoltorio tocable para tarjetas: se hunde un 3 % al presionar con
 * `resorteTap` y da un toque suave. El area tactil es el propio contenido.
 */
export function Presionable({ onPress, etiqueta, rol = 'button', estilo, escala = ESCALA_PRESIONADO, presion: externa, children }: {
  onPress: () => void;
  etiqueta: string;
  rol?: 'button' | 'link';
  estilo?: StyleProp<ViewStyle>;
  /** Cuanto se hunde al presionar (0.03 = 3 %). 0 la deja quieta. */
  escala?: number;
  /** Si viene, `Presionable` escribe aqui su presion (0 a 1) para que el contenido reaccione. */
  presion?: SharedValue<number>;
  children: React.ReactNode;
}) {
  const reducido = useReducedMotion();
  const propia = useSharedValue(0);
  const presion = externa ?? propia;
  const cuerpo = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 1 - escala * presion.value }],
  }), [reducido, escala]);

  return (
    <Pressable
      onPressIn={() => { presion.value = withSpring(1, resorteTap); haptico.toque(); }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={onPress}
      accessibilityRole={rol}
      accessibilityLabel={etiqueta}
    >
      <Animated.View style={[estilo, cuerpo]}>{children}</Animated.View>
    </Pressable>
  );
}
