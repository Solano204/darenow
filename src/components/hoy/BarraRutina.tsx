import React from 'react';
import { StyleSheet, View } from 'react-native';
import { paleta } from '../../theme';

const COLORES = [paleta.placaVerde, paleta.placaAmarilla, paleta.placaRoja] as const;
const MAX_SEGMENTOS = 10;

/**
 * Miniatura de una rutina propia: un segmento por ejercicio (hasta 10), con
 * los colores de las placas en orden. Solo dice cuan larga es; el numero exacto
 * lo dice el texto de la tarjeta.
 */
export function BarraRutina({ pasos }: { pasos: number }) {
  const n = Math.max(1, Math.min(pasos, MAX_SEGMENTOS));
  return (
    <View style={s.fila} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={[s.segmento, { backgroundColor: COLORES[i % COLORES.length] }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flex: 1, flexDirection: 'row', gap: 2, maxWidth: 96 },
  segmento: { flex: 1, height: 4, borderRadius: 2 },
});
