import React, { useEffect } from 'react';
import { View, Text, type StyleProp, type TextStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const INTERVALO_MS = 220;
const IMPACTO_MS = 130;
const ESCALA_INICIAL = 1.35;
const ROTACION_INICIAL = -2;

/**
 * Cada linea se estampa como una placa que cae: entra grande, gira dos
 * grados y asienta con `resortePlaca`, con un golpe Rigid al impactar. Con
 * `animar=false` (movimiento reducido o paso ya visto) aparece estatico.
 */
export function TituloEstampado({ lineas, estilo, activo, animar = true, retraso = 0 }: {
  lineas: string[];
  estilo: StyleProp<TextStyle>;
  activo: boolean;
  animar?: boolean;
  retraso?: number;
}) {
  const reducido = useReducedMotion();
  const estatico = reducido || !animar;

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={lineas.join(' ')}>
      {lineas.map((linea, k) => (
        <Golpe
          key={linea} texto={linea} estilo={estilo}
          activo={activo} estatico={estatico}
          espera={retraso + k * INTERVALO_MS}
        />
      ))}
    </View>
  );
}

function Golpe({ texto, estilo, activo, estatico, espera }: {
  texto: string; estilo: StyleProp<TextStyle>; activo: boolean; estatico: boolean; espera: number;
}) {
  const t = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { t.value = 1; return; }
    if (!activo) { t.value = 0; return; }
    t.value = withDelay(espera, withSpring(1, resortePlaca));
    const golpe = setTimeout(haptico.sello, espera + IMPACTO_MS);
    return () => { clearTimeout(golpe); cancelAnimation(t); };
  }, [estatico, activo]);

  const animado = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 2),
    transform: [
      { scale: ESCALA_INICIAL - (ESCALA_INICIAL - 1) * t.value },
      { rotate: `${ROTACION_INICIAL * (1 - t.value)}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ alignSelf: 'flex-start' }, animado]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Text style={estilo}>{texto}</Text>
    </Animated.View>
  );
}
