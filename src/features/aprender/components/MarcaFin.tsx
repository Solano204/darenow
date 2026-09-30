import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { Huella } from '@/ui/fx/Huella';

const LADO = 28;
const ESCALA_INICIAL = 1.3;
const IMPACTO_MS = 120;

/**
 * La marca de fin de un articulo: una huella de palma de magnesia de 28 px, centrada, que se
 * estampa (escala 1.3 a 1, de transparente a visible) la primera vez que entra en pantalla
 * (`activo`) con un toque suave. Es solo decorativa: no marca nada como leido ni guarda estado.
 * Con movimiento reducido aparece puesta y sin toque.
 */
export function MarcaFin({ activo }: { activo: boolean }) {
  const reducido = useReducedMotion();
  const t = useSharedValue(reducido ? 1 : 0);

  useEffect(() => {
    if (reducido) { t.set(1); return; }
    if (!activo) { t.set(0); return; }
    t.set(withSpring(1, resortePlaca));
    const golpe = setTimeout(haptico.toque, IMPACTO_MS);
    return () => { clearTimeout(golpe); cancelAnimation(t); };
  }, [reducido, activo, t]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ scale: ESCALA_INICIAL - (ESCALA_INICIAL - 1) * t.value }],
  }));

  return (
    <View style={s.caja} pointerEvents="none">
      <Animated.View style={estilo}><Huella lado={LADO} /></Animated.View>
    </View>
  );
}

const s = StyleSheet.create({ caja: { alignItems: 'center', paddingVertical: 8 } });
