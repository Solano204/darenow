import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import type { Programa } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { Tocable } from '@/ui/components/Tocable';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { TextoDesvanecido } from '@/ui/components/TextoDesvanecido';
import { BarraCarga13 } from '@/ui/fx/BarraCarga13';

const LADO_FOTO = 72;

/**
 * «Tu programa»: la foto de 72, el nombre completo, la descripcion en dos
 * lineas que se desvanecen (sin puntos suspensivos) y el avance: «Semana N de M»
 * con una placa por semana (`BarraCarga13`), la actual en azul. Toda la tarjeta
 * lleva al programa, como antes.
 */
export function TuPrograma({ programa, semanaActual, onPress }: {
  programa: Programa;
  semanaActual: number;
  onPress: () => void;
}) {
  const total = Math.max(1, programa.semanas);
  const actual = Math.min(Math.max(semanaActual, 1), total);
  const nombre = nombreVisible(programa.name);
  return (
    <View style={s.raiz}>
      <Tocable onPress={onPress} etiqueta={`${nombre}. Semana ${actual} de ${total}`} rol="link" estilo={s.caja}>
        <View style={s.fila}>
          <FotoOscura tipo="programa" id={programa.id} ancho={LADO_FOTO} alto={LADO_FOTO} radioEsquina={16} velo={false} />
          <View style={s.textos}>
            <Text style={s.nombre} numberOfLines={2}>{nombre}</Text>
            <TextoDesvanecido texto={programa.desc} lineas={2} alturaLinea={20} estilo={s.descripcion} />
          </View>
        </View>
        <View style={s.avance} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={s.semana}>
            Semana <Text style={s.semanaNumero}>{actual}</Text> de {total}
          </Text>
          <BarraCarga13 total={total} actual={actual} compacta />
        </View>
      </Tocable>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  caja: {
    padding: 16, borderRadius: 24, gap: 12,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  textos: { flex: 1, gap: 2 },
  nombre: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 21, color: paleta.magnesia },
  descripcion: { fontFamily: familia.cuerpo, fontSize: 14, color: paleta.magnesia2 },
  avance: { gap: 8 },
  semana: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  semanaNumero: { fontFamily: familia.titulo, fontSize: 16, color: paleta.magnesia },
});
