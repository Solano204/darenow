import React from 'react';
import { StyleSheet, View } from 'react-native';
import { paleta } from '@/ui/theme';

const ANCHO = 6;
const ALTO = 16;

/**
 * Nivel del ejercicio como placas de 6x16: las del nivel actual en `magnesia`
 * y el resto hasta `maximo` en `gomaBorde`. El maximo de niveles del catalogo
 * es 3 (`Ejercicio.level`). `alto` la escala (una linea de texto de 14 px pide 12). El lector de pantalla oye «Nivel N de 3».
 */
export function NivelPlacas({ nivel, maximo = 3, alto = ALTO }: { nivel: number; maximo?: number; alto?: number }) {
  const ancho = Math.round((alto * ANCHO) / ALTO);
  return (
    <View style={s.fila} accessible accessibilityLabel={`Nivel ${nivel} de ${maximo}`}>
      {Array.from({ length: maximo }, (_, i) => (
        <View key={i} style={[s.placa, { width: ancho, height: alto, backgroundColor: i < nivel ? paleta.magnesia : paleta.gomaBorde }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  placa: { borderRadius: 2 },
});
