import type { Favoritos } from '../store/store';
import { plural } from './plural';
import { MESES, diaCorto, esSesionLarga, fechaLarga } from './fechas';

/**
 * Ayudas de la pestana Yo (solo vista). No cambian ningun dato ni ningun calculo del estado: leen
 * lo que ya guarda la app y lo preparan para dibujarlo.
 */

/* ------------------------------------------------------------------ Ultimos 7 dias */

/** Placas de la columna mas alta: cabe en los 120 px del mapa (placas de 8 con 2 de separacion). */
export const MAX_PLACAS_DIA = 12;
/** Con menos de estos minutos de referencia, la columna mas larga no llena la altura: una semana suave no parece una gran. */
export const MINUTOS_REFERENCIA = 30;

/**
 * Cuantas placas lleva cada dia: mas minutos, mas placas, a escala de la semana (el dia mas largo, o 30
 * minutos si ninguno los alcanza, llena la columna). Un dia con actividad lleva al menos una; uno sin
 * actividad, ninguna (queda el piso).
 */
export function placasPorDia(minutos: readonly number[], maximo: number = MAX_PLACAS_DIA): number[] {
  const referencia = Math.max(MINUTOS_REFERENCIA, ...minutos);
  return minutos.map(m => (m > 0 ? Math.min(maximo, Math.max(1, Math.round((m / referencia) * maximo))) : 0));
}

/** Toda la semana en cero: la grafica baja a solo los pisos y las letras. */
export const semanaEnCero = (minutos: readonly number[]): boolean => minutos.every(m => m <= 0);

/** Lo que oye el lector de pantalla de la grafica: «Lunes 25, 0; Martes 26, 12…» con los minutos de cada dia. */
export const resumenDeSemana = (semana: readonly { fecha: string; min: number }[]): string =>
  `Minutos de los últimos siete días: ${semana.map(d => `${diaCorto(d.fecha)}, ${d.min}`).join('; ')}`;

/* ------------------------------------------------------------------ Calendario */

const dosCifras = (n: number): string => String(n).padStart(2, '0');

/** «2026», 8, 25 (mes de 0 a 11) → «2026-09-25»: el formato del dato. */
export const fechaDeDia = (anio: number, mes: number, dia: number): string => `${anio}-${dosCifras(mes + 1)}-${dosCifras(dia)}`;

