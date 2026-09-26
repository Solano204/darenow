import { plural } from './plural';

/**
 * El plan de un programa en el tiempo (solo vista). Un programa son semanas agrupadas en
 * fases; aqui se convierten los rangos del dato («1-2», «7») en numeros y se calcula cuantos
 * minutos se entrena cada semana con lo que el dato ya trae. No cambia ningun dato.
 */

export interface FaseDato { semanas: string; foco: string; rutinas: string[]; nota?: string }
export interface FasePrograma { desde: number; hasta: number; foco: string; rutinas: string[]; nota?: string }

const RANGO = /^\s*(\d+)\s*(?:[-–]\s*(\d+))?\s*$/;

/** «1-2» → 1 a 2; «7» → 7 a 7. Cualquier otra cosa, `null`. */
export function parsearRango(texto: string): { desde: number; hasta: number } | null {
  const m = texto.match(RANGO);
  if (!m) return null;
  const desde = Number(m[1]);
  const hasta = m[2] === undefined ? desde : Number(m[2]);
  return desde >= 1 && hasta >= desde ? { desde, hasta } : null;
}

/** Las fases con sus semanas en numeros, en el orden del dato. Si algun rango no se entiende, `null`. */
export function fasesDePrograma(fases: FaseDato[]): FasePrograma[] | null {
  const salida: FasePrograma[] = [];
  for (const f of fases) {
    const r = parsearRango(f.semanas);
    if (!r) return null;
    salida.push({ ...r, foco: f.foco, rutinas: f.rutinas, nota: f.nota });
  }
  return salida;
}

/** La fase (su posicion) a la que pertenece una semana, o -1. */
export const faseDeSemana = (fases: FasePrograma[], semana: number): number =>
  fases.findIndex(f => semana >= f.desde && semana <= f.hasta);

/**
 * Minutos que se entrenan cada semana: los dias por semana del programa por la duracion
 * promedio de las rutinas de la fase de esa semana. Es la lista de `semanas` numeros, o `null`
 * si a alguna semana le falta su fase o a alguna rutina su duracion (entonces la grafica no
 * inventa alturas: las dibuja todas iguales).
 */
export function minutosPorSemana(
  semanas: number,
  diasSemana: number,
  fases: FasePrograma[],
  minutosDe: (idRutina: string) => number | undefined,
): number[] | null {
  const salida: number[] = [];
  for (let s = 1; s <= semanas; s++) {
    const fase = fases[faseDeSemana(fases, s)];
    if (!fase || fase.rutinas.length === 0) return null;
    const mins = fase.rutinas.map(minutosDe);
    if (mins.some(m => m === undefined || !(m > 0))) return null;
    const suma = (mins as number[]).reduce((a, m) => a + m, 0);
    salida.push(Math.round((diasSemana * suma) / mins.length));
  }
  return salida;
}

/**
 * Placas de cada semana, de 1 a `maximo`, proporcionales a sus minutos (la semana mas larga
 * lleva `maximo`). Sin minutos, todas las columnas son iguales.
 */
export function placasPorSemana(minutos: number[] | null, semanas: number, maximo: number, planas = Math.min(8, maximo)): number[] {
  if (!minutos || minutos.length !== semanas) return Array.from({ length: semanas }, () => planas);
  const tope = Math.max(...minutos);
  return minutos.map(m => Math.max(1, Math.round((m / tope) * maximo)));
}

/** «Semanas 1–2» o, con una sola semana, «Semana 7». */
export const textoDeRango = (desde: number, hasta: number): string =>
  hasta > desde ? `Semanas ${desde}–${hasta}` : `Semana ${desde}`;

/** «semana 7», «semanas 1 y 2», «semanas 3 a 5»: el rango como se dice en voz alta. */
export const palabrasDeRango = (desde: number, hasta: number): string =>
  hasta === desde ? `semana ${desde}` : hasta === desde + 1 ? `semanas ${desde} y ${hasta}` : `semanas ${desde} a ${hasta}`;

/**
 * Lo que oye el lector de pantalla en lugar de la grafica: «Semanas 1 y 2, Aparecer, 28 minutos
 * por semana; semanas 3 y 4, Volumen, 42 minutos por semana…». `nombre` pone la ortografia de
 * cada fase. Con `semanaActual` (el usuario ya sigue el programa) se anade en que semana va.
 */
export function resumenDePlan(
  fases: FasePrograma[],
  minutos: number[] | null,
  semanaActual?: number,
  nombre: (foco: string) => string = f => f,
): string {
  const frases = fases.map(f => {
    const base = `${palabrasDeRango(f.desde, f.hasta)}, ${nombre(f.foco)}`;
    const m = minutos?.[f.desde - 1];
    return m === undefined ? base : `${base}, ${m} ${plural(m, 'minuto')} por semana`;
  });
  const texto = frases.join('; ');
  if (!texto) return texto;
  const conMayuscula = texto[0].toUpperCase() + texto.slice(1);
  return semanaActual ? `${conMayuscula}. Vas en la semana ${semanaActual}.` : conMayuscula;
}
