import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '@/ui/theme';

/** Ancho de la columna de lectura: unos 62 caracteres por linea a 18 px. */
const ANCHO_COLUMNA = 560;
const SEPARACION_PARRAFOS = 20;

/**
 * El cuerpo de un articulo, de un mito o de una explicacion: Figtree 400 de 18/30 `magnesia` en una
 * columna de unos 62 caracteres por linea (en pantallas anchas la columna se centra). Los parrafos
 * se separan 20 px si el dato ya trae saltos de linea; si viene en un solo bloque no se parte.
 * Los numeros («4 semanas») se quedan en linea, sin estilo propio.
 */
export function CuerpoLectura({ texto }: { texto: string }) {
  const parrafos = texto.split(/\n+/).map(p => p.trim()).filter(Boolean);
  return (
    <View style={s.columna}>
      {parrafos.map((p, i) => (
        <Text key={i} style={[s.parrafo, i > 0 && s.siguiente]} maxFontSizeMultiplier={1.3}>{p}</Text>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  columna: { width: '100%', maxWidth: ANCHO_COLUMNA, alignSelf: 'center' },
  parrafo: { fontFamily: familia.cuerpo, fontSize: 18, lineHeight: 30, color: paleta.magnesia },
  siguiente: { marginTop: SEPARACION_PARRAFOS },
});
