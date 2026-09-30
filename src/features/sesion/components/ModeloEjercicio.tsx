import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { easing } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import Clip from '@/ui/components/Clip';
import Foto from '@/ui/components/Foto';

/** El modelo: el clip del ejercicio en bucle. Al cambiar de ejercicio el saliente se desliza a la izquierda y el nuevo entra por la derecha. */
export function ModeloEjercicio({ id, nombre, alto, activo }: { id: string; nombre: string; alto: number; activo: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [saliente, setSaliente] = useState<string | null>(null);
  const previo = useRef(id);
  const entra = useSharedValue(1);
  const sale = useSharedValue(0);

  useEffect(() => {
    if (previo.current === id) return;
    const anterior = previo.current;
    previo.current = id;
    if (reducido) return;
    setSaliente(anterior);
    entra.set(0);
    sale.set(0);
    entra.set(withTiming(1, { duration: 300, easing: easing.salida }));
    sale.set(withTiming(1, { duration: 300, easing: easing.salida }, fin => { if (fin) runOnJS(setSaliente)(null); }));
  }, [entra, id, reducido, sale]);

  const entrante = useAnimatedStyle(() => ({
    opacity: entra.value, transform: [{ translateX: (1 - entra.value) * 60 }],
  }), [tick]);
  const saliendo = useAnimatedStyle(() => ({
    opacity: 1 - sale.value, transform: [{ translateX: -60 * sale.value }],
  }), [tick]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, entrante]}>
        <Clip id={id} nombre={nombre} alto={alto} ancho="100%" forma="tarjeta" activo={activo} />
      </Animated.View>
      {saliente && (
        <Animated.View style={[StyleSheet.absoluteFill, saliendo]} pointerEvents="none">
          <Foto tipo="ejercicio" id={saliente} alto={alto} ancho="100%" forma="tarjeta" />
        </Animated.View>
      )}
    </View>
  );
}
