import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, familia, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const ALTO_INTERRUPTOR = 36;
const RADIO = 10;
const RADIO_FICHA = 8;
const INSET = 2;
const BORDE = 1;
const PADDING_OPCION = 12;

type Medida = { x: number; w: number };

/**
 * Control de dos posiciones («Puedo hacer» / «Catalogo»): no son dos chips, es un
 * interruptor. Una ficha `magnesia` se desliza bajo la opcion activa con `resortePlaca`
 * y toma el ancho de cada opcion (cada una mide lo que su texto), y el texto cambia de
 * color al paso de la ficha. Con movimiento reducido la ficha salta de una a otra.
 * `opciones` es lo que se ve; `etiquetas`, la frase completa que oye el lector de pantalla.
 */
export function InterruptorDos({ opciones, etiquetas, indice, onCambio }: {
  opciones: readonly [string, string];
  etiquetas: readonly [string, string];
  indice: 0 | 1;
  onCambio: (indice: 0 | 1) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [medidas, setMedidas] = useState<readonly [Medida, Medida]>([{ x: 0, w: 0 }, { x: 0, w: 0 }]);
  const pos = useSharedValue<number>(indice);

  useEffect(() => {
    pos.set(reducido ? indice : withSpring(indice, resortePlaca));
  }, [indice, pos, reducido]);

  const medir = (i: 0 | 1) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setMedidas(m => (m[i].x === x && m[i].w === width ? m : i === 0 ? [{ x, w: width }, m[1]] : [m[0], { x, w: width }]));
  };

  const [m0, m1] = medidas;
  // `x` llega desde el borde exterior de la caja; la ficha se coloca desde el interior del borde.
  const ficha = useAnimatedStyle(() => ({
    width: interpolate(pos.value, [0, 1], [m0.w, m1.w]),
    transform: [{ translateX: interpolate(pos.value, [0, 1], [m0.x - BORDE, m1.x - BORDE]) }],
  }), [m0, m1, tick]);
  const colorIzquierda = useAnimatedStyle(() => ({
    color: interpolateColor(pos.value, [0, 1], [paleta.goma, paleta.magnesia2]),
  }), [tick]);
  const colorDerecha = useAnimatedStyle(() => ({
    color: interpolateColor(pos.value, [0, 1], [paleta.magnesia2, paleta.goma]),
  }), [tick]);
  const colores = [colorIzquierda, colorDerecha];

  return (
    <View style={s.caja} accessibilityRole="radiogroup">
      <Animated.View style={[s.ficha, ficha]} pointerEvents="none" />
      {opciones.map((texto, i) => (
        <Pressable
          key={texto} style={s.opcion} onLayout={medir(i as 0 | 1)}
          onPress={() => { if (i !== indice) { haptico.seleccion(); onCambio(i as 0 | 1); } }}
          accessibilityRole="radio" accessibilityLabel={etiquetas[i]} accessibilityState={{ checked: i === indice }}
        >
          <Animated.Text style={[s.texto, colores[i]]} numberOfLines={1} maxFontSizeMultiplier={1.1}>{texto}</Animated.Text>
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
    position: 'absolute', top: INSET, left: 0, bottom: INSET, borderRadius: RADIO_FICHA, backgroundColor: paleta.magnesia,
  },
  opcion: { paddingHorizontal: PADDING_OPCION, alignItems: 'center', justifyContent: 'center' },
  texto: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20 },
});
