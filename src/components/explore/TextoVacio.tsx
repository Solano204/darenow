import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '../../theme';

/** Sin resultados: una frase que dice que paso y que probar, sin ilustraciones. */
export function TextoVacio({ texto }: { texto: string }) {
  return (
    <View style={s.caja} accessible accessibilityLiveRegion="polite">
      <Text style={s.texto}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  caja: { paddingVertical: 32, paddingHorizontal: 8 },
  texto: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 24, color: paleta.magnesia2, textAlign: 'center' },
});
