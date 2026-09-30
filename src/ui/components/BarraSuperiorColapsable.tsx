import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedStyle, useDerivedValue, type SharedValue,
} from 'react-native-reanimated';
import { DesenfoqueIos } from './DesenfoqueIos';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta, conAlfa, familia, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { EstrellaFavorito } from './EstrellaFavorito';

const LADO_BOTON = 44;
const ALTO_BARRA = 52;
const MARGEN_BOTON = 16;
const APARECE_DESDE = 0.45;
const APARECE_HASTA = 0.75;
const APARECE_UN_PASO = 0.6;
const DESPLAZA_TITULO_PX = 8;

/**
 * Atras y favorito flotan sobre el modelo (44 px, `goma` al 70 %). Cuando el
 * modelo sale de la vista aparece una barra `goma` al 92 % con borde inferior y
 * el nombre del ejercicio al centro (fundido y 8 px), y los botones pierden su
 * fondo circular. Con movimiento reducido la barra aparece en un solo paso.
 */
export function BarraSuperiorColapsable({ y, alturaHero, nombre, favorito = false, onFavorito, onAtras, children }: {
  y: SharedValue<number>;
  alturaHero: number;
  nombre: string;
  favorito?: boolean;
  /** Sin el, no hay estrella (un mito no se guarda en favoritos). */
  onFavorito?: () => void;
  onAtras: () => void;
  /** Lo que va pegado al borde inferior de la barra y aparece con ella (la linea de progreso de lectura). */
  children?: React.ReactNode;
}) {
  const { top } = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const tick = useTick();

  const t = useDerivedValue(() => (
    reducido
      ? (y.value > alturaHero * APARECE_UN_PASO ? 1 : 0)
      : interpolate(y.value, [alturaHero * APARECE_DESDE, alturaHero * APARECE_HASTA], [0, 1], Extrapolation.CLAMP)
  ), [reducido, alturaHero]);
  const sinFondo = useDerivedValue(() => 1 - t.value);

  const barra = useAnimatedStyle(() => ({ opacity: t.value }), [tick]);
  const titulo = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: reducido ? 0 : DESPLAZA_TITULO_PX * (1 - t.value) }],
  }), [reducido, tick]);
  const fondoAtras = useAnimatedStyle(() => ({ opacity: sinFondo.value }), [tick]);

  return (
    <View style={[s.raiz, { height: top + ALTO_BARRA }]} pointerEvents="box-none">
      <Animated.View style={[s.barra, barra]} pointerEvents="none">
        <DesenfoqueIos intensidad={40} estilo={s.llena} />
        <View style={[s.llena, s.velo]} />
        <View style={s.linea} />
        {children}
      </Animated.View>

      <View style={[s.fila, { top: top + (ALTO_BARRA - LADO_BOTON) / 2 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => { haptico.toque(); onAtras(); }} hitSlop={4}
          accessibilityRole="button" accessibilityLabel="Atrás" style={s.boton}
        >
          <Animated.View style={[s.fondoBoton, fondoAtras]} />
          <Ionicons name="chevron-back" size={20} color={paleta.magnesia} />
        </Pressable>

        <Animated.Text
          style={[s.nombre, titulo]} numberOfLines={1} pointerEvents="none"
          accessibilityElementsHidden importantForAccessibility="no"
        >
          {nombre}
        </Animated.Text>

        {onFavorito ? (
          <EstrellaFavorito activo={favorito} onPress={onFavorito} nombre={nombre} lado={LADO_BOTON} fondo={sinFondo} />
        ) : <View style={s.boton} />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  barra: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  llena: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  velo: { backgroundColor: conAlfa(paleta.goma, 0.92) },
  linea: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: paleta.gomaBorde },
  fila: {
    position: 'absolute', left: MARGEN_BOTON, right: MARGEN_BOTON, height: LADO_BOTON,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  boton: { width: LADO_BOTON, height: LADO_BOTON, borderRadius: LADO_BOTON / 2, alignItems: 'center', justifyContent: 'center' },
  fondoBoton: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: LADO_BOTON / 2,
    backgroundColor: conAlfa(paleta.goma, 0.7),
  },
  nombre: {
    position: 'absolute', left: LADO_BOTON + 12, right: LADO_BOTON + 12, textAlign: 'center',
    fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia,
  },
});
