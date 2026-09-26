import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, resorteMagnesia } from '../../theme';
import { Entrada } from '../fx/Entrada';
import { TarjetaConFilo } from '../ui/TarjetaConFilo';

const DESDE_LA_IZQUIERDA_PX = -8;

/**
 * «Lo que suele pasar»: una tarjeta con un filo izquierdo de 3 px en `placaAmarilla` (el mismo
 * significado que «Zonas de riesgo» y «Parcial»: atencion). El titulo va en tipo oracion, Figtree
 * 600 de 14 en `placaAmarilla` con un icono de advertencia de 16, y el texto en Figtree 16/24
 * `magnesia`. Entra con un fundido y 8 px desde la izquierda al aparecer (`activo`), una vez.
 */
export function TarjetaLoQueSuelePasar({ texto, activo, titulo = 'Lo que suele pasar', animar = true, icono = 'warning-outline', compacto }: {
  texto: string;
  activo: boolean;
  /** El titulo en tipo oracion: «Lo que suele pasar» en la ficha de un musculo; otro en la advertencia de un protocolo de medicion. */
  titulo?: string;
  /** Sin animacion de entrada (una tarjeta que aparece dentro de una fila que ya se anima). */
  animar?: boolean;
  /** El icono del titulo: una advertencia por defecto, un escudo en el filtro de lesiones de Ajustes. */
  icono?: React.ComponentProps<typeof Ionicons>['name'];
  /** Texto de 15/22 en lugar de 16/24 (Ajustes). */
  compacto?: boolean;
}) {
  return (
    <Entrada activo={activo} animar={animar} x={DESDE_LA_IZQUIERDA_PX} resorte={resorteMagnesia}>
      <TarjetaConFilo colorFilo={paleta.placaAmarilla}>
        <View style={s.titulo}>
          <Ionicons name={icono} size={16} color={paleta.placaAmarilla} />
          <Text style={s.tituloTexto} accessibilityRole="header">{titulo}</Text>
        </View>
        <Text style={[s.texto, compacto && s.textoCompacto]}>{texto}</Text>
      </TarjetaConFilo>
    </Entrada>
  );
}

const s = StyleSheet.create({
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tituloTexto: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20, color: paleta.placaAmarilla },
  texto: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 24, color: paleta.magnesia },
  textoCompacto: { fontSize: 15, lineHeight: 22 },
});
