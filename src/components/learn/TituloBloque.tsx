import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { paleta, familia } from '@/ui/theme';

/** Titulo de un bloque de Aprender («Relacionado», «Por qué», «Lo que esta app no hace»): Big Shoulders 700 de 24. */
export function TituloBloque({ children }: { children: string }) {
  return <Text style={s.titulo} accessibilityRole="header" maxFontSizeMultiplier={1.3}>{children}</Text>;
}

const s = StyleSheet.create({
  titulo: { fontFamily: familia.titulo, fontSize: 24, lineHeight: 28, color: paleta.magnesia, marginBottom: 16 },
});
