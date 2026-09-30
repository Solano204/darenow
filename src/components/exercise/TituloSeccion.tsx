import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '@/theme';

/** Titulo de seccion de la ficha: Big Shoulders 700 de 26 y, si se pide, una linea de ayuda en Figtree 14. */
export function TituloSeccion({ titulo, ayuda }: { titulo: string; ayuda?: string }) {
  return (
    <View style={s.caja}>
      <Text style={s.titulo} accessibilityRole="header">{titulo}</Text>
      {ayuda ? <Text style={s.ayuda}>{ayuda}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  caja: { marginBottom: 16, gap: 2 },
  titulo: { fontFamily: familia.titulo, fontSize: 26, lineHeight: 30, color: paleta.magnesia },
  ayuda: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto },
});
