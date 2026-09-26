import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { paleta, tinte, tipo, radio } from '../../theme';

const ANCHO_BARRA = 3;

export const estiloNota = { ...tipo.etiqueta, fontSize: 14, lineHeight: 20, color: paleta.magnesia };

/** Reemplaza a las pastillas azules: una nota de entrenador con barra de acción a la izquierda. */
export function NotaEntrenador({ children, estilo, colorBarra = paleta.placaAzul }: {
  children: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
  /** Color de la barra lateral (azul de accion por defecto). */
  colorBarra?: string;
}) {
  return (
    <View style={[s.caja, estilo]}>
      <View style={[s.barra, { backgroundColor: colorBarra }]} />
      {typeof children === 'string' ? <Text style={estiloNota}>{children}</Text> : children}
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    alignSelf: 'flex-start', overflow: 'hidden', backgroundColor: tinte.notaEntrenador,
    borderRadius: radio.nota, paddingVertical: 12, paddingRight: 14, paddingLeft: 14 + ANCHO_BARRA,
  },
  barra: { position: 'absolute', left: 0, top: 0, bottom: 0, width: ANCHO_BARRA, backgroundColor: paleta.placaAzul },
});
