import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue,
  type DerivedValue,
} from 'react-native-reanimated';
import { MARGEN_PANTALLA } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

/** Posicion de un elemento respecto al enfocado: 0 = enfocado, 1 = ya paso por la izquierda, -1 = el siguiente. */
export type Progreso = DerivedValue<number>;

const ESCALA_LEJOS = 0.92;
const OPACIDAD_LEJOS = 0.6;
const GIRO_LEJOS_GRADOS = 3;

/**
 * Carrusel con profundidad: el elemento enfocado esta a escala 1 y opacidad
 * 1; los vecinos se alejan hasta 0.92 y 0.6 y se inclinan 3 grados hacia
 * fuera. `renderItem` recibe el progreso de su elemento para mover su contenido
 * a otra velocidad (parallax interior). Con `apilado` los elementos se solapan
 * como una pila de placas, el primero encima. Con movimiento reducido solo
 * queda el ajuste al deslizar.
 */
export function CarruselProfundidad<T>({ data, keyExtractor, renderItem, ancho, alto, separacion = 12, apilado }: {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number, progreso: Progreso) => React.ReactElement;
  ancho: number;
  alto: number;
  /** Negativa para solapar (pila). */
  separacion?: number;
  apilado?: boolean;
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
      renderItem={({ item, index }) => (
        <Celda
          index={index} paso={paso} ancho={ancho} separacion={separacion}
          scrollX={scrollX} capa={apilado ? data.length - index : undefined}
        >
          {progreso => renderItem(item, index, progreso)}
        </Celda>
      )}
    />
  );
}

function Celda({ index, paso, ancho, separacion, scrollX, capa, children }: {
  index: number;
  paso: number;
  ancho: number;
  separacion: number;
  scrollX: { value: number };
  capa?: number;
  children: (progreso: Progreso) => React.ReactElement;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const progreso = useDerivedValue(() => (scrollX.value - index * paso) / paso);

  const estilo = useAnimatedStyle(() => {
    if (reducido) return {};
    const d = progreso.value;
    const lejos = Math.abs(d);
    return {
      opacity: interpolate(lejos, [0, 1], [1, OPACIDAD_LEJOS], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(lejos, [0, 1], [1, ESCALA_LEJOS], Extrapolation.CLAMP) },
        { rotate: `${interpolate(d, [-1, 0, 1], [GIRO_LEJOS_GRADOS, 0, -GIRO_LEJOS_GRADOS], Extrapolation.CLAMP)}deg` },
      ],
    };
  }, [reducido, tick]);

  return (
    <Animated.View style={[{ width: ancho, marginRight: separacion, zIndex: capa }, estilo]}>
      {children(progreso)}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  contenido: { paddingHorizontal: MARGEN_PANTALLA, alignItems: 'flex-start' },
});
