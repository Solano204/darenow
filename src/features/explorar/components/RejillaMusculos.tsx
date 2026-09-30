import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import { resorteMagnesia, MARGEN_PANTALLA } from '@/ui/theme';
import type { MusculoIndice } from '@/data/catalog';
import { textoVisible } from '@/lib/presentacion';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { Entrada } from '@/ui/fx/Entrada';
import { TextoVacio } from '@/ui/components/TextoVacio';
import { EncabezadoPegado } from '@/ui/components/EncabezadoPegado';
import type { PropsLista } from '@/ui/components/listaBase';
import { ListaAnimada, PROPS_LISTA, idsAnimados, useFundidoAlCambiar } from '@/ui/components/listaVirtual';
import { EncabezadoRegion } from './EncabezadoRegion';
import { FichaMusculoNombre } from '@/ui/components/FichaMusculoNombre';
import {
  SEPARACION_H, armarFilas, ladoFicha, type FilaCatalogo,
} from '@/ui/components/disposicionCatalogo';

/** Solo las primeras filas (las que se ven al abrir) entran en ola; las que aparecen por scroll no se animan. */
const FILAS_CON_OLA = 5;
const ESCALONADO_OLA_MS = 30;
const ESCALA_OLA = 0.92;
/** Las fichas que ya entraron en ola en esta sesion: al reciclar las filas (FlashList) no se repite. */
const animados = idsAnimados('explorar/musculos');

/**
 * Los musculos como una rejilla de tres columnas de fichas cuadradas (`FichaRender`, radio 24,
 * sobre `magnesia`), con un encabezado cada vez que cambia el grupo **en el orden actual**: la
 * lista nunca se reordena. Los encabezados quedan pegados justo bajo la cabecera fija de Explorar
 * (que ya no se mueve) mientras su grupo esta en pantalla (`EncabezadoPegado`).
 *
 * Al cargar, las fichas visibles entran en ola diagonal: retraso de (fila + columna) × 30 ms, con
 * fundido y escala de 0.92 a 1 con `resorteMagnesia`, una sola vez por ficha. Con una busqueda, la
 * lista hace un fundido de 150 ms (FlashList, R5: sin transiciones de layout por fila). Con
 * movimiento reducido no hay ola. Filas y encabezados son dos tipos de celda (`getItemType`).
 */
export function RejillaMusculos({ musculos, propsLista, scrollY, onPress }: {
  musculos: MusculoIndice[];
  propsLista: PropsLista;
  /** El scroll de la lista (el mismo que mueve la cabecera). */
  scrollY: SharedValue<number>;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const { width } = useWindowDimensions();
  const lado = ladoFicha(width - 2 * MARGEN_PANTALLA);
  const filas = useMemo(() => armarFilas(musculos, lado), [musculos, lado]);
  const arriba = useMemo(() => filas.map(f => (f.tipo === 'region' ? f.arriba : Number.POSITIVE_INFINITY)), [filas]);

  const fundido = useFundidoAlCambiar(filas, reducido);
  const renderItem = ({ item }: ListRenderItemInfo<FilaCatalogo>) => {
    if (item.tipo === 'region') return <EncabezadoRegion etiqueta={item.etiqueta} cantidad={item.cantidad} />;
    return (
      <View style={[s.fila, { height: item.alto }]}>
        {item.musculos.map((m, columna) => (
          <FichaEnOla
            key={m.id} id={m.id} animar={!reducido && item.fila < FILAS_CON_OLA} retraso={(item.fila + columna) * ESCALONADO_OLA_MS}
          >
            <FichaMusculoNombre
              id={m.id} nombre={textoVisible(m.name)} lado={lado} lineas={item.lineas} onPress={() => onPress(m.id)}
            />
          </FichaEnOla>
        ))}
      </View>
    );
  };

  return (
    <View style={s.raiz}>
      <Animated.View style={[s.raiz, fundido]}>
        <ListaAnimada
          {...PROPS_LISTA} {...propsLista}
          data={filas}
          keyExtractor={claveDe}
          getItemType={tipoDe}
          ListEmptyComponent={VACIO}
          renderItem={renderItem}
        />
      </Animated.View>
      <EncabezadoPegado
        arriba={arriba} scrollY={scrollY} top={0} recorrido={0}
        contenido={i => {
          const fila = filas[i];
          return fila.tipo === 'region' ? <EncabezadoRegion etiqueta={fila.etiqueta} cantidad={fila.cantidad} /> : null;
        }}
      />
    </View>
  );
}

/** Una ficha que entra en la ola la primera vez que se ve en la sesion; despues aparece puesta. */
function FichaEnOla({ id, animar, retraso, children }: { id: string; animar: boolean; retraso: number; children: React.ReactNode }) {
  const [entra] = useState(() => animar && !animados.has(id));
  useEffect(() => { if (entra) animados.add(id); }, [entra, id]);
  return (
    <Entrada activo animar={entra} retraso={retraso} escala={ESCALA_OLA} resorte={resorteMagnesia}>
      {children}
    </Entrada>
  );
}

const claveDe = (f: FilaCatalogo) => f.clave;
const tipoDe = (f: FilaCatalogo) => f.tipo;
const VACIO = <TextoVacio texto="Ningún músculo coincide. Prueba con otra palabra." />;

const s = StyleSheet.create({
  raiz: { flex: 1 },
  fila: { flexDirection: 'row', gap: SEPARACION_H },
});
