/**
 * FORJA · ui / movimiento
 *
 * `useMovimientoReducido` y las animaciones reutilizables que lo consumen:
 * entrada escalonada, pulso de estado y numeros que cuentan.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, type ViewStyle } from 'react-native';
import { color, anim } from '../../theme';

export { useReducedMotion as useMovimientoReducido } from '../../hooks/useReducedMotion';
import { useReducedMotion as useMovimientoReducido } from '../../hooks/useReducedMotion';

/** Entrada suave: aparece y sube unos pixeles. */
export function Aparece({ children, retraso = 0, estilo }: {
  children: React.ReactNode; retraso?: number; estilo?: ViewStyle;
}) {
  const reducido = useMovimientoReducido();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducido) { v.setValue(1); return; }
    Animated.timing(v, {
      toValue: 1, duration: anim.normal, delay: retraso,
      easing: Easing.bezier(0.2, 0.7, 0.3, 1), useNativeDriver: true,
    }).start();
  }, [reducido]);
  return (
    <Animated.View style={[
      estilo,
      {
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      },
    ]}>
      {children}
    </Animated.View>
  );
}

/** Pulso lento. Para lo que esta vivo ahora mismo: un punto de "en curso". */
export function Pulso({ tamano = 8, tono = color.carbon }: { tamano?: number; tono?: string }) {
  const reducido = useMovimientoReducido();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducido) return;
    Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ])).start();
  }, [reducido]);
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
