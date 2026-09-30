import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, familia } from '@/ui/theme';
import { plural } from '@/lib/plural';

export const ALTO_ENCABEZADO = 32;
export const LADO_NODO = 12;
/** Altura del centro del nodo dentro del encabezado: donde nace el riel. */
export const CENTRO_NODO = ALTO_ENCABEZADO / 2;
/** Cuanto se corre a la derecha todo lo que cuelga del riel (titulo, filas). */
export const SANGRIA_RIEL = 20;

/**
 * Encabezado de un bloque: el nombre en Big Shoulders 24. Si el bloque tiene vueltas, a la
 * derecha va el indicador: el icono de repetir y «×3» (el lector de pantalla oye «3 vueltas»).
 * El nodo del riel lo pone `RielVertical`.
 */
export function EncabezadoBloque({ titulo, vueltas }: { titulo: string; vueltas?: number }) {
  return (
    <View style={s.fila}>
      <Text style={s.titulo} numberOfLines={1} accessibilityRole="header">{titulo}</Text>
      {vueltas ? (
        <View style={s.vueltas} accessible accessibilityLabel={`${vueltas} ${plural(vueltas, 'vuelta')}`}>
          <Ionicons name="repeat" size={16} color={paleta.magnesia} />
          <Text style={s.vueltasTexto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>×{vueltas}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { height: ALTO_ENCABEZADO, flexDirection: 'row', alignItems: 'center' },
  titulo: { flex: 1, fontFamily: familia.titulo, fontSize: 24, lineHeight: 28, color: paleta.magnesia },
  vueltas: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vueltasTexto: { fontFamily: familia.titulo, fontSize: 18, lineHeight: 22, color: paleta.magnesia },
});
