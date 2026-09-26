import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '../../theme';
import { nombreVisible } from '../../data/nombresVisibles';
import { Presionable } from '../ui/Presionable';
import { FotoOscura } from '../ui/FotoOscura';
import { InsigniaFoto } from '../ui/InsigniaFoto';
import { EstrellaFavorito } from './EstrellaFavorito';

export const ANCHO_TARJETA_PROGRAMA = 240;
export const ALTO_FOTO_PROGRAMA = 150;
const CAPAS_DE_LA_PILA = [4, 8];

export interface ProgramaHoy { id: string; nombre: string; semanas: number; favorito: boolean }

/**
 * Tarjeta de programa de 240 px con el efecto de pila en version compacta: dos
 * tarjetas detras, desplazadas 4 y 8 px. La duracion sale una sola vez, en la
 * insignia sobre la foto («12 sem»); no se repite bajo el titulo.
 */
export function TarjetaPrograma({ p, onPress, onFavorito }: {
  p: ProgramaHoy;
  onPress: () => void;
  onFavorito: () => void;
}) {
  const nombre = nombreVisible(p.nombre);
  return (
    <View style={s.caja}>
      {CAPAS_DE_LA_PILA.map(d => (
        <View key={d} style={[s.capa, { left: d * 2, right: d * 2, top: d, opacity: 1 - d * 0.04 }]} />
      ))}
      <Presionable onPress={onPress} etiqueta={`${nombre}, ${p.semanas} semanas`}>
        <View>
          <FotoOscura
            tipo="programa" id={p.id} ancho={ANCHO_TARJETA_PROGRAMA} alto={ALTO_FOTO_PROGRAMA}
            radioEsquina={20} alturaVelo="30%"
          />
          <View style={s.insignia}><InsigniaFoto numero={p.semanas} unidad="sem" /></View>
        </View>
        <Text style={s.titulo} numberOfLines={2}>{nombre}</Text>
      </Presionable>
      <View style={s.estrella}>
        <EstrellaFavorito activo={p.favorito} onPress={onFavorito} nombre={nombre} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: { width: ANCHO_TARJETA_PROGRAMA, paddingBottom: 8 },
  capa: {
    position: 'absolute', height: ALTO_FOTO_PROGRAMA, borderRadius: 20,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  insignia: { position: 'absolute', bottom: 8, left: 8 },
  estrella: { position: 'absolute', top: 6, right: 6 },
  titulo: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 21, color: paleta.magnesia, marginTop: 18 },
});
