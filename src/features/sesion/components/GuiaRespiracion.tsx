import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, familia } from '@/ui/theme';
import { useTick } from '@/ui/hooks/useTick';

/**
 * «Inhala» y «Exhala» cruzandose al ritmo del anillo. Es solo visual: no cambia la duracion del
 * descanso. Lee la respiracion (`respiro`, de 0 a 1 en 8 s) y cambia de palabra a la mitad: el
 * cambio solo re-renderiza esta guia, no el reproductor (H-24, R4).
 */
export function GuiaRespiracion({ respiro, activo }: { respiro: SharedValue<number>; activo: boolean }) {
  const [inhala, setInhala] = useState(true);
  useAnimatedReaction(() => respiro.value < 0.5, (v, previo) => {
    if (v !== previo) runOnJS(setInhala)(v);
  });
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