/** Las celdas de un mes: huecos hasta el primer dia (la semana empieza en lunes), sus dias y huecos hasta cerrar la fila. */
export function celdasDelMes(anio: number, mes: number): (number | null)[] {
  const hueco = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const dias = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = Array(hueco).fill(null);
  for (let d = 1; d <= dias; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

export interface DiaDelCalendario {
  fecha: string;
  dia: number;
  entreno: boolean;
  /** 25 minutos o mas: huella rellena; menos, en contorno. */
  largo: boolean;
  esHoy: boolean;
  futuro: boolean;
  /** «Jueves 25, hoy, sesión de 25 minutos o más» */
  etiqueta: string;
}

/** Como se ve un dia del calendario y como se lee. */
export function diaDelCalendario(
  anio: number, mes: number, dia: number, hoy: string, minutosPor: Readonly<Record<string, number>>, entrenados: ReadonlySet<string>,
): DiaDelCalendario {
  const fecha = fechaDeDia(anio, mes, dia);
  const entreno = entrenados.has(fecha);
  const largo = entreno && esSesionLarga(minutosPor[fecha] ?? 0);
  const esHoy = fecha === hoy;
  const marca = entreno ? (largo ? ', sesión de 25 minutos o más' : ', sesión corta') : '';
  return { fecha, dia, entreno, largo, esHoy, futuro: fecha > hoy, etiqueta: `${diaCorto(fecha)}${esHoy ? ', hoy' : ''}${marca}` };
}

/** Los dias con sesion de un mes (los del dato: cada fecha cuenta una vez). */
export const diasDelMes = (entrenados: ReadonlySet<string>, anio: number, mes: number): number =>
  [...entrenados].filter(f => f.startsWith(`${anio}-${dosCifras(mes + 1)}-`)).length;

/* ------------------------------------------------------------------ Estadisticas */

/** Las etiquetas de las cuatro placas con su plural: «1 sesión», «2 sesiones». La racha va como «racha». */
export const etiquetasDeEstadisticas = (sesiones: number, minutos: number, series: number): [string, string, string, string] => [
  'racha', plural(sesiones, 'sesión', 'sesiones'), plural(minutos, 'minuto', 'minutos'), plural(series, 'serie', 'series'),
];

/* ------------------------------------------------------------------ Favoritos */

export type TipoFavorito = keyof Favoritos;
export interface ItemFavorito { tipo: TipoFavorito; id: string }

export const totalFavoritos = (f: Favoritos): number => Object.values(f).reduce((n, a) => n + a.length, 0);

/**
 * Los favoritos de todos los tipos en una sola fila: de cada tipo, del mas reciente al mas antiguo
 * (el dato guarda el ultimo al final), repartidos por turnos entre ejercicios, rutinas, programas,
 * tips y musculos para que la fila no sea un solo tipo. Hasta `tope`; «Ver todos» lleva al resto.
 */
export function mezclarFavoritos(f: Favoritos, tope = 8): ItemFavorito[] {
  const orden: TipoFavorito[] = ['ejercicios', 'rutinas', 'programas', 'tips', 'musculos'];
  const colas = orden.map(tipo => [...(f[tipo] ?? [])].reverse().map((id): ItemFavorito => ({ tipo, id })));
  const salida: ItemFavorito[] = [];
  for (let i = 0; salida.length < tope && colas.some(c => i < c.length); i++) {
    for (const cola of colas) if (i < cola.length && salida.length < tope) salida.push(cola[i]);
  }
  return salida;
}

/* ------------------------------------------------------------------ Retos */

export type MetaReto = { tipo: 'placas' | 'celdas' | 'barra'; total: number };

/** El indicador de progreso que le toca a cada reto de la lista: siete placas, treinta celdas o una barra de cien. */
const METAS: Record<string, MetaReto> = {
  ch_001: { tipo: 'placas', total: 7 },
  ch_002: { tipo: 'celdas', total: 30 },
  ch_003: { tipo: 'barra', total: 100 },
};
export const metaDeReto = (id: string): MetaReto | undefined => METAS[id];

/** El progreso guardado de un reto, acotado a su meta. */
export const progresoAcotado = (progreso: number, total: number): number => Math.min(total, Math.max(0, Math.round(progreso)));

/* ------------------------------------------------------------------ Retos: vista previa de la meta */

/** Un reto de dias seguidos hasta este numero se ve como circulos; uno mas largo, como rejilla. */
export const MAX_CIRCULOS = 10;

export type VistaPreviaReto =
  | { tipo: 'circulos'; total: number }
  /** `meta` es cuantas de las `total` celdas hay que llenar («20 sesiones en 30 dias»). */
  | { tipo: 'rejilla'; total: number; meta?: number }
  | { tipo: 'tramos'; total: number };

/**
 * La forma de la meta de un reto, leida del texto de su objetivo y de su duracion (solo vista, nada se guarda):
 * «… siete dias seguidos» son 7 circulos; «20 sesiones en 30 dias», una rejilla de 30 celdas con la meta en la 20;
 * «100 sesiones en total», una barra de 10 tramos. Un objetivo que no se puede interpretar no lleva vista previa.
 */
export function vistaPreviaDeReto(reto: { objetivo: string; duracion_dias: number | null }): VistaPreviaReto | undefined {
  const texto = reto.objetivo.toLowerCase();
  const enDias = texto.match(/(\d+)\s+sesiones\s+en\s+(\d+)\s+d[ií]as/);
  if (enDias) return { tipo: 'rejilla', total: Number(enDias[2]), meta: Number(enDias[1]) };
  const enTotal = texto.match(/(\d+)\s+sesiones\s+en\s+total/);
  if (enTotal) return { tipo: 'tramos', total: Number(enTotal[1]) };
  if (/seguidos/.test(texto) && reto.duracion_dias) {
    return reto.duracion_dias <= MAX_CIRCULOS
      ? { tipo: 'circulos', total: reto.duracion_dias }
      : { tipo: 'rejilla', total: reto.duracion_dias };
  }
  return undefined;
}

/* ------------------------------------------------------------------ Historial */

export interface MesDeHistorial<T> { clave: string; nombre: string; items: T[] }

/**
 * Las sesiones en tramos seguidos del mismo mes, **en el orden que traen** (nada se reordena): cada vez que
 * cambia el mes empieza un tramo nuevo con su nombre («Septiembre 2026»).
 */
export function agruparPorMes<T extends { fecha: string }>(sesiones: readonly T[]): MesDeHistorial<T>[] {
  const meses: MesDeHistorial<T>[] = [];
  for (const s of sesiones) {
    const clave = s.fecha.slice(0, 7);
    const ultimo = meses[meses.length - 1];
    if (ultimo && ultimo.clave === clave) { ultimo.items.push(s); continue; }
    const [anio, mes] = clave.split('-').map(Number);
    meses.push({ clave, nombre: MESES[mes - 1] ? `${MESES[mes - 1]} ${anio}` : clave, items: [s] });
  }
  return meses;
}

export interface FilaDeHistorial { fecha: string; minutos: number; series: number; largo: boolean }

/** Una sesion guardada como la muestra el historial: fecha legible, minutos, series y si fue de 25 minutos o mas. */
export function filaDeHistorial(
  s: { fecha: string; duracionS: number; series: readonly { omitida?: boolean }[] }, ahora: Date = new Date(),
): FilaDeHistorial {
  const minutos = Math.round(s.duracionS / 60);
  return {
    fecha: fechaLarga(s.fecha, ahora), minutos, series: s.series.filter(x => !x.omitida).length, largo: esSesionLarga(minutos),
  };
}
