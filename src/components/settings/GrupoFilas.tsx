import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { paleta, MARGEN_PANTALLA } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const RADIO_GRUPO = 20;
const CAMBIO_ALTURA_MS = 240;
const SANGRIA_POR_DEFECTO = 16;

/**
 * Lista agrupada: un contenedor `gomaAlta` de radio 20 con borde `gomaBorde` y sus filas separadas por una linea de
 * 1 px que arranca en `sangria` (donde empieza el texto), no una tarjeta por fila. `animarAltura` hace que el grupo
 * cambie de alto con `LinearTransition` de 240 ms cuando una fila entra o sale (con movimiento reducido, sin animar).
 */
export function GrupoFilas({ children, sangria = SANGRIA_POR_DEFECTO, animarAltura }: {
  children: React.ReactNode;
  sangria?: number;
  animarAltura?: boolean;
}) {
  const reducido = useReducedMotion();
  const filas = React.Children.toArray(children);

  return (
    <Animated.View
      layout={animarAltura && !reducido ? LinearTransition.duration(CAMBIO_ALTURA_MS) : undefined}
      style={s.grupo}
    >
      {filas.map((fila, i) => (
        <React.Fragment key={React.isValidElement(fila) && fila.key !== null ? fila.key : i}>
          {i > 0 && <View style={[s.linea, { marginLeft: sangria }]} />}
          {fila}
        </React.Fragment>
      ))}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  grupo: {
    marginHorizontal: MARGEN_PANTALLA, borderRadius: RADIO_GRUPO, overflow: 'hidden',
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  linea: { height: 1, backgroundColor: paleta.gomaBorde },
});
