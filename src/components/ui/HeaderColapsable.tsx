import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta, tipo, familia, MARGEN_PANTALLA, AREA_TACTIL_MIN, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

/** Alto del encabezado expandido, sin contar el inset superior. */
export const ALTO_HEADER = 96;
const RECORRIDO = 44;
const ENCOGE_TITULO = 0.38;
const FUNDE_SALUDO = 28;

type Icono = keyof typeof Ionicons.glyphMap;

/**
 * Encabezado que se colapsa con el scroll: el saludo se desvanece, el titulo
 * se encoge a la izquierda y todo sube hasta quedar en una barra de 52 px que
 * se queda fija. El contenido de la pantalla necesita `paddingTop = inset.top +
 * ALTO_HEADER`. Con movimiento reducido no hay encogimiento: el encabezado
 * simplemente se va con el contenido.
 */
export function HeaderColapsable({ y, saludo, titulo, accion }: {
  y: SharedValue<number>;
  saludo?: string;
  titulo: string;
  accion?: { icono: Icono; etiqueta: string; onPress: () => void };
}) {
  const { top } = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const tick = useTick();

  const contenedor = useAnimatedStyle(() => {
    const p = interpolate(y.value, [0, RECORRIDO], [0, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY: reducido ? -Math.max(0, y.value) : -RECORRIDO * p }] };
  }, [reducido, tick]);
  const borde = useAnimatedStyle(() => ({
    opacity: reducido ? 0 : interpolate(y.value, [0, RECORRIDO], [0, 1], Extrapolation.CLAMP),
  }), [reducido, tick]);
  const textoSaludo = useAnimatedStyle(() => ({
    opacity: reducido ? 1 : interpolate(y.value, [0, FUNDE_SALUDO], [1, 0], Extrapolation.CLAMP),
  }), [reducido, tick]);
  const textoTitulo = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 1 - ENCOGE_TITULO * interpolate(y.value, [0, RECORRIDO], [0, 1], Extrapolation.CLAMP) }],
  }), [reducido, tick]);

  return (
    <Animated.View style={[s.caja, { height: top + ALTO_HEADER, paddingTop: top }, contenedor]} pointerEvents="box-none">
      <View style={s.fondo} />
      <Animated.View style={[s.linea, borde]} pointerEvents="none" />
      <View style={s.fila} pointerEvents="box-none">
        <View style={s.textos}>
          {saludo ? (
            <Animated.Text style={[s.saludo, textoSaludo]} numberOfLines={1}>{saludo}</Animated.Text>
          ) : null}
          <Animated.Text
            style={[s.titulo, textoTitulo]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}
            accessibilityRole="header"
          >
            {titulo}
          </Animated.Text>
        </View>
        {accion && (
          <Pressable
            onPress={() => { haptico.toque(); accion.onPress(); }}
            accessibilityRole="button" accessibilityLabel={accion.etiqueta}
            style={s.boton} hitSlop={4}
          >
            <Ionicons name={accion.icono} size={22} color={paleta.magnesia} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  caja: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: paleta.goma },
  linea: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: paleta.gomaBorde },
  fila: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 12,
    paddingHorizontal: MARGEN_PANTALLA, paddingBottom: 12,
  },
  textos: { flex: 1 },
  saludo: { ...tipo.pie, color: paleta.magnesia2, marginBottom: 2 },
  titulo: {
    fontFamily: familia.display, fontSize: 38, lineHeight: 40, letterSpacing: -0.5,
    color: paleta.magnesia, transformOrigin: 'left bottom',
  },
  boton: {
    width: AREA_TACTIL_MIN, height: AREA_TACTIL_MIN, borderRadius: AREA_TACTIL_MIN / 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
});
