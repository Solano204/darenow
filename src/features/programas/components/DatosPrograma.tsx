import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, familia } from '@/ui/theme';
import { nombreGoal } from '@/data/catalog';
import { plural } from '@/lib/plural';
import { PlacaDato } from '@/ui/components/PlacaDato';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';

const ESPERA_MS = 250;
const ESCALONADO_MS = 80;
const ANCHO_OBJETIVO = 84;
const TAMANO_NUMERO = 40;

/**
 * Los tres datos clave del programa como placas: semanas, dias por semana y minutos por
 * sesion, con el filo de arriba neutro (`magnesia3`); el numero se separa de la unidad solo en la
 * vista. Al lado, el objetivo con su icono. Las placas caen una tras otra y solo la ultima
 * da el golpe. En 360 px la unidad va abreviada («días/sem») y el lector de pantalla oye la
 * frase entera.
 */
export function DatosPrograma({ semanas, dias, minutos, objetivo }: {
  semanas: number;
  dias: number;
  minutos: number;
  /** Id del objetivo (`GOALS`). */
  objetivo: string;
}) {
  const nombre = nombreGoal(objetivo);
  return (
    <View style={s.fila}>
      <PlacaDato
        numero={semanas} etiqueta={plural(semanas, 'semana')} filo={paleta.magnesia3} tamano={TAMANO_NUMERO}
        retraso={ESPERA_MS} haptica={false}
      />
      <PlacaDato
        numero={dias} etiqueta={`${plural(dias, 'día')}/sem`} lector={`${plural(dias, 'día')} por semana`}
        filo={paleta.magnesia3} tamano={TAMANO_NUMERO} retraso={ESPERA_MS + ESCALONADO_MS} haptica={false}
      />
      <PlacaDato
        numero={minutos} etiqueta="min" lector="minutos por sesión" filo={paleta.magnesia3} tamano={TAMANO_NUMERO}
        retraso={ESPERA_MS + 2 * ESCALONADO_MS}
      />
      <View style={s.objetivo} accessible accessibilityLabel={`Objetivo: ${nombre}`}>
        <Ionicons name={ICONOS_OBJETIVO[objetivo] ?? 'flag-outline'} size={16} color={paleta.magnesia2} />
        <Text style={s.objetivoTexto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{nombre}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  objetivo: { width: ANCHO_OBJETIVO, justifyContent: 'center', gap: 6 },
  objetivoTexto: { fontFamily: familia.medio, fontSize: 14, lineHeight: 18, color: paleta.magnesia2 },
});
