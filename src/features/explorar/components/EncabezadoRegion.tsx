import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '@/ui/theme';
import { plural } from '@/lib/plural';
import { ALTO_REGION } from '@/ui/components/disposicionCatalogo';

/**
 * El encabezado de una region del catalogo («Espalda 9»): el nombre en Big Shoulders 700 de 20 y,
 * al lado, cuantos musculos trae ese tramo en Figtree 14 `magnesia3`. El lector de pantalla oye
 * «Espalda, 9 músculos».
 */
export function EncabezadoRegion({ etiqueta, cantidad }: { etiqueta: string; cantidad: number }) {
  return (
    <View
      style={s.fila} accessible accessibilityRole="header"
      accessibilityLabel={`${etiqueta}, ${cantidad} ${plural(cantidad, 'músculo')}`}
    >
      <Text style={s.titulo} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{etiqueta}</Text>
      <Text style={s.cantidad} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{cantidad}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { height: ALTO_REGION, paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, color: paleta.magnesia },
  cantidad: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto },
});
