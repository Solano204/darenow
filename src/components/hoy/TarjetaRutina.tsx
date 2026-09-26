import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, tinte, tipo } from '../../theme';
import { Presionable } from '../ui/Presionable';
import { FotoOscura } from '../ui/FotoOscura';
import { Huella } from '../fx/Huella';
import { EstrellaFavorito } from './EstrellaFavorito';
import { BarraRutina } from './BarraRutina';

export const ANCHO_TARJETA_RUTINA = 240;
const ALTO_FOTO = 150;

export interface RutinaHoy {
  id: string;
  nombre: string;
  min: number;
  mia: boolean;
  imagenId?: string;
  /** Solo rutinas propias. */
  ejercicios?: number;
  /** Solo rutinas propias: ya se hizo alguna sesion con ella. */
  hecha?: boolean;
}

/**
 * Tarjeta de rutina de 240 px: foto de 150 con el tratamiento de color, la
 * duracion una sola vez en una insignia y la estrella de favorito arriba a la
 * derecha. Las rutinas propias llevan ademas su barra de ejercicios y, si ya se
 * hicieron, una huella.
 */
export function TarjetaRutina({ r, favorito, onPress, onFavorito }: {
  r: RutinaHoy;
  favorito: boolean;
  onPress: () => void;
  onFavorito: () => void;
}) {
  const etiqueta = `${r.nombre}, ${r.min} minutos${r.mia ? ', rutina propia' : ''}`;
  return (
    <View style={s.caja}>
      <Presionable onPress={onPress} etiqueta={etiqueta}>
        <FotoOscura tipo="rutina" id={r.imagenId ?? r.id} ancho={ANCHO_TARJETA_RUTINA} alto={ALTO_FOTO} radioEsquina={20} />
        <View style={s.insignia}><Text style={s.insigniaTexto}>{r.min} min</Text></View>
        <Text style={s.titulo} numberOfLines={2}>{r.nombre}</Text>
        {r.mia && (
          <View style={s.propia}>
            <Text style={s.propiaTexto}>Mi rutina</Text>
            {r.ejercicios ? <BarraRutina pasos={r.ejercicios} /> : <View style={s.relleno} />}
            {r.hecha && <Huella lado={18} />}
          </View>
        )}
      </Presionable>
      <View style={s.estrella}>
        <EstrellaFavorito activo={favorito} onPress={onFavorito} nombre={r.nombre} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: { width: ANCHO_TARJETA_RUTINA },
  insignia: {
    position: 'absolute', top: 8, left: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
    backgroundColor: tinte.notaEntrenador, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  insigniaTexto: { ...tipo.dato, color: paleta.magnesia },
  estrella: { position: 'absolute', top: 4, right: 4 },
  titulo: { ...tipo.h3, color: paleta.magnesia, marginTop: 10 },
  propia: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  propiaTexto: { ...tipo.etiqueta, color: paleta.magnesia2 },
  relleno: { flex: 1 },
});
