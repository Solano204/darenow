/**
 * FORJA · maquina de estados del reproductor (pura)
 *
 * Sin React, sin expo, sin audio. Todo el comportamiento del temporizador
 * vive aqui para poder probarlo con node, sin renderizar nada.
 * La UI reacciona a estos estados; nunca los provoca.
 *
 * preparado -> trabajo -> [cambio_lado -> trabajo] -> descanso -> ... -> fin
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

type Accion =
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

interface Ctx { items: ItemSesion[] }

function duracionTrabajo(it: ItemSesion): number | null {
  return it.segPlan ?? null; // null = por repeticiones, lo marca el usuario
}

export function esUnilateral(it: ItemSesion): boolean {
  return it.unilateral || it.measure === 'reps_por_lado';
}

/**
 * Adelanta el reloj `segundos` de una vez, sin recorrer un tick a la vez:
 * hace falta cuando la app vuelve de segundo plano o de estar cerrada y
 * paso mucho mas de un segundo real.
 *
 * A proposito NO encadena varias fases aunque el tiempo alcance para eso:
 * solo ajusta la fase actual y la deja en 0 si ya se hubiera acabado. El
 * siguiente tick real dispara la transicion, exactamente igual que si el
 * usuario hubiera visto llegar el reloj a cero. Simular la cadena completa
 * de fases que pasarian en una ausencia larga (podrian ser series enteras)
 * es un simulador aparte que no vale la pena para "se me cerro la app".
 */
export function avanzarReloj(e: EstadoPlayer, items: ItemSesion[], segundos: number): EstadoPlayer {
  if (e.fase === 'pausa' || e.fase === 'fin' || segundos <= 0) return e;
  const it = items[e.indice];
  const transcurridoS = e.transcurridoS + segundos;

  // Trabajo por repeticiones: cuenta hacia arriba, no tiene "se acabo".
  if (e.fase === 'trabajo' && duracionTrabajo(it) === null) {
    return { ...e, transcurridoS, restanteS: e.restanteS + segundos };
  }

  const descansoAcumuladoS = e.fase === 'descanso' ? e.descansoAcumuladoS + segundos : e.descansoAcumuladoS;
  return { ...e, transcurridoS, descansoAcumuladoS, restanteS: Math.max(0, e.restanteS - segundos) };
}

