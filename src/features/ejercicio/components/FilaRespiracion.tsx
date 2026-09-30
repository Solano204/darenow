import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, interpolateColor, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { paleta, familia } from '@/ui/theme';
import { textoVisible } from '@/lib/presentacion';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const LADO_ANILLO = 44;
const CICLO_MS = 8000;
const ESCALA_MAX = 1.12;

/**
 * «Respiracion»: un anillo de 44 px que respira (1 a 1.12 en 4 s por fase, como el
 * descanso del reproductor) junto al texto de siempre. Si el texto habla de
 * inhalar y exhalar, el trazo alterna entre `magnesia` (inhala) y `magnesia3`
 * (exhala). Es decorativo: no cambia ningun dato. Con movimiento reducido queda quieto.
 */
export function FilaRespiracion({ texto }: { texto: string }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const ciclo = useSharedValue(0);
  const conFases = /inhal|exhal/i.test(texto);

  useEffect(() => {
    if (reducido) { cancelAnimation(ciclo); ciclo.set(0); return; }
    ciclo.set(withRepeat(withTiming(1, { duration: CICLO_MS, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(ciclo);
  }, [ciclo, reducido]);

  const anillo = useAnimatedStyle(() => {
    const r = ciclo.value;
    const tri = r < 0.5 ? r * 2 : 2 - r * 2;
    const suave = tri * tri * (3 - 2 * tri);
    return {
      transform: [{ scale: 1 + (ESCALA_MAX - 1) * suave }],
      borderColor: conFases ? interpolateColor(suave, [0, 1], [paleta.magnesia3, paleta.magnesia]) : paleta.magnesia2,
    };
  }, [conFases, tick]);

  return (
    <View style={s.fila} accessible accessibilityLabel={`Respiración. ${textoVisible(texto)}`}>
      <View style={s.zonaAnillo} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Animated.View style={[s.anillo, anillo]} />
      </View>
      <View style={s.textos} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={s.etiqueta}>Respiración</Text>
        <Text style={s.texto}>{textoVisible(texto)}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 24 },
  zonaAnillo: { width: LADO_ANILLO + 8, height: LADO_ANILLO + 8, alignItems: 'center', justifyContent: 'center' },
  anillo: { width: LADO_ANILLO, height: LADO_ANILLO, borderRadius: LADO_ANILLO / 2, borderWidth: 3 },
  textos: { flex: 1, gap: 2 },
  etiqueta: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  texto: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 24, color: paleta.magnesia },
});
