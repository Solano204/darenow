/**
 * FORJA · vidrio
 *
 * Capa borrosa reutilizable. Se usa en las barras que flotan sobre
 * contenido (pestanas, cabeceras pegadas, banner de anuncio) y en las
 * superficies que se apoyan encima de una foto.
 *
 * Por que no ponerlo en todas partes: el desenfoque cuesta GPU y en
 * Android de gama baja se nota. Va solo donde hay algo detras que se
 * mueve; una tarjeta sobre fondo liso no gana nada y si pierde fluidez.
 * Para esas, el filo de luz de `Tarjeta` da el mismo efecto de vidrio a
 * coste cero.
 *
 * Sobre el tinte: en tema oscuro va `tint="dark"`. Un desenfoque claro
 * sobre fondo oscuro produce una niebla lechosa que ensucia el texto.
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { color, radio, filoLuz, sol, degradado, veloVidrio } from '@/ui/theme';

export interface VidrioProps {
  children?: React.ReactNode;
  intensidad?: number;
  estilo?: ViewStyle;
  /** redondeo; por defecto el de tarjeta */
  redondo?: number;
  /** velo oscuro por encima del desenfoque, para que el texto se lea */
  velo?: number;
  /** filo de luz en el canto, como en las tarjetas */
  filo?: boolean;
}

export default function Vidrio({
  children, intensidad = 40, estilo, redondo = radio.tarjeta, velo = 0.55, filo = true,
}: VidrioProps) {
  const cuerpo = (
    <View style={[{ borderRadius: redondo, overflow: 'hidden' }, filo ? null : estilo]}>
      <BlurView intensity={intensidad} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: veloVidrio(velo) }]} />
      {/* Brillo especular: el reflejo diagonal que lo hace parecer cristal. */}
      <LinearGradient
        colors={degradado.especular}
        start={sol.start} end={sol.end}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );

  if (!filo) return cuerpo;

  // Envoltura de 1px con el borde degradado: brilla del lado del sol.
  return (
    <LinearGradient
      colors={filoLuz} start={sol.start} end={sol.end}
      style={[{ borderRadius: redondo, padding: 1 }, estilo]}
    >
      <View style={{ borderRadius: redondo - 1, overflow: 'hidden' }}>
        <BlurView intensity={intensidad} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: veloVidrio(velo) }]} />
        <LinearGradient
          colors={degradado.especular}
          start={sol.start} end={sol.end}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {children}
      </View>
    </LinearGradient>
  );
}

/** Vidrio a pantalla completa, para fondos de modal. */
export function VidrioFondo({ children, intensidad = 26 }: {
  children?: React.ReactNode; intensidad?: number;
}) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={intensidad} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color.veloFondo }]} />
      {children}
    </View>
  );
}

/** Pastilla borrosa para poner encima de una foto (favoritos, etiquetas). */
export function VidrioPastilla({ children, tamano }: {
  children: React.ReactNode; tamano?: number;
}) {
  return (
    <View style={[
      st.pastilla,
      tamano ? { width: tamano, height: tamano, borderRadius: tamano / 2 } : null,
    ]}>
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color.veloPastilla }]} />
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  pastilla: {
    overflow: 'hidden', borderRadius: radio.pastilla,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: color.bordeVidrio,
  },
});
