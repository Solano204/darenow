import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { paleta, familia, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

type Trio<T> = readonly [T, T, T];
type Posicion = 0 | 1 | 2;

const ALTO = 44;
const RADIO = 12;
const RADIO_FICHA = 10;
const INSET = 2;
const BORDE = 1;
const CAMBIO_REDUCIDO_MS = 120;

/**
 * Control segmentado de tres posiciones (`InterruptorDos` ampliado): una ficha `magnesia` se desliza bajo la opcion
 * elegida con `resortePlaca` y el texto cambia de color al paso de la ficha. `opciones` es lo que se ve y `etiquetas`
 * la frase que oye el lector de pantalla. Con movimiento reducido la ficha cambia con un fundido de 120 ms.
 */
export function SegmentadoTres({ opciones, etiquetas, indice, onCambio }: {
  opciones: Trio<string>;
  etiquetas: Trio<string>;
  indice: Posicion;
  onCambio: (indice: Posicion) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [ancho, setAncho] = useState(0);
  const pos = useSharedValue<number>(indice);

  useEffect(() => {
    pos.set(reducido ? withTiming(indice, { duration: CAMBIO_REDUCIDO_MS }) : withSpring(indice, resortePlaca));
  }, [indice, pos, reducido]);

  const celda = ancho > 0 ? (ancho - 2 * (INSET + BORDE)) / 3 : 0;
  const ficha = useAnimatedStyle(() => ({
    width: celda, transform: [{ translateX: pos.value * celda }],
  }), [celda, tick]);

  const texto0 = useAnimatedStyle(() => ({ color: colorDe(pos.value, 0) }), [tick]);
  const texto1 = useAnimatedStyle(() => ({ color: colorDe(pos.value, 1) }), [tick]);
  const texto2 = useAnimatedStyle(() => ({ color: colorDe(pos.value, 2) }), [tick]);
  const textos = [texto0, texto1, texto2];

  const medir = (e: LayoutChangeEvent) => setAncho(e.nativeEvent.layout.width);

  return (
    <View style={s.caja} onLayout={medir} accessibilityRole="radiogroup">
      <Animated.View style={[s.ficha, ficha]} pointerEvents="none" />
      {opciones.map((texto, i) => (
        <Pressable
          key={texto} style={s.opcion}
          onPress={() => { if (i !== indice) { haptico.seleccion(); onCambio(i as Posicion); } }}
          accessibilityRole="radio" accessibilityLabel={etiquetas[i]} accessibilityState={{ checked: i === indice }}
        >
          <Animated.Text style={[s.texto, textos[i]]} numberOfLines={1} maxFontSizeMultiplier={1.1}>{texto}</Animated.Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Oscuro sobre la ficha y gris fuera de ella, segun lo cerca que este la ficha de la opcion `i`. */
function colorDe(pos: number, i: number): string {
  'worklet';
  return interpolateColor(pos, [i - 1, i, i + 1], [paleta.magnesia2, paleta.goma, paleta.magnesia2]);
}

const s = StyleSheet.create({
  caja: {
    height: ALTO, borderRadius: RADIO, flexDirection: 'row', padding: INSET,
    backgroundColor: paleta.goma, borderWidth: BORDE, borderColor: paleta.gomaBorde,
  },
  ficha: { position: 'absolute', top: INSET, left: INSET, bottom: INSET, borderRadius: RADIO_FICHA, backgroundColor: paleta.magnesia },
  opcion: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  texto: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20 },
});
