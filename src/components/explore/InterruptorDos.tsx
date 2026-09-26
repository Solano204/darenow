import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, familia, resortePlaca, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

export const ALTO_INTERRUPTOR = 36;
const RADIO = 10;
const RADIO_FICHA = 8;
const INSET = 2;
const BORDE = 1;

/**
 * Control de dos posiciones («Lo que puedo hacer» / «Catalogo completo»): no son dos
 * chips, es un interruptor. Una ficha `magnesia` se desliza bajo la opcion activa con
 * `resortePlaca` y el texto de cada opcion cambia de color al paso de la ficha. Con
 * movimiento reducido la ficha salta de una a otra.
 */
export function InterruptorDos({ opciones, indice, onCambio }: {
  opciones: readonly [string, string];
  indice: 0 | 1;
  onCambio: (indice: 0 | 1) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [ancho, setAncho] = useState(0);
  const pos = useSharedValue<number>(indice);

  useEffect(() => {
    pos.value = reducido ? indice : withSpring(indice, resortePlaca);
  }, [indice, reducido]);

  const mitad = Math.max(0, (ancho - 2 * BORDE - 2 * INSET) / 2);
  const ficha = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value * mitad }] }), [mitad, tick]);
  const colorIzquierda = useAnimatedStyle(() => ({
    color: interpolateColor(pos.value, [0, 1], [paleta.goma, paleta.magnesia2]),
  }), [tick]);
  const colorDerecha = useAnimatedStyle(() => ({
    color: interpolateColor(pos.value, [0, 1], [paleta.magnesia2, paleta.goma]),
  }), [tick]);
  const colores = [colorIzquierda, colorDerecha];

  return (
    <View
      style={s.caja} accessibilityRole="radiogroup"
      onLayout={(e: LayoutChangeEvent) => setAncho(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[s.ficha, { width: mitad }, ficha]} pointerEvents="none" />
      {opciones.map((texto, i) => (
        <Pressable
          key={texto} style={s.opcion}
          onPress={() => { if (i !== indice) { haptico.seleccion(); onCambio(i as 0 | 1); } }}
          accessibilityRole="radio" accessibilityLabel={texto} accessibilityState={{ checked: i === indice }}
        >
          <Animated.Text style={[s.texto, colores[i]]} numberOfLines={1}>{texto}</Animated.Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    height: ALTO_INTERRUPTOR, borderRadius: RADIO, flexDirection: 'row', padding: INSET,
    backgroundColor: paleta.gomaAlta, borderWidth: BORDE, borderColor: paleta.gomaBorde,
  },
  ficha: {
    position: 'absolute', top: INSET, left: INSET, bottom: INSET, borderRadius: RADIO_FICHA, backgroundColor: paleta.magnesia,
  },
  opcion: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  texto: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20 },
});
