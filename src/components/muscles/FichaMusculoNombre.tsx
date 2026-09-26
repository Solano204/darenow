import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '../../theme';
import { Presionable } from '../ui/Presionable';
import { FichaRender } from './FichaRender';

const ESCALA_PRESIONADA = 0.06;

/**
 * Una ficha de musculo con su nombre debajo: el render cuadrado de radio 24 y el nombre en
 * Figtree 600 de 14, centrado, hasta `lineas` lineas completas. Al presionar se hunde a 0.94 con
 * un toque suave. Sin `onPress` (un musculo citado que no existe en el catalogo, BUG-13) es solo
 * una imagen con su nombre: no hay nada que abrir.
 */
export function FichaMusculoNombre({ id, nombre, lado, lineas, onPress, etiqueta }: {
  id: string;
  nombre: string;
  lado: number;
  lineas: number;
  onPress?: () => void;
  /** Lo que oye el lector de pantalla si no es solo el nombre. */
  etiqueta?: string;
}) {
  const cuerpo = (
    <>
      <FichaRender id={id} ancho={lado} alto={lado} />
      <Text
        style={[s.nombre, { width: lado }]} numberOfLines={lineas} adjustsFontSizeToFit minimumFontScale={0.85}
        maxFontSizeMultiplier={1.2} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      >
        {nombre}
      </Text>
    </>
  );

  if (!onPress) {
    return <View style={{ width: lado }} accessible accessibilityLabel={etiqueta ?? nombre}>{cuerpo}</View>;
  }
  return (
    <Presionable onPress={onPress} etiqueta={etiqueta ?? nombre} escala={ESCALA_PRESIONADA} estilo={{ width: lado }}>
      {cuerpo}
    </Presionable>
  );
}

const s = StyleSheet.create({
  nombre: { marginTop: 8, fontFamily: familia.enfasis, fontSize: 14, lineHeight: 18, color: paleta.magnesia, textAlign: 'center' },
});
