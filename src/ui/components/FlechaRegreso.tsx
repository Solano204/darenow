import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { Canvas, Group, Path, Skia, vec } from '@shopify/react-native-skia';
import { paleta } from '@/ui/theme';
import { useTick } from '@/ui/hooks/useTick';
import { RIEL_X, GROSOR } from './rielGeometria';

/** La flecha de regreso se dibuja en un lienzo de 40 con su trazo desplazado (8, 6) para que al girar no se recorte. */
const LIENZO_FLECHA = 40;
const DESPL_FLECHA = { x: 8, y: 6 };
const INICIO_FLECHA = { x: 6, y: 4 };
const CENTRO_GIRO = vec(21.5, 19);
/** Baja de la raiz del riel, sale a la derecha y sube con la punta hacia arriba: «esto se repite». */
const RUTA_FLECHA = 'M6 4 L6 10 C6 26 18 26 18 14 M14.5 17.5 L18 14 L21.5 17.5';

/** La flecha curva que cierra el tramo repetido. Da una vuelta completa al llenarse el riel hasta ella. */
export function FlechaRegreso({ filasFin, lleno, giro }: {
  filasFin: SharedValue<number>;
  lleno: SharedValue<number>;
  giro: SharedValue<number>;
}) {
  const tick = useTick();
  const ruta = useMemo(() => Skia.Path.MakeFromSVGString(RUTA_FLECHA), []);
  const posicion = useAnimatedStyle(() => ({ top: filasFin.value - (INICIO_FLECHA.y + DESPL_FLECHA.y) }), [tick]);
  const desplazar = useDerivedValue(() => [{ translateX: DESPL_FLECHA.x }, { translateY: DESPL_FLECHA.y }]);
  const girar = useDerivedValue(() => [{ rotate: giro.value * 2 * Math.PI }]);
  if (!ruta) return null;

  return (
    <Animated.View
      style={[s.flecha, posicion]} pointerEvents="none"
      importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
    >
      <Canvas style={{ width: LIENZO_FLECHA, height: LIENZO_FLECHA }}>
        <Group transform={girar} origin={CENTRO_GIRO}>
          <Group transform={desplazar}>
            <Path path={ruta} style="stroke" strokeWidth={GROSOR} strokeCap="round" strokeJoin="round" color={paleta.gomaBorde} />
            <Path
              path={ruta} style="stroke" strokeWidth={GROSOR} strokeCap="round" strokeJoin="round" color={paleta.magnesia2}
              opacity={lleno}
            />
          </Group>
        </Group>
      </Canvas>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  flecha: { position: 'absolute', left: RIEL_X - (INICIO_FLECHA.x + DESPL_FLECHA.x), width: LIENZO_FLECHA, height: LIENZO_FLECHA },
});
