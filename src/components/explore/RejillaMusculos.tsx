import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { MARGEN_PANTALLA } from '../../theme';
import { EJERCICIOS, type Musculo } from '../../data/catalog';
import { plural } from '../../utils/plural';
import { FichaMusculo, type MedidasFicha } from '../exercise/FichaMusculo';
import { TextoVacio } from './TextoVacio';
import { PROPS_FIJAS, type PropsLista } from './listaBase';

const COLUMNAS = 2;
const SEPARACION = 16;
const LETRA = 14;
const FILAS_CON_ENTRADA = 6;
/** Hasta este largo el nombre cabe en una linea a 14 px en una columna de 360 px; mas largo se parte por palabras. */
const LARGO_UNA_LINEA = 20;

/**
 * Los musculos como una rejilla de dos columnas de `FichaMusculo`, cada ficha del
 * ancho de su columna. Bajo el nombre, cuantos ejercicios lo trabajan (como principal o
 * como apoyo; nada si ninguno). Entran escalonados por fila (50 ms) solo las primeras
 * seis filas, es decir, en la carga inicial.
 */
export function RejillaMusculos({ musculos, propsLista, onPress }: {
  musculos: Musculo[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const ancho = (width - 2 * MARGEN_PANTALLA - SEPARACION) / COLUMNAS;
  const cuantos = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const e of EJERCICIOS) for (const id of new Set([...e.primary, ...e.secondary])) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
    return cuenta;
  }, []);

  return (
    <Animated.FlatList
      {...PROPS_FIJAS} {...propsLista}
      data={musculos}
      keyExtractor={(m: Musculo) => m.id}
      numColumns={COLUMNAS}
      columnWrapperStyle={s.fila}
      ListEmptyComponent={<TextoVacio texto="Ningún músculo coincide. Prueba con otra palabra." />}
      renderItem={({ item, index }: { item: Musculo; index: number }) => {
        const n = cuantos.get(item.id) ?? 0;
        const medidas: MedidasFicha = { ancho, letra: LETRA, lineas: item.name.length > LARGO_UNA_LINEA ? 2 : 1 };
        return (
          <View style={s.celda}>
            <FichaMusculo
              m={item} principal={false} medidas={medidas} indice={Math.floor(index / COLUMNAS)}
              activo animar={index < FILAS_CON_ENTRADA * COLUMNAS}
              detalle={n > 0 ? `${n} ${plural(n, 'ejercicio')}` : undefined}
              onPress={() => onPress(item.id)}
            />
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  fila: { gap: SEPARACION },
  celda: { flex: 1, marginBottom: SEPARACION },
});
