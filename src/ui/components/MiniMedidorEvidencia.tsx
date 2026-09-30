import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLOR_VEREDICTO, ORDEN_VEREDICTOS, type Conteos } from './MedidorEvidencia';

/**
 * La barra del medidor de la ficha en 32x4: un segmento por veredicto, proporcional al
 * numero de afirmaciones de cada uno. Solo visual: el lector de pantalla oye el resumen
 * en la etiqueta de la fila. Sin afirmaciones no dibuja nada.
 */
export function MiniMedidorEvidencia({ conteos }: { conteos: Conteos }) {
  const partes = ORDEN_VEREDICTOS.filter(v => conteos[v] > 0);
  if (partes.length === 0) return null;
  return (
    <View style={s.barra} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {partes.map(v => <View key={v} style={{ flex: conteos[v], backgroundColor: COLOR_VEREDICTO[v] }} />)}
    </View>
  );
}

const s = StyleSheet.create({
  barra: { width: 32, height: 4, borderRadius: 2, overflow: 'hidden', flexDirection: 'row', gap: 1 },
});
