import React, { useEffect, useEffectEvent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { paleta, familia, easing } from '@/ui/theme';
import type { Evidencia } from '@/data/catalog';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { acumuladosPrevios } from '@/lib/acumulados';

export const COLOR_VEREDICTO: Record<Evidencia, string> = {
  ok: paleta.placaVerde,
  parcial: paleta.placaAmarilla,
  mito: paleta.placaRoja,
  cuidado: paleta.magnesia2,
};

/** Orden en que se llena el medidor y en que se cuentan. */
export const ORDEN_VEREDICTOS: Evidencia[] = ['ok', 'parcial', 'mito', 'cuidado'];
const DURACION_TOTAL_MS = 600;
const ALTO = 10;

const NOMBRES: Record<Evidencia, [singular: string, plural: string]> = {
  ok: ['comprobado', 'comprobados'],
  parcial: ['parcial', 'parciales'],
  mito: ['mito', 'mitos'],
  cuidado: ['cuidado', 'cuidados'],
};

export type Conteos = Record<Evidencia, number>;

/** Cuantas afirmaciones hay de cada veredicto. */
export function contarVeredictos(mapa: Record<string, Evidencia>): Conteos {
  const c: Conteos = { ok: 0, parcial: 0, mito: 0, cuidado: 0 };
  for (const v of Object.values(mapa)) c[v] += 1;
  return c;
}

/** El veredicto que mas se repite; en un empate gana el mas serio (mito, parcial, comprobado). */
export function veredictoDominante(c: Conteos): Evidencia {
  return [...ORDEN_VEREDICTOS].reverse().reduce((mejor, v) => (c[v] > c[mejor] ? v : mejor), 'ok' as Evidencia);
}

/** «3 comprobados, 1 parcial»: solo los conteos que existen, sin inventar una calificacion. */
export function resumenDeConteos(c: Conteos): string {
  return ORDEN_VEREDICTOS
    .filter(v => c[v] > 0)
    .map(v => `${c[v]} ${NOMBRES[v][c[v] === 1 ? 0 : 1]}`)
    .join(', ');
}

/**
 * Barra de 10 px dividida en segmentos proporcionales al numero de afirmaciones
 * de cada veredicto. Al activarse se llena de izquierda a derecha, segmento por
 * segmento (600 ms en total); con movimiento reducido aparece llena.
 */
export function MedidorEvidencia({ conteos, activo }: { conteos: Conteos; activo: boolean }) {
  const total = ORDEN_VEREDICTOS.reduce((n, v) => n + conteos[v], 0);
  const presentes = ORDEN_VEREDICTOS.filter(v => conteos[v] > 0);
  const previos = acumuladosPrevios(presentes.map(v => conteos[v]));
  const segmentos = presentes.map((v, i) => {
    const inicio = (previos[i] / total) * DURACION_TOTAL_MS;
    return { v, n: conteos[v], inicio, duracion: (conteos[v] / total) * DURACION_TOTAL_MS };
  });

  return (
    <View accessible accessibilityLabel={`Evidencia: ${resumenDeConteos(conteos)}`}>
      <View style={s.barra} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {segmentos.map(g => <Segmento key={g.v} g={g} activo={activo} />)}
      </View>
      <Text style={s.resumen} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {resumenDeConteos(conteos)}
      </Text>
    </View>
  );
}

function Segmento({ g, activo }: { g: { v: Evidencia; n: number; inicio: number; duracion: number }; activo: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(reducido ? 1 : 0);

  const alCambiarActivo = useEffectEvent(() => {
    if (reducido) { t.set(1); return; }
    if (!activo) return;
    t.set(withDelay(g.inicio, withTiming(1, { duration: g.duracion, easing: easing.salida })));
    return () => cancelAnimation(t);
  });
  useEffect(() => alCambiarActivo(), [activo, reducido]);

  const relleno = useAnimatedStyle(() => ({ transform: [{ scaleX: t.value }] }), [tick]);
  return (
    <View style={[s.segmento, { flex: g.n }]}>
      <Animated.View style={[s.relleno, { backgroundColor: COLOR_VEREDICTO[g.v] }, relleno]} />
    </View>
  );
}

const s = StyleSheet.create({
  barra: { flexDirection: 'row', gap: 2, height: ALTO, borderRadius: ALTO / 2, overflow: 'hidden' },
  segmento: { height: ALTO, backgroundColor: paleta.gomaBorde, overflow: 'hidden' },
  relleno: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transformOrigin: 'left' },
  resumen: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2, marginTop: 8 },
});
