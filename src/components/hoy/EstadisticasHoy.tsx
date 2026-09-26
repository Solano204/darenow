import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PLACAS, MARGEN_PANTALLA } from '../../theme';
import { PlacaDato } from '../ui/PlacaDato';

/**
 * Los cuatro numeros de siempre (sesiones, minutos, series y mejor racha) como
 * placas de dato en una cuadricula de 2x2. Sin animacion: es un bloque de
 * consulta bajo el pliegue.
 */
export function EstadisticasHoy({ sesiones, minutos, series, mejorRacha }: {
  sesiones: number; minutos: number; series: number; mejorRacha: number;
}) {
  const datos = [
    { numero: sesiones, etiqueta: 'sesiones' },
    { numero: minutos, etiqueta: 'minutos' },
    { numero: series, etiqueta: 'series' },
    { numero: mejorRacha, etiqueta: 'mejor racha' },
  ];
  return (
    <View style={s.rejilla}>
      {datos.map((d, i) => (
        <View key={d.etiqueta} style={s.celda}>
          <PlacaDato numero={d.numero} etiqueta={d.etiqueta} filo={PLACAS[i]} retraso={0} animar={false} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: MARGEN_PANTALLA },
  celda: { width: '47.5%', flexGrow: 1, flexDirection: 'row' },
});
