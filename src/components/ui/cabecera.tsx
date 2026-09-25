import React, { createContext, useContext } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue,
} from 'react-native-reanimated';
import { paleta, tipo, MARGEN_PANTALLA } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const RECORRIDO_TITULO = 56;
const APARICION_COMPACTA: [number, number] = [40, 72];
const ALTO_BARRA_COMPACTA = 48;
const ENCOGIMIENTO = 0.9;

/** Posicion vertical del scroll de la pantalla, para ligar a ella el encogimiento del titulo. */
export const ContextoScroll = createContext<SharedValue<number> | null>(null);

export function useScrollCabecera() {
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { y.value = e.contentOffset.y; });
  return { y, onScroll };
}

/** Titulo grande de pantalla: al bajar se encoge y se desvanece, y toma su lugar la barra compacta. */
export function TituloGrande({ children, estilo }: { children: string; estilo?: StyleProp<TextStyle> }) {
  const y = useContext(ContextoScroll);
  const reducido = useReducedMotion();
  const animado = useAnimatedStyle(() => {
    if (y === null) return {};
    const p = interpolate(y.value, [0, RECORRIDO_TITULO], [0, 1], Extrapolation.CLAMP);
    if (reducido) return { opacity: 1 - p };
    return {
      opacity: 1 - p,
      transform: [{ translateY: -8 * p }, { scale: 1 - (1 - ENCOGIMIENTO) * p }],
    };
  });

  return (
    <Animated.Text style={[tipo.h1, s.titulo, estilo, animado]} accessibilityRole="header">
      {children}
    </Animated.Text>
  );
}

/** Barra superior compacta que aparece cuando el titulo grande ya salio de la vista. */
export function BarraCompacta({ titulo, y }: { titulo: string; y: SharedValue<number> }) {
  const reducido = useReducedMotion();
  const animado = useAnimatedStyle(() => {
    const p = interpolate(y.value, APARICION_COMPACTA, [0, 1], Extrapolation.CLAMP);
    return reducido ? { opacity: p } : { opacity: p, transform: [{ translateY: 6 * (1 - p) }] };
  });

  return (
    <Animated.View style={[s.barra, animado]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={s.tituloCompacto} numberOfLines={1}>{titulo}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  titulo: { color: paleta.magnesia, transformOrigin: 'left center' },
  barra: {
    position: 'absolute', top: 0, left: 0, right: 0, height: ALTO_BARRA_COMPACTA,
    justifyContent: 'center', paddingHorizontal: MARGEN_PANTALLA,
    backgroundColor: paleta.goma, borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde,
  },
  tituloCompacto: { ...tipo.h2, color: paleta.magnesia },
});