export function crearReducer(ctx: Ctx) {
  // OJO: se lee `ctx.items` en cada uso, nunca se desestructura a una
  // variable local. `ctx` es el mismo objeto durante toda la sesion (lo
  // mantiene useSessionPlayer con un ref), pero su campo `items` se
  // actualiza en cada render; desestructurar aqui lo habria congelado con
  // el valor del primer render y el reproductor habria seguido decidiendo
  // "el siguiente ejercicio" sobre una lista vieja para siempre.
  /** Calcula el siguiente estado tras terminar trabajo o descanso. */
  function siguiente(e: EstadoPlayer): EstadoPlayer {
    const it = ctx.items[e.indice];

    // Si es unilateral y acabamos el lado izquierdo, toca el derecho.
    if (e.fase === 'trabajo' && esUnilateral(it) && e.lado === 'izq') {
      return {
        ...e,
        fase: 'cambio_lado',
        faseAnterior: 'trabajo',
        lado: 'der',
        restanteS: 5,
      };
    }

    const ultimaSerie = e.serieNum >= it.seriesPlan;
    const ultimoEjercicio = e.indice >= ctx.items.length - 1;

    // Fin de la sesion.
    if (ultimaSerie && ultimoEjercicio) {
      return { ...e, fase: 'fin', faseAnterior: e.fase, restanteS: 0 };
    }

    // Descanso entre series o entre ejercicios.
    if (e.fase === 'trabajo') {
      return {
        ...e,
        fase: 'descanso',
        faseAnterior: 'trabajo',
        restanteS: it.descansoPlan,
      };
    }

    // Terminado el descanso: siguiente serie o siguiente ejercicio.
    if (ultimaSerie) {
      const sig = ctx.items[e.indice + 1];
      return {
        ...e,
        fase: 'preparado',
        faseAnterior: e.fase,
        indice: e.indice + 1,
        serieNum: 1,
        lado: esUnilateral(sig) ? 'izq' : null,
        restanteS: PREPARACION_S,
      };
    }
    return {
      ...e,
      fase: 'preparado',
      faseAnterior: e.fase,
      serieNum: e.serieNum + 1,
      lado: esUnilateral(it) ? 'izq' : null,
      restanteS: PREPARACION_S,
    };
  }

  return function reducer(e: EstadoPlayer, a: Accion): EstadoPlayer {
    const it = ctx.items[e.indice];

    switch (a.t) {
      case 'tick': {
        if (e.fase === 'pausa' || e.fase === 'fin') return e;
        const transcurrido = e.transcurridoS + 1;

        // Trabajo por repeticiones: el reloj cuenta hacia arriba y espera
        // a que el usuario confirme. No se corta solo.
        if (e.fase === 'trabajo' && duracionTrabajo(it) === null) {
          return { ...e, transcurridoS: transcurrido, restanteS: e.restanteS + 1 };
        }

        const restante = e.restanteS - 1;
        const acum = e.fase === 'descanso' ? e.descansoAcumuladoS + 1 : e.descansoAcumuladoS;

        if (restante > 0) {
          return { ...e, restanteS: restante, transcurridoS: transcurrido, descansoAcumuladoS: acum };
        }

        // La fase termino.
        if (e.fase === 'preparado' || e.fase === 'cambio_lado') {
          return {
            ...e,
            fase: 'trabajo',
            faseAnterior: e.fase,
            restanteS: duracionTrabajo(it) ?? 0,
            transcurridoS: transcurrido,
          };
        }
        if (e.fase === 'trabajo') {
          const hecha: SerieHecha = {
            ejercicioId: it.id,
            orden: e.indice,
            serieNum: e.serieNum,
            lado: e.lado,
            reps: null,
            segundos: it.segPlan,
            pesoKg: null,
            omitida: false,
            descansoRealS: 0,
          };
          // Cada lado de un unilateral se registra por separado.
          return siguiente({
            ...e,
            transcurridoS: transcurrido,
            hechas: [...e.hechas, hecha],
            anterior: { ...e, anterior: null },
          });
        }
        return siguiente({ ...e, transcurridoS: transcurrido, descansoAcumuladoS: acum });
      }

      // El usuario confirma una serie por repeticiones.
      case 'registrar': {
        const hecha: SerieHecha = {
          ejercicioId: it.id,
          orden: e.indice,
          serieNum: e.serieNum,
          lado: e.lado,
          reps: a.reps ?? it.repsPlan,
          segundos: null,
          pesoKg: a.pesoKg ?? null,
          omitida: false,
          descansoRealS: 0,
        };
        return siguiente({ ...e, hechas: [...e.hechas, hecha], anterior: { ...e, anterior: null } });
      }

      case 'avanzar':
        return siguiente(e);

      // Omitir deja constancia. No se pierde el dato de que se omitio.
      case 'omitir': {
        const hecha: SerieHecha = {
          ejercicioId: it.id,
          orden: e.indice,
          serieNum: e.serieNum,
          lado: e.lado,
          reps: null,
          segundos: null,
          pesoKg: null,
          omitida: true,
          descansoRealS: 0,
        };
        return siguiente({ ...e, hechas: [...e.hechas, hecha], anterior: { ...e, anterior: null } });
      }

      // Deshace la ultima serie marcada, sea registrada, automatica u
      // omitida. Solo un nivel: `anterior` de la foto ya viene en null.
      case 'deshacer':
        return e.anterior ?? e;

      case 'masDescanso':
        return e.fase === 'descanso'
          ? { ...e, restanteS: e.restanteS + a.seg }
          : e;

      case 'pausar':
        return e.fase === 'pausa' ? e : { ...e, fase: 'pausa', faseAnterior: e.fase };

      case 'reanudar':
        return e.fase === 'pausa'
          ? { ...e, fase: e.faseAnterior ?? 'preparado', faseAnterior: 'pausa' }
          : e;

      // Saltar a otro ejercicio cambia de contexto: la foto de "antes"
      // dejaria de tener sentido (apuntaria a un ejercicio distinto), asi
      // que se descarta en vez de arrastrarla.
      case 'irA': {
        const sig = ctx.items[a.indice];
        return {
          ...e,
          fase: 'preparado',
          indice: a.indice,
          serieNum: 1,
          lado: esUnilateral(sig) ? 'izq' : null,
          restanteS: PREPARACION_S,
          anterior: null,
        };
      }

      case 'sustituido':
        return { ...e, fase: 'preparado', serieNum: 1, restanteS: PREPARACION_S, anterior: null };

      case 'avanzarReloj':
        return avanzarReloj(e, ctx.items, a.segundos);

      default:
        return e;
    }
  };
}

export function estadoInicial(items: ItemSesion[]): EstadoPlayer {
  return {
    fase: 'preparado',
    faseAnterior: null,
    indice: 0,
    serieNum: 1,
    lado: esUnilateral(items[0]) ? 'izq' : null,
    restanteS: PREPARACION_S,
    transcurridoS: 0,
    hechas: [],
    descansoAcumuladoS: 0,
    anterior: null,
  };
}

