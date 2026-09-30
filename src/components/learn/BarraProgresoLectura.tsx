import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { paleta } from '@/ui/theme';

const GROSOR = 2;

/**
 * La linea de progreso de lectura, pegada al borde inferior de la barra superior (que la muestra
 * al colapsar el hero). Se llena de `magnesia` de izquierda a derecha con el scroll por el cuerpo:
 * 0 cuando el inicio del cuerpo toca la barra y 1 cuando su final llega al pie de la pantalla, o
 * cuando el scroll ya no da mas (un cuerpo corto no se queda a medias). Se calcula en el hilo de
 * UI, sin suavizado: es informacion, tambien con movimiento reducido.
 */
export function BarraProgresoLectura({ y, inicio, alto, contenido, barraAlto }: {
  y: SharedValue<number>;
  /** Donde empieza el cuerpo en el contenido del scroll, y cuanto mide. */
  inicio: SharedValue<number>;
  alto: SharedValue<number>;
  /** Cuanto mide todo el contenido del scroll. */
  contenido: SharedValue<number>;
  /** Alto de la barra superior con el inset: el cuerpo empieza a contar cuando su borde llega ahi. */
  barraAlto: number;
}) {
  const { height: ventana } = useWindowDimensions();
  const estilo = useAnimatedStyle(() => {
    const desde = inicio.value - barraAlto;
    const hasta = Math.max(desde + 1, Math.min(inicio.value + alto.value - ventana, contenido.value - ventana));
    const p = Math.min(1, Math.max(0, (y.value - desde) / (hasta - desde)));
    return { transform: [{ scaleX: p }] };
  }, [barraAlto, ventana]);

  return <Animated.View style={[s.linea, estilo]} pointerEvents="none" />;
}

const s = StyleSheet.create({
  linea: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: GROSOR, backgroundColor: paleta.magnesia, transformOrigin: 'left',
  },
});
