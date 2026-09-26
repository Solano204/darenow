import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { paleta, resortePlaca, haptico, AREA_TACTIL_MIN } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

const ANCHO_PISTA = 44;
const ALTO_PISTA = 26;
const LADO_PERILLA = 20;
const MARGEN_PERILLA = 3;
const RECORRIDO = ANCHO_PISTA - LADO_PERILLA - 2 * MARGEN_PERILLA;
const CAMBIO_REDUCIDO_MS = 120;

/**
 * El dibujo del interruptor de DARENOW: pista de 44×26 (`gomaBorde`, azul de accion al activarse) y una perilla
 * `magnesia` que se desliza con `resortePlaca`. Con movimiento reducido cambia con un fundido de 120 ms. No es
 * tocable: quien lo usa (una fila, `InterruptorTiempo`) es el control.
 */
export function PistaSwitch({ activo }: { activo: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const pos = useSharedValue(activo ? 1 : 0);

  useEffect(() => {
    pos.value = reducido
      ? withTiming(activo ? 1 : 0, { duration: CAMBIO_REDUCIDO_MS })
      : withSpring(activo ? 1 : 0, resortePlaca);
  }, [activo, reducido]);

  const pista = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pos.value, [0, 1], [paleta.gomaBorde, paleta.placaAzul]),
  }), [tick]);
  const perilla = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value * RECORRIDO }] }), [tick]);

  return (
    <Animated.View style={[s.pista, pista]}>
      <Animated.View style={[s.perilla, perilla]} />
    </Animated.View>
  );
}

/** El interruptor suelto (sin fila alrededor): un area de toque de 44 con la pista, como un `Switch` del sistema. */
export function SwitchDarenow({ activo, onCambio, etiqueta, ayuda }: {
  activo: boolean;
  onCambio: (activo: boolean) => void;
  etiqueta: string;
  ayuda?: string;
}) {
  return (
    <Pressable
      onPress={() => { haptico.toque(); onCambio(!activo); }}
      accessibilityRole="switch" accessibilityLabel={etiqueta} accessibilityHint={ayuda}
      accessibilityState={{ checked: activo }} style={s.area}
    >
      <PistaSwitch activo={activo} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  area: { minHeight: AREA_TACTIL_MIN, minWidth: AREA_TACTIL_MIN, alignItems: 'center', justifyContent: 'center' },
  pista: { width: ANCHO_PISTA, height: ALTO_PISTA, borderRadius: ALTO_PISTA / 2, justifyContent: 'center' },
  perilla: {
    width: LADO_PERILLA, height: LADO_PERILLA, borderRadius: LADO_PERILLA / 2, marginLeft: MARGEN_PERILLA,
    backgroundColor: paleta.magnesia,
  },
});
