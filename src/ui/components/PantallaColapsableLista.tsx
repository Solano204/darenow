import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedScrollHandler, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FlashListProps } from '@shopify/flash-list';
import { paleta } from '@/ui/theme';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { HeaderColapsable, ALTO_HEADER } from '@/ui/fx/HeaderColapsable';
import { ListaAnimada, PROPS_LISTA } from './listaVirtual';

const AIRE_BAJO_TITULO = 16;

/** Lo que la pantalla necesita de su marco para pegar algo bajo la cabecera. */
export interface ContextoLista {
  y: SharedValue<number>;
  /** Donde termina la cabecera desplegada (con el inset): ahi se pega un encabezado de grupo. */
  altoCabecera: number;
}

/**
 * El mismo marco que `PantallaColapsable` (fondo `goma` con su textura, titulo grande que colapsa a
 * la barra superior con el scroll) con una lista virtualizada en vez de un scroll con todo montado
 * (R5): para listas que crecen sin tope, como el historial. Mismo relleno arriba y abajo, mismo
 * `y` para la cabecera y lo que se pegue a ella (`superposicion`).
 */
export function PantallaColapsableLista<T>({ titulo, onAtras, superposicion, lista, y, ...props }: {
  titulo: string;
  /** El scroll de la lista (lo crea la pantalla: sus filas tambien lo leen). */
  y: SharedValue<number>;
  onAtras: () => void;
  superposicion?: (c: ContextoLista) => React.ReactNode;
  /** El ref de la FlashList (para leer donde quedo cada fila). */
  lista?: React.Ref<unknown>;
} & Omit<FlashListProps<T>, 'onScroll' | 'contentContainerStyle'>) {
  const inset = useSafeAreaInsets();
  const onScroll = useAnimatedScrollHandler(e => { y.set(e.contentOffset.y); });
  const altoCabecera = inset.top + ALTO_HEADER;
  const contenido = { paddingTop: altoCabecera + AIRE_BAJO_TITULO, paddingBottom: inset.bottom + 40 };

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <ListaAnimada<T>
        {...PROPS_LISTA} {...props}
        ref={lista}
        onScroll={onScroll as never}
        contentContainerStyle={contenido}
      />
      {superposicion?.({ y, altoCabecera })}
      <HeaderColapsable y={y} titulo={titulo} onAtras={onAtras} />
    </View>
  );
}

const s = StyleSheet.create({ raiz: { flex: 1, backgroundColor: paleta.goma } });
