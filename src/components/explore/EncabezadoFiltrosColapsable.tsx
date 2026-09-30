import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, conAlfa, MARGEN_PANTALLA } from '@/theme';

export const SEPARACION_FILAS = 8;
export const ALTO_FILA_CATEGORIA = 32;
export const ALTO_FILA_OBJETIVO = 36;

const ANCHO_DEGRADADO = 24;
const OPACIDAD_ENCABEZADO = 0.92;

/** Fila de chips con scroll horizontal y un degradado de 24 px en el borde derecho que avisa de que hay mas. */
export function FilaChips({ children, alto }: { children: React.ReactNode; alto: number }) {
  return (
    <View style={{ height: alto }}>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.chips}
      >
        {children}
      </ScrollView>
      <LinearGradient
        colors={[conAlfa(paleta.goma, 0), conAlfa(paleta.goma, OPACIDAD_ENCABEZADO)]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} pointerEvents="none" style={s.degradado}
      />
    </View>
  );
}

const s = StyleSheet.create({
  chips: { paddingHorizontal: MARGEN_PANTALLA, gap: 8, alignItems: 'center' },
  degradado: { position: 'absolute', top: 0, bottom: 0, right: 0, width: ANCHO_DEGRADADO },
});
