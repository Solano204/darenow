import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { paleta, familia, resortePlaca, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

export const ALTO_SEGMENTOS = 44;
const PADDING_X = 12;
const ALTO_INDICADOR = 3;
const FUNDIDO_REDUCIDO_MS = 150;

interface Medida { x: number; ancho: number }

/**
 * Navegacion entre las listas de Explorar: texto, no pastillas (el mismo lenguaje
 * de la barra de pestanas). El activo va en `magnesia`, los demas en `magnesia3`, y
 * una barra azul de 3 px del ancho del texto activo se desliza y cambia de ancho con
 * `resortePlaca`. Si los cuatro no caben, la fila hace scroll y el activo se centra.
 * Con movimiento reducido la barra cambia de sitio con un fundido de 150 ms.
 */
export function SegmentosIndicador<T extends string>({ segmentos, activo, onCambio }: {
  segmentos: readonly { id: T; texto: string }[];
  activo: T;
  onCambio: (id: T) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { width } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const colocado = useRef(false);
  const [medidas, setMedidas] = useState<Partial<Record<T, Medida>>>({});
  const ix = useSharedValue(0);
  const iw = useSharedValue(0);
  const opacidad = useSharedValue(1);

  const medir = (id: T) => (e: LayoutChangeEvent) => {
    const { x, width: ancho } = e.nativeEvent.layout;
    setMedidas(m => (m[id]?.x === x && m[id]?.ancho === ancho ? m : { ...m, [id]: { x, ancho } }));
  };

  useEffect(() => {
    const m = medidas[activo];
    if (!m) return;
    const x = m.x + PADDING_X;
    const ancho = m.ancho - 2 * PADDING_X;
    const animar = colocado.current;
    colocado.current = true;

    if (!animar) { ix.value = x; iw.value = ancho; }
    else if (reducido) {
      opacidad.value = 0;
      ix.value = x; iw.value = ancho;
      opacidad.value = withTiming(1, { duration: FUNDIDO_REDUCIDO_MS });
    } else {
      ix.value = withSpring(x, resortePlaca);
      iw.value = withSpring(ancho, resortePlaca);
    }

    const ultimo = segmentos[segmentos.length - 1].id;
    const fin = medidas[ultimo];
    const contenido = fin ? fin.x + fin.ancho + PADDING_X : width;
    const destino = Math.min(Math.max(0, m.x + m.ancho / 2 - width / 2), Math.max(0, contenido - width));
    scroll.current?.scrollTo({ x: destino, animated: animar && !reducido });
  }, [activo, medidas, reducido, width]);

  const indicador = useAnimatedStyle(() => ({
    width: iw.value, opacity: opacidad.value, transform: [{ translateX: ix.value }],
  }), [tick]);

  return (
    <ScrollView
      ref={scroll} horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist"
      contentContainerStyle={s.contenido} style={s.fila}
    >
      {segmentos.map(seg => {
        const seleccionado = seg.id === activo;
        return (
          <Pressable
            key={seg.id} onLayout={medir(seg.id)}
            onPress={() => { if (!seleccionado) { haptico.seleccion(); onCambio(seg.id); } }}
            accessibilityRole="tab" accessibilityLabel={seg.texto} accessibilityState={{ selected: seleccionado }}
            style={s.segmento}
          >
            <Text style={[s.texto, { color: seleccionado ? paleta.magnesia : paleta.magnesia3Texto }]}>{seg.texto}</Text>
          </Pressable>
        );
      })}
      <Animated.View style={[s.indicador, indicador]} pointerEvents="none" />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fila: { flexGrow: 0, height: ALTO_SEGMENTOS },
  contenido: { paddingHorizontal: PADDING_X, height: ALTO_SEGMENTOS },
  segmento: { height: ALTO_SEGMENTOS, paddingHorizontal: PADDING_X, justifyContent: 'center' },
  texto: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22 },
  indicador: {
    position: 'absolute', left: 0, bottom: 0, height: ALTO_INDICADOR, borderRadius: ALTO_INDICADOR / 2,
    backgroundColor: paleta.placaAzul,
  },
});
