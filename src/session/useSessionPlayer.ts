/**
 * FORJA · hook del reproductor
 *
 * Conecta la maquina de estados pura con el reloj de React, y dispara los
 * sonidos de cada transicion.
 *
 * Este hook no habla: los tonos solo marcan CUANDO pasa algo, para poder
 * entrenar sin mirar el telefono. Tres tins que suben de altura al final
 * de una fase, y un tono distinto por cada transicion.
 *
 * La voz (texto a voz, opcional) vive en Reproductor.tsx, no aqui: lee el
 * nombre y las claves del ejercicio, la cuenta final y los cambios de
 * fase, y usa exactamente estas mismas transiciones como disparador.
 *
 * Que suena y cuando:
 *
 *   preparado, 3-2-1  -> cuenta_3, cuenta_2, cuenta_1   ya casi arranca
 *   -> trabajo        -> inicio_serie                    empieza
 *   trabajo por tiempo, 3-2-1 -> cuenta_3/2/1            ya casi acaba
 *   trabajo -> descanso -> fin_serie                     acabaste
 *   trabajo -> cambio_lado -> cambio_lado                cambia de pierna
 *   descanso -> preparado -> fin_descanso                se acabo el break
 *   -> fin            -> fin_sesion                      terminaste todo
 *
 * En descanso NO hay cuenta atras a proposito: el descanso desemboca en
 * preparado, que ya trae sus nueve segundos con su propio 3-2-1. Poner las
 * dos serian ocho tonos en doce segundos y dejarian de significar nada.
 *
 * En pausa no suena nada, y al reanudar tampoco: el sonido marca eventos de
 * la sesion, no acciones del usuario.
 */

import { useCallback, useEffect, useRef, useReducer } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ItemSesion } from '@/engine/session';
import { crearReducer, estadoInicial, esUnilateral, avanzarReloj } from './playerMachine';
import type { EstadoPlayer, Fase } from './playerMachine';
import { prepararSonido, soltarSonido, activarSonido, reproducir } from '@/media/sonido';

export type { Fase };

import { CLAVE_SESION_EN_CURSO as CLAVE_GUARDADO } from '@/storage/claves';

export interface SesionEnCurso {
  items: ItemSesion[];
  estado: EstadoPlayer;
  guardadoEn: number;
}

/** Para leer, antes de montar el reproductor, si hay algo que continuar. */
export async function leerSesionGuardada(): Promise<SesionEnCurso | null> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE_GUARDADO);
    return raw ? (JSON.parse(raw) as SesionEnCurso) : null;
  } catch {
    return null;
  }
}

export async function borrarSesionGuardada(): Promise<void> {
  await AsyncStorage.removeItem(CLAVE_GUARDADO).catch(() => {});
}

