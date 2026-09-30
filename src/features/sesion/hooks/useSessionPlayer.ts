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

import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ItemSesion } from '@/lib/engine/session';
import { crearReducer, estadoInicial, esUnilateral, avanzarReloj } from '@/features/sesion/utils/playerMachine';
import type { EstadoPlayer } from '@/features/sesion/utils/playerMachine';
import type { Accion } from '@/features/sesion/utils/playerTipos';
import { prepararSonido, soltarSonido, activarSonido } from '@/media/sonido';
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

/**
 * El estado del reproductor vive en un store por sesion (R4). El reloj lo cambia cada segundo,
 * pero la pantalla se suscribe solo a su «estructura» (fase, ejercicio, serie, lado, series
 * hechas): el tiempo lo leen el numero y unos pocos componentes hoja (`useTiempoSesion`). La
 * maquina, el intervalo de 1 s y las transiciones son los mismos de siempre.
 */
export type TiendaSesion = StoreApi<{ estado: EstadoPlayer }>;

/** Lo que cambia al pasar de fase, de serie o de ejercicio; no con cada segundo. */
export type EstructuraSesion = Omit<EstadoPlayer, 'restanteS' | 'transcurridoS' | 'descansoAcumuladoS'>;

const estructuraDe = (e: EstadoPlayer): EstructuraSesion => ({
  fase: e.fase, faseAnterior: e.faseAnterior, indice: e.indice, serieNum: e.serieNum, lado: e.lado,
  hechas: e.hechas, anterior: e.anterior,
});

/** Segundos restantes de la fase: solo para quien los pinta o reacciona a cada segundo. */
export function useTiempoSesion(tienda: TiendaSesion): number {
  return useStore(tienda, s => s.estado.restanteS);
}

/** Un valor calculado del estado (con el tiempo incluido) que cambia pocas veces: p. ej. «en cuenta final». */
export function useDeSesion<T>(tienda: TiendaSesion, sel: (e: EstadoPlayer) => T): T {
  return useStore(tienda, s => sel(s.estado));
}

export function useSessionPlayer(
  items: ItemSesion[], sonido = true, restaurar?: SesionEnCurso | null,
) {
  // El reducer se rehace cuando cambia `items` y `enviar` usa siempre el ultimo: si la pantalla
  // sustituye un ejercicio a mitad de sesion, el motor ve la lista nueva de inmediato.
  const reducer = useMemo(() => crearReducer({ items }), [items]);
  const reducerRef = useRef(reducer);
  useLayoutEffect(() => { reducerRef.current = reducer; }, [reducer]);
  const [tienda] = useState<TiendaSesion>(() => createStore<{ estado: EstadoPlayer }>()(() => {
    if (!restaurar) return { estado: estadoInicial(items) };
    const segundos = Math.max(0, Math.round((Date.now() - restaurar.guardadoEn) / 1000));
    return { estado: avanzarReloj(restaurar.estado, items, segundos) };
  }));
  const enviar = useCallback(
    (a: Accion) => tienda.setState(s => ({ estado: reducerRef.current(s.estado, a) })),
    [tienda],
  );
  const estado = useStore(tienda, useShallow(s => estructuraDe(s.estado)));

  // Reloj. Un solo intervalo para toda la sesion.
  useEffect(() => {
    if (estado.fase === 'fin' || estado.fase === 'pausa') return;
    const id = setInterval(() => enviar({ t: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [estado.fase, enviar]);

  /* ---------------------------------------------------------------- */
  /* Sesion interrumpida: segundo plano o app cerrada                  */
  /* ---------------------------------------------------------------- */

  // El listener se registra una sola vez y lee el estado y los items mas frescos al disparar
  // (el estado, del store; los items, con `useEffectEvent`), sin re-suscribirse con cada tick.
  const fondoDesde = useRef<number | null>(null);
  const alCambiarApp = useEffectEvent((st: string) => {
    if (st !== 'active') {
      fondoDesde.current = Date.now();
      const actual = tienda.getState().estado;
      if (actual.fase !== 'fin') {
        AsyncStorage.setItem(CLAVE_GUARDADO, JSON.stringify({
          items, estado: actual, guardadoEn: Date.now(),
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
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => alCambiarApp(st));
    return () => sub.remove();
  }, []);

  // Ademas del respaldo por segundo plano, cada serie que se marca queda
  // guardada: si la app se cierra de golpe sin pasar por background,
  // "nada se pierde" sigue siendo cierto.
  const alCambiarHechas = useEffectEvent(() => {
    const actual = tienda.getState().estado;
    if (actual.hechas.length === 0 || actual.fase === 'fin') return;
    AsyncStorage.setItem(CLAVE_GUARDADO, JSON.stringify({
      items, estado: actual, guardadoEn: Date.now(),
    } as SesionEnCurso)).catch(() => {});
  });
  useEffect(() => alCambiarHechas(), [estado.hechas.length]);

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

  const totalSeries = items.reduce((s, x) => s + x.seriesPlan * (esUnilateral(x) ? 2 : 1), 0);
  const seriesHechas = estado.hechas.length;

  return {
    tienda,
    /** La estructura del estado: sin el tiempo, que cambia cada segundo (ver `useTiempoSesion`). */
    estado,
    ejercicio: it,
    progreso: totalSeries ? seriesHechas / totalSeries : 0,
    esPorTiempo: it?.segPlan != null,
    puedeDeshacer: estado.anterior !== null,
    registrar: useCallback((reps?: number, pesoKg?: number) =>
      enviar({ t: 'registrar', reps, pesoKg }), [enviar]),
    avanzar:     useCallback(() => enviar({ t: 'avanzar' }), [enviar]),
    omitir:      useCallback(() => enviar({ t: 'omitir' }), [enviar]),
    deshacer:    useCallback(() => enviar({ t: 'deshacer' }), [enviar]),
    masDescanso: useCallback((seg = 20) => enviar({ t: 'masDescanso', seg }), [enviar]),
    pausar:      useCallback(() => enviar({ t: 'pausar' }), [enviar]),
    reanudar:    useCallback(() => enviar({ t: 'reanudar' }), [enviar]),
    irA:         useCallback((i: number) => enviar({ t: 'irA', indice: i }), [enviar]),
    /** Se llama al salir de la sesion (completa o abandonada): ya no hay
     *  nada que ofrecer continuar la proxima vez que se abra el reproductor. */
    limpiarGuardado: useCallback(() => borrarSesionGuardada(), []),
  };
}
