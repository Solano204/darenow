import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta, conAlfa, ALTO_BOTON, MARGEN_PANTALLA } from '@/theme';

const RELLENO_ARRIBA = 8;
const SEPARACION_ABAJO = 16;
const ALTO_VELO = 32;

/** Lo que mide la barra sin la zona segura: el aire de arriba, el boton y el de abajo. El scroll lo suma a su relleno inferior. */
export const ALTO_BARRA_INFERIOR = RELLENO_ARRIBA + ALTO_BOTON + SEPARACION_ABAJO;

/**
 * La barra fija de abajo de una ficha con su boton: `goma` sobre la zona segura y un degradado
 * de 32 px hacia arriba, para que el contenido que pasa por debajo se funda en vez de cortarse.
 */
export function BarraInferiorFija({ children }: { children: React.ReactNode }) {
  const inset = useSafeAreaInsets();
  return (
    <View style={[s.barra, { paddingBottom: inset.bottom + SEPARACION_ABAJO }]}>
      <LinearGradient colors={[conAlfa(paleta.goma, 0), paleta.goma]} pointerEvents="none" style={s.velo} />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  barra: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: RELLENO_ARRIBA, paddingHorizontal: MARGEN_PANTALLA,
    backgroundColor: paleta.goma,
  },
  velo: { position: 'absolute', left: 0, right: 0, top: -ALTO_VELO, height: ALTO_VELO },
});
