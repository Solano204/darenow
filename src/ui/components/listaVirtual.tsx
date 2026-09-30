/**
 * Listas largas con FlashList (R5). Ver `docs/ARQUITECTURA.md`, «Listas».
 *
 * FlashList recicla las celdas: una fila que sale de pantalla se reusa para otro elemento, asi
 * que la misma instancia del componente recibe otro `id`. Reglas para las filas:
 * - Nada de estado local que dependa del elemento sin reiniciarse al cambiar el id (o que venga
 *   del store). Una fila con mucho estado interno (sellos, tachones medidos) se monta de nuevo
 *   por id (`key={id}` en `renderItem`): se reinicia entera y la lista sigue virtualizada.
 * - Los shared values por fila (presion, escala) se reinician al cambiar el id.
 * - Las entradas de las primeras filas se animan una sola vez por elemento (`EntradaUnaVez`,
 *   con un `Set` de ids ya animados); al reciclar no se repiten.
 * - Las fotos llevan `recyclingKey` (lo pone `Imagen`).
 * - FlashList no hace transiciones de layout ni salidas por fila: al cambiar el resultado (un
 *   filtro), la lista entera hace un fundido de 150 ms (`useFundidoAlCambiar`).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { FlashList, type FlashListProps } from '@shopify/flash-list';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withTiming, type EasingFunction, type EasingFunctionFactory, type SharedValue,
} from 'react-native-reanimated';

/** FlashList que acepta el `onScroll` de `useAnimatedScrollHandler`. */
export const ListaAnimada = Animated.createAnimatedComponent(FlashList) as unknown as <T>(
  p: FlashListProps<T> & { ref?: React.Ref<unknown> },
) => React.ReactElement;

/** Lo comun a las listas largas. */
export const PROPS_LISTA = {
  scrollEventThrottle: 16,
  showsVerticalScrollIndicator: false,
} as const;

const FUNDIDO_MS = 150;

/**
 * Fundido de 150 ms de la lista entera cuando cambia lo que muestra (no en la carga inicial):
 * sustituye a las salidas y reacomodos por fila que FlashList no admite.
 */
export function useFundidoAlCambiar(datos: unknown, reducido: boolean) {
  const opacidad = useSharedValue(1);
  const previos = useRef(datos);
  useEffect(() => {
    if (previos.current === datos) return;
    previos.current = datos;
    cancelAnimation(opacidad);
    opacidad.set(0);
    opacidad.set(withTiming(1, { duration: FUNDIDO_MS }));
  }, [datos, opacidad, reducido]);
  return useAnimatedStyle(() => ({ opacity: opacidad.value }));
}

/** Los ids que ya hicieron su entrada, por lista, durante esta sesion de la app. */
const animadosPorLista = new Map<string, Set<string>>();
export function idsAnimados(lista: string): Set<string> {
  let ids = animadosPorLista.get(lista);
  if (!ids) { ids = new Set(); animadosPorLista.set(lista, ids); }
  return ids;
}

/**
 * La entrada de una de las primeras filas (fundido y `desde` px de recorrido, tras `retraso` ms),
 * una sola vez por elemento: si la celda se recicla para otro id, o el elemento ya entro antes,
 * aparece ya puesto. Con movimiento reducido, un fundido de 150 ms.
 */
export function EntradaUnaVez({
  id, animados, animar, desde, retraso, duracion, curva, reducido, estilo, children,
}: {
  id: string;
  animados: Set<string>;
  /** Si esta posicion lleva entrada (solo las primeras filas). */
  animar: boolean;
  desde: number;
  retraso: number;
  duracion: number;
  /** Curva del recorrido (la de `withTiming` por defecto). */
  curva?: EasingFunction | EasingFunctionFactory;
  reducido: boolean;
  estilo?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const [primerId] = useState(id);
  const [entra] = useState(() => animar && !animados.has(id));
  const t = useSharedValue(entra ? 0 : 1);

  useEffect(() => {
    if (!entra) return;
    animados.add(primerId);
    t.set(withDelay(reducido ? 0 : retraso, withTiming(1, reducido ? { duration: FUNDIDO_MS } : { duration: duracion, easing: curva })));
  }, [animados, curva, duracion, entra, primerId, reducido, retraso, t]);

  // Reciclada para otro elemento: aparece ya puesta.
  useLayoutEffect(() => {
    if (id === primerId) return;
    cancelAnimation(t);
    t.set(1);
  }, [id, primerId, t]);

  const estiloAnimado = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: reducido ? 0 : (1 - t.value) * desde }],
  }));
  return <Animated.View style={[estilo, estiloAnimado]}>{children}</Animated.View>;
}

/** Reinicia un shared value por fila (presion, escala) cuando la celda pasa a otro elemento. */
export function useReinicioPorId(id: string, valor: SharedValue<number>, inicial = 0) {
  useLayoutEffect(() => {
    cancelAnimation(valor);
    valor.set(inicial);
  }, [id, valor, inicial]);
}

/**
 * Si este elemento hace su entrada: `condicion` (una de las primeras posiciones) y que no la haya
 * hecho antes en la sesion. Se decide al montar; el id se anota despues de pintarse.
 */
export function useUnaVez(animados: Set<string>, id: string, condicion: boolean): boolean {
  const [entra] = useState(() => condicion && !animados.has(id));
  useEffect(() => { if (entra) animados.add(id); }, [animados, entra, id]);
  return entra;
}
