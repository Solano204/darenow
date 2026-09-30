import React, { useState } from 'react';
import { StyleSheet, Text, View, type NativeSyntheticEvent, type StyleProp, type TextLayoutEventData, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, conAlfa } from '@/theme';

const FUNDIDO_LINEAS = 0.9;
/** Cuanto se desvanece el final de la ultima linea visible en la version horizontal. */
const ANCHO_FUNDIDO_PX = 40;

interface FinDeLinea { x: number; ancho: number }

/**
 * Texto de un maximo de `lineas` lineas cuyo final se desvanece hacia el fondo
 * en vez de cortarse con puntos suspensivos. Solo se desvanece si de verdad no
 * cabe. `fondo` es el color de la superficie sobre la que va.
 *
 * Por defecto el desvanecido es vertical (se come el pie de la ultima linea). Con
 * `horizontal`, la ultima linea visible se desvanece hacia la derecha en sus ultimos
 * 40 px, que es como se lee un extracto.
 */
export function TextoDesvanecido({ texto, lineas = 2, alturaLinea = 20, estilo, fondo = paleta.gomaAlta, horizontal = false }: {
  texto: string;
  lineas?: number;
  alturaLinea?: number;
  estilo?: StyleProp<TextStyle>;
  fondo?: string;
  horizontal?: boolean;
}) {
  const [recortado, setRecortado] = useState(false);
  const [fin, setFin] = useState<FinDeLinea | null>(null);

  const alMedir = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const medidas = e.nativeEvent.lines;
    const corta = medidas.length > lineas;
    setRecortado(corta);
    const ultima = corta ? medidas[lineas - 1] : undefined;
    setFin(previa => {
      if (!ultima) return null;
      return previa && previa.x === ultima.x && previa.ancho === ultima.width ? previa : { x: ultima.x, ancho: ultima.width };
    });
  };

  const ancho = fin ? Math.min(ANCHO_FUNDIDO_PX, fin.ancho) : 0;

  return (
    <View style={{ maxHeight: alturaLinea * lineas, overflow: 'hidden' }}>
      <Text style={[estilo, { lineHeight: alturaLinea }]} onTextLayout={alMedir}>
        {texto}
      </Text>
      {recortado && !horizontal && (
        <LinearGradient
          colors={[conAlfa(fondo, 0), fondo]} pointerEvents="none"
          style={[s.fundido, { height: alturaLinea * FUNDIDO_LINEAS }]}
        />
      )}
      {recortado && horizontal && fin && (
        <LinearGradient
          colors={[conAlfa(fondo, 0), fondo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} pointerEvents="none"
          style={{ position: 'absolute', top: (lineas - 1) * alturaLinea, height: alturaLinea, left: fin.x + fin.ancho - ancho, width: ancho }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  fundido: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
