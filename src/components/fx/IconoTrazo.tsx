import React, { useEffect, useMemo } from 'react';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { cancelAnimation, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { paleta, easing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const LADO_ORIGINAL = 24;
const DURACION_MS = 300;
const GROSOR = 1.75;

export type NombreIcono = 'telefono' | 'lista' | 'exportar' | 'estrella';

/** Iconos de linea de 24x24. Se dibujan de trazo, asi pueden «escribirse» al entrar. */
const RUTAS: Record<NombreIcono, string> = {
  telefono: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M10.2 12.2V11a1.8 1.8 0 0 1 3.6 0v1.2 M9.7 12.2h4.6v3.6H9.7z',
  lista: 'M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01',
  exportar: 'M12 15V4 M8 8l4-4 4 4 M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3',
  estrella: 'M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85z',
};

/** Icono de linea que se dibuja en 300 ms. Con movimiento reducido aparece completo. */
export function IconoTrazo({ nombre, activo, animar = true, retraso = 0, tamano = 20, color = paleta.magnesia2 }: {
  nombre: NombreIcono;
  activo: boolean;
  animar?: boolean;
  retraso?: number;
  tamano?: number;
  color?: string;
}) {
  const reducido = useReducedMotion();
  const estatico = reducido || !animar;
  const path = useMemo(() => Skia.Path.MakeFromSVGString(RUTAS[nombre]), [nombre]);
  const fin = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { fin.value = 1; return; }
    if (!activo) { fin.value = 0; return; }
    fin.value = withDelay(retraso, withTiming(1, { duration: DURACION_MS, easing: easing.salida }));
    return () => cancelAnimation(fin);
  }, [estatico, activo]);

  if (path === null) return null;
  return (
    <Canvas style={{ width: tamano, height: tamano }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Group transform={[{ scale: tamano / LADO_ORIGINAL }]}>
        <Path
          path={path} style="stroke" strokeWidth={GROSOR} strokeCap="round" strokeJoin="round"
          color={color} start={0} end={fin}
        />
      </Group>
    </Canvas>
  );
}
