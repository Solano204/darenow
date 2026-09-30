import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ListRenderItemInfo, ViewToken } from '@shopify/flash-list';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import type { Mito } from '@/data/catalog';
import type { RelacionadoVista } from '@/lib/aprender';
import { NotaEntrenador } from '@/ui/components/NotaEntrenador';
import { TextoVacio } from '@/ui/components/TextoVacio';
import type { PropsLista } from '@/ui/components/listaBase';
import { ListaAnimada, PROPS_LISTA } from '@/ui/components/listaVirtual';
import { FilaMito, type Activacion } from './FilaMito';
import { BloqueErrores } from './BloqueErrores';

const FRACCION_VISIBLE = 60;
/** Solo las primeras filas que se animan en la sesion dan el golpe de haptica del sello. */
const FILAS_CON_GOLPE = 3;

/** Los mitos que ya se animaron en esta sesion: al volver al segmento aparecen ya tachados, no se repite. */
const ANIMADOS = new Set<string>();
let golpesDados = 0;

/**
 * El segmento Mitos: la nota de introduccion (barra `placaRoja`), una fila por mito y, al pie, los
 * errores de ejecucion. La primera vez que una fila entra 60 % en pantalla se activa: su sello se
 * estampa y el tachon recorre la afirmacion (`FilaMito`). La haptica del sello suena solo en las
 * tres primeras filas animadas de la sesion.
 */
export function ListaMitos({ mitos, propsLista, onPress, onAbrirRelacionado }: {
  mitos: Mito[];
  propsLista: PropsLista;
  onPress: (id: string) => void;
  onAbrirRelacionado: (r: RelacionadoVista) => void;
}) {
  const [activas, setActivas] = useState<Record<string, Activacion>>({});
  // Las que ya se animaron antes de montar esta lista; el resto se anima al entrar en pantalla.
  const [previas] = useState(() => new Set(ANIMADOS));
  const [configuracion] = useState(() => ({ itemVisiblePercentThreshold: FRACCION_VISIBLE }));

  // Estable a proposito: la lista no admite cambiar `onViewableItemsChanged` en caliente.
  const alVer = useCallback(({ viewableItems }: { viewableItems: ViewToken<Mito>[] }) => {
    const nuevas = viewableItems.flatMap(v => (v.item && !ANIMADOS.has(v.item.id) ? [v.item.id] : []));
    if (nuevas.length === 0) return;
    const entradas = nuevas.map((id): [string, Activacion] => {
      ANIMADOS.add(id);
      const golpe = golpesDados < FILAS_CON_GOLPE;
      if (golpe) golpesDados += 1;
      return [id, { golpe }];
    });
    setActivas(previa => ({ ...previa, ...Object.fromEntries(entradas) }));
  }, []);

  // `key` por mito: la fila tiene sello, tachon y lineas medidas; si FlashList recicla la celda para
  // otro mito, se monta de nuevo y empieza limpia (la lista sigue virtualizada).
  const renderItem = useCallback(({ item }: ListRenderItemInfo<Mito>) => (
    <FilaMito key={item.id} mito={item} activacion={activas[item.id]} animar={!previas.has(item.id)} onPress={onPress} />
  ), [activas, previas, onPress]);

  return (
    <ListaAnimada
      {...PROPS_LISTA} {...propsLista}
      data={mitos}
      extraData={activas}
      keyExtractor={(m: Mito) => m.id}
      viewabilityConfig={configuracion}
      onViewableItemsChanged={alVer}
      ListHeaderComponent={(
        <NotaEntrenador colorBarra={paleta.placaRoja} estilo={s.nota}>
          <Text style={s.notaTexto} maxFontSizeMultiplier={1.3}>
            Saber qué no funciona vale tanto como saber qué sí. Cada afirmación lleva su veredicto.
          </Text>
        </NotaEntrenador>
      )}
      ListEmptyComponent={<TextoVacio texto="Ningún mito coincide. Prueba con otra palabra." />}
      ListFooterComponent={<View style={s.pie}><BloqueErrores onAbrir={onAbrirRelacionado} /></View>}
      renderItem={renderItem}
    />
  );
}

const s = StyleSheet.create({
  nota: { alignSelf: 'stretch', marginBottom: 8 },
  notaTexto: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 24, color: paleta.magnesia },
  // El pie lleva filas que se deslizan de borde a borde: se sale del relleno de la lista.
  pie: { marginHorizontal: -MARGEN_PANTALLA },
});
