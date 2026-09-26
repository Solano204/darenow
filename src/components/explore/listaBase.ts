import type { StyleProp, ViewStyle } from 'react-native';
import {
  FadeIn, FadeOut, LinearTransition, withDelay, withTiming,
  type EntryExitAnimationFunction, type useAnimatedScrollHandler,
} from 'react-native-reanimated';

/** Lo que Explorar reparte a cada lista: el scroll ligado al encabezado y el relleno que deja pasar bajo el. */
export interface PropsLista {
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
  contentContainerStyle: StyleProp<ViewStyle>;
}

/**
 * Lo comun a las cuatro listas. `removeClippedSubviews` apagado y una ventana corta:
 * las transiciones de layout de Reanimated no se llevan bien con las vistas recortadas
 * y una lista de 190 filas no necesita tener montadas mas de unas pantallas.
 */
export const PROPS_FIJAS = {
  scrollEventThrottle: 16,
  showsVerticalScrollIndicator: false,
  removeClippedSubviews: false,
  initialNumToRender: 12,
  windowSize: 7,
} as const;

/** Solo las primeras filas visibles llevan entrada, salida y reacomodo: el resto no cuesta nada. */
export const FILAS_ANIMADAS = 8;
/** Las primeras tarjetas de una lista de fotos aparecen escalonadas. */
export const TARJETAS_ESCALONADAS = 4;
export const ESCALONADO_TARJETA_MS = 60;
const MOVIMIENTO_MS = 200;
const TARJETA_MS = 260;
const FUNDIDO_REDUCIDO_MS = 150;

export const reacomodo = LinearTransition.duration(MOVIMIENTO_MS);
export const salida = FadeOut.duration(MOVIMIENTO_MS);
export const salidaReducida = FadeOut.duration(FUNDIDO_REDUCIDO_MS);
export const entradaReducida = FadeIn.duration(FUNDIDO_REDUCIDO_MS);

/** Aparece con un fundido mientras sube desde `y` px, tras `retraso` ms. */
function entradaDesde(y: number, retraso: number, duracion: number): EntryExitAnimationFunction {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: y }] },
      animations: {
        opacity: withDelay(retraso, withTiming(1, { duration: duracion })),
        transform: [{ translateY: withDelay(retraso, withTiming(0, { duration: duracion })) }],
      },
    };
  };
}

/** Fila que llega a la lista: fundido y 8 px de recorrido. */
export const entradaFila = entradaDesde(8, 0, MOVIMIENTO_MS);
/** Tarjeta que llega a la lista: fundido y 16 px de recorrido, escalonada 60 ms segun su posicion. */
export const entradaTarjeta = Array.from(
  { length: TARJETAS_ESCALONADAS }, (_, i) => entradaDesde(16, i * ESCALONADO_TARJETA_MS, TARJETA_MS),
);
