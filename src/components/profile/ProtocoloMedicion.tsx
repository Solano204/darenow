import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SharedValue } from 'react-native-reanimated';
import { paleta, familia } from '../../theme';
import type { Protocolo } from '../../data/catalog';
import { textoVisible } from '../../utils/presentacion';
import { NotaEntrenador } from '../ui/NotaEntrenador';
import { ListaClaves } from '../exercise/ListaClaves';
import { PasosLineaTiempo } from '../exercise/PasosLineaTiempo';
import { TarjetaLoQueSuelePasar } from '../muscles/TarjetaLoQueSuelePasar';

/**
 * Lo que trae un protocolo de medicion cuando se abre, en el orden de siempre: las condiciones fijas como una
 * lista de verificacion (una palomita verde por fila), los pasos como una linea de tiempo compacta (circulos de
 * 24 unidos por un riel; el numero lo pone el circulo), la advertencia en una tarjeta con filo amarillo y el margen
 * de error en una nota con barra `magnesia3` e icono de informacion (el azul se reserva para «Guardar»). `campo`
 * es la captura del valor. Devuelve un fragmento: sus bloques son hijos directos de la fila, asi la linea de
 * tiempo puede medir su posicion. `y` es el scroll ya desplazado hasta esa fila.
 */
export function ProtocoloMedicion({ p, y, campo }: { p: Protocolo; y: SharedValue<number>; campo?: React.ReactNode }) {
  return (
    <>
      <View style={s.bloque}>
        <Text style={s.subtitulo} accessibilityRole="header" maxFontSizeMultiplier={1.3}>Condiciones fijas</Text>
        <ListaClaves claves={p.condiciones_fijas} activo />
      </View>

      {p.pasos && p.pasos.length > 0 ? (
        <PasosLineaTiempo
          compacto y={y} pasos={p.pasos.map(textoVisible)} estilo={s.bloque}
          titulo={<Text style={[s.subtitulo, s.tituloPasos]} accessibilityRole="header" maxFontSizeMultiplier={1.3}>Pasos</Text>}
        />
      ) : null}

      {p.advertencia ? (
        <View style={s.bloque}>
          <TarjetaLoQueSuelePasar texto={textoVisible(p.advertencia)} titulo="Ten en cuenta" activo animar={false} />
        </View>
      ) : null}

      {p.interpretacion ? (
        <View style={s.bloque}>
          <NotaEntrenador colorBarra={paleta.magnesia3} estilo={s.nota}>
            <View style={s.margen} accessible accessibilityLabel={textoVisible(p.interpretacion)}>
              <Ionicons name="information-circle-outline" size={16} color={paleta.magnesia2} style={s.icono} />
              <Text style={s.margenTexto} maxFontSizeMultiplier={1.3} importantForAccessibility="no-hide-descendants">
                {textoVisible(p.interpretacion)}
              </Text>
            </View>
          </NotaEntrenador>
        </View>
      ) : null}

      {campo ? <View style={s.bloque}>{campo}</View> : null}
    </>
  );
}

const s = StyleSheet.create({
  bloque: { marginTop: 16 },
  subtitulo: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20, color: paleta.magnesia2, marginBottom: 6 },
  tituloPasos: { marginBottom: 10 },
  nota: { alignSelf: 'stretch' },
  margen: { flexDirection: 'row', gap: 8 },
  icono: { marginTop: 2 },
  margenTexto: { flex: 1, fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
});
