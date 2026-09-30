import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLOR_TEXTO_FASE, familia, resortePlaca, type FaseVisual } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const ESCALA_INICIAL = 1.3;

/** La palabra de la fase («Trabaja»), en el color de su placa. Al cambiar de texto se estampa: entra de 1.3 a 1 con `resortePlaca`. */
export function PalabraFase({ texto, visual }: { texto: string; visual: FaseVisual }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(1);
  const previo = useRef(texto);

  useEffect(() => {
    if (previo.current === texto) return;
    previo.current = texto;
    if (reducido) return;
    t.set(0);
    t.set(withSpring(1, resortePlaca));
  }, [texto, reducido]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ scale: ESCALA_INICIAL - (ESCALA_INICIAL - 1) * t.value }],
  }), [tick]);

  return (
    <Animated.Text
      style={[s.texto, { color: COLOR_TEXTO_FASE[visual] }, estilo]}
      accessibilityRole="header" maxFontSizeMultiplier={1.2}
    >
      {texto}
    </Animated.Text>
  );
}

const s = StyleSheet.create({
  texto: { fontFamily: familia.negrita, fontSize: 18, lineHeight: 24, textAlign: 'center', letterSpacing: 0.4 },
});
