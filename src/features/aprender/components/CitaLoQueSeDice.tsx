import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, familia, resortePlaca } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const ESCALA_INICIAL = 0.8;

/**
 * «Lo que se dice» de un mito, como una cita: la etiqueta en tipo oracion (Figtree 600 de 14) y, sin
 * tarjeta, la frase en Figtree 500 de 20/28 `magnesia2` con unas comillas tipograficas de 48 px en
 * `gomaBorde` a la izquierda. Las comillas aparecen (escala 0.8 a 1) cuando `activo` pasa a
 * verdadero; con movimiento reducido ya estan puestas. Es el mismo texto de siempre.
 */
export function CitaLoQueSeDice({ texto, activo }: { texto: string; activo: boolean }) {
  const reducido = useReducedMotion();
  const t = useSharedValue(reducido ? 1 : 0);

  useEffect(() => {
    if (reducido) { t.set(1); return; }
    if (!activo) { t.set(0); return; }
    t.set(withSpring(1, resortePlaca));
    return () => cancelAnimation(t);
  }, [reducido, activo, t]);

  const comillas = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ scale: ESCALA_INICIAL + (1 - ESCALA_INICIAL) * t.value }],
  }));

  return (
    <View accessible accessibilityLabel={`Lo que se dice: ${texto}`}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={s.etiqueta} maxFontSizeMultiplier={1.3}>Lo que se dice</Text>
        <View style={s.fila}>
          <Animated.Text style={[s.comillas, comillas]}>{'“'}</Animated.Text>
          <Text style={s.cita} maxFontSizeMultiplier={1.3}>{texto}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  etiqueta: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto },
  fila: { flexDirection: 'row', gap: 8, marginTop: 8 },
  comillas: { width: 36, fontFamily: familia.negrita, fontSize: 48, lineHeight: 56, color: paleta.gomaBorde, transformOrigin: 'left center' },
  cita: { flex: 1, fontFamily: familia.medio, fontSize: 20, lineHeight: 28, color: paleta.magnesia2, paddingTop: 6 },
});
