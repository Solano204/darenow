import { plural } from './plural';

/**
 * Tramos del perfil de una rutina (solo vista). Reparte el ancho de la grafica segun
 * lo que dura cada bloque y no reemplaza ningun calculo de duracion: el peso es el `min`
 * que ya trae el dato (o, si un bloque no lo trae, su numero de ejercicios).
 */

export type TipoTramo = 'calentamiento' | 'principal' | 'enfriamiento' | 'plano';

export interface BloqueDeTramo {
  /** `calentamiento`, `principal` o `enfriamiento` del dato; `plano` es una rutina sin bloques. */
  tipo: string;
  /** Minutos del bloque, o cualquier medida proporcional al tiempo. */
  peso: number;
  vueltas?: number;
  ejercicios: number;
}

export interface Tramo {
  tipo: TipoTramo;
  etiqueta: string;
  /** Donde empieza y cuanto ocupa, de 0 a 1 del ancho de la grafica. */
  inicio: number;
  fraccion: number;
  ejercicios: number;
  vueltas: number;
}

/**
 * Ningun tramo mide menos que esto: su etiqueta («Calentamiento») tiene que caber debajo.
 * Un calentamiento de 2 de 15 minutos mediria el 13 % y la etiqueta se montaria sobre la vecina.
 */
export const PISO_TRAMO = 0.28;

const tipoDe = (t: string): TipoTramo =>
  t === 'calentamiento' || t === 'enfriamiento' || t === 'plano' ? t : 'principal';

const mayuscula = (t: string): string => t[0].toUpperCase() + t.slice(1);

export function etiquetaDeTramo(tipo: TipoTramo, vueltas: number): string {
  if (tipo === 'plano') return 'Ejercicios';
  return vueltas > 1 ? `${mayuscula(tipo)} ×${vueltas}` : mayuscula(tipo);
}

/** Fracciones proporcionales a `pesos` con un piso: los tramos bajo el piso lo toman y los demas ceden lo justo. */
function fraccionesConPiso(pesos: number[]): number[] {
  const total = pesos.reduce((a, p) => a + p, 0);
  const f = pesos.map(p => p / total);
  const piso = Math.min(PISO_TRAMO, 1 / f.length);
  const fijos = new Set<number>();
  let g = f;
  for (let vuelta = 0; vuelta < f.length; vuelta++) {
    const nuevos = g.flatMap((x, i) => (x < piso - 1e-9 && !fijos.has(i) ? [i] : []));
    if (nuevos.length === 0) break;
    nuevos.forEach(i => fijos.add(i));
    const libre = 1 - piso * fijos.size;
    const suma = f.reduce((a, x, i) => (fijos.has(i) ? a : a + x), 0);
    g = f.map((x, i) => (fijos.has(i) ? piso : suma > 0 ? (x * libre) / suma : 0));
  }
  return g;
}

export function estimarTramos(bloques: BloqueDeTramo[]): Tramo[] {
  if (bloques.length === 0) return [];
  const pesos = bloques.map(b => (b.peso > 0 ? b.peso : Math.max(1, b.ejercicios)));
  const fracciones = fraccionesConPiso(pesos);
  let inicio = 0;
  return bloques.map((b, i) => {
    const tipo = tipoDe(b.tipo);
    const vueltas = b.vueltas && b.vueltas > 0 ? b.vueltas : 1;
    const tramo: Tramo = {
      tipo, etiqueta: etiquetaDeTramo(tipo, vueltas), inicio, fraccion: fracciones[i], ejercicios: b.ejercicios, vueltas,
    };
    inicio += fracciones[i];
    return tramo;
  });
}

/**
 * El resumen que oye el lector de pantalla en lugar de la grafica: «Calentamiento de 2
 * ejercicios, bloque principal de 5 ejercicios repetido 3 veces, enfriamiento de 1 ejercicio».
 */
export function resumenDeTramos(tramos: Tramo[]): string {
  const frases = tramos.map(t => {
    const n = `${t.ejercicios} ${plural(t.ejercicios, 'ejercicio')}`;
    if (t.tipo === 'plano') return n;
    const nombre = t.tipo === 'principal' ? 'bloque principal' : t.tipo;
    const vueltas = t.vueltas > 1 ? ` repetido ${t.vueltas} veces` : '';
    return `${nombre} de ${n}${vueltas}`;
  });
  const texto = frases.join(', ');
  return texto ? mayuscula(texto) : texto;
}
