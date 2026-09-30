import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, MARGEN_PANTALLA } from '../../theme';
import type { RelacionadoVista, TipoRelacionado } from '../../utils/aprender';
import { Presionable } from '../ui/Presionable';
import { FotoOscura } from '../ui/FotoOscura';
import { TituloBloque } from './TituloBloque';

const ANCHO = 200;
const ALTO_FOTO = 110;
const ICONOS: Record<TipoRelacionado, React.ComponentProps<typeof Ionicons>['name']> = {
  programa: 'barbell-outline', rutina: 'list-outline', ejercicio: 'body-outline',
};
const TIPOS: Record<TipoRelacionado, string> = { programa: 'Programa', rutina: 'Rutina', ejercicio: 'Ejercicio' };

/**
 * Lo relacionado con un articulo: una tarjeta de 200 de ancho con la foto (200 x 110, radio 16), el
 * tipo con su icono (barra con discos para un programa, lista para una rutina) y, debajo, el nombre
 * real en Figtree 600 de 15 (hasta 2 lineas). Al presionar se hunde a 0.97 con un toque suave; lleva
 * al mismo programa, rutina o ejercicio de siempre.
 */
function TarjetaRelacionada({ item, onPress }: { item: RelacionadoVista; onPress: (r: RelacionadoVista) => void }) {
  return (
    <Presionable onPress={() => onPress(item)} etiqueta={`${TIPOS[item.tipo]}: ${item.nombre}`} estilo={s.tarjeta}>
      <FotoOscura tipo={item.tipo} id={item.id} ancho={ANCHO} alto={ALTO_FOTO} radioEsquina={16} velo={false} />
      <View style={s.tipo}>
        <Ionicons name={ICONOS[item.tipo]} size={14} color={paleta.magnesia2} />
        <Text style={s.tipoTexto} maxFontSizeMultiplier={1.3}>{TIPOS[item.tipo]}</Text>
      </View>
      <Text style={s.nombre} numberOfLines={2} maxFontSizeMultiplier={1.3}>{item.nombre}</Text>
    </Presionable>
  );
}

/** Las tarjetas en una fila que se desliza, a sangre. */
export function FilaRelacionados({ relacionados, onAbrir }: {
  relacionados: RelacionadoVista[];
  onAbrir: (r: RelacionadoVista) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fila}>
      {relacionados.map(r => <TarjetaRelacionada key={r.id} item={r} onPress={onAbrir} />)}
    </ScrollView>
  );
}

/** El bloque «Relacionado»: su titulo y las tarjetas. Sin relacionados no se dibuja. */
export function BloqueRelacionado({ relacionados, onAbrir }: {
  relacionados: RelacionadoVista[];
  onAbrir: (r: RelacionadoVista) => void;
}) {
  if (relacionados.length === 0) return null;
  return (
    <View>
      <View style={s.margen}><TituloBloque>Relacionado</TituloBloque></View>
      <FilaRelacionados relacionados={relacionados} onAbrir={onAbrir} />
    </View>
  );
}

const s = StyleSheet.create({
  margen: { marginHorizontal: MARGEN_PANTALLA },
  fila: { paddingHorizontal: MARGEN_PANTALLA, gap: 12 },
  tarjeta: { width: ANCHO },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  tipoTexto: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  nombre: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.magnesia, marginTop: 2 },
});
