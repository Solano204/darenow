import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { paleta, easing } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { PalomitaTrazo } from '@/ui/fx/PalomitaTrazo';

const LADO = 24;
const RADIO = 6;
const MARCAR_MS = 200;
const DESMARCAR_MS = 180;
const CAMBIO_REDUCIDO_MS = 120;

/** El avance 0..1 de una marca: sube en 200 ms al marcar y baja en 180 al desmarcar (fundido de 120 con movimiento reducido). */
export function useProgresoMarca(marcada: boolean): SharedValue<number> {
  const reducido = useReducedMotion();
  const t = useSharedValue(marcada ? 1 : 0);

  useEffect(() => {
    t.set(withTiming(marcada ? 1 : 0, {
      duration: reducido ? CAMBIO_REDUCIDO_MS : marcada ? MARCAR_MS : DESMARCAR_MS, easing: easing.salida,
    }));
  }, [marcada, reducido]);

  return t;
}

/**
 * La casilla cuadrada de 24 px (radio 6) de una lista de seleccion multiple: al marcarse se rellena de `color` y una
 * palomita `goma` se dibuja de trazo. `t` es el avance de `useProgresoMarca`; la fila lo comparte para animar lo suyo.
 * Es decorativa: la fila es la que anuncia el estado.
 */
export function CasillaMarca({ t, marcada, color, refCaja }: {
  t: SharedValue<number>;
  marcada: boolean;
  color: string;
  refCaja?: React.Ref<View>;
}) {
  const tick = useTick();
  const borde = useAnimatedStyle(() => ({
    borderColor: interpolateColor(t.value, [0, 1], [paleta.magnesia3, color]),
  }), [tick, color]);
  const relleno = useAnimatedStyle(() => ({ opacity: t.value }), [tick]);

  return (
    <View ref={refCaja} style={s.caja} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[s.borde, borde]} />
      <Animated.View style={[s.relleno, { backgroundColor: color }, relleno]} />
      <PalomitaTrazo visible={marcada} tamano={20} color={paleta.goma} />
    </View>
  );
}

const s = StyleSheet.create({
  caja: { width: LADO, height: LADO, alignItems: 'center', justifyContent: 'center' },
  borde: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1.5, borderRadius: RADIO },
  relleno: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: RADIO },
});
