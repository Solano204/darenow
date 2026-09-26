import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '../../theme';
import { TarjetaConFilo } from '../ui/TarjetaConFilo';
import { TituloSeccion } from '../exercise/TituloSeccion';

/**
 * «Qué esperar»: la promesa honesta del programa (no promete una cifra y explica por que),
 * como cierre fuerte y no como letra chica. Una tarjeta con un filo izquierdo de 3 px en
 * `placaVerde` (lo que si puedes esperar es lo comprobado). El texto se conserva integro, en
 * Figtree 17/26 `magnesia`: sube de gris a principal.
 */
export function TarjetaQueEsperar({ texto }: { texto: string }) {
  return (
    <View>
      <TituloSeccion titulo="Qué esperar" />
      <TarjetaConFilo colorFilo={paleta.placaVerde}>
        <Text style={s.texto}>{texto}</Text>
      </TarjetaConFilo>
    </View>
  );
}

const s = StyleSheet.create({
  texto: { fontFamily: familia.cuerpo, fontSize: 17, lineHeight: 26, color: paleta.magnesia },
});
