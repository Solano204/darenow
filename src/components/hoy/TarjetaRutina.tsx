import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { paleta, conAlfa, familia } from '../../theme';
import { nombreVisible } from '../../data/nombresVisibles';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { Presionable } from '../ui/Presionable';
import { FotoOscura } from '../ui/FotoOscura';
import { Huella } from '../fx/Huella';
import { EstrellaFavorito } from './EstrellaFavorito';
import { BarraRutina } from './BarraRutina';
import type { Progreso } from '../fx/CarruselProfundidad';

export const ANCHO_TARJETA_RUTINA = 240;
export const ALTO_FOTO_RUTINA = 150;
const PASO = ANCHO_TARJETA_RUTINA + 16;
/** La foto interior se mueve al 85 % de la velocidad del carrusel: un 15 % del desplazamiento, con este tope. */
const FRACCION_PARALLAX = 0.15;
const TOPE_PARALLAX = 12;
const ESCALA_FOTO = 1 + (2 * TOPE_PARALLAX) / ANCHO_TARJETA_RUTINA + 0.02;
const ZOOM_PRESIONADO = 0.04;

export interface RutinaHoy {
  id: string;
  nombre: string;
  min: number;
  mia: boolean;
  imagenId?: string;
  /** Dato util distinto de la duracion (solo rutinas del catalogo: su objetivo). */
  subtitulo?: string;
  /** Solo rutinas propias. */
  ejercicios?: number;
  /** Solo rutinas propias: ya se hizo alguna sesion con ella. */
  hecha?: boolean;
}

/**
 * Tarjeta de rutina de 240 px: foto de 150 con el tratamiento de color, la
 * duracion una sola vez en una insignia abajo a la izquierda y la estrella de
 * favorito arriba a la derecha. Las rutinas propias llevan ademas su barra de
 * ejercicios y, si ya se hicieron, una huella de 12 px. Al presionar se hunde un
 * 3 % y la foto hace un zoom de 1.04.
 */
export function TarjetaRutina({ r, progreso, favorito, onPress, onFavorito }: {
  r: RutinaHoy;
  progreso: Progreso;
  favorito: boolean;
  onPress: () => void;
  onFavorito: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const nombre = nombreVisible(r.nombre);
  const etiqueta = `${nombre}, ${r.min} minutos${r.mia ? ', rutina propia' : ''}`;

  const foto = useAnimatedStyle(() => {
    if (reducido) return { transform: [{ scale: 1 }] };
    const tope = TOPE_PARALLAX / FRACCION_PARALLAX;
    return {
      transform: [
        { scale: ESCALA_FOTO + ZOOM_PRESIONADO * presion.value },
        { translateX: interpolate(progreso.value * PASO, [-tope, tope], [-TOPE_PARALLAX, TOPE_PARALLAX], Extrapolation.CLAMP) },
      ],
    };
  }, [reducido, tick]);

  return (
    <View style={s.caja}>
      <Presionable onPress={onPress} etiqueta={etiqueta} presion={presion}>
        <View>
          <FotoOscura
            tipo="rutina" id={r.imagenId ?? r.id} ancho={ANCHO_TARJETA_RUTINA} alto={ALTO_FOTO_RUTINA}
            radioEsquina={20} alturaVelo="30%" estiloImagen={foto}
          />
          <View style={s.insignia}>
            <Text style={s.insigniaNumero}>{r.min}</Text>
            <Text style={s.insigniaUnidad}>min</Text>
          </View>
        </View>
        <Text style={s.titulo} numberOfLines={2}>{nombre}</Text>
        {r.mia ? (
          <View style={s.propia}>
            <Text style={s.subtitulo}>Mi rutina</Text>
            {r.ejercicios ? <BarraRutina pasos={r.ejercicios} /> : <View style={s.relleno} />}
            {r.hecha && <Huella lado={12} />}
          </View>
        ) : r.subtitulo ? (
          <Text style={s.subtitulo} numberOfLines={1}>{r.subtitulo}</Text>
        ) : null}
      </Presionable>
      <View style={s.estrella}>
        <EstrellaFavorito activo={favorito} onPress={onFavorito} nombre={nombre} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: { width: ANCHO_TARJETA_RUTINA },
  insignia: {
    position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'baseline', gap: 3,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, backgroundColor: conAlfa(paleta.goma, 0.8),
  },
  insigniaNumero: { fontFamily: familia.titulo, fontSize: 16, lineHeight: 20, color: paleta.magnesia },
  insigniaUnidad: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  estrella: { position: 'absolute', top: 6, right: 6 },
  titulo: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 21, color: paleta.magnesia, marginTop: 10 },
  subtitulo: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  propia: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  relleno: { flex: 1 },
});
