import React, { useCallback } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import type { EjercicioIndice, Programa, Rutina } from '@/data/catalog';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { FilaEjercicio } from '@/ui/components/FilaEjercicio';
import { TarjetaRutina } from './TarjetaRutina';
import { TarjetaPrograma } from './TarjetaPrograma';
import { TextoVacio } from '@/ui/components/TextoVacio';
import {
  PROPS_FIJAS, FILAS_ANIMADAS, TARJETAS_ESCALONADAS, entradaFila, entradaTarjeta, entradaReducida, reacomodo, salida,
  salidaReducida, type PropsLista,
} from '@/ui/components/listaBase';

/**
 * Las tres listas con animacion de entrada y salida: solo las primeras posiciones
 * (8 filas, 4 tarjetas) llevan entrada, salida y reacomodo, para que una lista de 190
 * ejercicios no pague por ello. Con movimiento reducido, todo es un fundido de 150 ms.
 * Los datos, el orden y las acciones son los de siempre; las filas vienen de fuera.
 *
 * R4: `renderItem` va fuera del JSX y las filas son memo con props estables (el item y un
 * `onPress(id)` comun); la estrella de cada fila lee su favorito, asi que marcar uno no
 * vuelve a pintar la lista.
 */

export function ListaEjercicios({ ejercicios, propsLista, onPress }: {
  ejercicios: EjercicioIndice[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<EjercicioIndice>) => (
    <Animated.View
      entering={index < FILAS_ANIMADAS ? (reducido ? entradaReducida : entradaFila) : undefined}
      exiting={index < FILAS_ANIMADAS ? (reducido ? salidaReducida : salida) : undefined}
    >
      <FilaEjercicio e={item} onPress={onPress} />
    </Animated.View>
  ), [reducido, onPress]);
  return (
    <Animated.FlatList
      {...PROPS_FIJAS} {...propsLista}
      data={ejercicios}
      keyExtractor={idDe}
      itemLayoutAnimation={reducido ? undefined : reacomodo}
      ListEmptyComponent={VACIO_EJERCICIOS}
      renderItem={renderItem}
    />
  );
}

export function ListaRutinas({ rutinas, cabecera, propsLista, scrollY, onPress }: {
  rutinas: Rutina[];
  cabecera: React.ReactElement;
  propsLista: PropsLista;
  scrollY: SharedValue<number>;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Rutina>) => (
    <Animated.View
      entering={index < TARJETAS_ESCALONADAS ? (reducido ? entradaReducida : entradaTarjeta[index]) : undefined}
      exiting={index < TARJETAS_ESCALONADAS ? (reducido ? salidaReducida : salida) : undefined}
    >
      <TarjetaRutina r={item} scrollY={scrollY} onPress={onPress} />
    </Animated.View>
  ), [reducido, scrollY, onPress]);
  return (
    <Animated.FlatList
      {...PROPS_FIJAS} {...propsLista}
      data={rutinas}
      keyExtractor={idDe}
      itemLayoutAnimation={reducido ? undefined : reacomodo}
      ListHeaderComponent={cabecera}
      ListEmptyComponent={VACIO_RUTINAS}
      renderItem={renderItem}
    />
  );
}

export function ListaProgramas({ programas, propsLista, onPress }: {
  programas: Programa[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Programa>) => (
    <Animated.View
      entering={index < TARJETAS_ESCALONADAS ? (reducido ? entradaReducida : entradaTarjeta[index]) : undefined}
      exiting={index < TARJETAS_ESCALONADAS ? (reducido ? salidaReducida : salida) : undefined}
    >
      <TarjetaPrograma p={item} onPress={onPress} />
    </Animated.View>
  ), [reducido, onPress]);
  return (
    <Animated.FlatList
      {...PROPS_FIJAS} {...propsLista}
      data={programas}
      keyExtractor={idDe}
      itemLayoutAnimation={reducido ? undefined : reacomodo}
      ListEmptyComponent={VACIO_PROGRAMAS}
      renderItem={renderItem}
    />
  );
}

const idDe = (x: { id: string }) => x.id;
const VACIO_EJERCICIOS = <TextoVacio texto="Nada con esos filtros. Prueba a quitar alguno." />;
const VACIO_RUTINAS = <TextoVacio texto="Sin rutinas con ese filtro. Prueba con otro objetivo o borra la búsqueda." />;
const VACIO_PROGRAMAS = <TextoVacio texto="Sin programas con ese filtro. Prueba con otro objetivo o borra la búsqueda." />;
