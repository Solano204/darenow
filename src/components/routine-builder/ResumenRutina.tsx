import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, tipo, familia } from '@/theme';
import { plural } from '@/utils/plural';
import { Odometro } from '@/components/fx/Odometro';

const CIFRA = { ...tipo.numero, fontSize: 28, lineHeight: 32, color: paleta.magnesia };
const CIFRA_COMPACTA = { ...tipo.numero, fontSize: 20, lineHeight: 24, color: paleta.magnesia };

export const ALTO_RESUMEN_COMPACTO = 24;

/** «1 ejercicio, 3 series, 5 minutos» como frase, para el lector de pantalla. */
export function fraseResumen(ejercicios: number, series: number, minutos: number): string {
  return `${ejercicios} ${plural(ejercicios, 'ejercicio', 'ejercicios')}, ${series} ${plural(series, 'serie', 'series')}, `
    + `${minutos} ${plural(minutos, 'minuto', 'minutos')}`;
}

/**
 * Los tres numeros de la rutina en una linea: cifra de Big Shoulders que rueda
 * con `Odometro` y unidad de Figtree con la concordancia correcta («1 ejercicio»).
 * Solo es lo que se ve: el calculo lo hace quien la usa. No se lee por separado, la barra
 * ya lleva la frase completa.
 */
export function ResumenRutina({ ejercicios, series, minutos, compacto }: {
  ejercicios: number; series: number; minutos: number; compacto?: boolean;
}) {
  const datos: [number, string, string][] = [
    [ejercicios, 'ejercicio', 'ejercicios'], [series, 'serie', 'series'], [minutos, 'minuto', 'minutos'],
  ];
  return (
    <View
      style={[s.fila, compacto && s.filaCompacta]}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    >
      {datos.map(([n, uno, varios]) => (
        <View key={uno} style={s.dato}>
          <Odometro valor={n} continuo estilo={compacto ? CIFRA_COMPACTA : CIFRA} />
          <Text style={[s.unidad, compacto && s.unidadCompacta]}>{plural(n, uno, varios)}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 16, rowGap: 4 },
  filaCompacta: { columnGap: 12 },
  dato: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  unidad: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  unidadCompacta: { fontSize: 13, lineHeight: 18 },
});
