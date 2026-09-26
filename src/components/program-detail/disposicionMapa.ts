/**
 * La geometria del mapa de carga (solo vista): cuanto mide cada columna y donde van las
 * etiquetas de las fases. Es pura para poder comprobarla sin dibujar nada.
 */

export const ALTO_MAPA = 120;
export const ALTO_PLACA = 8;
export const SEPARACION_PLACA = 2;
export const PASO_PLACA = ALTO_PLACA + SEPARACION_PLACA;
/** Lo que cabe en el alto del mapa: la semana mas larga lleva estas placas. */
export const MAX_PLACAS = Math.floor((ALTO_MAPA + SEPARACION_PLACA) / PASO_PLACA);

export interface GeoMapa { colW: number; gap: number; paso: number }

/** Una columna por semana, a todo el ancho: mas separadas si son pocas y mas juntas si son muchas. */
export function geometriaMapa(semanas: number, ancho: number): GeoMapa {
  const gap = semanas <= 8 ? 8 : 4;
  const colW = (ancho - gap * (semanas - 1)) / semanas;
  return { colW, gap, paso: colW + gap };
}

export interface EtiquetaFase {
  /** 0 es la fila de arriba; una etiqueta que se montaria sobre otra baja a la fila siguiente. */
  fila: number;
  izquierda: number;
  ancho: number;
  centro: number;
}

/** Ancho aproximado de una letra de Figtree 500 a 12 px, con un poco de holgura. */
const ANCHO_CARACTER = 6.6;
const AIRE_ENTRE_ETIQUETAS = 6;

/**
 * Donde va el nombre de cada fase: centrado bajo sus columnas y, si no cabe junto al de la
 * fase anterior (una fase de una sola semana con un nombre largo), en la fila de abajo. Nunca
 * se sale del ancho del mapa.
 */
export function disponerEtiquetas(
  fases: { desde: number; hasta: number; nombre: string }[],
  geo: GeoMapa,
  ancho: number,
): EtiquetaFase[] {
  const finPorFila: number[] = [];
  return fases.map(f => {
    const x0 = (f.desde - 1) * geo.paso;
    const x1 = (f.hasta - 1) * geo.paso + geo.colW;
    const centro = (x0 + x1) / 2;
    const w = Math.min(ancho, f.nombre.length * ANCHO_CARACTER + 8);
    const izquierda = Math.min(Math.max(0, centro - w / 2), ancho - w);
    let fila = finPorFila.findIndex(fin => izquierda >= fin + AIRE_ENTRE_ETIQUETAS);
    if (fila === -1) fila = finPorFila.length;
    finPorFila[fila] = izquierda + w;
    return { fila, izquierda, ancho: w, centro };
  });
}
