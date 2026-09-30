import React from 'react';
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
 * fundido. `onPress` y `onFav` toman el id y llegan estables desde la pantalla.
 */
export function ListaTips({ tips, propsLista, favorito, onFav, onPress }: {
  tips: Tip[];
  propsLista: PropsLista;
  favorito: (id: string) => boolean;
  onFav: (id: string) => void;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  return (
    <Animated.FlatList
      {...PROPS_FIJAS} {...propsLista}
      data={tips}
      keyExtractor={(t: Tip) => t.id}
      ListEmptyComponent={<TextoVacio texto="Nada con esa búsqueda. Prueba con otra palabra o con otra categoría." />}
      renderItem={({ item, index }: ListRenderItemInfo<Tip>) => (
        <Animated.View
          entering={index < TARJETAS_CON_ENTRADA ? (reducido ? entradaReducida : entradaTarjeta[index]) : undefined}
        >
          <TarjetaArticulo tip={item} favorito={favorito(item.id)} onPress={onPress} onFav={onFav} />
        </Animated.View>
      )}
    />
  );
}
