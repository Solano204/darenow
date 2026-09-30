/**
 * DARENOW · derivados del estado
 *
 * Funciones puras sobre el estado del usuario: la fecha de hoy, la racha con dias de gracia y
 * las estadisticas de las sesiones. store.ts las re-exporta.
 */

import type { Racha, SesionGuardada } from './tipos';

/* ------------------------------------------------------------------ */
/* Utilidades de fecha                                                 */
/* ------------------------------------------------------------------ */

export function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Imagen para una rutina propia: la que se le asigno al azar al crearla, o
 * (si es de antes de eso, y por lo tanto no tiene) una eleccion estable
 * segun su id. Estable para que no cambie de foto entre pantallas ni al
 * releer la lista.
 */
export function imagenRutina(id: string, imagenId?: string): string {
  if (imagenId) return imagenId;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `rt_${String((h % 30) + 1).padStart(3, '0')}`;
}
export const mesActual = () => hoy().slice(0, 7);
const diasEntre = (a: string, b: string) =>
  Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);

const DIAS_DE_GRACIA = 2;

/**
 * Racha con dos dias de gracia al mes.
 * Nunca vuelve a cero: si se pasa el margen, se marca en pausa y al volver
 * a entrenar continua desde donde estaba.
 */
export function calcularRacha(r: Racha, fecha: string): Racha {
  const mes = fecha.slice(0, 7);
  const gracia = r.mesGracia === mes ? r.graciaUsada : 0;

  if (!r.ultimoDia) {
    return { dias: 1, mejor: Math.max(r.mejor, 1), ultimoDia: fecha, graciaUsada: gracia, mesGracia: mes, enPausa: false };
  }
  const hueco = diasEntre(r.ultimoDia, fecha);
  if (hueco <= 0) return r;                       // mismo dia, no suma

  let dias = r.dias + 1;
  let usada = gracia;
  if (hueco > 1) {
    const faltados = hueco - 1;
    if (gracia + faltados <= DIAS_DE_GRACIA) usada = gracia + faltados;
    // Sin gracia: la racha continua igual, solo deja de estar en pausa.
  }
  return {
    dias, mejor: Math.max(r.mejor, dias), ultimoDia: fecha,
    graciaUsada: usada, mesGracia: mes, enPausa: false,
  };
}

export function revisarPausa(r: Racha): Racha {
  if (!r.ultimoDia) return r;
  const hueco = diasEntre(r.ultimoDia, hoy());
  const gracia = r.mesGracia === mesActual() ? r.graciaUsada : 0;
  const disponible = DIAS_DE_GRACIA - gracia;
  return hueco - 1 > disponible ? { ...r, enPausa: true } : r;
}

/* ------------------------------------------------------------------ */
/* Estadisticas derivadas                                              */
/* ------------------------------------------------------------------ */

export function estadisticas(s: SesionGuardada[]) {
  const completadas = s.filter(x => x.estado === 'completada').length;
  const minutos = Math.round(s.reduce((a, x) => a + x.duracionS, 0) / 60);
  const series = s.reduce((a, x) => a + x.series.filter(y => !y.omitida).length, 0);
  const kcal = s.reduce((a, x) => a + (x.kcal ?? 0), 0);
  const dias = new Set(s.map(x => x.fecha)).size;
  return { total: s.length, completadas, minutos, series, kcal, dias };
}

/** Minutos por dia de los ultimos 7 dias, para la grafica de Yo. */
export function ultimos7(s: SesionGuardada[]): { fecha: string; min: number }[] {
  const salida: { fecha: string; min: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const min = Math.round(
      s.filter(x => x.fecha === d).reduce((a, x) => a + x.duracionS, 0) / 60,
    );
    salida.push({ fecha: d, min });
  }
  return salida;
}


/** Minutos por fecha. Alimenta el calendario mensual. */
export function minutosPorDia(s: SesionGuardada[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of s) out[x.fecha] = (out[x.fecha] ?? 0) + Math.round(x.duracionS / 60);
  return out;
}

/** Fechas unicas con sesion. */
export function diasEntrenados(s: SesionGuardada[]): string[] {
  return [...new Set(s.map(x => x.fecha))];
}

/** Ultimo rendimiento registrado de un ejercicio en estas sesiones (la serie real mas reciente). */
export function ultimaVezEn(
  sesiones: SesionGuardada[], id: string,
): { reps?: number; segundos?: number; pesoKg?: number; fecha: string } | undefined {
  for (let i = sesiones.length - 1; i >= 0; i--) {
    const s = sesiones[i];
    const serie = [...s.series].reverse().find(x => x.ejercicioId === id && !x.omitida);
    if (serie) {
      return {
        reps: serie.reps ?? undefined,
        segundos: serie.segundos ?? undefined,
        pesoKg: serie.pesoKg ?? undefined,
        fecha: s.fecha,
      };
    }
  }
  return undefined;
}
