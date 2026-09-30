import React, { useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import type { FlashListRef, ListRenderItemInfo } from '@shopify/flash-list';
import type { EjercicioIndice, Programa, Rutina } from '@/data/catalog';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { FilaEjercicio } from '@/ui/components/FilaEjercicio';
import { TarjetaRutina } from './TarjetaRutina';
import { TarjetaPrograma } from './TarjetaPrograma';
import { TextoVacio } from '@/ui/components/TextoVacio';
import { precargar } from '@/ui/components/Imagen';
import { fuenteMini } from '@/media/registry';
import { FILAS_ANIMADAS, TARJETAS_ESCALONADAS, type PropsLista } from '@/ui/components/listaBase';
import {
  ListaAnimada, PROPS_LISTA, EntradaUnaVez, idsAnimados, useFundidoAlCambiar,
} from '@/ui/components/listaVirtual';

/**
 * Las tres listas de Explorar, con FlashList (R5): la de 190 ejercicios solo monta las filas que
 * se ven. Las primeras posiciones (8 filas, 4 tarjetas) entran una sola vez por elemento; al
 * cambiar un filtro la lista hace un fundido de 150 ms (FlashList recicla las celdas y no admite
 * salidas ni reacomodos por fila). Con movimiento reducido, todo es un fundido de 150 ms. Los
 * datos, el orden y las acciones son los de siempre; las filas vienen de fuera.
 *
 * R4: `renderItem` va fuera del JSX y las filas son memo con props estables (el item y un
 * `onPress(id)` comun); la estrella de cada fila lee su favorito, asi que marcar uno no
 * vuelve a pintar la lista.
 */

const MOVIMIENTO_MS = 200;
const TARJETA_MS = 260;
const ESCALONADO_TARJETA_MS = 60;
/** Al cargar la lista de ejercicios se precargan las miniaturas de la siguiente pantalla. */
const PRECARGA_SIGUIENTES = 10;

const animadosEjercicios = idsAnimados('explorar/ejercicios');
const animadosRutinas = idsAnimados('explorar/rutinas');
const animadosProgramas = idsAnimados('explorar/programas');

export function ListaEjercicios({ ejercicios, propsLista, onPress }: {
  ejercicios: EjercicioIndice[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const fundido = useFundidoAlCambiar(ejercicios, reducido);
  const lista = useRef<FlashListRef<EjercicioIndice>>(null);
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<EjercicioIndice>) => (
    <EntradaUnaVez
      id={item.id} animados={animadosEjercicios} animar={index < FILAS_ANIMADAS}
      desde={8} retraso={0} duracion={MOVIMIENTO_MS} reducido={reducido}
    >
      <FilaEjercicio e={item} onPress={onPress} />
    </EntradaUnaVez>
  ), [reducido, onPress]);
  // Cargada la lista, las miniaturas de la siguiente pantalla (y nada mas).
  const alCargar = useCallback(() => {
    const ultima = lista.current?.computeVisibleIndices().endIndex ?? FILAS_ANIMADAS;
    precargar(ejercicios.slice(ultima + 1, ultima + 1 + PRECARGA_SIGUIENTES).map(e => fuenteMini('ejercicio', e.id)));
  }, [ejercicios]);
  return (
    <Animated.View style={[s.llena, fundido]}>
      <ListaAnimada
        {...PROPS_LISTA} {...propsLista}
        ref={lista}
        data={ejercicios}
        keyExtractor={idDe}
        onLoad={alCargar}
        ListEmptyComponent={VACIO_EJERCICIOS}
        renderItem={renderItem}
      />
    </Animated.View>
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
  const fundido = useFundidoAlCambiar(rutinas, reducido);
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Rutina>) => (
    <EntradaUnaVez
      id={item.id} animados={animadosRutinas} animar={index < TARJETAS_ESCALONADAS}
      desde={16} retraso={index * ESCALONADO_TARJETA_MS} duracion={TARJETA_MS} reducido={reducido}
    >
      <TarjetaRutina r={item} scrollY={scrollY} onPress={onPress} />
    </EntradaUnaVez>
  ), [reducido, scrollY, onPress]);
  return (
    <Animated.View style={[s.llena, fundido]}>
      <ListaAnimada
        {...PROPS_LISTA} {...propsLista}
        data={rutinas}
        keyExtractor={idDe}
        ListHeaderComponent={cabecera}
        ListEmptyComponent={VACIO_RUTINAS}
        renderItem={renderItem}
      />
    </Animated.View>
  );
}

export function ListaProgramas({ programas, propsLista, onPress }: {
  programas: Programa[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const fundido = useFundidoAlCambiar(programas, reducido);
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Programa>) => (
    <EntradaUnaVez
      id={item.id} animados={animadosProgramas} animar={index < TARJETAS_ESCALONADAS}
      desde={16} retraso={index * ESCALONADO_TARJETA_MS} duracion={TARJETA_MS} reducido={reducido}
    >
      <TarjetaPrograma p={item} onPress={onPress} />
    </EntradaUnaVez>
  ), [reducido, onPress]);
  return (
    <Animated.View style={[s.llena, fundido]}>
      <ListaAnimada
        {...PROPS_LISTA} {...propsLista}
        data={programas}
        keyExtractor={idDe}
        ListEmptyComponent={VACIO_PROGRAMAS}
        renderItem={renderItem}
      />
    </Animated.View>
  );
}

const idDe = (x: { id: string }) => x.id;
const VACIO_EJERCICIOS = <TextoVacio texto="Nada con esos filtros. Prueba a quitar alguno." />;
const VACIO_RUTINAS = <TextoVacio texto="Sin rutinas con ese filtro. Prueba con otro objetivo o borra la búsqueda." />;
const VACIO_PROGRAMAS = <TextoVacio texto="Sin programas con ese filtro. Prueba con otro objetivo o borra la búsqueda." />;

const s = StyleSheet.create({ llena: { flex: 1 } });
