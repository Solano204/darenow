import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { polvo } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';

const JALON_COMPLETO_PX = 80;

/**
 * Indicador de «arrastrar para actualizar»: una nube pequena de magnesia que
 * crece segun lo que se jala. Solo se ve donde el scroll admite desplazamiento
 * negativo (iOS); en Android el `RefreshControl` nativo hace su parte. Al soltar,
 * la nube «explota» con el motor de magnesia (`mini`), que dispara `Hoy`.
 */
export function NubeRefresco({ y, arriba }: { y: SharedValue<number>; arriba: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();

  const estilo = useAnimatedStyle(() => {
    const jalon = interpolate(-y.value, [0, JALON_COMPLETO_PX], [0, 1], Extrapolation.CLAMP);
    return { opacity: reducido ? 0 : jalon, transform: [{ scale: 0.4 + 0.9 * jalon }] };
  }, [reducido, tick]);

  return (
    <View style={[s.caja, { top: arriba }]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[s.nube, estilo]}>
        <View style={[s.bola, s.izquierda]} />
        <View style={[s.bola, s.centro]} />
        <View style={[s.bola, s.derecha]} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  nube: { width: 64, height: 36 },
  bola: { position: 'absolute', backgroundColor: polvo.velo },
  izquierda: { left: 2, top: 12, width: 24, height: 24, borderRadius: 12 },
  centro: { left: 16, top: 0, width: 32, height: 32, borderRadius: 16 },
  derecha: { left: 38, top: 12, width: 24, height: 24, borderRadius: 12 },
});
