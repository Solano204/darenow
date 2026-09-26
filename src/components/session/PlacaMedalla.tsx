import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, conAlfa, resortePlaca, easing } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

type Glifo = keyof typeof Ionicons.glyphMap;

const LADO = 56;
const RADIO_EXTERIOR = LADO / 2;
const RADIO_CENTRO = 22;
const RADIO_FILETE = 19;
const MUESCAS = 20;
const CAIDA_PX = 160;
const VUELTA_Y_MEDIA_GRADOS = 540;
const BRILLO_MS = 700;

/** Icono de cada logro (`icono` en `40_challenges_achievements.json`). */
const GLIFOS: Record<string, Glifo> = {
  arbol: 'leaf', bandera: 'flag', barra: 'barbell', bosque: 'leaf', brote: 'leaf', columna: 'body',
  empuje: 'arrow-up', invertido: 'swap-vertical', luna: 'moon', lupa: 'search', mano: 'hand-left',
  mapa: 'map', perfil: 'person', regreso: 'arrow-undo', ruta: 'trail-sign', ruta_larga: 'trail-sign',
  semilla: 'leaf', silencio: 'volume-mute', sol: 'sunny', tabla: 'grid',
};

/**
 * Placa-medalla: un disco olimpico de 56 px (anillo exterior `magnesia` con
 * muescas, centro `goma`, filete interior fino; vistas y no un `Canvas`, porque
 * un Canvas de Skia no gira bien en Y en Android) y el icono del
 * logro al centro. Cae desde arriba girando en Y una vuelta y media, se asienta
 * con `resortePlaca` (`alAsentar` da el golpe y la nube) y un brillo la cruza una
 * vez. Con movimiento reducido aparece fija.
 */
export function PlacaMedalla({ icono, retraso = 0, alAsentar }: {
  icono: string;
  retraso?: number;
  alAsentar?: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(reducido ? 1 : 0);
  const brillo = useSharedValue(0);
  const asentada = useRef(false);

  const asentar = () => {
    if (asentada.current) return;
    asentada.current = true;
    alAsentar?.();
  };

  useEffect(() => {
    if (reducido) { t.value = 1; return; }
    t.value = withDelay(retraso, withSpring(1, resortePlaca, fin => { if (fin) runOnJS(asentar)(); }));
    brillo.value = withDelay(retraso + 350, withTiming(1, { duration: BRILLO_MS, easing: easing.salida }));
    return () => { cancelAnimation(t); cancelAnimation(brillo); };
  }, [reducido, retraso]);

  const cae = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 4),
    transform: [
      { perspective: 600 },
      { translateY: -CAIDA_PX * (1 - t.value) },
      { rotateY: `${VUELTA_Y_MEDIA_GRADOS * (1 - t.value)}deg` },
    ],
  }), [tick]);
  const luz = useAnimatedStyle(() => ({
    opacity: brillo.value > 0 && brillo.value < 1 ? 0.55 : 0,
    transform: [{ translateX: -LADO + brillo.value * LADO * 2 }, { rotate: '20deg' }],
  }), [tick]);

  return (
    <Animated.View style={[s.caja, cae]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={s.disco} />
      {Array.from({ length: MUESCAS }, (_, i) => (
        <View
          key={i}
          style={[s.muesca, { transform: [{ rotate: `${(i * 360) / MUESCAS}deg` }, { translateY: -(RADIO_EXTERIOR - 3.5) }] }]}
        />
      ))}
      <View style={s.centro} />
      <View style={s.filete} />
      <View style={s.icono}><Ionicons name={GLIFOS[icono] ?? 'ribbon'} size={22} color={paleta.magnesia} /></View>
      <View style={s.recorte} pointerEvents="none">
        <Animated.View style={[s.luz, luz]}>
          <LinearGradient
            colors={[conAlfa(paleta.blanco, 0), conAlfa(paleta.blanco, 0.9), conAlfa(paleta.blanco, 0)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  caja: { width: LADO, height: LADO },
  disco: { position: 'absolute', top: 0, left: 0, width: LADO, height: LADO, borderRadius: LADO / 2, backgroundColor: paleta.magnesia },
  muesca: {
    position: 'absolute', top: RADIO_EXTERIOR - 1.5, left: RADIO_EXTERIOR - 0.75, width: 1.5, height: 3, backgroundColor: paleta.goma,
  },
  centro: {
    position: 'absolute', top: RADIO_EXTERIOR - RADIO_CENTRO, left: RADIO_EXTERIOR - RADIO_CENTRO,
    width: RADIO_CENTRO * 2, height: RADIO_CENTRO * 2, borderRadius: RADIO_CENTRO, backgroundColor: paleta.goma,
  },
  filete: {
    position: 'absolute', top: RADIO_EXTERIOR - RADIO_FILETE, left: RADIO_EXTERIOR - RADIO_FILETE,
    width: RADIO_FILETE * 2, height: RADIO_FILETE * 2, borderRadius: RADIO_FILETE, borderWidth: 1, borderColor: paleta.magnesia3,
  },
  icono: { position: 'absolute', top: 0, left: 0, width: LADO, height: LADO, alignItems: 'center', justifyContent: 'center' },
  recorte: {
    position: 'absolute', top: 0, left: 0, width: LADO, height: LADO, borderRadius: LADO / 2, overflow: 'hidden',
  },
  luz: { position: 'absolute', top: -10, bottom: -10, left: 0, width: 18 },
});
