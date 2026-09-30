import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { paleta, familia, easing, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

type Nivel = 1 | 2 | 3;

const NIVELES: readonly Nivel[] = [1, 2, 3];
/** Cada nivel es una placa mas alta que la anterior (el mismo lenguaje que la escala de esfuerzo). */
const ALTO_PLACA: Record<Nivel, number> = { 1: 28, 2: 44, 3: 60 };
const RELLENO_MS = 220;
const CAMBIO_REDUCIDO_MS = 120;

/**
 * El nivel como tres placas de altura creciente, todas en `magnesia` (no en colores de veredicto): la elegida se
 * rellena desde abajo en 220 ms y las otras quedan en contorno, con «Nivel 1 / 2 / 3» debajo. Elegir da una haptica
 * de seleccion. Con movimiento reducido el relleno aparece con un fundido de 120 ms.
 */
export function SelectorNivel({ nivel, onCambio }: { nivel: Nivel; onCambio: (nivel: Nivel) => void }) {
  return (
    <View style={s.fila} accessibilityRole="radiogroup">
      {NIVELES.map(n => (
        <Placa
          key={n} nivel={n} activa={nivel === n}
          onPress={() => { if (n === nivel) return; haptico.seleccion(); onCambio(n); }}
        />
      ))}
    </View>
  );
}

function Placa({ nivel, activa, onPress }: { nivel: Nivel; activa: boolean; onPress: () => void }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(activa ? 1 : 0);

  useEffect(() => {
    t.value = withTiming(activa ? 1 : 0, { duration: reducido ? CAMBIO_REDUCIDO_MS : RELLENO_MS, easing: easing.salida });
  }, [activa, reducido]);

  const relleno = useAnimatedStyle(() => ({
    opacity: reducido ? t.value : 1,
    transform: [{ scaleY: reducido ? 1 : t.value }],
  }), [reducido, tick]);

  return (
    <Pressable
      onPress={onPress} style={s.columna}
      accessibilityRole="radio" accessibilityLabel={`Nivel ${nivel}`} accessibilityState={{ checked: activa }}
    >
      <View style={[s.placa, { height: ALTO_PLACA[nivel] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, s.relleno, relleno]} />
      </View>
      <Text style={[s.etiqueta, activa && s.etiquetaActiva]} maxFontSizeMultiplier={1.3}>Nivel {nivel}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-end' },
  columna: { flex: 1, alignItems: 'stretch', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 8, minHeight: 44 },
  placa: { borderRadius: 8, borderWidth: 1.5, borderColor: paleta.magnesia, overflow: 'hidden' },
  relleno: { backgroundColor: paleta.magnesia, transformOrigin: 'bottom' },
  etiqueta: { textAlign: 'center', fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  etiquetaActiva: { color: paleta.magnesia },
});
