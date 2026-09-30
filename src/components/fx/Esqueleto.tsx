import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, tinte, radio, easing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';

const BARRIDO_MS = 1200;
const ANCHO_BANDA = 0.6;

/**
 * Hueco de carga: superficie `gomaAlta` con una banda de luz tenue que la
 * cruza. Con movimiento reducido es un bloque quieto. Sin medidas propias se
 * estira sobre su contenedor (`StyleSheet.absoluteFill`).
 */
export function Esqueleto({ ancho, alto, radioEsquina = radio.foto, estilo }: {
  ancho?: number | `${number}%`;
  alto?: number;
  radioEsquina?: number;
  estilo?: StyleProp<ViewStyle>;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [medida, setMedida] = useState(0);
  const t = useSharedValue(0);

  useEffect(() => {
    if (reducido || medida === 0) return;
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: BARRIDO_MS, easing: easing.salida }), -1, false);
    return () => cancelAnimation(t);
  }, [reducido, medida]);

  const banda = useAnimatedStyle(() => ({
    transform: [{ translateX: -medida * ANCHO_BANDA + t.value * medida * (1 + ANCHO_BANDA) }],
  }), [medida, tick]);

  const propio = ancho !== undefined || alto !== undefined;
  return (
    <View
      style={[s.base, propio ? { width: ancho, height: alto } : s.llena, { borderRadius: radioEsquina }, estilo]}
      onLayout={e => setMedida(e.nativeEvent.layout.width)}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    >
      {!reducido && medida > 0 && (
        <Animated.View style={[s.banda, { width: medida * ANCHO_BANDA }, banda]}>
          <LinearGradient
            colors={['transparent', tinte.neutra, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  base: { backgroundColor: paleta.gomaAlta, overflow: 'hidden' },
  llena: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  banda: { position: 'absolute', top: 0, bottom: 0, left: 0 },
});
