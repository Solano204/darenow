import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { paleta, tinte, tipo, radio } from '../../theme';

const ANCHO_BARRA = 3;

/** Reemplaza a las pastillas azules: una nota de entrenador con barra de acción a la izquierda. */
export function NotaEntrenador({ children, estilo }: { children: React.ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.caja, estilo]}>
      <View style={s.barra} />
      <Text style={s.texto}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    alignSelf: 'flex-start', overflow: 'hidden', backgroundColor: tinte.notaEntrenador,
    borderRadius: radio.nota, paddingVertical: 12, paddingRight: 14, paddingLeft: 14 + ANCHO_BARRA,
  },
  barra: { position: 'absolute', left: 0, top: 0, bottom: 0, width: ANCHO_BARRA, backgroundColor: paleta.placaAzul },
  texto: { ...tipo.etiqueta, fontSize: 14, lineHeight: 20, color: paleta.magnesia },
});
