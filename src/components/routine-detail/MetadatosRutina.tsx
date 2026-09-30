import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia } from '@/ui/theme';
import { nombreGoal } from '@/data/catalog';
import { plural } from '@/utils/plural';
import { NivelPlacas } from '@/ui/components/NivelPlacas';
import { DatoNumerico } from '@/ui/components/DatoNumerico';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';

/**
 * Los metadatos de una rutina en una linea, sin repetir nada: la duracion (numero en Big
 * Shoulders y «min»), el objetivo con su icono, el nivel en placas y, si aplica, «Silenciosa».
 * Una rutina propia no tiene nivel: trae la etiqueta «MÍA» y sus numeros de ejercicios y series.
 * Los separa un punto de 3 px.
 */
export function MetadatosRutina({ minutos, objetivo, nivel, silenciosa, propia, ejercicios, series }: {
  minutos: number;
  /** Id del objetivo (`GOALS`). */
  objetivo: string;
  nivel?: number;
  silenciosa?: boolean;
  propia?: boolean;
  ejercicios?: number;
  series?: number;
}) {
  const nombre = nombreGoal(objetivo);
  const partes: { clave: string; nodo: React.ReactNode }[] = [
    {
      clave: 'min',
      nodo: (
        <Text style={s.lineaMin}>
          <Text style={s.numero}>{minutos}</Text>
          <Text style={s.unidadMin}> min</Text>
        </Text>
      ),
    },
    {
      clave: 'objetivo',
      nodo: (
        <View style={s.dato}>
          <Ionicons name={ICONOS_OBJETIVO[objetivo] ?? 'flag-outline'} size={14} color={paleta.magnesia2} />
          <Text style={s.texto}>{nombre}</Text>
        </View>
      ),
    },
  ];
  if (nivel !== undefined) {
    partes.push({
      clave: 'nivel',
      nodo: <View style={s.dato}><NivelPlacas nivel={nivel} alto={12} /><Text style={s.texto}>Nivel {nivel}</Text></View>,
    });
  }
  if (silenciosa) {
    partes.push({
      clave: 'silenciosa',
      nodo: <View style={s.dato}><Ionicons name="volume-mute-outline" size={14} color={paleta.magnesia2} /><Text style={s.texto}>Silenciosa</Text></View>,
    });
  }
  if (ejercicios !== undefined) partes.push({ clave: 'ejercicios', nodo: <DatoNumerico numero={ejercicios} unidad={plural(ejercicios, 'ejercicio')} /> });
  if (series !== undefined) partes.push({ clave: 'series', nodo: <DatoNumerico numero={series} unidad={plural(series, 'serie')} /> });

  const etiqueta = [
    propia ? 'Rutina propia' : null,
    `${minutos} ${plural(minutos, 'minuto')}`,
    nombre,
    nivel !== undefined ? `nivel ${nivel} de 3` : null,
    silenciosa ? 'silenciosa' : null,
    ejercicios !== undefined ? `${ejercicios} ${plural(ejercicios, 'ejercicio')}` : null,
    series !== undefined ? `${series} ${plural(series, 'serie')}` : null,
  ].filter(Boolean).join(', ');

  return (
    <View style={s.fila} accessible accessibilityLabel={etiqueta}>
      {propia && (
        <View style={s.mia} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={s.miaTexto}>MÍA</Text>
        </View>
      )}
      {partes.map((p, i) => (
        <View key={p.clave} style={s.dato} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {(i > 0 || propia) && <View style={s.punto} />}
          {p.nodo}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 6, columnGap: 8 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  punto: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: paleta.gomaBorde, marginRight: 2 },
  lineaMin: { lineHeight: 24 },
  numero: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, color: paleta.magnesia },
  unidadMin: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 24, color: paleta.magnesia2 },
  texto: { fontFamily: familia.medio, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  mia: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: paleta.gomaBorde,
    backgroundColor: paleta.gomaAlta,
  },
  miaTexto: { fontFamily: familia.enfasis, fontSize: 12, lineHeight: 16, letterSpacing: 1, color: paleta.magnesia },
});
