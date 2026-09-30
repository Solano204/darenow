/**
 * DARENOW · tipos de la maquina del reproductor
 *
 * Fases, series hechas, el estado del reproductor y las acciones que entiende el reducer de
 * `playerMachine.ts`, que los re-exporta.
 */

import type { ItemSesion } from '@/lib/engine/session';

export type Fase = 'preparado' | 'trabajo' | 'cambio_lado' | 'descanso' | 'pausa' | 'fin';

export interface SerieHecha {
  ejercicioId: string;
  orden: number;
  serieNum: number;
  lado: 'izq' | 'der' | null;
  reps: number | null;
  segundos: number | null;
  pesoKg: number | null;
  omitida: boolean;
  descansoRealS: number;
}

export interface EstadoPlayer {
  fase: Fase;
  faseAnterior: Fase | null;
  indice: number;        // posicion en items
  serieNum: number;      // 1..seriesPlan
  lado: 'izq' | 'der' | null;
  restanteS: number;     // segundos restantes de la fase actual
  transcurridoS: number; // segundos totales de sesion
  hechas: SerieHecha[];
  descansoAcumuladoS: number;
  /**
   * Foto de como estaba todo justo antes de la ultima serie que se marco
   * (registrada, automatica por tiempo, u omitida). Permite deshacer con
   * un toque. Se pisa en cada serie nueva: solo se deshace la ultima, no
   * un historial completo. `anterior` de un `anterior` siempre es null,
   * para no arrastrar una cadena que crece sin limite.
   */
  anterior: EstadoPlayer | null;
}

/**
 * Segundos de preparacion antes de cada serie.
 *
 * Nueve segundos: tiempo suficiente para leer el nombre del ejercicio, las
 * series y las claves antes de que arranque la serie, sin que se sienta
 * larga la espera. Quien ya lo sabe toca "Empezar ya".
 */
export const PREPARACION_S = 9;

export type Accion =
  | { t: 'tick' }
  | { t: 'avanzar' }                       // termina la fase actual
  | { t: 'registrar'; reps?: number; pesoKg?: number }
  | { t: 'omitir' }
  | { t: 'deshacer' }                      // vuelve a como estaba antes de la ultima serie
  | { t: 'masDescanso'; seg: number }
  | { t: 'pausar' }
  | { t: 'reanudar' }
  | { t: 'irA'; indice: number }
  | { t: 'sustituido' }
  /** Adelanta el reloj el tiempo real que paso, p.ej. tras volver de segundo plano. */
  | { t: 'avanzarReloj'; segundos: number };

export interface Ctx { items: ItemSesion[] }
