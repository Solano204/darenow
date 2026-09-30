import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue,
  type DerivedValue,
} from 'react-native-reanimated';
import { MARGEN_PANTALLA } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';

/** Posicion de un elemento respecto al enfocado: 0 = enfocado, 1 = ya paso por la izquierda, -1 = el siguiente. */
export type Progreso = DerivedValue<number>;

const ESCALA_LEJOS = 0.92;
const OPACIDAD_LEJOS = 0.7;
const ESCALA_LEJOS_SUAVE = 0.96;
const OPACIDAD_LEJOS_SUAVE = 0.9;

/**
 * Carrusel con profundidad: el elemento enfocado esta a escala 1 y opacidad 1;
 * los vecinos se alejan hasta 0.92 y 0.7 (con `suave`, 0.96 y 0.9). `renderItem`
 * recibe el progreso de su elemento para mover su contenido a otra velocidad
 * (parallax interior, giro del atleta). Con movimiento reducido solo queda el
 * ajuste al deslizar. `pie` es un elemento final (por ejemplo «Ver todas»).
 */
export function CarruselProfundidad<T>({ data, keyExtractor, renderItem, ancho, alto, separacion = 16, suave, pie }: {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number, progreso: Progreso) => React.ReactElement;
  ancho: number;
  alto: number;
  separacion?: number;
  suave?: boolean;
  pie?: React.ReactElement | null;
}) {
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scrollX.value = e.contentOffset.x; });
  const paso = ancho + separacion;

  return (
    <Animated.FlatList
      data={data}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={paso}
      snapToAlignment="start"
      onScroll={onScroll}
      scrollEventThrottle={16}
      getItemLayout={(_, i) => ({ length: paso, offset: paso * i, index: i })}
      initialNumToRender={3}
      windowSize={5}
      style={{ height: alto }}
      contentContainerStyle={s.contenido}
      ListFooterComponent={pie ?? null}
      renderItem={({ item, index }) => (
        <Celda index={index} paso={paso} ancho={ancho} separacion={separacion} scrollX={scrollX} suave={!!suave}>
          {progreso => renderItem(item, index, progreso)}
        </Celda>
      )}
    />
  );
}

function Celda({ index, paso, ancho, separacion, scrollX, suave, children }: {
  index: number;
  paso: number;
  ancho: number;
  separacion: number;
  scrollX: { value: number };
  suave: boolean;
  children: (progreso: Progreso) => React.ReactElement;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const progreso = useDerivedValue(() => (scrollX.value - index * paso) / paso);
  const escalaLejos = suave ? ESCALA_LEJOS_SUAVE : ESCALA_LEJOS;
  const opacidadLejos = suave ? OPACIDAD_LEJOS_SUAVE : OPACIDAD_LEJOS;

  const estilo = useAnimatedStyle(() => {
    if (reducido) return {};
    const lejos = Math.abs(progreso.value);
    return {
      opacity: interpolate(lejos, [0, 1], [1, opacidadLejos], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(lejos, [0, 1], [1, escalaLejos], Extrapolation.CLAMP) }],
    };
  }, [reducido, escalaLejos, opacidadLejos, tick]);

  return (
    <Animated.View style={[{ width: ancho, marginRight: separacion }, estilo]}>
      {children(progreso)}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  contenido: { paddingHorizontal: MARGEN_PANTALLA, alignItems: 'flex-start' },
});
