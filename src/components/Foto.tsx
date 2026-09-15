/**
 * FORJA · Foto
 *
 * Un solo componente para toda imagen de la app. Si el archivo esta en el
 * registro, lo muestra. Si no, no pinta nada: mejor un hueco vacio que un
 * marcador tapando el resto de la fila o tarjeta.
 */

import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { color, radio } from '../theme';
import { fuente, type TipoFoto } from '../media/registry';

export interface FotoProps {
  tipo: TipoFoto;
  id: string;
  nombre?: string;
  /** ancho y alto, o solo alto si va a lo ancho del contenedor */
  alto?: number;
  ancho?: number | '100%';
  forma?: 'circulo' | 'redonda' | 'tarjeta';
  /** @deprecated sin imagen el componente ya no pinta nada, este prop no hace nada */
  mostrarRuta?: boolean;
  estilo?: ViewStyle;
}

export default function Foto({
  tipo: t, id, alto = 64, ancho, forma = 'redonda', estilo,
}: FotoProps) {
  const src = fuente(t, id);
  if (!src) return null;

  const w = ancho ?? alto;
  const br =
    forma === 'circulo' ? alto / 2 :
    forma === 'tarjeta' ? radio.tarjeta : radio.foto;

  return (
    <View style={[{
      height: alto,
      width: w as ViewStyle['width'],
      borderRadius: br,
      overflow: 'hidden',
      backgroundColor: color.lienzo,
    }, estilo]}>
      <Image source={src} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
    </View>
  );
}
