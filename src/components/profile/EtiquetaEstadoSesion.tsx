import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia } from '../../theme';
import { textoDeEstadoSesion } from '../../utils/textosVisibles';

/**
 * El estado de una sesion del historial («Completa» o «Parcial») como una etiqueta neutra: fondo `gomaAlta`,
 * borde `gomaBorde`, radio 8, un circulo lleno (completa) o a medio llenar (parcial) de 12 px y el texto en Figtree
 * 600 de 13 `magnesia2`. No es una `InsigniaEvidencia`: el amarillo de «Parcial» es un veredicto cientifico y
 * aqui solo quiere decir «sesion incompleta». El texto es el de siempre.
 */
export function EtiquetaEstadoSesion({ estado }: { estado: string }) {
  const completa = estado === 'completada';
  const texto = textoDeEstadoSesion(estado);
  return (
    <View style={s.caja} accessible accessibilityLabel={`Sesión ${texto.toLowerCase()}`}>
      <Ionicons name={completa ? 'ellipse' : 'contrast'} size={12} color={paleta.magnesia2} />
      <Text style={s.texto} maxFontSizeMultiplier={1.3} importantForAccessibility="no-hide-descendants">{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  texto: { fontFamily: familia.enfasis, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
});
