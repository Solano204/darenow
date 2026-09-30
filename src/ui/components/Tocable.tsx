import React from 'react';
import { Pressable, type AccessibilityState, type Insets, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { resorteTap, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const ESCALA_PRESIONADO = 0.03;

/**
 * El envoltorio tocable del sistema: `Pressable` que se hunde un 3 % al presionar con
 * `resorteTap` y da un toque suave (que respeta el ajuste de hapticos, ver `ui/theme/haptics`).
 * El area tactil es el propio contenido, mas `hitSlop` si hace falta.
 *
 * Todo lo opcional tiene el comportamiento de siempre por defecto: sin `haptica={false}` hay
 * toque, sin `deshabilitado` responde, sin `escala` se hunde 3 %.
 */
export function Tocable({
  onPress, onLongPress, etiqueta, pista, rol = 'button', estado, estilo, escala = ESCALA_PRESIONADO,
  haptica = true, deshabilitado = false, hitSlop, presion: externa, children,
}: {
  onPress: () => void;
  onLongPress?: () => void;
  etiqueta: string;
  /** `accessibilityHint`: que pasa al tocar, si no es obvio por la etiqueta. */
  pista?: string;
  rol?: 'button' | 'link';
  /** `accessibilityState` extra (seleccionado, marcado...). `disabled` sale de `deshabilitado`. */
  estado?: AccessibilityState;
  estilo?: StyleProp<ViewStyle>;
  /** Cuanto se hunde al presionar (0.03 = 3 %). 0 la deja quieta. */
  escala?: number;
  /** Toque haptico al presionar. */
  haptica?: boolean;
  /** No responde ni se hunde; el lector de pantalla lo anuncia como deshabilitado. */
  deshabilitado?: boolean;
  hitSlop?: number | Insets;
  /** Si viene, `Tocable` escribe aqui su presion (0 a 1) para que el contenido reaccione. */
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
      onPressIn={() => { presion.set(withSpring(1, resorteTap)); if (haptica) haptico.toque(); }}
      onPressOut={() => { presion.set(withSpring(0, resorteTap)); }}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={deshabilitado}
      hitSlop={hitSlop}
      accessibilityRole={rol}
      accessibilityLabel={etiqueta}
      accessibilityHint={pista}
      accessibilityState={deshabilitado || estado ? { ...estado, disabled: deshabilitado } : undefined}
    >
      <Animated.View style={[estilo, cuerpo]}>{children}</Animated.View>
    </Pressable>
  );
}
