import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { paleta, radio } from '../../theme';
import { GomaTexture } from '../fx/GomaTexture';

const GROSOR_FILO = 3;

/**
 * Una superficie `gomaAlta` con textura, borde de 1 px y un filo de 3 px a la izquierda del color
 * que le da su significado (`placaVerde` para lo comprobado, `placaAmarilla` para una advertencia).
 * Es la `TarjetaGoma` con el filo: sin sombra, la profundidad es la superficie.
 */
export function TarjetaConFilo({ colorFilo, children, estilo, relleno = 20 }: {
  colorFilo: string;
  children: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
  relleno?: number;
}) {
  return (
    <View style={[s.caja, estilo]}>
      <GomaTexture />
      <View style={[s.filo, { backgroundColor: colorFilo }]} />
      <View style={{ paddingVertical: relleno, paddingRight: relleno, paddingLeft: relleno + GROSOR_FILO }}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    backgroundColor: paleta.gomaAlta, borderRadius: radio.tarjeta, borderWidth: 1, borderColor: paleta.gomaBorde, overflow: 'hidden',
  },
  filo: { position: 'absolute', top: 0, left: 0, bottom: 0, width: GROSOR_FILO },
});
