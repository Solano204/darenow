import React, { useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, conAlfa } from '../../theme';

const FUNDIDO_LINEAS = 0.9;

/**
 * Texto de un maximo de `lineas` lineas cuyo final se desvanece hacia el fondo
 * en vez de cortarse con puntos suspensivos. Solo se desvanece si de verdad no
 * cabe. `fondo` es el color de la superficie sobre la que va.
 */
export function TextoDesvanecido({ texto, lineas = 2, alturaLinea = 20, estilo, fondo = paleta.gomaAlta }: {
  texto: string;
  lineas?: number;
  alturaLinea?: number;
  estilo?: StyleProp<TextStyle>;
  fondo?: string;
}) {
  const [recortado, setRecortado] = useState(false);
  return (
    <View style={{ maxHeight: alturaLinea * lineas, overflow: 'hidden' }}>
      <Text
        style={[estilo, { lineHeight: alturaLinea }]}
        onTextLayout={e => setRecortado(e.nativeEvent.lines.length > lineas)}
      >
        {texto}
      </Text>
      {recortado && (
        <LinearGradient
          colors={[conAlfa(fondo, 0), fondo]} pointerEvents="none"
          style={[s.fundido, { height: alturaLinea * FUNDIDO_LINEAS }]}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  fundido: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
