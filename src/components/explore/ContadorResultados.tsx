import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '../../theme';
import { plural } from '../../utils/plural';
import { Odometro } from '../fx/Odometro';

const ALTO_CONTADOR = 24;
const ANUNCIO_RETRASO_MS = 700;

/**
 * «30 rutinas»: el numero en Big Shoulders 20 y la unidad en Figtree 15, separados solo
 * al mostrarlos. El numero rueda hacia arriba o abajo cada vez que cambia (filtro,
 * busqueda o segmento). El lector de pantalla oye la frase entera y la vuelve a oir al
 * cambiar (region viva en Android; en iOS, un aviso tras dejar de teclear).
 * `derecha` es lo que va al otro lado de la linea (la fila crece hasta su alto) y
 * `junto` lo que va pegado a la unidad.
 */
export function ContadorResultados({ cuantos, singular, plural: pluralUnidad, derecha, junto }: {
  cuantos: number;
  singular: string;
  plural: string;
  derecha?: React.ReactNode;
  junto?: React.ReactNode;
}) {
  const unidad = plural(cuantos, singular, pluralUnidad);
  const frase = `${cuantos} ${unidad}`;
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    if (Platform.OS !== 'ios') return;
    const id = setTimeout(() => AccessibilityInfo.announceForAccessibility(frase), ANUNCIO_RETRASO_MS);
    return () => clearTimeout(id);
  }, [frase]);

  return (
    <View style={s.fila}>
      <View
        style={s.cifra} accessible accessibilityRole="text" accessibilityLabel={frase} accessibilityLiveRegion="polite"
      >
        <Odometro valor={cuantos} continuo estilo={s.numero} />
        <Text style={s.unidad} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{unidad}</Text>
        {junto}
      </View>
      {derecha}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { minHeight: ALTO_CONTADOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cifra: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  numero: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, color: paleta.magnesia },
  unidad: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 24, color: paleta.magnesia2 },
});
