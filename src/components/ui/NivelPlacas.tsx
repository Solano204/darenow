import React from 'react';
import { StyleSheet, View } from 'react-native';
import { paleta } from '../../theme';

const PLACAS_NIVEL = [paleta.placaVerde, paleta.placaAmarilla, paleta.placaRoja] as const;
const ANCHO = 8;
const ALTO = 22;

/**
 * Nivel del ejercicio (1 a 3) como placas: se llenan de izquierda a derecha en
 * verde, amarillo y rojo, las que faltan quedan como contorno. Mismo dato que
 * el texto «Nivel N», que sigue siendo lo que lee el lector de pantalla.
 */
export function NivelPlacas({ nivel }: { nivel: 1 | 2 | 3 }) {
  return (
    <View style={s.fila} accessible accessibilityLabel={`Nivel ${nivel} de 3`}>
      {PLACAS_NIVEL.map((c, i) => (
        <View
          key={i}
          style={[s.placa, i < nivel ? { backgroundColor: c, borderColor: c } : s.vacia]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  placa: { width: ANCHO, height: ALTO, borderRadius: 3, borderWidth: 1 },
  vacia: { backgroundColor: 'transparent', borderColor: paleta.gomaBorde },
});
