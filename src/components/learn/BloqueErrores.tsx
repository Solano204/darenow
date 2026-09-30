import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia, MARGEN_PANTALLA } from '@/theme';
import { ERRORES } from '@/data/catalog';
import { textoVisible } from '@/utils/presentacion';
import { relacionadosVista, textoDeLectura, type RelacionadoVista } from '@/utils/aprender';
import { FilaRelacionados } from './TarjetaRelacionada';
import { TarjetaEnSuLugar } from './TarjetaEnSuLugar';
import { TituloBloque } from './TituloBloque';

/**
 * «Errores de ejecución más frecuentes», al pie de Mitos: por cada error, lo que pasa y por que
 * importa, la correccion (en su tarjeta verde, ya puesta) y los ejercicios donde se ve, con su
 * nombre. Mismo contenido y mismos ejercicios de siempre; cada uno lleva a su ficha.
 */
export function BloqueErrores({ onAbrir }: { onAbrir: (r: RelacionadoVista) => void }) {
  const errores = useMemo(() => ERRORES.map(e => ({ e, ejercicios: relacionadosVista(e.ejercicios) })), []);
  return (
    <View style={s.bloque}>
      <View style={s.margen}><TituloBloque>Errores de ejecución más frecuentes</TituloBloque></View>
      {errores.map(({ e, ejercicios }) => (
        <View key={e.id} style={s.error}>
          <View style={s.margen}>
            <Text style={s.titulo} maxFontSizeMultiplier={1.3}>{textoVisible(e.error)}</Text>
            <Text style={s.porQue} maxFontSizeMultiplier={1.3}>{textoDeLectura(e.por_que_importa)}</Text>
            <View style={s.correccion}>
              <TarjetaEnSuLugar texto={textoDeLectura(e.correccion)} activo animar={false} tamano="normal" />
            </View>
          </View>
          {ejercicios.length > 0 && (
            <View style={s.ejercicios}><FilaRelacionados relacionados={ejercicios} onAbrir={onAbrir} /></View>
          )}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bloque: { marginTop: 40 },
  margen: { marginHorizontal: MARGEN_PANTALLA },
  error: { marginBottom: 32 },
  titulo: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 23, color: paleta.magnesia },
  porQue: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2, marginTop: 6 },
  correccion: { marginTop: 12 },
  ejercicios: { marginTop: 16 },
});
