import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, type DerivedValue,
} from 'react-native-reanimated';
import { paleta, resortePlaca, MARGEN_PANTALLA } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

export type EstadoPlaca = 'hecho' | 'omitido' | 'actual' | 'pendiente';

const ALTO_PLACA = 6;
const HUECO = 4;
const ASIENTO_ESCALA = 0.8;

/**
 * Una placa delgada por ejercicio. Las terminadas en `magnesia2`; la actual se
 * llena de izquierda a derecha, en tiempo real, con el color de la fase; las
 * pendientes en `gomaBorde`; una omitida queda en `gomaBorde` con una diagonal.
 * Al terminar un ejercicio su placa «se asienta» (un golpe de escala con
 * `resortePlaca`). `fraccion` es el avance del ejercicio actual (0 a 1).
 */
export function BarraProgresoSesion({ estados, fraccion, color }: {
  estados: EstadoPlaca[];
  fraccion: number;
  color: DerivedValue<string>;
}) {
  const actual = estados.findIndex(e => e === 'actual');
  return (
    <View
      style={s.fila} accessible accessibilityRole="progressbar"
      accessibilityLabel={`Ejercicio ${actual >= 0 ? actual + 1 : estados.length} de ${estados.length}`}
    >
      {estados.map((e, i) => <Placa key={i} estado={e} fraccion={fraccion} color={color} />)}
    </View>
  );
}

function Placa({ estado, fraccion, color }: { estado: EstadoPlaca; fraccion: number; color: DerivedValue<string> }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const lleno = useSharedValue(estado === 'hecho' ? 1 : 0);
  const asiento = useSharedValue(0);
  const previo = useRef(estado);
  const esActual = estado === 'actual';

  useEffect(() => {
    const objetivo = estado === 'hecho' ? 1 : esActual ? fraccion : 0;
    if (reducido) lleno.value = objetivo;
    else lleno.value = esActual ? withTiming(objetivo, { duration: 1000, easing: Easing.linear }) : withTiming(objetivo, { duration: 220 });
    if (previo.current === 'actual' && estado === 'hecho' && !reducido) {
      asiento.value = withSequence(withTiming(1, { duration: 60 }), withSpring(0, resortePlaca));
    }
    previo.current = estado;
  }, [estado, fraccion, reducido]);

  const caja = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + ASIENTO_ESCALA * asiento.value }] }), [tick]);
  const relleno = useAnimatedStyle(() => ({
    transform: [{ scaleX: lleno.value }],
    backgroundColor: esActual ? color.value : paleta.magnesia2,
  }), [esActual, tick]);

  return (
    <Animated.View style={[s.placa, caja]}>
      <Animated.View style={[s.relleno, relleno]} />
      {estado === 'omitido' && <View style={s.diagonal} />}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', gap: HUECO, paddingHorizontal: MARGEN_PANTALLA },
  placa: { flex: 1, height: ALTO_PLACA, borderRadius: ALTO_PLACA / 2, overflow: 'hidden', backgroundColor: paleta.gomaBorde },
  relleno: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transformOrigin: 'left' },
  diagonal: {
    position: 'absolute', left: '50%', top: -3, width: 1.5, height: 12,
    backgroundColor: paleta.magnesia3, transform: [{ rotate: '35deg' }],
  },
});
