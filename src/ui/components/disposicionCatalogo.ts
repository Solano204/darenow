import type { MusculoIndice } from '@/data/catalog';
import { textoDeEtiqueta, textoVisible } from '@/lib/presentacion';

/**
 * La disposicion del catalogo de musculos (solo vista): las fichas en filas de tres, con un
 * encabezado cada vez que cambia el grupo **en el orden actual** (nunca se reordena la lista).
 * Es pura y calcula el alto de cada fila para que la lista sepa donde esta cada una sin medirla.
 */

export const COLUMNAS = 3;
export const SEPARACION_H = 12;
const SEPARACION_V = 20;
export const ALTO_REGION = 44;
const ALTO_LINEA_NOMBRE = 18;
const AIRE_NOMBRE = 8;
export const RADIO_FICHA = 24;
/** Letras de Figtree 600 de 14 px que caben en una linea bajo una ficha de unos 96 px, con holgura. */
const LETRAS_POR_LINEA = 12;
/** Las filas reservan al menos dos lineas de nombre: asi la rejilla no salta de una fila a otra. */
const LINEAS_MINIMAS = 2;

/** Lado de la ficha para el ancho util dado: tres columnas con 12 px entre cada una. */
export const ladoFicha = (anchoUtil: number): number => (anchoUtil - (COLUMNAS - 1) * SEPARACION_H) / COLUMNAS;

/** Cuantas lineas ocupa un nombre partido por palabras (nunca a medias), con `porLinea` letras por linea. */
export function lineasDeNombre(nombre: string, porLinea: number = LETRAS_POR_LINEA): number {
  let lineas = 1;
  let actual = 0;
  for (const palabra of nombre.split(/\s+/).filter(Boolean)) {
    if (actual === 0) actual = palabra.length;
    else if (actual + 1 + palabra.length <= porLinea) actual += 1 + palabra.length;
    else { lineas += 1; actual = palabra.length; }
    if (palabra.length > porLinea) { lineas += Math.ceil(palabra.length / porLinea) - 1; actual = palabra.length % porLinea; }
  }
  return lineas;
}

export interface TramoGrupo { grupo: string; etiqueta: string; musculos: MusculoIndice[] }

/** Tramos seguidos del mismo `group`, en el orden que traen los musculos (un grupo puede volver a aparecer mas abajo). */
export function agruparPorGrupo(musculos: readonly MusculoIndice[]): TramoGrupo[] {
  const tramos: TramoGrupo[] = [];
  for (const m of musculos) {
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.grupo === m.group) ultimo.musculos.push(m);
    else tramos.push({ grupo: m.group, etiqueta: textoDeEtiqueta(m.group), musculos: [m] });
  }
  return tramos;
}

export type FilaCatalogo =
  | { tipo: 'region'; clave: string; grupo: string; etiqueta: string; cantidad: number; arriba: number; alto: number }
  | { tipo: 'fichas'; clave: string; musculos: MusculoIndice[]; fila: number; lineas: number; arriba: number; alto: number };

/**
 * Las filas del catalogo: un encabezado por tramo de grupo (con cuantos musculos trae ese
 * tramo) y, debajo, sus fichas de tres en tres. Si algun musculo no trae `group`, no hay
 * encabezados. `arriba` es la posicion de cada fila y `alto` su alto, incluida la separacion de abajo.
 */
export function armarFilas(
  musculos: readonly MusculoIndice[],
  lado: number,
  nombreDe: (m: MusculoIndice) => string = m => textoVisible(m.name),
): FilaCatalogo[] {
  const conGrupos = musculos.length > 0 && musculos.every(m => !!m.group);
  const tramos = conGrupos ? agruparPorGrupo(musculos) : [{ grupo: '', etiqueta: '', musculos: [...musculos] }];
  const filas: FilaCatalogo[] = [];
  let arriba = 0;
  let numero = 0;
  tramos.forEach((t, k) => {
    if (conGrupos) {
      filas.push({ tipo: 'region', clave: `r${k}`, grupo: t.grupo, etiqueta: t.etiqueta, cantidad: t.musculos.length, arriba, alto: ALTO_REGION });
      arriba += ALTO_REGION;
    }
    for (let i = 0; i < t.musculos.length; i += COLUMNAS) {
      const fichas = t.musculos.slice(i, i + COLUMNAS);
      const lineas = Math.max(LINEAS_MINIMAS, ...fichas.map(m => lineasDeNombre(nombreDe(m))));
      const alto = lado + AIRE_NOMBRE + lineas * ALTO_LINEA_NOMBRE + SEPARACION_V;
      filas.push({ tipo: 'fichas', clave: `f${k}-${i}`, musculos: fichas, fila: numero++, lineas, arriba, alto });
      arriba += alto;
    }
  });
  return filas;
}

/**
 * El encabezado que debe quedar pegado abajo de los segmentos: el ultimo cuya fila ya paso por
 * arriba con el scroll `y`; -1 si todavia no ha pasado ninguno (el primero se ve en su sitio).
 */
export function regionActiva(filas: readonly FilaCatalogo[], y: number): number {
  const arriba = filas.map(f => (f.tipo === 'region' ? f.arriba : Number.POSITIVE_INFINITY));
  return indiceRegionActiva(arriba, y);
}

/**
 * Lo mismo con solo numeros (la posicion de cada fila, o infinito si no es un encabezado): asi
 * puede correr en el hilo de UI sin llevarse las fichas. Devuelve la posicion de la fila.
 */
export function indiceRegionActiva(arriba: readonly number[], y: number): number {
  'worklet';
  let activa = -1;
  for (let i = 0; i < arriba.length; i++) if (arriba[i] < y) activa = i;
  return activa;
}
