import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import type { ListRenderItemInfo } from '@shopify/flash-list';
import type { Tip } from '@/data/catalog';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { TextoVacio } from '@/ui/components/TextoVacio';
import type { PropsLista } from '@/ui/components/listaBase';
import {
  ListaAnimada, PROPS_LISTA, EntradaUnaVez, idsAnimados, useFundidoAlCambiar,
} from '@/ui/components/listaVirtual';
import { TarjetaArticulo } from './TarjetaArticulo';

/** Solo las primeras tarjetas de la lista llevan entrada (escalonada 60 ms); las demas aparecen sin animacion. */
const TARJETAS_CON_ENTRADA = 3;
const ESCALONADO_MS = 60;
const TARJETA_MS = 260;
const animados = idsAnimados('aprender/tips');

/**
 * El segmento Tips: una tarjeta a lo ancho por articulo, en el orden del dato (FlashList, R5). Las
 * primeras tres entran escalonadas una sola vez por tarjeta; al cambiar de categoria o de busqueda
 * la lista hace un fundido de 150 ms. Con movimiento reducido, un fundido. `onPress` toma el id y llega estable desde la pantalla; cada estrella lee su favorito.
 */
export function ListaTips({ tips, propsLista, onPress }: {
  tips: Tip[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const fundido = useFundidoAlCambiar(tips, reducido);
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Tip>) => (
    <EntradaUnaVez
      id={item.id} animados={animados} animar={index < TARJETAS_CON_ENTRADA}
      desde={16} retraso={index * ESCALONADO_MS} duracion={TARJETA_MS} reducido={reducido}
    >
      <TarjetaArticulo tip={item} onPress={onPress} />
    </EntradaUnaVez>
  ), [reducido, onPress]);
  return (
    <Animated.View style={[s.llena, fundido]}>
      <ListaAnimada
        {...PROPS_LISTA} {...propsLista}
        data={tips}
        keyExtractor={idDe}
        ListEmptyComponent={VACIO}
        renderItem={renderItem}
      />
    </Animated.View>
  );
}

const idDe = (t: Tip) => t.id;
const VACIO = <TextoVacio texto="Nada con esa búsqueda. Prueba con otra palabra o con otra categoría." />;

const s = StyleSheet.create({ llena: { flex: 1 } });
