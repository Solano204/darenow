import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PLACAS, MARGEN_PANTALLA } from '../../theme';
import { PlacaDato } from '../ui/PlacaDato';

const TAMANO_NUMERO = 32;
const ESCALONADO_MS = 80;

/**
 * Los cuatro numeros de siempre (sesiones, minutos, series y mejor racha) como
 * placas de dato en una fila. Los numeros ruedan la primera vez que el bloque
 * entra en pantalla (`activo`) y las etiquetas respetan el plural («1 sesion»).
 */
export function EstadisticasHoy({ sesiones, minutos, series, mejorRacha, activo }: {
  sesiones: number; minutos: number; series: number; mejorRacha: number; activo: boolean;
}) {
  const datos = [
    { numero: sesiones, etiqueta: sesiones === 1 ? 'sesión' : 'sesiones' },
    { numero: minutos, etiqueta: minutos === 1 ? 'minuto' : 'minutos' },
    { numero: series, etiqueta: series === 1 ? 'serie' : 'series' },
    { numero: mejorRacha, etiqueta: 'mejor racha' },
  ];
  return (
    <View style={s.fila}>
      {datos.map((d, i) => (
        <View key={i} style={s.celda}>
          <PlacaDato
            numero={d.numero} etiqueta={d.etiqueta} filo={PLACAS[i]} retraso={i * ESCALONADO_MS}
            activo={activo} haptica={false} tamano={TAMANO_NUMERO}
          />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 8, paddingHorizontal: MARGEN_PANTALLA },
  celda: { flex: 1, flexDirection: 'row' },
});
