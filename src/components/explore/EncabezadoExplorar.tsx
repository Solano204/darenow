import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta, familia, MARGEN_PANTALLA } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';

export type SegmentoExplorar = 'ejercicios' | 'rutinas' | 'programas' | 'musculos';

const ALTO_TITULO = 46;
export const SEP_SEGMENTOS = 4;
export const SEP_CONTADOR = 12;
const PADDING_INFERIOR = 8;

/** Scroll en el que termina de encoger el titulo. */
export const RANGO_SCROLL = 80;
/** Recorrido por defecto de `EncabezadoPegado` para cabeceras que si se encogen (ver `fx/HeaderColapsable`); esta cabecera no se mueve. */
export const RECORRIDO_PX = 18;
const TAMANO_TITULO = 40;
const TAMANO_TITULO_COLAPSADO = 22;
const ESCALA_FINAL = TAMANO_TITULO_COLAPSADO / TAMANO_TITULO;
const FOCO_COLAPSA = 0.5;

/**
 * Cabecera de Explorar (titulo, buscador, segmentos, filtros y contador): fuera de la
 * lista y en el flujo normal, con fondo solido `goma` y sin desenfoque. No cambia de
 * alto ni de posicion. Con el scroll (0 a 80 px) o al enfocar el buscador (`foco`) solo
 * el titulo encoge de 40 a 22 px con `scale` (nunca `fontSize`, para no volver a medir).
 * Con movimiento reducido cambia en un solo paso.
 */
export function EncabezadoExplorar({ y, foco, titulo = 'Explorar', extraTitulo, children }: {
  y: SharedValue<number>;
  foco: SharedValue<number>;
  /** El titulo grande que se encoge (Explorar y Aprender comparten esta cabecera). */
  titulo?: string;
  /** Lo que va a la derecha del titulo (la marca «Sin conexión» de Aprender). */
  extraTitulo?: React.ReactNode;
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

  const borde = useAnimatedStyle(() => ({ opacity: avance(y.value, foco.value) }), [reducido, tick]);
  const estiloTitulo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - ESCALA_FINAL) * avance(y.value, foco.value) }],
  }), [reducido, tick]);

  return (
    <View style={[s.caja, { paddingTop: top }]}>
      <Animated.View style={[s.linea, borde]} pointerEvents="none" />
      <Animated.Text
        style={[s.titulo, estiloTitulo]} numberOfLines={1} maxFontSizeMultiplier={1.1} accessibilityRole="header"
      >
        {titulo}
      </Animated.Text>
      {extraTitulo ? <View style={[s.extra, { top: top + ALTO_TITULO - 30 }]} pointerEvents="box-none">{extraTitulo}</View> : null}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  caja: { zIndex: 10, paddingBottom: PADDING_INFERIOR, backgroundColor: paleta.goma },
  linea: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: paleta.gomaBorde },
  extra: { position: 'absolute', right: MARGEN_PANTALLA },
  titulo: {
    height: ALTO_TITULO, paddingBottom: 4, marginHorizontal: MARGEN_PANTALLA,
    fontFamily: familia.display, fontSize: TAMANO_TITULO, lineHeight: TAMANO_TITULO + 2, letterSpacing: -0.5,
    color: paleta.magnesia, transformOrigin: 'left bottom',
  },
});
