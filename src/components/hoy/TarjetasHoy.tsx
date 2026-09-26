import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, tinte, tipo } from '../../theme';
import { fuente, type TipoFoto } from '../../media/registry';
import { CATEGORIAS, type Ejercicio, type Musculo, type Tip } from '../../data/catalog';
import { nombreVisible } from '../../data/nombresVisibles';
import { Presionable } from '../ui/Presionable';
import { FotoOscura } from '../ui/FotoOscura';
import { EstrellaFavorito } from './EstrellaFavorito';

export const ANCHO_EJERCICIO_MINI = 150;
export const ALTO_EJERCICIO_MINI = 104;
export const ANCHO_MUSCULO = 140;
export const ALTO_MUSCULO = 112;
export const ANCHO_ARTICULO = 220;
export const ALTO_ARTICULO = 124;

/** Tarjeta comun de las filas de descubrimiento: foto tratada, titulo completo y, si se pide, insignia y estrella. */
function TarjetaFoto({
  tipoFoto, id, ancho, altoFoto, titulo, lineas, sub, insignia, favorito, onFavorito, onPress, etiqueta,
}: {
  tipoFoto: TipoFoto;
  id: string;
  ancho: number;
  altoFoto: number;
  titulo: string;
  lineas: number;
  sub?: string;
  insignia?: string;
  favorito?: boolean;
  onFavorito?: () => void;
  onPress: () => void;
  etiqueta: string;
}) {
  return (
    <View style={{ width: ancho }}>
      <Presionable onPress={onPress} etiqueta={etiqueta}>
        <FotoOscura tipo={tipoFoto} id={id} ancho={ancho} alto={altoFoto} radioEsquina={20} />
        {insignia ? <View style={s.insignia}><Text style={s.insigniaTexto}>{insignia}</Text></View> : null}
        <Text style={s.titulo} numberOfLines={lineas}>{titulo}</Text>
        {sub ? <Text style={s.sub} numberOfLines={1}>{sub}</Text> : null}
      </Presionable>
      {onFavorito ? (
        <View style={s.estrella}><EstrellaFavorito activo={!!favorito} onPress={onFavorito} nombre={titulo} /></View>
      ) : null}
    </View>
  );
}

export function TarjetaEjercicioMini({ e, favorito, onPress, onFavorito }: {
  e: Ejercicio; favorito: boolean; onPress: () => void; onFavorito: () => void;
}) {
  const nombre = nombreVisible(e.name);
  const categoria = CATEGORIAS.find(c => c.id === e.category)?.nombre ?? e.category;
  return (
    <TarjetaFoto
      tipoFoto="ejercicio" id={e.id} ancho={ANCHO_EJERCICIO_MINI} altoFoto={ALTO_EJERCICIO_MINI}
      titulo={nombre} lineas={2} sub={categoria} favorito={favorito} onFavorito={onFavorito}
      onPress={onPress} etiqueta={`${nombre}, ${categoria}`}
    />
  );
}

/**
 * Ficha de un musculo. Si trabaja en la sesion de hoy lleva la insignia «Hoy» y,
 * cuando existe `<id>_hoy` (la version con el musculo resaltado, ver
 * `docs/IMAGENES.md`), se usa esa imagen.
 */
export function FichaMusculo({ m, trabajaHoy, onPress }: { m: Musculo; trabajaHoy: boolean; onPress: () => void }) {
  const idFoto = trabajaHoy && fuente('musculo', `${m.id}_hoy`) ? `${m.id}_hoy` : m.id;
  return (
    <TarjetaFoto
      tipoFoto="musculo" id={idFoto} ancho={ANCHO_MUSCULO} altoFoto={ALTO_MUSCULO}
      titulo={m.name} lineas={2} insignia={trabajaHoy ? 'Hoy' : undefined}
      onPress={onPress} etiqueta={trabajaHoy ? `${m.name}, se trabaja hoy` : m.name}
    />
  );
}

export function TarjetaArticulo({ t, sala, favorito, onPress, onFavorito }: {
  t: Tip; sala?: string; favorito: boolean; onPress: () => void; onFavorito: () => void;
}) {
  return (
    <TarjetaFoto
      tipoFoto="tip" id={t.id} ancho={ANCHO_ARTICULO} altoFoto={ALTO_ARTICULO}
      titulo={t.titulo} lineas={3} sub={sala} favorito={favorito} onFavorito={onFavorito}
      onPress={onPress} etiqueta={sala ? `${t.titulo}, ${sala}` : t.titulo}
    />
  );
}

const s = StyleSheet.create({
  insignia: {
    position: 'absolute', top: 8, left: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
    backgroundColor: tinte.notaEntrenador, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  insigniaTexto: { ...tipo.dato, color: paleta.magnesia },
  estrella: { position: 'absolute', top: 4, right: 4 },
  titulo: { ...tipo.h3, color: paleta.magnesia, marginTop: 10 },
  sub: { ...tipo.pie, color: paleta.magnesia2, marginTop: 2 },
});
