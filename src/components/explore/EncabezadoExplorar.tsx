import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta, conAlfa, familia, MARGEN_PANTALLA } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { ALTO_BUSCADOR } from './BuscadorVivo';
import { ALTO_SEGMENTOS } from './SegmentosIndicador';
import { ALTO_CONTADOR } from './ContadorResultados';
import { ALTO_INTERRUPTOR } from './InterruptorDos';
import { ALTO_FILTROS_EJERCICIOS, ALTO_FILTROS_UNA_FILA } from './EncabezadoFiltrosColapsable';

export type SegmentoExplorar = 'ejercicios' | 'rutinas' | 'programas' | 'musculos';

export const ALTO_TITULO = 46;
export const SEP_SEGMENTOS = 4;
export const SEP_CONTADOR = 12;
export const SEP_INTERRUPTOR = 8;
const PADDING_INFERIOR = 8;

/** Scroll en el que termina de colapsar el titulo. */
const RANGO_SCROLL = 80;
/** Cuanto sube todo el bloque al colapsar: deja el titulo justo bajo la barra de estado. */
const RECORRIDO_PX = 18;
const TAMANO_TITULO = 40;
const TAMANO_TITULO_COLAPSADO = 22;
const ESCALA_FINAL = TAMANO_TITULO_COLAPSADO / TAMANO_TITULO;
const OPACIDAD_BARRA = 0.92;
const FOCO_COLAPSA = 0.5;

/**
 * Alto del encabezado desplegado, con el inset de arriba. Es la suma exacta de sus
 * filas: las listas lo usan de relleno superior, asi que no se mide (medirlo mientras
 * las filas se pliegan haria bailar la lista).
 */
export function altoEncabezado(segmento: SegmentoExplorar, insetArriba: number): number {
  const filtros = segmento === 'ejercicios' ? ALTO_FILTROS_EJERCICIOS : segmento === 'musculos' ? 0 : ALTO_FILTROS_UNA_FILA;
  const interruptor = segmento === 'ejercicios' ? SEP_INTERRUPTOR + ALTO_INTERRUPTOR : 0;
  return insetArriba + ALTO_TITULO + ALTO_BUSCADOR + SEP_SEGMENTOS + ALTO_SEGMENTOS + filtros
    + SEP_CONTADOR + ALTO_CONTADOR + interruptor + PADDING_INFERIOR;
}

/**
 * Cabecera fija de Explorar: titulo, buscador, segmentos, filtros y contador sobre
 * `goma` al 92 % (con desenfoque en iOS) y un borde inferior que aparece al colapsar.
 * Con el scroll (0 a 80 px) o al enfocar el buscador (`foco`), el titulo pasa de 40 a
 * 22 px con `scale` (no cambia `fontSize`) y el bloque sube 18 px. Con movimiento
 * reducido cambia en un solo paso.
 */
export function EncabezadoExplorar({ y, foco, children }: {
  y: SharedValue<number>;
  foco: SharedValue<number>;
  children: React.ReactNode;
}) {
  const { top } = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const tick = useTick();

  const avance = (valor: number, enfoque: number) => {
    'worklet';
    if (reducido) return valor > RANGO_SCROLL || enfoque > FOCO_COLAPSA ? 1 : 0;
    return Math.max(interpolate(valor, [0, RANGO_SCROLL], [0, 1], Extrapolation.CLAMP), enfoque);
  };

  const caja = useAnimatedStyle(() => ({
    transform: [{ translateY: -RECORRIDO_PX * avance(y.value, foco.value) }],
  }), [reducido, tick]);
  const borde = useAnimatedStyle(() => ({ opacity: avance(y.value, foco.value) }), [reducido, tick]);
  const titulo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - ESCALA_FINAL) * avance(y.value, foco.value) }],
  }), [reducido, tick]);

  return (
    <Animated.View style={[s.caja, { paddingTop: top }, caja]}>
      {Platform.OS === 'ios' ? <BlurView intensity={40} tint="dark" style={s.llena} /> : null}
      <View style={s.llena} />
      <Animated.View style={[s.linea, borde]} pointerEvents="none" />
      <Animated.Text
        style={[s.titulo, titulo]} numberOfLines={1} maxFontSizeMultiplier={1.1} accessibilityRole="header"
      >
        Explorar
      </Animated.Text>
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  caja: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingBottom: PADDING_INFERIOR },
  llena: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: conAlfa(paleta.goma, OPACIDAD_BARRA) },
  linea: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: paleta.gomaBorde },
  titulo: {
    height: ALTO_TITULO, paddingBottom: 4, marginHorizontal: MARGEN_PANTALLA,
    fontFamily: familia.display, fontSize: TAMANO_TITULO, lineHeight: TAMANO_TITULO + 2, letterSpacing: -0.5,
    color: paleta.magnesia, transformOrigin: 'left bottom',
  },
});
