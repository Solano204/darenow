import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, tipo, familia, MARGEN_PANTALLA } from '../../theme';
import { NotaEntrenador } from '../ui/NotaEntrenador';
import { Odometro } from '../fx/Odometro';
import { SieteDias } from '../profile/SieteDias';

const ESTILO_RACHA = { ...tipo.numero, fontSize: 48, lineHeight: 50, color: paleta.magnesia };

/**
 * Los dias seguidos (numero de 48 en `magnesia` que rueda, con «dias seguidos»
 * en minuscula debajo) y, a la derecha, los minutos de los ultimos siete dias como
 * el `SieteDias` de Yo en su version compacta (pilas de placas en 64 px). Sin fondo:
 * va agrupado con la franja de dias. Si la racha esta en pausa, la nota de siempre.
 * `activo` arranca las animaciones cuando el bloque entra en pantalla.
 */
export function TuSemana({ dias, enPausa, semana, activo }: {
  dias: number;
  enPausa: boolean;
  semana: { fecha: string; min: number }[];
  activo: boolean;
}) {
  const etiqueta = dias === 1 ? 'día seguido' : 'días seguidos';
  return (
    <View style={s.raiz}>
      <View style={s.fila}>
        <View style={s.racha} accessible accessibilityLabel={`${dias} ${etiqueta}`}>
          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Odometro valor={dias} continuo activo={activo} estilo={ESTILO_RACHA} />
          </View>
          <Text style={s.etiqueta}>{etiqueta}</Text>
        </View>
        <SieteDias semana={semana} activo={activo} compacto />
      </View>
      {enPausa && (
        <NotaEntrenador estilo={s.nota}>
          Tu racha está en pausa, no perdida. Entrena hoy y sigue desde donde estaba.
        </NotaEntrenador>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  fila: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  racha: { minWidth: 96 },
  etiqueta: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
  nota: { alignSelf: 'stretch', marginTop: 16 },
});
