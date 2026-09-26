import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions, type ListRenderItemInfo } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import { resorteMagnesia, MARGEN_PANTALLA } from '../../theme';
import type { Musculo } from '../../data/catalog';
import { textoVisible } from '../../utils/presentacion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Entrada } from '../fx/Entrada';
import { TextoVacio } from '../explore/TextoVacio';
import { EncabezadoPegado } from '../explore/EncabezadoPegado';
import { PROPS_FIJAS, reacomodo, type PropsLista } from '../explore/listaBase';
import { EncabezadoRegion } from './EncabezadoRegion';
import { FichaMusculoNombre } from './FichaMusculoNombre';
import {
  SEPARACION_H, armarFilas, ladoFicha, type FilaCatalogo,
} from './disposicionCatalogo';

/** Solo las primeras filas (las que se ven al abrir) entran en ola; las que aparecen por scroll no se animan. */
const FILAS_CON_OLA = 5;
const ESCALONADO_OLA_MS = 30;
const ESCALA_OLA = 0.92;

/**
 * Los musculos como una rejilla de tres columnas de fichas cuadradas (`FichaRender`, radio 24,
 * sobre `magnesia`), con un encabezado cada vez que cambia el grupo **en el orden actual**: la
 * lista nunca se reordena. Los encabezados quedan pegados bajo la cabecera de Explorar mientras
 * su grupo esta en pantalla (`EncabezadoPegado`, que sigue el colapso de la cabecera).
 *
 * Al cargar, las fichas visibles entran en ola diagonal: retraso de (fila + columna) × 30 ms, con
 * fundido y escala de 0.92 a 1 con `resorteMagnesia`. Con una busqueda, las filas se reacomodan con
 * transiciones de layout. Con movimiento reducido no hay ola. Las filas tienen un alto que se
 * calcula (`armarFilas`), asi que la lista no mide nada.
 */
export function RejillaMusculos({ musculos, propsLista, scrollY, topPegajoso, onPress }: {
  musculos: Musculo[];
  propsLista: PropsLista;
  /** El scroll de la lista (el mismo que mueve la cabecera). */
  scrollY: SharedValue<number>;
  /** Donde termina la cabecera de Explorar: ahi se pega el encabezado de region. */
  topPegajoso: number;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const { width } = useWindowDimensions();
  const lado = ladoFicha(width - 2 * MARGEN_PANTALLA);
  const filas = useMemo(() => armarFilas(musculos, lado), [musculos, lado]);
  const arriba = useMemo(() => filas.map(f => (f.tipo === 'region' ? f.arriba : Number.POSITIVE_INFINITY)), [filas]);

  const renderItem = ({ item }: ListRenderItemInfo<FilaCatalogo>) => {
    if (item.tipo === 'region') return <EncabezadoRegion etiqueta={item.etiqueta} cantidad={item.cantidad} />;
    return (
      <View style={[s.fila, { height: item.alto }]}>
        {item.musculos.map((m, columna) => (
          <Entrada
            key={m.id} activo animar={!reducido && item.fila < FILAS_CON_OLA} retraso={(item.fila + columna) * ESCALONADO_OLA_MS}
            escala={ESCALA_OLA} resorte={resorteMagnesia}
          >
            <FichaMusculoNombre
              id={m.id} nombre={textoVisible(m.name)} lado={lado} lineas={item.lineas} onPress={() => onPress(m.id)}
            />
          </Entrada>
        ))}
      </View>
    );
  };

  return (
    <View style={s.raiz}>
      <Animated.FlatList
        {...PROPS_FIJAS} {...propsLista}
        data={filas}
        keyExtractor={(f: FilaCatalogo) => f.clave}
        getItemLayout={(_: unknown, i: number) => ({ length: filas[i].alto, offset: filas[i].arriba, index: i })}
        itemLayoutAnimation={reducido ? undefined : reacomodo}
        ListEmptyComponent={<TextoVacio texto="Ningún músculo coincide. Prueba con otra palabra." />}
        renderItem={renderItem}
      />
      <EncabezadoPegado
        arriba={arriba} scrollY={scrollY} top={topPegajoso}
        contenido={i => {
          const fila = filas[i];
          return fila.tipo === 'region' ? <EncabezadoRegion etiqueta={fila.etiqueta} cantidad={fila.cantidad} /> : null;
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
  fila: { flexDirection: 'row', gap: SEPARACION_H },
});
