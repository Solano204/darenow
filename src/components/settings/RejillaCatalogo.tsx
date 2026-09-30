import React, { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { runOnJS, useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import { paleta, familia, tipo, MARGEN_PANTALLA } from '@/theme';
import { ESTADISTICAS } from '@/data/catalog';
import { Odometro } from '@/components/fx/Odometro';

const DURACION_ODOMETRO_MS = 900;
const ESCALONADO_MS = 60;
const MARGEN_VISIBLE_PX = 80;

const CELDAS = [
  { etiqueta: 'Ejercicios', n: ESTADISTICAS.ejercicios },
  { etiqueta: 'Sin equipo', n: ESTADISTICAS.sinEquipo },
  { etiqueta: 'Aptos sin saltos', n: ESTADISTICAS.silenciosos },
  { etiqueta: 'Músculos', n: ESTADISTICAS.musculos },
  { etiqueta: 'Rutinas', n: ESTADISTICAS.rutinas },
  { etiqueta: 'Programas', n: ESTADISTICAS.programas },
  { etiqueta: 'Tips', n: ESTADISTICAS.tips },
  { etiqueta: 'Mitos', n: ESTADISTICAS.mitos },
] as const;

/**
 * Lo que la app trae, en una rejilla de dos columnas de celdas `gomaAlta`: un numero grande y su etiqueta. La primera
 * vez que la seccion entra en pantalla todos los numeros ruedan desde 0 (odometro de 900 ms, escalonados 60 ms): es el
 * unico momento de celebracion de Ajustes. `arriba` es donde empieza la seccion dentro del scroll y `y` el scroll.
 */
export function RejillaCatalogo({ y, arriba }: { y: SharedValue<number>; arriba: number }) {
  const { height: alturaVentana } = useWindowDimensions();
  const [activo, setActivo] = useState(false);

  useAnimatedReaction(
    () => y.value + alturaVentana - MARGEN_VISIBLE_PX > arriba,
    (dentro, previo) => { if (dentro && !previo) runOnJS(setActivo)(true); },
    [arriba, alturaVentana],
  );

  return (
    <View style={s.rejilla}>
      {CELDAS.map((c, i) => (
        <View key={c.etiqueta} style={s.celda} accessible accessibilityLabel={`${c.etiqueta}, ${c.n}`}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Odometro
              valor={c.n} activo={activo} retraso={i * ESCALONADO_MS} duracionColumna={DURACION_ODOMETRO_MS}
              estilo={s.numero}
            />
          </View>
          <Text style={s.etiqueta} maxFontSizeMultiplier={1.3} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {c.etiqueta}
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  rejilla: {
    marginHorizontal: MARGEN_PANTALLA, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12,
  },
  celda: { width: '48%', padding: 14, borderRadius: 16, backgroundColor: paleta.gomaAlta },
  numero: { ...tipo.numero, fontSize: 32, lineHeight: 34, color: paleta.magnesia },
  etiqueta: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2, marginTop: 2 },
});
