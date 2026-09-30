import React, { useCallback } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import Animated from 'react-native-reanimated';
import type { Tip } from '@/data/catalog';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { TextoVacio } from '@/ui/components/TextoVacio';
import { PROPS_FIJAS, entradaReducida, entradaTarjeta, type PropsLista } from '@/ui/components/listaBase';
import { TarjetaArticulo } from './TarjetaArticulo';

/** Solo las primeras tarjetas de la lista llevan entrada (escalonada 60 ms); las demas aparecen sin animacion. */
const TARJETAS_CON_ENTRADA = 3;

/**
 * El segmento Tips: una tarjeta a lo ancho por articulo, en el orden del dato. Las primeras tres
 * entran escalonadas en la carga inicial y al cambiar de categoria; con movimiento reducido, un
 * fundido. `onPress` toma el id y llega estable desde la pantalla; cada estrella lee su favorito.
 */
export function ListaTips({ tips, propsLista, onPress }: {
  tips: Tip[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Tip>) => (
    <Animated.View
      entering={index < TARJETAS_CON_ENTRADA ? (reducido ? entradaReducida : entradaTarjeta[index]) : undefined}
    >
      <TarjetaArticulo tip={item} onPress={onPress} />
    </Animated.View>
  ), [reducido, onPress]);
  return (
    <Animated.FlatList
      {...PROPS_FIJAS} {...propsLista}
      data={tips}
      keyExtractor={idDe}
      ListEmptyComponent={VACIO}
      renderItem={renderItem}
    />
  );
}

const idDe = (t: Tip) => t.id;
const VACIO = <TextoVacio texto="Nada con esa búsqueda. Prueba con otra palabra o con otra categoría." />;
