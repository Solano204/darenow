import React, { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { paleta, radio, degradado, conAlfa } from '../../theme';
import { fuente, type TipoFoto } from '../../media/registry';
import { Esqueleto } from '../fx/Esqueleto';

/** Exposicion de las fotos claras del catalogo sobre la goma: el equivalente barato al tratamiento de Skia. */
const EXPOSICION = 0.8;

/**
 * Foto de lista con el tratamiento Goma y Magnesia: la imagen baja de
 * exposicion sobre `gomaAlta`, con un velo que la funde a goma por abajo y un
 * esqueleto mientras decodifica. Sin archivo muestra un glifo, no un hueco.
 * Es `expo-image` con cache en memoria y disco: apta para listas largas (el
 * tratamiento con Skia se reserva para las fotos grandes, un `Canvas` por
 * tarjeta no escala). `estiloImagen` admite un estilo animado de parallax.
 */
export function FotoOscura({
  tipo, id, ancho, alto, radioEsquina = radio.foto, velo = true, alturaVelo = '55%', fondoVelo, fondo, exposicion, estilo, estiloImagen,
}: {
  tipo: TipoFoto;
  id: string;
  ancho: number | `${number}%`;
  alto: number;
  radioEsquina?: number;
  velo?: boolean;
  /** Alto del degradado a goma sobre la foto, desde abajo. */
  alturaVelo?: `${number}%`;
  /** Color al que se funde el velo (por defecto `goma`; una tarjeta de `gomaAlta` pide ese). */
  fondoVelo?: string;
  /** Color de la superficie sobre la que va la foto (por defecto `gomaAlta`; los renders de musculos, con fondo claro, piden `magnesia`). */
  fondo?: string;
  /** Opacidad de la foto sobre esa superficie (0.8 por defecto; 1 la deja tal cual). */
  exposicion?: number;
  estilo?: StyleProp<ViewStyle>;
  estiloImagen?: React.ComponentProps<typeof Animated.View>['style'];
}) {
  const src = fuente(tipo, id);
  const [lista, setLista] = useState(false);

  return (
    <View style={[{ width: ancho, height: alto, borderRadius: radioEsquina }, s.caja, fondo ? { backgroundColor: fondo } : null, estilo]}>
      {src ? (
        <Animated.View style={[s.llena, estiloImagen]}>
          <Image
            source={src} style={exposicion === undefined ? s.imagen : [s.imagen, { opacity: exposicion }]} contentFit="cover" transition={200}
            cachePolicy="memory-disk" recyclingKey={id} onLoad={() => setLista(true)}
          />
        </Animated.View>
      ) : (
        <View style={s.hueco}><Ionicons name="barbell-outline" size={26} color={paleta.magnesia3} /></View>
      )}
      {src && !lista && <Esqueleto radioEsquina={radioEsquina} />}
      {velo && (
        <LinearGradient
          colors={fondoVelo ? [conAlfa(fondoVelo, 0), fondoVelo] : degradado.haciaGoma} pointerEvents="none" style={[s.velo, { height: alturaVelo }]}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  caja: { overflow: 'hidden', backgroundColor: paleta.gomaAlta },
  llena: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  imagen: { width: '100%', height: '100%', opacity: EXPOSICION },
  hueco: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  velo: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
