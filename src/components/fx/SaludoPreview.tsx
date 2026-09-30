import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { paleta, tipo, familia } from '@/theme';
import { saludo } from '@/data/mensajes';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const ENTRADA_LETRA_MS = 120;
const PARPADEO_MS = 520;
const ESTILO_NOMBRE = { ...tipo.display, fontSize: 44, lineHeight: 46, color: paleta.magnesia };

/**
 * Vista previa del saludo tal como se vera en la app, mientras se escribe el
 * nombre. Solo es visual: usa el valor del campo, no guarda nada. Cada letra
 * nueva entra con un fundido y 6 px de desplazamiento; con el campo vacio
 * parpadea un guion bajo.
 */
export function SaludoPreview({ nombre }: { nombre: string }) {
  const base = useMemo(() => `${saludo()},`, []);
  const palabras = nombre.match(/\S+\s*/g) ?? [];
  let indice = 0;

  return (
    <View accessible accessibilityLabel={`Así te saludaremos: ${nombre.trim() === '' ? base : `${base} ${nombre.trim()}`}`}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={s.base}>{base}</Text>
        {nombre === '' ? (
          <Cursor />
        ) : (
          <View style={s.nombre}>
            {palabras.map((palabra, w) => (
              <View key={w} style={s.palabra}>
                {palabra.split('').map(c => <Letra key={indice} c={c} pos={indice++} />)}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function Letra({ c }: { c: string; pos: number }) {
  const reducido = useReducedMotion();
  const t = useSharedValue(reducido ? 1 : 0);

  useEffect(() => {
    if (reducido) return;
    t.value = withTiming(1, { duration: ENTRADA_LETRA_MS });
  }, []);

  const estilo = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: 6 * (1 - t.value) }],
  }));

  return <Animated.Text style={[ESTILO_NOMBRE, estilo]}>{c}</Animated.Text>;
}

function Cursor() {
  const reducido = useReducedMotion();
  const t = useSharedValue(1);

  useEffect(() => {
    if (reducido) return;
    t.value = withRepeat(withSequence(withTiming(0, { duration: PARPADEO_MS }), withTiming(1, { duration: PARPADEO_MS })), -1);
    return () => cancelAnimation(t);
  }, [reducido]);

  const estilo = useAnimatedStyle(() => ({ opacity: t.value }));
  return <Animated.Text style={[ESTILO_NOMBRE, estilo]}>_</Animated.Text>;
}

const s = StyleSheet.create({
  base: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 22, color: paleta.magnesia2 },
  nombre: { flexDirection: 'row', flexWrap: 'wrap' },
  palabra: { flexDirection: 'row' },
});
