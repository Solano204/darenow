import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { paleta, tipo, familia, resortePlaca, haptico } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { Odometro } from './Odometro';

const ANCHO_PLACA = 6;
const ALTO_PLACA = 14;
const ALTO_ACTUAL = 18;
const SEPARACION = 4;
const ESCALA_NORMAL = ALTO_PLACA / ALTO_ACTUAL;
const HITOS = [5, 9];

type Estado = 0 | 1 | 2;

/**
 * Progreso del cuestionario: una placa delgada por paso, como discos cargados
 * en una barra. Pendiente: `gomaBorde`. Hecha: `magnesia2`. Actual: azul de
 * accion y 4 px mas alta. `total` es dinamico (algunos pasos se omiten segun
 * las respuestas). Haptica Medium solo en los hitos 5, 9 y el ultimo.
 */
export function BarraCarga13({ total, actual, compacta, ganadas, colorHecha = paleta.magnesia2, etiqueta }: {
  total: number;
  actual: number;
  /** Sin margen lateral ni contador: para ir dentro de una tarjeta que ya dice «Semana N de M». */
  compacta?: boolean;
  /**
   * La barra como cuenta (los logros ganados): las primeras `ganadas` placas van llenas, las demas vacias y
   * ninguna es «la actual». Sin contador. `actual` no se usa.
   */
  ganadas?: number;
  /** El color de una placa hecha (`magnesia2` por defecto; los logros ganados van en `magnesia`). */
  colorHecha?: string;
  /** Lo que oye el lector de pantalla si no es «Paso N de M». */
  etiqueta?: string;
}) {
  const previo = useRef(actual);
  const comoCuenta = ganadas !== undefined;

  useEffect(() => {
    if (!comoCuenta && actual > previo.current && (HITOS.includes(actual) || actual === total)) haptico.placa();
    previo.current = actual;
  }, [actual]);

  return (
    <View
      style={compacta || comoCuenta ? s.filaCompacta : s.fila}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta ?? `Paso ${actual} de ${total}`}
      accessibilityValue={comoCuenta ? { min: 0, max: total, now: ganadas } : { min: 1, max: total, now: actual }}
    >
      <View style={s.interior} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={s.placas}>
          {Array.from({ length: total }, (_, k) => (
            <Placa
              key={k} colorHecha={colorHecha}
              estado={(comoCuenta ? (k < ganadas ? 2 : 0) : k < actual - 1 ? 2 : k === actual - 1 ? 1 : 0) as Estado}
            />
          ))}
        </View>
        {!compacta && !comoCuenta && (
          <View style={s.contador}>
            <Odometro valor={actual} continuo estilo={s.numero} />
            <Text style={s.total}>/ {total}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function Placa({ estado, colorHecha }: { estado: Estado; colorHecha: string }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue<number>(estado);

  useEffect(() => {
    t.value = reducido ? withTiming(estado, { duration: 150 }) : withSpring(estado, { ...resortePlaca, overshootClamping: true });
  }, [estado, reducido]);

  const estilo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1, 2], [paleta.gomaBorde, paleta.placaAzul, colorHecha]),
    transform: [{ scaleY: interpolate(t.value, [0, 1, 2], [ESCALA_NORMAL, 1, ESCALA_NORMAL]) }],
  }), [tick, colorHecha]);

  return <Animated.View style={[s.placa, estilo]} />;
}

const s = StyleSheet.create({
  fila: { paddingHorizontal: 24, paddingTop: 8 },
  filaCompacta: { paddingTop: 0 },
  interior: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placas: { flexDirection: 'row', alignItems: 'center', gap: SEPARACION, height: ALTO_ACTUAL },
  placa: { width: ANCHO_PLACA, height: ALTO_ACTUAL, borderRadius: 2 },
  contador: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  numero: { ...tipo.numero, fontSize: 18, lineHeight: 22, color: paleta.magnesia },
  total: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto },
});
