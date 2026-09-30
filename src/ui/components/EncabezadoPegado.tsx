import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { paleta, conAlfa, MARGEN_PANTALLA } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { indiceRegionActiva } from './disposicionCatalogo';
import { RANGO_SCROLL, RECORRIDO_PX } from './EncabezadoExplorar';

/** El aire que la lista deja entre la cabecera fija y su primera fila (el relleno de la pantalla menos el alto de la cabecera). */
const AIRE_BAJO_CABECERA = 16;

/**
 * La copia de un encabezado de grupo (una region de musculos, una letra del glosario) que queda
 * pegada bajo la cabecera fija mientras su grupo esta en pantalla. `arriba` es la posicion de
 * cada fila de la lista, o infinito si no es un encabezado; `contenido` dibuja el encabezado de
 * la fila activa (o nada). Aparece cuando el encabezado de la lista llega a la cabecera y cambia
 * al pasar al grupo siguiente. Sube con la cabecera cuando esta se encoge, con el mismo scroll.
 */
export function EncabezadoPegado({ arriba, scrollY, top, contenido, rango = RANGO_SCROLL, recorrido = RECORRIDO_PX }: {
  arriba: readonly number[];
  scrollY: SharedValue<number>;
  /** Donde termina la cabecera fija: ahi se pega el encabezado. */
  top: number;
  contenido: (fila: number) => React.ReactNode;
  /** Scroll en que termina de colapsar la cabecera y cuanto sube (los de Explorar por defecto; las pantallas con `HeaderColapsable` traen otros). */
  rango?: number;
  recorrido?: number;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [indice, setIndice] = useState(-1);
  const posiciones = useMemo(() => [...arriba], [arriba]);

  useAnimatedReaction(
    () => indiceRegionActiva(posiciones, scrollY.value - AIRE_BAJO_CABECERA),
    (actual, previo) => { if (actual !== previo) runOnJS(setIndice)(actual); },
    [posiciones],
  );

  const sube = useAnimatedStyle(() => {
    const avance = reducido ? (scrollY.value > rango ? 1 : 0) : Math.min(1, Math.max(0, scrollY.value / rango));
    return { transform: [{ translateY: -recorrido * avance }] };
  }, [reducido, tick, rango, recorrido]);

  const dentro = indice >= 0 ? contenido(indice) : null;
  if (!dentro) return null;
  return (
    <Animated.View style={[s.pegado, { top }, sube]} pointerEvents="none">
      {dentro}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  pegado: {
    position: 'absolute', left: 0, right: 0, zIndex: 5, paddingHorizontal: MARGEN_PANTALLA, paddingBottom: 4,
    backgroundColor: conAlfa(paleta.goma, 0.92), borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde,
  },
});
