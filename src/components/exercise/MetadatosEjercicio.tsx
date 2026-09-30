import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '@/ui/theme';
import { CATEGORIAS, type Ejercicio } from '@/data/catalog';
import { capitalizar } from '@/lib/presentacion';
import { NivelPlacas } from '@/ui/components/NivelPlacas';

/**
 * Los metadatos en una linea: nivel en placas, categoria, «Por lado» y, si
 * aplica, «Impacto alto» y «Ruidoso», separados por un punto dibujado de 3 px.
 * La primera letra va en mayuscula solo en la vista.
 */
export function MetadatosEjercicio({ ejercicio: e }: { ejercicio: Ejercicio }) {
  const categoria = CATEGORIAS.find(c => c.id === e.category)?.nombre ?? capitalizar(e.category);
  const datos = [
    categoria,
    ...(e.unilateral ? ['Por lado'] : []),
    ...(e.impact >= 2 ? ['Impacto alto'] : []),
    ...(e.noise >= 2 ? ['Ruidoso'] : []),
  ];
  return (
    <View
      style={s.fila} accessible
      accessibilityLabel={`Nivel ${e.level} de 3, ${datos.join(', ')}`}
    >
      <View style={s.nivel}>
        <NivelPlacas nivel={e.level} />
        <Text style={s.texto}>Nivel {e.level}</Text>
      </View>
      {datos.map(d => (
        <View key={d} style={s.dato}>
          <View style={s.punto} />
          <Text style={s.texto}>{d}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 6, columnGap: 8 },
  nivel: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  punto: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: paleta.gomaBorde },
  texto: { fontFamily: familia.medio, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
});
