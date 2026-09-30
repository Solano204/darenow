import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { paleta, radio } from '@/ui/theme';
import { GomaTexture } from '@/ui/fx/GomaTexture';

/** Superficie `gomaAlta` con textura y borde de 1 px. Sin sombra: la profundidad es la superficie. */
export function TarjetaGoma({ children, estilo, relleno = 20 }: {
  children: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
  relleno?: number;
}) {
  return (
    <View style={[s.caja, estilo]}>
      <GomaTexture />
      <View style={{ padding: relleno }}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    backgroundColor: paleta.gomaAlta, borderRadius: radio.tarjeta,
    borderWidth: 1, borderColor: paleta.gomaBorde, overflow: 'hidden',
  },
});
