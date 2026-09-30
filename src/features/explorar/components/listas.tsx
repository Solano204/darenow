import React from 'react';
import type { ListRenderItemInfo } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import type { Ejercicio, Programa, Rutina } from '@/data/catalog';
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
 */

interface ComunesFavorito { favorito: (id: string) => boolean; onFav: (id: string) => void }

export function ListaEjercicios({ ejercicios, propsLista, favorito, onFav, onPress }: ComunesFavorito & {
  ejercicios: Ejercicio[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  return (
    <Animated.FlatList
      {...PROPS_FIJAS} {...propsLista}
      data={ejercicios}
      keyExtractor={(e: Ejercicio) => e.id}
      itemLayoutAnimation={reducido ? undefined : reacomodo}
      ListEmptyComponent={<TextoVacio texto="Nada con esos filtros. Prueba a quitar alguno." />}
      renderItem={({ item, index }: ListRenderItemInfo<Ejercicio>) => (
        <Animated.View
          entering={index < FILAS_ANIMADAS ? (reducido ? entradaReducida : entradaFila) : undefined}
          exiting={index < FILAS_ANIMADAS ? (reducido ? salidaReducida : salida) : undefined}
        >
          <FilaEjercicio e={item} favorito={favorito(item.id)} onFav={onFav} onPress={onPress} />
        </Animated.View>
      )}
    />
  );
}

export function ListaRutinas({ rutinas, cabecera, propsLista, scrollY, favorito, onFav, onPress }: ComunesFavorito & {
  rutinas: Rutina[];
  cabecera: React.ReactElement;
  propsLista: PropsLista;
  scrollY: SharedValue<number>;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  return (
    <Animated.FlatList
      {...PROPS_FIJAS} {...propsLista}
      data={rutinas}
      keyExtractor={(r: Rutina) => r.id}
      itemLayoutAnimation={reducido ? undefined : reacomodo}
      ListHeaderComponent={cabecera}
      ListEmptyComponent={<TextoVacio texto="Sin rutinas con ese filtro. Prueba con otro objetivo o borra la búsqueda." />}
      renderItem={({ item, index }: ListRenderItemInfo<Rutina>) => (
        <Animated.View
          entering={index < TARJETAS_ESCALONADAS ? (reducido ? entradaReducida : entradaTarjeta[index]) : undefined}
          exiting={index < TARJETAS_ESCALONADAS ? (reducido ? salidaReducida : salida) : undefined}
        >
          <TarjetaRutina
            r={item} favorito={favorito(item.id)} scrollY={scrollY}
            onPress={() => onPress(item.id)} onFavorito={() => onFav(item.id)}
          />
        </Animated.View>
      )}
    />
  );
}

export function ListaProgramas({ programas, propsLista, favorito, onFav, onPress }: ComunesFavorito & {
  programas: Programa[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  return (
    <Animated.FlatList
      {...PROPS_FIJAS} {...propsLista}
      data={programas}
      keyExtractor={(p: Programa) => p.id}
      itemLayoutAnimation={reducido ? undefined : reacomodo}
      ListEmptyComponent={<TextoVacio texto="Sin programas con ese filtro. Prueba con otro objetivo o borra la búsqueda." />}
      renderItem={({ item, index }: ListRenderItemInfo<Programa>) => (
        <Animated.View
          entering={index < TARJETAS_ESCALONADAS ? (reducido ? entradaReducida : entradaTarjeta[index]) : undefined}
          exiting={index < TARJETAS_ESCALONADAS ? (reducido ? salidaReducida : salida) : undefined}
        >
          <TarjetaPrograma
            p={item} favorito={favorito(item.id)} onPress={() => onPress(item.id)} onFavorito={() => onFav(item.id)}
          />
        </Animated.View>
      )}
    />
  );
}
