import React, { useEffect, useMemo, useState } from 'react';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { paleta, easing } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const LADO_ORIGINAL = 24;
const RUTA = 'M6 12.5l4 4 8-8.5';
const DIBUJAR_MS = 220;
const BORRAR_MS = 200;
const GROSOR = 2.4;

/** Palomita que se dibuja de trazo (220 ms) al marcarse y se borra al desmarcarse. Con movimiento reducido aparece completa. */
export function PalomitaTrazo({ visible, tamano = 24, color = paleta.blanco }: {
  visible: boolean;
  tamano?: number;
  color?: string;
}) {
  const reducido = useReducedMotion();
  const [montada, setMontada] = useState(visible);
  const fin = useSharedValue(visible ? 1 : 0);
  const path = useMemo(() => Skia.Path.MakeFromSVGString(RUTA), []);

  useEffect(() => {
    if (visible) {
      setMontada(true);
      fin.value = reducido ? 1 : withTiming(1, { duration: DIBUJAR_MS, easing: easing.salida });
      return;
    }
    if (reducido) { fin.value = 0; setMontada(false); return; }
    fin.value = withTiming(0, { duration: BORRAR_MS }, terminado => {
      if (terminado) runOnJS(setMontada)(false);
    });
  }, [visible, reducido]);

  if (!montada || path === null) return null;
  return (
    <Canvas style={{ width: tamano, height: tamano }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Group transform={[{ scale: tamano / LADO_ORIGINAL }]}>
        <Path
          path={path} style="stroke" strokeWidth={GROSOR} strokeCap="round" strokeJoin="round"
          color={color} start={0} end={fin}
        />
      </Group>
    </Canvas>
  );
}
