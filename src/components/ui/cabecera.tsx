import { createContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, tipo, MARGEN_PANTALLA } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { barraBajada } from '@/hooks/useBarraFlotante';

const UMBRAL_DIRECCION = 6;
const MIN_BAJADA = 40;
const DUR_BARRA_MS = 180;

const APARICION_COMPACTA: [number, number] = [40, 72];
const ALTO_BARRA_COMPACTA = 48;

/** Posicion vertical del scroll de la pantalla, para ligar a ella el encogimiento del titulo. */
export const ContextoScroll = createContext<SharedValue<number> | null>(null);

/**
 * Baja o sube la barra de pestanas segun la direccion del scroll. `previo` y `bajando`
 * son el estado de la pantalla que la usa (dos valores compartidos suyos).
 */
export function seguirBarra(actual: number, previo: SharedValue<number>, bajando: SharedValue<number>) {
  'worklet';
  const delta = actual - previo.value;
  if (Math.abs(delta) < UMBRAL_DIRECCION) return;
  previo.value = actual;
  const objetivo = delta > 0 && actual > MIN_BAJADA ? 1 : 0;
  if (objetivo === bajando.value) return;
  bajando.value = objetivo;
  barraBajada.value = withTiming(objetivo, { duration: DUR_BARRA_MS });
}

export function useScrollCabecera() {
  const y = useSharedValue(0);
  const previo = useSharedValue(0);
  const bajando = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => {
    y.value = e.contentOffset.y;
    seguirBarra(e.contentOffset.y, previo, bajando);
  });
  return { y, onScroll };
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
  barra: {
    position: 'absolute', top: 0, left: 0, right: 0, height: ALTO_BARRA_COMPACTA,
    justifyContent: 'center', paddingHorizontal: MARGEN_PANTALLA,
    backgroundColor: paleta.goma, borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde,
  },
  tituloCompacto: { ...tipo.h2, color: paleta.magnesia },
});
