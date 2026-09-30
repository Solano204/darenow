import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '@/theme';

const ALTO_ENCABEZADO_MES = 48;

/**
 * El encabezado de un mes del historial («Septiembre 2026»): Big Shoulders 700 de 20 en `magnesia3`, con la
 * altura fija que necesita el encabezado pegajoso que lo copia bajo la cabecera. Sin margen propio: lo pone quien
 * lo usa (la lista y la copia pegajosa). El lector de pantalla lo oye como un encabezado.
 */
export function EncabezadoMes({ nombre }: { nombre: string }) {
  return (
    <View style={s.caja} accessible accessibilityRole="header" accessibilityLabel={nombre}>
      <Text style={s.texto} maxFontSizeMultiplier={1.3} importantForAccessibility="no-hide-descendants">{nombre}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  caja: { height: ALTO_ENCABEZADO_MES, justifyContent: 'flex-end', paddingBottom: 8 },
  texto: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, color: paleta.magnesia3 },
});
