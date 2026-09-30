import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { DesenfoqueIos } from '@/ui/components/DesenfoqueIos';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta, conAlfa, familia, MARGEN_PANTALLA, AREA_TACTIL_MIN, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

/** Alto del encabezado expandido, sin contar el inset superior. */
export const ALTO_HEADER = 96;
/** Scroll en el que termina de colapsar. */
export const RANGO_SCROLL = 80;
/** Cuanto sube el bloque al colapsar: deja una barra de 52 px. */
export const RECORRIDO_PX = 44;
const TAMANO_TITULO = 40;
const TAMANO_TITULO_COLAPSADO = 22;
const ESCALA_FINAL = TAMANO_TITULO_COLAPSADO / TAMANO_TITULO;
const FUNDE_SALUDO = RANGO_SCROLL / 2;
const OPACIDAD_BARRA = 0.92;
/** Cuanto se corre el titulo colapsado para dejar sitio a la flecha de atras. */
const DESPLAZA_POR_FLECHA_PX = 40;

type Icono = keyof typeof Ionicons.glyphMap;

/**
 * Encabezado que se colapsa con el scroll (worklets ligados al scroll, sin
 * estado): de 0 a 80 px el titulo pasa de 40 a 22 px con `scale` y `translateY`
 * (no cambia `fontSize`), el saludo se desvanece y todo sube hasta una barra de
 * 52 px `goma` al 92 % con borde inferior (con desenfoque en iOS). El boton de
 * accion se queda arriba a la derecha. El contenido necesita `paddingTop =
 * inset.top + ALTO_HEADER`. Con movimiento reducido cambia en un solo paso al
 * pasar de 80 px.
 */
export function HeaderColapsable({ y, saludo, titulo, accion, onAtras }: {
  y: SharedValue<number>;
  saludo?: string;
  titulo: string;
  accion?: { icono: Icono; etiqueta: string; onPress: () => void };
  /**
   * Una flecha de atras fija arriba a la izquierda (las pantallas que se abren desde otra). Mientras el titulo
   * grande esta a la vista la barra solo lleva la flecha; al colapsar, el titulo se corre a su lado.
   */
  onAtras?: () => void;
}) {
  const { top } = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const tick = useTick();

  const avance = (valor: number) => {
    'worklet';
    if (reducido) return valor > RANGO_SCROLL ? 1 : 0;
    return interpolate(valor, [0, RANGO_SCROLL], [0, 1], Extrapolation.CLAMP);
  };

  const contenedor = useAnimatedStyle(() => ({ transform: [{ translateY: -RECORRIDO_PX * avance(y.value) }] }), [reducido, tick]);
  const borde = useAnimatedStyle(() => ({ opacity: avance(y.value) }), [reducido, tick]);
  const textoSaludo = useAnimatedStyle(() => ({
    opacity: reducido
      ? (y.value > RANGO_SCROLL ? 0 : 1)
      : interpolate(y.value, [0, FUNDE_SALUDO], [1, 0], Extrapolation.CLAMP),
  }), [reducido, tick]);
  const textoTitulo = useAnimatedStyle(() => ({
    transform: [
      { translateX: onAtras ? DESPLAZA_POR_FLECHA_PX * avance(y.value) : 0 },
      { scale: 1 - (1 - ESCALA_FINAL) * avance(y.value) },
    ],
  }), [reducido, tick, onAtras]);

  return (
    <>
    <Animated.View style={[s.caja, { height: top + ALTO_HEADER, paddingTop: top }, contenedor]} pointerEvents="box-none">
      <DesenfoqueIos intensidad={40} estilo={s.llena} />
      <View style={s.llena} />
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
            <Ionicons name={accion.icono} size={20} color={paleta.magnesia} />
          </Pressable>
        )}
      </View>
    </Animated.View>
    {onAtras && (
      <Pressable
        onPress={() => { haptico.toque(); onAtras(); }} hitSlop={4}
        accessibilityRole="button" accessibilityLabel="Atrás" style={[s.atras, { top: top + 4 }]}
      >
        <Ionicons name="chevron-back" size={22} color={paleta.magnesia} />
      </Pressable>
    )}
    </>
  );
}

const s = StyleSheet.create({
  atras: {
    position: 'absolute', left: 12, zIndex: 11, width: AREA_TACTIL_MIN, height: AREA_TACTIL_MIN,
    alignItems: 'center', justifyContent: 'center',
  },
  caja: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  llena: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: conAlfa(paleta.goma, OPACIDAD_BARRA) },
  linea: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: paleta.gomaBorde },
  fila: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 12,
    paddingHorizontal: MARGEN_PANTALLA, paddingBottom: 12,
  },
  textos: { flex: 1 },
  saludo: { fontFamily: familia.medio, fontSize: 15, lineHeight: 20, color: paleta.magnesia2, marginBottom: 2 },
  titulo: {
    fontFamily: familia.display, fontSize: TAMANO_TITULO, lineHeight: TAMANO_TITULO + 2, letterSpacing: -0.5,
    color: paleta.magnesia, transformOrigin: 'left bottom',
  },
  boton: {
    width: AREA_TACTIL_MIN, height: AREA_TACTIL_MIN, borderRadius: AREA_TACTIL_MIN / 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
});
