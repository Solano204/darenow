/**
 * FORJA · ui / movimiento
 *
 * `useMovimientoReducido` y las animaciones reutilizables que lo consumen:
 * pulso de estado y numeros que cuentan.
 */

import React, { useEffect, useState } from 'react';
import { View, Animated, Easing } from 'react-native';
import { color } from '@/ui/theme';

import { useReducedMotion as useMovimientoReducido } from '@/ui/hooks/useReducedMotion';

export { useReducedMotion as useMovimientoReducido } from '@/ui/hooks/useReducedMotion';

/** Pulso lento. Para lo que esta vivo ahora mismo: un punto de "en curso". */
export function Pulso({ tamano = 8, tono = color.carbon }: { tamano?: number; tono?: string }) {
  const reducido = useMovimientoReducido();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reducido) return;
    Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ])).start();
  }, [reducido, v]);
  return (
    <View style={{ width: tamano * 2.4, height: tamano * 2.4, alignItems: 'center', justifyContent: 'center' }}>
      {/* El halo es el loop; con movimiento reducido se queda solo el
          punto solido, que ya comunica "en curso" sin moverse. */}
      {!reducido && (
        <Animated.View style={{
          position: 'absolute', width: tamano * 2.4, height: tamano * 2.4,
          borderRadius: tamano * 1.2, backgroundColor: tono,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.30, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        }} />
      )}
      <View style={{ width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: tono }} />
    </View>
  );
}
