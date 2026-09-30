import React, { useState } from 'react';
import { useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, type SharedValue,
} from 'react-native-reanimated';
import { resorteMagnesia } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const DESPLAZAMIENTO_PX = 12;
const MARGEN_VISIBLE_PX = 80;

/**
 * Modulo bajo el pliegue que se revela una sola vez, cuando el scroll lo trae
 * a la vista: sube 12 px y aparece con `resorteMagnesia`. `children` recibe
 * `activo` para arrancar, en ese momento, las animaciones propias del modulo
 * (numeros que ruedan, barras que se llenan). Con movimiento reducido aparece
 * ya puesto y `activo` es verdadero desde el inicio. Debe ser hijo directo del
 * contenido del scroll.
 */
export function BloqueRevela({ y, estilo, sinMovimiento, fraccion, children }: {
  y: SharedValue<number>;
  estilo?: StyleProp<ViewStyle>;
  /** Solo avisa a `children` cuando entra en pantalla (`activo`): no sube ni se desvanece. */
  sinMovimiento?: boolean;
  /** Fraccion del bloque que debe estar en pantalla para activarlo (0.4 = el 40 %). Sin ella, cuando asoma 80 px. */
  fraccion?: number;
  children: (activo: boolean) => React.ReactNode;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { height: alturaVentana } = useWindowDimensions();
  const arriba = useSharedValue(Number.POSITIVE_INFINITY);
  const altoBloque = useSharedValue(0);
  const visto = useSharedValue(reducido || sinMovimiento ? 1 : 0);
  const [activo, setActivo] = useState(reducido);

  useAnimatedReaction(
    () => y.value + alturaVentana - (fraccion === undefined ? MARGEN_VISIBLE_PX : fraccion * altoBloque.value) > arriba.value,
    (dentro, previo) => {
      if (!dentro || previo) return;
      if (!sinMovimiento) visto.value = withSpring(1, resorteMagnesia);
      runOnJS(setActivo)(true);
    },
    [alturaVentana, fraccion],
  );

  const animado = useAnimatedStyle(() => ({
    opacity: Math.min(1, visto.value * 2),
    transform: [{ translateY: reducido ? 0 : (1 - visto.value) * DESPLAZAMIENTO_PX }],
  }), [reducido, tick]);

  return (
    <Animated.View style={[estilo, animado]} onLayout={e => { arriba.value = e.nativeEvent.layout.y; altoBloque.value = e.nativeEvent.layout.height; }}>
      {children(activo)}
    </Animated.View>
  );
}
