import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia } from '@/ui/theme';
import { fuente, type TipoFoto } from '@/media/registry';
import {
  CATEGORIAS, evidenciaDe, type Ejercicio, type Musculo, type Tip,
} from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { textoVisible } from '@/lib/presentacion';
import { iconoDeSala, nombreDeSala } from '@/lib/aprender';
import { Presionable } from '@/ui/components/Presionable';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { NivelPlacas } from '@/ui/components/NivelPlacas';
import { contarVeredictos, resumenDeConteos } from '@/ui/components/MedidorEvidencia';
import { MiniMedidorEvidencia } from '@/ui/components/MiniMedidorEvidencia';
import { EstrellaFavorito } from '@/ui/components/EstrellaFavorito';

export const ANCHO_EJERCICIO_MINI = 150;
export const ALTO_EJERCICIO_MINI = 120;
export const LADO_MUSCULO = 112;
export const ANCHO_ARTICULO = 240;
export const ALTO_ARTICULO = 130;

/** Tarjeta comun de las filas de descubrimiento: foto tratada, titulo completo y, si se pide, estrella y un pie. */
function TarjetaFoto({
  tipoFoto, id, ancho, altoFoto, radioFoto, titulo, estiloTitulo, lineas, pie, favorito, onFavorito, onPress, etiqueta,
}: {
  tipoFoto: TipoFoto;
  id: string;
  ancho: number;
  altoFoto: number;
  radioFoto: number;
  titulo: string;
  estiloTitulo: StyleProp<TextStyle>;
  lineas: number;
  pie?: React.ReactNode;
  favorito?: boolean;
  onFavorito?: () => void;
  onPress: () => void;
  etiqueta: string;
}) {
  return (
    <View style={{ width: ancho }}>
      <Presionable onPress={onPress} etiqueta={etiqueta}>
        <FotoOscura tipo={tipoFoto} id={id} ancho={ancho} alto={altoFoto} radioEsquina={radioFoto} />
        <Text style={[s.titulo, estiloTitulo]} numberOfLines={lineas}>{titulo}</Text>
        {pie}
      </Presionable>
      {onFavorito ? (
        <View style={s.estrella}><EstrellaFavorito activo={!!favorito} onPress={onFavorito} nombre={titulo} /></View>
      ) : null}
    </View>
  );
}

/**
 * Ficha de «Ejercicios para ti» (150 de ancho): foto de 150x120, nombre completo
 * a 2 lineas, la categoria con su inicial en mayuscula y el nivel en placas, y
 * el mini medidor de evidencia de Explorar (32x4, un segmento por veredicto) si el
 * ejercicio tiene afirmaciones.
 */
export function TarjetaEjercicioMini({ e, favorito, onPress, onFavorito }: {
  e: Ejercicio; favorito: boolean; onPress: () => void; onFavorito: () => void;
}) {
  const nombre = nombreVisible(e.name);
  const categoria = CATEGORIAS.find(c => c.id === e.category)?.nombre ?? e.category;
  const conteos = useMemo(() => contarVeredictos(evidenciaDe(e).mapa), [e]);
  const evidencia = resumenDeConteos(conteos);
  return (
    <TarjetaFoto
      tipoFoto="ejercicio" id={e.id} ancho={ANCHO_EJERCICIO_MINI} altoFoto={ALTO_EJERCICIO_MINI} radioFoto={20}
      titulo={nombre} estiloTitulo={s.tituloMediano} lineas={2}
      pie={(
        <View style={s.datos}>
          <View style={s.categoriaFila}>
            <Text style={s.categoria} numberOfLines={1}>{categoria}</Text>
            <NivelPlacas nivel={e.level} />
          </View>
          <MiniMedidorEvidencia conteos={conteos} />
        </View>
      )}
      favorito={favorito} onFavorito={onFavorito}
      onPress={onPress} etiqueta={`${nombre}, ${categoria}, nivel ${e.level} de 3${evidencia ? `. Evidencia: ${evidencia}` : ''}`}
    />
  );
}

/**
 * Ficha de un musculo: cuadrada de 112 con radio 24 y el nombre debajo, completo
 * (hasta 2 lineas). Si el musculo trabaja en la sesion de hoy y existe `<id>_hoy`
 * (la version con el musculo resaltado, ver `docs/IMAGENES.md`), se usa esa imagen.
 */
export function FichaMusculo({ m, trabajaHoy, onPress }: { m: Musculo; trabajaHoy: boolean; onPress: () => void }) {
  const idFoto = trabajaHoy && fuente('musculo', `${m.id}_hoy`) ? `${m.id}_hoy` : m.id;
  const nombre = nombreVisible(m.name);
  return (
    <TarjetaFoto
      tipoFoto="musculo" id={idFoto} ancho={LADO_MUSCULO} altoFoto={LADO_MUSCULO} radioFoto={24}
      titulo={nombre} estiloTitulo={s.tituloChico} lineas={2}
      onPress={onPress} etiqueta={trabajaHoy ? `${nombre}, se trabaja hoy` : nombre}
    />
  );
}

/**
 * Articulo de «Para leer hoy» (240 de ancho): foto de 240x130, la categoria en tipo oracion con el icono de su sala
 * (el mismo de Aprender) y el titulo en Big Shoulders, hasta 3 lineas. Lo que dice y el icono salen de los mismos
 * ayudantes que la tarjeta de Aprender, para que un articulo se lea igual en las dos pestanas.
 */
export function TarjetaArticulo({ t, favorito, onPress, onFavorito }: {
  t: Tip; favorito: boolean; onPress: () => void; onFavorito: () => void;
}) {
  const titulo = textoVisible(t.titulo);
  const categoria = nombreDeSala(t.sala);
  return (
    <TarjetaFoto
      tipoFoto="tip" id={t.id} ancho={ANCHO_ARTICULO} altoFoto={ALTO_ARTICULO} radioFoto={20}
      titulo={titulo} estiloTitulo={s.tituloArticulo} lineas={3}
      pie={categoria ? (
        <View style={s.sala}>
          <Ionicons name={iconoDeSala(t.sala)} size={14} color={paleta.magnesia2} />
          <Text style={s.categoria} numberOfLines={1}>{categoria}</Text>
        </View>
      ) : undefined}
      favorito={favorito} onFavorito={onFavorito}
      onPress={onPress} etiqueta={categoria ? `${titulo}, ${categoria}` : titulo}
    />
  );
}

const s = StyleSheet.create({
  titulo: { color: paleta.magnesia, marginTop: 10 },
  tituloMediano: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20 },
  tituloChico: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 19, marginTop: 8 },
  tituloArticulo: { fontFamily: familia.titulo, fontSize: 18, lineHeight: 21 },
  datos: { gap: 6, marginTop: 4 },
  categoriaFila: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  categoria: { flexShrink: 1, fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  sala: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  estrella: { position: 'absolute', top: 6, right: 6 },
});
