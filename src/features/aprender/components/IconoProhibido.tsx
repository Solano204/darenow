import React, { useEffect, useMemo } from 'react';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { cancelAnimation, useDerivedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { paleta, easing } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const LADO_ORIGINAL = 24;
const CIRCULO = 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18';
const DIAGONAL = 'M5.64 5.64L18.36 18.36';
const TRAZO_MS = 200;
const GROSOR = 2;

/**
 * El icono «prohibido» (circulo con una diagonal) que se dibuja de trazo: primero el circulo
 * y despues la diagonal que lo cruza, 200 ms cada uno, cuando `activo` pasa a verdadero (con
 * `retraso` de espera). Sin haptica. Con movimiento reducido aparece ya dibujado.
 */
export function IconoProhibido({ activo, retraso = 0, tamano = 18, color = paleta.magnesia2 }: {
  activo: boolean;
  retraso?: number;
  tamano?: number;
  color?: string;
}) {
  const reducido = useReducedMotion();
  const circulo = useSharedValue(reducido ? 1 : 0);
  const diagonal = useSharedValue(reducido ? 1 : 0);
  const rutas = useMemo(() => ({ circulo: Skia.Path.MakeFromSVGString(CIRCULO), diagonal: Skia.Path.MakeFromSVGString(DIAGONAL) }), []);
  // Un trazo de largo cero con la punta redonda deja un punto: no se pinta hasta que empieza.
  const opacidadCirculo = useDerivedValue(() => (circulo.value > 0 ? 1 : 0));
  const opacidadDiagonal = useDerivedValue(() => (diagonal.value > 0 ? 1 : 0));

  useEffect(() => {
    if (reducido) { circulo.value = 1; diagonal.value = 1; return; }
    if (!activo) { circulo.value = 0; diagonal.value = 0; return; }
    circulo.value = withDelay(retraso, withTiming(1, { duration: TRAZO_MS, easing: easing.salida }));
    diagonal.value = withDelay(retraso + TRAZO_MS, withTiming(1, { duration: TRAZO_MS, easing: easing.salida }));
    return () => { cancelAnimation(circulo); cancelAnimation(diagonal); };
  }, [activo, reducido, retraso]);

  if (rutas.circulo === null || rutas.diagonal === null) return null;
  return (
    <Canvas style={{ width: tamano, height: tamano }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Group transform={[{ scale: tamano / LADO_ORIGINAL }]}>
        <Path
          path={rutas.circulo} style="stroke" strokeWidth={GROSOR} strokeCap="round" color={color}
          start={0} end={circulo} opacity={opacidadCirculo}
        />
        <Path
          path={rutas.diagonal} style="stroke" strokeWidth={GROSOR} strokeCap="round" color={color}
          start={0} end={diagonal} opacity={opacidadDiagonal}
        />
      </Group>
    </Canvas>
  );
}
