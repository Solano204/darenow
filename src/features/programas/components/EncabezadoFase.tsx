import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, familia, resortePlaca } from '@/ui/theme';
import { nombreVisible } from '@/data/nombresVisibles';
import { palabrasDeRango } from '@/features/programas/utils/minutosPorSemana';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const ESCALA_SELLO = 1.3;

/**
 * Encabezado de una fase: «Semanas» en Figtree 14 y los numeros en Big Shoulders 800 de 24
 * («1–2», con guion corto; «Semana 7» si es una sola), y a la derecha el nombre de la fase como
 * etiqueta protagonista (Big Shoulders 700 de 16 en una pastilla `gomaAlta`). Al entrar la
 * fase en pantalla por primera vez (`visto`) la etiqueta se estampa: baja de 1.3 a 1 con
 * `resortePlaca`, sin golpe. Con movimiento reducido no se mueve.
 */
export function EncabezadoFase({ desde, hasta, foco, visto }: {
  desde: number;
  hasta: number;
  foco: string;
  visto: boolean;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const sello = useSharedValue(reducido ? 1 : 0);
  const nombre = nombreVisible(foco);
  const varias = hasta > desde;
  const lector = palabrasDeRango(desde, hasta);

  useEffect(() => {
    if (reducido || !visto) return;
    sello.set(withSpring(1, resortePlaca));
  }, [visto, reducido]);

  const etiqueta = useAnimatedStyle(() => ({
    opacity: Math.min(1, sello.value * 3),
    transform: [{ scale: ESCALA_SELLO - (ESCALA_SELLO - 1) * sello.value }],
  }), [tick]);

  return (
    <View
      style={s.fila} accessible accessibilityRole="header"
      accessibilityLabel={`${lector[0].toUpperCase()}${lector.slice(1)}, ${nombre}`}
    >
      <Text style={s.rango} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={s.semanas}>{varias ? 'Semanas' : 'Semana'} </Text>
        <Text style={s.numeros}>{varias ? `${desde}–${hasta}` : desde}</Text>
      </Text>
      <Animated.View style={[s.etiqueta, etiqueta]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={s.foco} numberOfLines={1}>{nombre}</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rango: { lineHeight: 28 },
  semanas: { fontFamily: familia.medio, fontSize: 14, lineHeight: 28, color: paleta.magnesia2 },
  numeros: { fontFamily: familia.display, fontSize: 24, lineHeight: 28, color: paleta.magnesia },
  etiqueta: {
    flexShrink: 1, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1,
    borderColor: paleta.gomaBorde, backgroundColor: paleta.gomaAlta,
  },
  foco: { fontFamily: familia.titulo, fontSize: 16, lineHeight: 20, color: paleta.magnesia },
});
