import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { paleta, familia } from '@/ui/theme';

/** «12 semanas»: el numero en Big Shoulders 700 15 y la unidad en Figtree 13, en una sola linea de texto. */
export function DatoNumerico({ numero, unidad }: { numero: number; unidad: string }) {
  return (
    <Text style={s.linea}>
      <Text style={s.numero}>{numero}</Text>
      <Text style={s.unidad}> {unidad}</Text>
    </Text>
  );
}

const s = StyleSheet.create({
  linea: { lineHeight: 20 },
  numero: { fontFamily: familia.titulo, fontSize: 15, lineHeight: 20, color: paleta.magnesia },
  unidad: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 20, color: paleta.magnesia2 },
});
