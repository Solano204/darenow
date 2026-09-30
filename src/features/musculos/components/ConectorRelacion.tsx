import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { paleta, easing } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const ANCHO_CONECTOR = 34;
export const ALTO_CONECTOR = 14;
const GROSOR = 2;
const RAYA = 5;
const HUECO = 3;
const DIBUJA_MS = 400;
/** El tope aparece cuando la primera ficha llega y «empuja» (el rebote de los antagonistas tarda esto en llegar). */
const ESPERA_TOPE_MS = 260;

/**
 * La linea que une la mini ficha del musculo actual con los que se relacionan con el. Los
 * sinergicos (tiran en la misma direccion) llevan una linea de 2 px `magnesia3` **continua**,
 * que se dibuja de izquierda a derecha; los antagonistas (dos fuerzas que se enfrentan), una
 * linea **discontinua con un pequeño tope** en medio. Decorativo: el lector de pantalla no lo oye.
 * Con movimiento reducido ya esta dibujado.
 */
export function ConectorRelacion({ tipo, activo }: { tipo: 'sinergico' | 'antagonista'; activo: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(reducido ? 1 : 0);

  useEffect(() => {
    if (reducido || !activo) return;
    t.value = withDelay(tipo === 'antagonista' ? ESPERA_TOPE_MS : 0, withTiming(1, { duration: DIBUJA_MS, easing: easing.salida }));
  }, [activo, reducido]);

  const dibuja = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0.001, t.value) }] }), [tick]);
  const aparece = useAnimatedStyle(() => ({ opacity: t.value }), [tick]);

  return (
    <View style={s.caja} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {tipo === 'sinergico' ? (
        <Animated.View style={[s.continua, dibuja]} />
      ) : (
        <Animated.View style={[s.discontinua, aparece]}>
          <View style={s.raya} /><View style={s.raya} />
          <View style={s.tope} />
          <View style={s.raya} /><View style={s.raya} />
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  caja: { width: ANCHO_CONECTOR, height: ALTO_CONECTOR, justifyContent: 'center' },
  continua: { width: ANCHO_CONECTOR, height: GROSOR, borderRadius: GROSOR / 2, backgroundColor: paleta.magnesia3, transformOrigin: 'left center' },
  discontinua: { flexDirection: 'row', alignItems: 'center', gap: HUECO },
  raya: { width: RAYA, height: GROSOR, borderRadius: GROSOR / 2, backgroundColor: paleta.magnesia3 },
  tope: { width: GROSOR, height: ALTO_CONECTOR, borderRadius: GROSOR / 2, backgroundColor: paleta.magnesia2 },
});
