import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '@/theme';
import { Odometro } from '@/components/fx/Odometro';

/**
 * Titulo de un grupo de la lista de rutinas («Mis rutinas», «Del catalogo»): Big Shoulders
 * 22, con 32 px de aire antes. El conteo del grupo va aparte, sin parentesis, en
 * `magnesia3`, y rueda con `Odometro` cuando cambia.
 */
export function EncabezadoGrupo({ titulo, cuantos }: { titulo: string; cuantos?: number }) {
  return (
    <View
      style={s.fila} accessible accessibilityRole="header"
      accessibilityLabel={cuantos === undefined ? titulo : `${titulo}, ${cuantos}`}
    >
      <Text style={s.titulo}>{titulo}</Text>
      {cuantos !== undefined && <Odometro valor={cuantos} continuo estilo={s.cuantos} />}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32, marginBottom: 12 },
  titulo: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 26, color: paleta.magnesia },
  cuantos: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 26, color: paleta.magnesia3Texto },
});
