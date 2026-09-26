import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { paleta, familia, esp, resorteTap, easing, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

const LADO_DIAL = 20;
const GRADOS_45_MIN = 270;
const GRADOS_5_MIN = 30;
const GIRO_MS = 300;
const REPOSO_MS = 700;
const ESCALA_PRESIONADO = 0.02;

/**
 * Fila secundaria (fondo transparente con borde de 1 px, radio 16, alto de 48)
 * con un dial en miniatura de 20 px a la izquierda. Quieto marca 45 min; al tocar, la aguja gira hasta
 * 5 y se pone azul mientras se dispara `onPress`. Con movimiento reducido el
 * dial ya marca 5.
 */
export function BotonFilaSecundario({ texto, onPress, estilo }: {
  texto: string;
  onPress: () => void;
  estilo?: StyleProp<ViewStyle>;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const giro = useSharedValue(0);

  const cuerpo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }] }));
  const aguja = useAnimatedStyle(() => {
    const t = reducido ? 1 : giro.value;
    return {
      transform: [{ rotate: `${GRADOS_45_MIN + (GRADOS_5_MIN - GRADOS_45_MIN) * t}deg` }],
      opacity: 1,
    };
  }, [reducido, tick]);
  const punta = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(reducido ? 1 : giro.value, [0, 1], [paleta.magnesia, paleta.placaAzulTexto]),
  }), [reducido, tick]);

  const alTocar = () => {
    if (!reducido) {
      giro.value = withSequence(
        withTiming(1, { duration: GIRO_MS, easing: easing.salida }),
        withDelay(REPOSO_MS, withTiming(0, { duration: 1 })),
      );
    }
    onPress();
  };

  return (
    <Pressable
      onPressIn={() => { presion.value = withSpring(1, resorteTap); haptico.toque(); }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityLabel={texto}
      style={estilo}
    >
      <Animated.View style={[s.cuerpo, cuerpo]}>
        <View style={s.dial} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Animated.View style={[s.giro, aguja]}>
            <Animated.View style={[s.aguja, punta]} />
          </Animated.View>
          <View style={s.centro} />
        </View>
        <Text style={s.texto} numberOfLines={2} maxFontSizeMultiplier={1.15}>{texto}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cuerpo: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: esp.sm + 4,
    paddingHorizontal: esp.md, paddingVertical: 8, borderRadius: 16,
    borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  dial: {
    width: LADO_DIAL, height: LADO_DIAL, borderRadius: LADO_DIAL / 2,
    borderWidth: 1.5, borderColor: paleta.magnesia3, alignItems: 'center', justifyContent: 'center',
  },
  giro: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' },
  aguja: { width: 2, height: LADO_DIAL / 2 - 4, marginTop: 2, borderRadius: 1 },
  centro: { width: 4, height: 4, borderRadius: 2, backgroundColor: paleta.magnesia2 },
  texto: { flex: 1, fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.magnesia },
});
