import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, PLACAS, resortePlaca, resorteTap, haptico } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const ANCHO = 128;
const ALTO = 36;
const ANCHO_PLACA = 6;
const HUECO = 2;
const HOMBRO = 36;
const ALTOS = [16, 22, 28, 34];
const DISTANCIA_ENTRADA = 44;
const CLANK_MS = 260;
const TEMBLOR_PX = 1;

const clank = () => haptico.placa();

const xIzquierda = (k: number) => HOMBRO - (k + 1) * (ANCHO_PLACA + HUECO);
const xDerecha = (k: number) => ANCHO - HOMBRO + k * (ANCHO_PLACA + HUECO) + HUECO;

/**
 * Barra olimpica miniatura. Cada paso carga una placa a cada lado, en el
 * orden real de peso (verde, amarilla, azul, roja) y cada vez mas alta.
 * `paso` es el indice, desde 0.
 */
export function BarraPlacas({ paso, total = PLACAS.length }: { paso: number; total?: number }) {
  const reducido = useReducedMotion();
  const temblor = useSharedValue(0);
  const previo = useRef(-1);

  useEffect(() => {
    const avanzo = paso > previo.current;
    previo.current = paso;
    if (reducido || !avanzo) return;
    temblor.value = withDelay(CLANK_MS, withSequence(
      withTiming(1, { duration: 40 }, fin => { if (fin) runOnJS(clank)(); }),
      withSpring(0, resorteTap),
    ));
  }, [paso, reducido]);

  const temblorVarilla = useAnimatedStyle(() => ({ transform: [{ translateY: temblor.value * TEMBLOR_PX }] }));
  const temblorHombroIzq = useAnimatedStyle(() => ({ transform: [{ translateY: temblor.value * TEMBLOR_PX }] }));
  const temblorHombroDer = useAnimatedStyle(() => ({ transform: [{ translateY: temblor.value * TEMBLOR_PX }] }));

  return (
    <View
      style={s.caja}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${paso + 1} de ${total}`}
      accessibilityValue={{ min: 1, max: total, now: paso + 1 }}
    >
      <View style={s.barra}>
        <Animated.View style={[s.varilla, temblorVarilla]} />
        <Animated.View style={[s.hombro, { left: HOMBRO - 3 }, temblorHombroIzq]} />
        <Animated.View style={[s.hombro, { left: ANCHO - HOMBRO }, temblorHombroDer]} />
        {PLACAS.map((c, k) => (
          <React.Fragment key={k}>
            <Placa lado="izq" k={k} color={c} presente={k <= paso} reducido={reducido} temblor={temblor} />
            <Placa lado="der" k={k} color={c} presente={k <= paso} reducido={reducido} temblor={temblor} />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

function Placa({ lado, k, color, presente, reducido, temblor }: {
  lado: 'izq' | 'der'; k: number; color: string; presente: boolean; reducido: boolean; temblor: SharedValue<number>;
}) {
  const t = useSharedValue(0);
  const sentido = lado === 'izq' ? -1 : 1;

  useEffect(() => {
    if (reducido) { t.value = presente ? 1 : 0; return; }
    const destino = presente ? 1 : 0;
    t.value = withSpring(destino, { ...resortePlaca, overshootClamping: true });
  }, [presente, reducido]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 4),
    transform: [{ translateX: (1 - t.value) * DISTANCIA_ENTRADA * sentido }, { translateY: temblor.value * TEMBLOR_PX }],
  }));

  const alto = ALTOS[Math.min(k, ALTOS.length - 1)];
  return (
    <Animated.View
      style={[
        s.placa,
        { backgroundColor: color, height: alto, top: (ALTO - alto) / 2, left: lado === 'izq' ? xIzquierda(k) : xDerecha(k) },
        estilo,
      ]}
    />
  );
}

const s = StyleSheet.create({
  caja: { width: ANCHO, height: ALTO },
  barra: { width: ANCHO, height: ALTO },
  varilla: {
    position: 'absolute', left: 0, right: 0, top: (ALTO - 4) / 2, height: 4,
    borderRadius: 2, backgroundColor: paleta.magnesia3,
  },
  hombro: {
    position: 'absolute', top: (ALTO - 12) / 2, width: 3, height: 12,
    borderRadius: 1, backgroundColor: paleta.magnesia3,
  },
  placa: { position: 'absolute', width: ANCHO_PLACA, borderRadius: 2 },
});
