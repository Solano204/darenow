import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { paleta } from '@/ui/theme';

/** [izquierda, alto, ancho] de cada dedo, en fracciones del lado. El menique y el indice son los mas cortos. */
const DEDOS: [number, number, number][] = [
  [0.27, 0.27, 0.11], [0.41, 0.33, 0.11], [0.55, 0.31, 0.11], [0.69, 0.23, 0.1],
];
const TOP_PALMA = 0.5;
const OPACIDAD_POLVO = 0.9;

/**
 * Huella de una mano con magnesia: palma y cuatro dedos con la punta redonda
 * y un pulgar inclinado. Es una marca de «hoy entrenaste», no un icono de
 * accion: no es tocable y no lleva texto ni etiqueta propia; quien la usa
 * describe el estado con su propio `accessibilityLabel`.
 */
export function Huella({ lado, color = paleta.magnesia, opacidad = OPACIDAD_POLVO, contorno, estilo }: {
  lado: number;
  color?: string;
  opacidad?: number;
  /** Solo el borde de cada pieza, sin relleno: el dia de una sesion corta en el calendario. */
  contorno?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const f = (n: number) => n * lado;
  const pintura = contorno ? { borderWidth: 1, borderColor: color } : { backgroundColor: color };
  return (
    <View
      style={[{ width: lado, height: lado, opacity: opacidad }, estilo]}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"
    >
      <View style={[s.pieza, {
        left: f(0.22), top: f(TOP_PALMA), width: f(0.58), height: f(0.44), borderRadius: f(0.2), ...pintura,
      }]} />
      {DEDOS.map(([x, alto, ancho], i) => (
        <View
          key={i}
          style={[s.pieza, {
            left: f(x), top: f(TOP_PALMA + 0.04 - alto), width: f(ancho), height: f(alto),
            borderRadius: f(ancho / 2), ...pintura,
          }]}
        />
      ))}
      <View style={[s.pieza, {
        left: f(0.09), top: f(0.5), width: f(0.12), height: f(0.28), borderRadius: f(0.06),
        ...pintura, transform: [{ rotate: '-38deg' }],
      }]} />
    </View>
  );
}

const s = StyleSheet.create({ pieza: { position: 'absolute' } });
