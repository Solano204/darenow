import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation, interpolate, runOnJS, useAnimatedReaction, useAnimatedStyle, type SharedValue,
} from 'react-native-reanimated';
import { paleta, conAlfa, MARGEN_PANTALLA } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { indiceRegionActiva } from '../muscles/disposicionCatalogo';
import { ChipCategoria } from '../explore/ChipCategoria';

/** Alto de la fila de chips: el contenido de la pantalla deja este hueco bajo el titulo. */
export const ALTO_INDICE = 48;
const AIRE_BAJO_INDICE = 12;
const BLOQUEO_TRAS_TOQUE_MS = 800;
const RANGO_BORDE_PX = 8;
const ESPACIO_ENTRE_CHIPS = 8;

/**
 * El indice de secciones de Ajustes: una fila horizontal de chips (uno por seccion) debajo del titulo. Es solo de
 * navegacion: tocar uno lleva a esa seccion (con desplazamiento animado, sin animar con movimiento reducido) y no
 * cambia ningun ajuste. Al hacer scroll marca como activa la seccion que esta a la vista y, al llegar a la barra
 * superior, se queda pegada bajo ella con su fondo y su borde. `arriba` es donde empieza cada seccion dentro del
 * scroll (infinito si aun no se mide).
 */
export function IndiceSecciones({ nombres, arriba, y, scroll, altoBarra, relleno }: {
  nombres: readonly string[];
  arriba: readonly number[];
  y: SharedValue<number>;
  scroll: React.RefObject<Animated.ScrollView | null>;
  /** Donde termina la barra superior ya colapsada: ahi se pega. */
  altoBarra: number;
  /** Donde empieza el contenido (bajo el titulo grande): de ahi parte y sube con el scroll. */
  relleno: number;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [activo, setActivo] = useState(0);
  const tocado = useRef(false);
  const fila = useRef<ScrollView>(null);
  const xs = useRef<number[]>([]);
  const linea = altoBarra + ALTO_INDICE + AIRE_BAJO_INDICE;

  const alDesplazar = (indice: number) => { if (!tocado.current) setActivo(indice); };

  useAnimatedReaction(
    () => Math.max(0, indiceRegionActiva(arriba, y.value + linea + 1)),
    (actual, previo) => { if (actual !== previo) runOnJS(alDesplazar)(actual); },
    [arriba, linea],
  );

  useEffect(() => {
    fila.current?.scrollTo({ x: Math.max(0, (xs.current[activo] ?? 0) - MARGEN_PANTALLA), animated: !reducido });
  }, [activo]);

  const ir = (indice: number) => {
    tocado.current = true;
    setActivo(indice);
    const destino = arriba[indice];
    if (Number.isFinite(destino)) scroll.current?.scrollTo({ y: Math.max(0, destino - linea), animated: !reducido });
    setTimeout(() => { tocado.current = false; }, BLOQUEO_TRAS_TOQUE_MS);
  };

  const sube = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(altoBarra, relleno - y.value) }],
  }), [altoBarra, relleno, tick]);
  const pegado = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [relleno - altoBarra - RANGO_BORDE_PX, relleno - altoBarra], [0, 1], Extrapolation.CLAMP),
  }), [altoBarra, relleno, tick]);

  return (
    <Animated.View style={[s.raiz, sube]} pointerEvents="box-none">
      <Animated.View style={[s.fondo, pegado]} pointerEvents="none" />
      <ScrollView
        ref={fila} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.chips}
      >
        {nombres.map((nombre, i) => (
          <View key={nombre} onLayout={e => { xs.current[i] = e.nativeEvent.layout.x; }}>
            <ChipCategoria texto={nombre} activo={i === activo} onPress={() => ir(i)} />
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  raiz: { position: 'absolute', top: 0, left: 0, right: 0, height: ALTO_INDICE, zIndex: 5 },
  fondo: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: conAlfa(paleta.goma, 0.92),
    borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde,
  },
  chips: { paddingHorizontal: MARGEN_PANTALLA, gap: ESPACIO_ENTRE_CHIPS, alignItems: 'center' },
});
