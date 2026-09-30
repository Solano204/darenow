import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia, MARGEN_PANTALLA } from '@/theme';
import { filaDeHistorial } from '@/utils/perfil';
import { plural } from '@/utils/plural';
import { Huella } from '@/components/fx/Huella';

const ALTO = 64;
const LADO_HUELLA = 14;

/**
 * Una sesion del historial en Yo, sin tarjeta: la fecha legible («Viernes 25 de septiembre», con el ano solo
 * si no es el actual) en Figtree 600 de 16, y a la derecha los minutos y las series con el numero en Big
 * Shoulders 700 de 18 y la unidad en Figtree 13. A la izquierda, la huella de 14 px: en contorno si la sesion
 * fue corta y rellena si llego a 25 minutos (el mismo criterio del calendario). Alto de 64 con un separador
 * de 1 px. No es tocable: hoy tampoco lo era.
 */
export function FilaHistorial({ sesion }: { sesion: { fecha: string; duracionS: number; series: readonly { omitida?: boolean }[] } }) {
  const f = filaDeHistorial(sesion);
  const series = plural(f.series, 'serie', 'series');
  return (
    <View style={s.fila} accessible accessibilityLabel={`${f.fecha}. ${f.minutos} min. ${f.series} ${series}.`}>
      <View style={s.interior} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Huella lado={LADO_HUELLA} contorno={!f.largo} color={f.largo ? paleta.magnesia : paleta.magnesia2} opacidad={1} />
        <Text style={s.fecha} numberOfLines={2} maxFontSizeMultiplier={1.3}>{f.fecha}</Text>
        <View style={s.dato}>
          <Text style={s.numero} maxFontSizeMultiplier={1.3}>{f.minutos}</Text>
          <Text style={s.unidad} maxFontSizeMultiplier={1.3}>min</Text>
        </View>
        <View style={s.dato}>
          <Text style={s.numero} maxFontSizeMultiplier={1.3}>{f.series}</Text>
          <Text style={s.unidad} maxFontSizeMultiplier={1.3}>{series}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { minHeight: ALTO, marginHorizontal: MARGEN_PANTALLA, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde },
  interior: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  fecha: { flex: 1, fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
  dato: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  numero: { fontFamily: familia.titulo, fontSize: 18, lineHeight: 22, color: paleta.magnesia },
  unidad: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
});
