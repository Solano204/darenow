import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, conAlfa, familia } from '@/ui/theme';

type Icono = keyof typeof Ionicons.glyphMap;

/**
 * Dato sobre una foto en una pastilla `goma` al 80 %: el numero en Big Shoulders 16 y la
 * unidad en Figtree 13 («15 min», «12 sem»). Quien la usa la coloca con una vista absoluta.
 */
export function InsigniaFoto({ numero, unidad }: { numero: number; unidad: string }) {
  return (
    <View style={s.pastilla}>
      <Text style={s.numero}>{numero}</Text>
      <Text style={s.unidad}>{unidad}</Text>
    </View>
  );
}

/** Etiqueta de texto con icono sobre una foto («Silenciosa»), con la misma pastilla. */
export function EtiquetaFoto({ icono, texto }: { icono: Icono; texto: string }) {
  return (
    <View style={[s.pastilla, s.etiqueta]}>
      <Ionicons name={icono} size={14} color={paleta.magnesia2} />
      <Text style={s.unidad}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pastilla: {
    flexDirection: 'row', alignItems: 'baseline', gap: 3, paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 8, backgroundColor: conAlfa(paleta.goma, 0.8),
  },
  etiqueta: { alignItems: 'center', gap: 4 },
  numero: { fontFamily: familia.titulo, fontSize: 16, lineHeight: 20, color: paleta.magnesia },
  unidad: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
});
