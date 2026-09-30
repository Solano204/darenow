import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { paleta, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { colorDePlaca } from './BarraRutina';

const MAX_SEGMENTOS = 10;

const ANCHO_MINI = 96;
const ALTO_MINI = 20;
const ANCHO_PLACA = 4;
const SEPARACION_PLACA = 1;
const MAX_PLACAS_POR_MANGA = 8;
const DESPLAZAMIENTO_ENTRADA = 14;
const ESCALONADO_PLACA_MS = 40;
const ASENTAMIENTO_MS = 260;

/**
 * Miniatura de una rutina propia: un segmento por ejercicio (hasta 10), con
 * los colores de las placas en orden. Solo dice cuan larga es; el numero exacto
 * lo dice el texto de la tarjeta.
 */
export function BarraRutina({ pasos }: { pasos: number }) {
  const n = Math.max(1, Math.min(pasos, MAX_SEGMENTOS));
  return (
    <View style={s.fila} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={[s.segmento, { backgroundColor: colorDePlaca(i) }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flex: 1, flexDirection: 'row', gap: 2, maxWidth: 96 },
  segmento: { flex: 1, height: 4, borderRadius: 2 },
});

/**
 * Version compacta de 96x20: una barra con una placa por ejercicio en cada
 * manga (hasta 8), la mas alta pegada al centro, con los colores de siempre.
 * Con `animar` distinto de cero (un contador que sube cada vez que hay que
 * repetirlo) las placas entran una por una, 40 ms entre cada una (tras `retraso`), y
 * suena un solo golpe al final.
 */
export function MiniBarraRutina({ pasos, animar = 0, retraso = 0 }: { pasos: number; animar?: number; retraso?: number }) {
  const n = Math.max(1, Math.min(pasos, MAX_PLACAS_POR_MANGA));
  const reducido = useReducedMotion();

  useEffect(() => {
    if (!animar || reducido) return;
    const id = setTimeout(haptico.placa, retraso + (n - 1) * ESCALONADO_PLACA_MS + ASENTAMIENTO_MS);
    return () => clearTimeout(id);
  }, [animar, reducido, n, retraso]);

  const indices = Array.from({ length: n }, (_, i) => i);
  return (
    <View style={m.barra} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[...indices].reverse().map(i => <Placa key={`i${i}`} i={i} lado={-1} animar={animar} retraso={retraso} />)}
      <View style={m.eje} />
      {indices.map(i => <Placa key={`d${i}`} i={i} lado={1} animar={animar} retraso={retraso} />)}
    </View>
  );
}

function Placa({ i, lado, animar, retraso }: { i: number; lado: -1 | 1; animar: number; retraso: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(1);

  useEffect(() => {
    if (!animar || reducido) return;
    t.set(0);
    t.set(withDelay(retraso + i * ESCALONADO_PLACA_MS, withSpring(1, resortePlaca)));
    return () => cancelAnimation(t);
  }, [animar, reducido]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ translateX: lado * DESPLAZAMIENTO_ENTRADA * (1 - t.value) }],
  }), [tick]);

  return (
    <Animated.View style={[m.placa, { height: Math.max(8, ALTO_MINI - 2 * i), backgroundColor: colorDePlaca(i) }, estilo]} />
  );
}

const m = StyleSheet.create({
  barra: { width: ANCHO_MINI, height: ALTO_MINI, flexDirection: 'row', alignItems: 'center', gap: SEPARACION_PLACA },
  eje: { flex: 1, minWidth: 8, height: 2, borderRadius: 1, backgroundColor: paleta.magnesia3 },
  placa: { width: ANCHO_PLACA, borderRadius: 1.5 },
});
