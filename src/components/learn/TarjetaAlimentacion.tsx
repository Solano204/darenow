import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '@/theme';
import { NUTRICION } from '@/data/catalog';
import { textoVisible } from '@/utils/presentacion';
import { textoDeLectura } from '@/utils/aprender';
import { Entrada } from '@/components/fx/Entrada';
import { TarjetaGoma } from '@/components/ui/TarjetaGoma';
import { FotoOscura } from '@/components/ui/FotoOscura';
import { TarjetaEnSuLugar } from './TarjetaEnSuLugar';

type Concepto = (typeof NUTRICION)['conceptos'][number];

const LADO_MINIATURA = 48;
/** Solo las dos primeras tarjetas entran en la carga inicial, escalonadas 60 ms. */
const TARJETAS_CON_ENTRADA = 2;
const ESCALONADO_MS = 60;
const DESPLAZAMIENTO_PX = 16;

/**
 * Un concepto de alimentacion: la miniatura de 48 (radio 12) con el titulo en Big Shoulders 700 de
 * 20, el cuerpo completo en Figtree 16/25 y, si trae implicacion, el consejo practico en una
 * `TarjetaEnSuLugar` con flecha (es una accion, no un veredicto). `activo` es cuando la tarjeta entra
 * en pantalla: ahi el filo verde del consejo crece.
 */
export function TarjetaAlimentacion({ concepto, indice, activo }: { concepto: Concepto; indice: number; activo: boolean }) {
  return (
    <Entrada
      activo animar={indice < TARJETAS_CON_ENTRADA} retraso={indice * ESCALONADO_MS} y={DESPLAZAMIENTO_PX}
      estilo={s.caja}
    >
      <TarjetaGoma>
        <View style={s.cabeza}>
          <FotoOscura tipo="tip" id={concepto.id} ancho={LADO_MINIATURA} alto={LADO_MINIATURA} radioEsquina={12} velo={false} />
          <Text style={s.titulo} accessibilityRole="header" maxFontSizeMultiplier={1.3}>{textoVisible(concepto.titulo)}</Text>
        </View>
        <Text style={s.cuerpo} maxFontSizeMultiplier={1.3}>{textoDeLectura(concepto.cuerpo)}</Text>
        {concepto.implicacion ? (
          <View style={s.consejo}>
            <TarjetaEnSuLugar texto={textoDeLectura(concepto.implicacion)} activo={activo} icono="flecha" tamano="normal" haptica={false} />
          </View>
        ) : null}
      </TarjetaGoma>
    </Entrada>
  );
}

const s = StyleSheet.create({
  caja: { marginBottom: 16 },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { flex: 1, fontFamily: familia.titulo, fontSize: 20, lineHeight: 23, color: paleta.magnesia },
  cuerpo: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 25, color: paleta.magnesia2, marginTop: 14 },
  consejo: { marginTop: 16 },
});
