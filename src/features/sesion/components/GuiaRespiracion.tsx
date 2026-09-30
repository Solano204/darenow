import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { paleta, familia } from '@/ui/theme';
import { useTick } from '@/ui/hooks/useTick';

/** «Inhala» y «Exhala» cruzandose al ritmo del anillo. Es solo visual: no cambia la duracion del descanso. */
export function GuiaRespiracion({ inhala, activo }: { inhala: boolean; activo: boolean }) {
  const t = useSharedValue(inhala ? 1 : 0);
  const tick = useTick();
  useEffect(() => { t.set(withTiming(inhala ? 1 : 0, { duration: 500 })); }, [inhala, t]);
  const uno = useAnimatedStyle(() => ({ opacity: activo ? t.value : 0 }), [activo, tick]);
  const otro = useAnimatedStyle(() => ({ opacity: activo ? 1 - t.value : 0 }), [activo, tick]);
  return (
    <View style={s.guia} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.Text style={[s.guiaTexto, uno]}>Inhala</Animated.Text>
      <Animated.Text style={[s.guiaTexto, s.guiaSuperpuesta, otro]}>Exhala</Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  guia: { height: 20, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  guiaTexto: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  guiaSuperpuesta: { position: 'absolute' },
});
