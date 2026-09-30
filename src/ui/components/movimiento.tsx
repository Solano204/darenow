/**
 * FORJA · ui / movimiento
 *
 * `useMovimientoReducido` y las animaciones reutilizables que lo consumen:
 * pulso de estado y numeros que cuentan.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { color } from '@/ui/theme';

import { useReducedMotion as useMovimientoReducido } from '@/ui/hooks/useReducedMotion';
import { useLoopActivo } from '@/ui/hooks/useLoopActivo';

export { useReducedMotion as useMovimientoReducido } from '@/ui/hooks/useReducedMotion';

/** Pulso lento. Para lo que esta vivo ahora mismo: un punto de "en curso". */
export function Pulso({ tamano = 8, tono = color.carbon }: { tamano?: number; tono?: string }) {
  const reducido = useMovimientoReducido();
  const v = useSharedValue(0);
  // En el hilo de UI (R6), detenido al desmontar (antes el loop del core seguia vivo, H-20) y en pausa
  // con la pantalla tapada (vive en la pestana Yo, que no se desmonta).
  const activo = useLoopActivo();
  useEffect(() => {
    if (reducido || !activo) { cancelAnimation(v); return; }
    v.set(0);
    v.set(withRepeat(withSequence(
      withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 900, easing: Easing.in(Easing.quad) }),
    ), -1, false));
    return () => cancelAnimation(v);
  }, [reducido, v, activo]);
  const halo = useAnimatedStyle(() => ({
    opacity: interpolate(v.value, [0, 1], [0.30, 0]),
    transform: [{ scale: interpolate(v.value, [0, 1], [0.5, 1]) }],
  }));
  return (
    <View style={{ width: tamano * 2.4, height: tamano * 2.4, alignItems: 'center', justifyContent: 'center' }}>
      {/* El halo es el loop; con movimiento reducido se queda solo el
          punto solido, que ya comunica "en curso" sin moverse. */}
      {!reducido && (
        <Animated.View style={[{
          position: 'absolute', width: tamano * 2.4, height: tamano * 2.4,
          borderRadius: tamano * 1.2, backgroundColor: tono,
        }, halo]} />
      )}
      <View style={{ width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: tono }} />
    </View>
  );
}
