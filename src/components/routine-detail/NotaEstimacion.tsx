import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia } from '../../theme';
import { NotaEntrenador } from '../ui/NotaEntrenador';

/**
 * La nota de gasto calorico como lo que es, una frase honesta de la marca: barra lateral
 * `magnesia3` (no azul), un icono de informacion y el valor («~110 kcal») en Big Shoulders 22
 * con el resto en Figtree 15. El texto es el de siempre; solo se separa el valor al mostrarlo.
 */
export function NotaEstimacion({ kcal }: { kcal: number }) {
  return (
    <NotaEntrenador colorBarra={paleta.magnesia3} estilo={s.nota}>
      <View
        style={s.fila} accessible
        accessibilityLabel={`Gasto aproximado para 70 kg: ~${kcal} kcal. Es una estimación poblacional, no una medida de tu cuerpo.`}
      >
        <Ionicons name="information-circle-outline" size={16} color={paleta.magnesia3} style={s.icono} />
        <Text style={s.texto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          Gasto aproximado para 70 kg: <Text style={s.valor}>~{kcal} kcal</Text>. Es una estimación poblacional, no una medida de tu cuerpo.
        </Text>
      </View>
    </NotaEntrenador>
  );
}

const s = StyleSheet.create({
  nota: { alignSelf: 'stretch' },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  icono: { marginTop: 3 },
  texto: { flex: 1, fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2 },
  valor: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 22, color: paleta.magnesia },
});
