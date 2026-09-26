import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, conAlfa, MARGEN_PANTALLA } from '../../theme';
import { useTick } from '../../hooks/useTick';

export const SEPARACION_FILAS = 8;
export const ALTO_FILA_CATEGORIA = 32;
export const ALTO_FILA_OBJETIVO = 36;
/** Alto de la zona de filtros de Ejercicios: aire de arriba, categoria, aire y objetivo. */
export const ALTO_FILTROS_EJERCICIOS = SEPARACION_FILAS + ALTO_FILA_CATEGORIA + SEPARACION_FILAS + ALTO_FILA_OBJETIVO;
/** Zona de filtros de Rutinas y Programas: aire de arriba y objetivo. */
export const ALTO_FILTROS_UNA_FILA = SEPARACION_FILAS + ALTO_FILA_OBJETIVO;

const ANCHO_DEGRADADO = 24;
const OPACIDAD_ENCABEZADO = 0.92;

/**
 * Pliega las filas de filtro hacia arriba con la altura y la opacidad (`pliegue` va
 * de 0 desplegado a 1 plegado). Es solo visual: los filtros siguen aplicados. Plegado,
 * no recibe toques ni lo lee el lector de pantalla. `alto` es la suma exacta de las
 * filas de dentro.
 */
export function EncabezadoFiltrosColapsable({ pliegue, alto, plegado, children }: {
  pliegue: SharedValue<number>;
  alto: number;
  plegado: boolean;
  children: React.ReactNode;
}) {
  const tick = useTick();
  const estilo = useAnimatedStyle(() => ({
    height: alto * (1 - pliegue.value), opacity: 1 - pliegue.value,
  }), [alto, tick]);

  return (
    <Animated.View
      style={[s.caja, estilo]}
      pointerEvents={plegado ? 'none' : 'auto'}
      accessibilityElementsHidden={plegado}
      importantForAccessibility={plegado ? 'no-hide-descendants' : 'auto'}
    >
      {children}
    </Animated.View>
  );
}

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
  caja: { overflow: 'hidden', paddingTop: SEPARACION_FILAS, gap: SEPARACION_FILAS },
  chips: { paddingHorizontal: MARGEN_PANTALLA, gap: 8, alignItems: 'center' },
  degradado: { position: 'absolute', top: 0, bottom: 0, right: 0, width: ANCHO_DEGRADADO },
});
