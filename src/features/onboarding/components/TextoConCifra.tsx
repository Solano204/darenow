import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { Odometro } from '@/ui/fx/Odometro';

const ESCALA_CIFRA = 1.2;

/** Texto donde una cifra rueda en un odometro; el resto va como texto normal, en la misma linea base. */
export function TextoConCifra({ texto, cifra, estilo, activo, animar, retraso }: {
  texto: string; cifra?: number; estilo: StyleProp<TextStyle>; activo: boolean; animar: boolean; retraso: number;
}) {
  if (cifra === undefined) return <Text style={estilo}>{texto}</Text>;
  const corte = texto.indexOf(String(cifra));
  const antes = texto.slice(0, corte);
  const despues = texto.slice(corte + String(cifra).length);

  return (
    <View accessible accessibilityLabel={texto}>
      <View style={s.filaCifra} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {antes !== '' && <Text style={estilo} maxFontSizeMultiplier={ESCALA_CIFRA}>{antes}</Text>}
        <Odometro valor={cifra} estilo={estilo} activo={activo} animar={animar} retraso={retraso} />
        {despues !== '' && <Text style={[estilo, s.resto]} maxFontSizeMultiplier={ESCALA_CIFRA}>{despues}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  filaCifra: { flexDirection: 'row', alignItems: 'baseline' },
  resto: { flexShrink: 1 },
});