export function useSessionPlayer(
  items: ItemSesion[], sonido = true, restaurar?: SesionEnCurso | null,
) {
  // `ctx` es el MISMO objeto durante toda la sesion (por eso el reducer,
  // creado una vez, puede seguir usandolo), pero su campo `items` se
  // actualiza en cada render: si la pantalla sustituye un ejercicio a
  // mitad de sesion, el motor ve la lista nueva de inmediato en vez de
  // quedarse con la que habia al montar.
  const ctx = useRef({ items }).current;
  ctx.items = items;
  const reducer = useRef(crearReducer(ctx)).current;
  const [estado, enviar] = useReducer(reducer, items, its => {
    if (!restaurar) return estadoInicial(its);
    const segundos = Math.max(0, Math.round((Date.now() - restaurar.guardadoEn) / 1000));
    return avanzarReloj(restaurar.estado, its, segundos);
  });

  // Reloj. Un solo intervalo para toda la sesion.
  useEffect(() => {
    if (estado.fase === 'fin' || estado.fase === 'pausa') return;
    const id = setInterval(() => enviar({ t: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [estado.fase]);

  /* ---------------------------------------------------------------- */
  /* Sesion interrumpida: segundo plano o app cerrada                  */
  /* ---------------------------------------------------------------- */

  // Refs, no estado: este efecto se registra una sola vez y siempre lee
  // el valor mas fresco al disparar, sin tener que re-suscribirse cada
  // segundo con cada tick.
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const fondoDesde = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      if (st !== 'active') {
        fondoDesde.current = Date.now();
        if (estadoRef.current.fase !== 'fin') {
          AsyncStorage.setItem(CLAVE_GUARDADO, JSON.stringify({
            items: itemsRef.current, estado: estadoRef.current, guardadoEn: Date.now(),
          } as SesionEnCurso)).catch(() => {});
        }
        return;
      }
      // Vuelve al frente: el reloj no corrio solo, se ajusta de una vez
      // con el tiempo real que paso en vez de dejar que la cuenta se
      // quede atrasada.
      if (fondoDesde.current != null) {
        const segundos = Math.round((Date.now() - fondoDesde.current) / 1000);
        fondoDesde.current = null;
        if (segundos > 0) enviar({ t: 'avanzarReloj', segundos });
      }
    });
    return () => sub.remove();
  }, []);

  // Ademas del respaldo por segundo plano, cada serie que se marca queda
  // guardada: si la app se cierra de golpe sin pasar por background,
  // "nada se pierde" sigue siendo cierto.
  useEffect(() => {
    if (estado.hechas.length === 0 || estado.fase === 'fin') return;
    AsyncStorage.setItem(CLAVE_GUARDADO, JSON.stringify({
      items, estado, guardadoEn: Date.now(),
    } as SesionEnCurso)).catch(() => {});
  }, [estado.hechas.length]);

  const it = items[estado.indice];

  /* ---------------------------------------------------------------- */
  /* Sonido                                                            */
  /* ---------------------------------------------------------------- */

  // Los nueve players se crean al montar, no al sonar: crearlos en el
  // momento del disparo mete 50-200 ms de retraso y un tin que llega tarde
  // es peor que ninguno.
  useEffect(() => {
    prepararSonido();
    return soltarSonido;
  }, []);

  useEffect(() => { activarSonido(sonido); }, [sonido]);

  const faseAnterior = useRef<Fase | null>(null);
  const ultimaCuenta = useRef<string>('');

  // Transiciones.
  useEffect(() => {
    const ant = faseAnterior.current;
    faseAnterior.current = estado.fase;
    if (ant === null || ant === estado.fase) return;
    // Entrar o salir de pausa no suena: es una accion del usuario, ya sabe
    // que la hizo.
    if (ant === 'pausa' || estado.fase === 'pausa') return;

    switch (estado.fase) {
      case 'trabajo':     reproducir('inicio_serie'); break;
      case 'cambio_lado': reproducir('cambio_lado'); break;
      case 'descanso':    reproducir('fin_serie'); break;
      case 'preparado':   if (ant === 'descanso') reproducir('fin_descanso'); break;
      case 'fin':         reproducir('fin_sesion'); break;
    }
  }, [estado.fase]);

  // Cuenta atras. Solo en fases que cuentan hacia abajo: el trabajo por
  // repeticiones cuenta hacia arriba y no tiene final previsible.
  useEffect(() => {
    const cuenta =
      estado.fase === 'preparado' ||
      estado.fase === 'cambio_lado' ||
      (estado.fase === 'trabajo' && it?.segPlan != null);
    if (!cuenta) return;

    const s = estado.restanteS;
    if (s < 1 || s > 3) return;

    // Una sola vez por segundo y por serie: sin esto, pausar y reanudar en
    // el segundo 2 vuelve a disparar el mismo tin.
    const clave = `${estado.fase}:${estado.indice}:${estado.serieNum}:${estado.lado}:${s}`;
    if (ultimaCuenta.current === clave) return;
    ultimaCuenta.current = clave;

    reproducir(s === 3 ? 'cuenta_3' : s === 2 ? 'cuenta_2' : 'cuenta_1');
  }, [estado.restanteS, estado.fase, estado.indice, estado.serieNum, estado.lado, it]);

  const totalSeries = items.reduce((s, x) => s + x.seriesPlan * (esUnilateral(x) ? 2 : 1), 0);
  const seriesHechas = estado.hechas.length;

  return {
    estado,
    ejercicio: it,
    progreso: totalSeries ? seriesHechas / totalSeries : 0,
    esPorTiempo: it?.segPlan != null,
    puedeDeshacer: estado.anterior !== null,
    registrar: useCallback((reps?: number, pesoKg?: number) =>
      enviar({ t: 'registrar', reps, pesoKg }), []),
    avanzar:     useCallback(() => enviar({ t: 'avanzar' }), []),
    omitir:      useCallback(() => enviar({ t: 'omitir' }), []),
    deshacer:    useCallback(() => enviar({ t: 'deshacer' }), []),
    masDescanso: useCallback((seg = 20) => enviar({ t: 'masDescanso', seg }), []),
    pausar:      useCallback(() => enviar({ t: 'pausar' }), []),
    reanudar:    useCallback(() => enviar({ t: 'reanudar' }), []),
    irA:         useCallback((i: number) => enviar({ t: 'irA', indice: i }), []),
    /** Se llama al salir de la sesion (completa o abandonada): ya no hay
     *  nada que ofrecer continuar la proxima vez que se abra el reproductor. */
    limpiarGuardado: useCallback(() => borrarSesionGuardada(), []),
  };
}
