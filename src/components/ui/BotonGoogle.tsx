import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { google, paleta, tipo, radio, esp, ALTO_BOTON, resorteTap, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const LADO_LOGO = 20;
const LADO_ORIGINAL = 48;
const ESCALA_PRESIONADO = 0.03;
const PUNTO = 8;
const PULSO_MS = 360;
const ESCALONADO_PUNTOS_MS = 140;

/** Logo «G» oficial de Google en sus cuatro colores. No se modifica. */
const TRAZOS_G = [
  { d: 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z', color: google.rojo },
  { d: 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z', color: google.azul },
  { d: 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z', color: google.amarillo },
  { d: 'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z', color: google.verde },
];

export function LogoG() {
  const trazos = useMemo(
    () => TRAZOS_G.map(t => ({ path: Skia.Path.MakeFromSVGString(t.d), color: t.color })),
    [],
  );
  return (
    <Canvas style={s.logo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Group transform={[{ scale: LADO_LOGO / LADO_ORIGINAL }]}>
        {trazos.map((t, k) => t.path !== null && <Path key={k} path={t.path} color={t.color} />)}
      </Group>
    </Canvas>
  );
}

/**
 * Boton de Google en su variante oscura, con el logo oficial y el texto que
 * pide la marca. Cápsula de 58 de alto. Mientras espera, el texto se
 * reemplaza por tres puntos de magnesia que pulsan y el boton no cambia de
 * tamano.
 */
export function BotonGoogle({ texto, textoOcupado, ocupado, onPress, estilo }: {
  texto: string;
  textoOcupado: string;
  ocupado?: boolean;
  onPress: () => void;
  estilo?: StyleProp<ViewStyle>;
}) {
  const reducido = useReducedMotion();
  const presion = useSharedValue(0);
  const cuerpo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }] }));

  return (
    <Pressable
      onPressIn={() => { if (ocupado) return; presion.value = withSpring(1, resorteTap); haptico.toque(); }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={ocupado ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={ocupado ? textoOcupado : texto}
      accessibilityState={{ busy: !!ocupado }}
      style={estilo}
    >
      <Animated.View style={[s.cuerpo, cuerpo]}>
        <LogoG />
        <View style={s.contenido}>
          {ocupado && !reducido
            ? <Puntos />
            : <Text style={s.texto} numberOfLines={1} maxFontSizeMultiplier={1.15}>{ocupado ? textoOcupado : texto}</Text>}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function Puntos() {
  return (
    <View style={s.puntos} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {[0, 1, 2].map(k => <Punto key={k} retraso={k * ESCALONADO_PUNTOS_MS} />)}
    </View>
  );
}

function Punto({ retraso }: { retraso: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(retraso, withRepeat(
      withSequence(withTiming(1, { duration: PULSO_MS }), withTiming(0, { duration: PULSO_MS })),
      -1,
    ));
    return () => cancelAnimation(t);
  }, []);
  const estilo = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * t.value,
    transform: [{ translateY: -3 * t.value }],
  }));
  return <Animated.View style={[s.punto, estilo]} />;
}

const s = StyleSheet.create({
  cuerpo: {
    minHeight: ALTO_BOTON, borderRadius: radio.pastilla, paddingHorizontal: esp.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: google.fondo, borderWidth: 1, borderColor: google.borde,
  },
  logo: { width: LADO_LOGO, height: LADO_LOGO },
  contenido: { minHeight: 22, minWidth: 60, justifyContent: 'center' },
  texto: { ...tipo.cuerpoEnfasis, color: google.texto },
  puntos: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  punto: { width: PUNTO, height: PUNTO, borderRadius: PUNTO / 2, backgroundColor: paleta.magnesia },
});
