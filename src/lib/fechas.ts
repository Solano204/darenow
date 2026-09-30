/**
 * Formato de fechas solo para la vista. El dato sigue siendo «AAAA-MM-DD» (`hoy()`, `SesionGuardada.fecha`);
 * aqui solo se lee bonito. Nombres fijos en espanol en vez de `Intl`: asi el resultado no depende del
 * motor de JavaScript ni del idioma del telefono y se puede comprobar con una prueba.
 */

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/** Minutos desde los que una sesion cuenta como «de 25 minutos o mas» en el calendario y el historial. */
const MINUTOS_SESION_LARGA = 25;

/** «2026-09-25» → un `Date` local a medianoche (sin el corrimiento de zona horaria de `new Date('2026-09-25')`). */
export function fechaLocal(fecha: string): Date {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(a, m - 1, d);
}

const minuscula = (t: string): string => t.charAt(0).toLowerCase() + t.slice(1);

/**
 * «2026-09-25» → «Viernes 25 de septiembre». El ano solo se agrega si no es el del `ahora` que se pasa
 * («Miércoles 3 de diciembre de 2025»). Una fecha que no se puede leer se devuelve tal cual.
 */
export function fechaLarga(fecha: string, ahora: Date = new Date()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  const d = fechaLocal(fecha);
  const base = `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${minuscula(MESES[d.getMonth()])}`;
  return d.getFullYear() === ahora.getFullYear() ? base : `${base} de ${d.getFullYear()}`;
}

/** «2026-09-25» → «Viernes 25»: lo que oye el lector de pantalla de un dia del calendario. */
export function diaCorto(fecha: string): string {
  const d = fechaLocal(fecha);
  return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()}`;
}

/** Un dia entrenado: si llego a los 25 minutos (rellena) o no (contorno). */
export const esSesionLarga = (minutos: number): boolean => minutos >= MINUTOS_SESION_LARGA;
