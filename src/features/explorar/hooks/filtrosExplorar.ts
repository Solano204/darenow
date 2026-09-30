/**
 * DARENOW · filtros de Explorar en un store (R4)
 *
 * Antes eran estado de la pantalla: cada tecla o cada chip re-renderizaba Explorar entera
 * (encabezado, buscador, los 14 chips, el contador y la lista). Ahora cada pieza lee solo lo que
 * pinta: el buscador el texto, cada chip si esta activo, y el contador y la lista el resultado.
 *
 * El texto y los chips se actualizan al instante; el resultado se calcula con `useDeferredValue`,
 * asi que React pinta primero la tecla o el chip y despues la lista (sin trabar el teclado).
 * No se guarda nada: al desmontar Explorar vuelven a sus valores iniciales, como antes.
 */
import { useDeferredValue, useMemo } from 'react';
import { create } from 'zustand';
import { EJERCICIOS, RUTINAS, PROGRAMAS, MUSCULOS } from '@/data/catalog';
import { useEstadoSel } from '@/state/store';
import {
  filtrarEjercicios, filtrarRutinas, filtrarProgramas, filtrarMusculos, type FiltrosExplorar,
} from '@/features/explorar/utils/filtrar';

const INICIALES: FiltrosExplorar = { q: '', cat: null, goal: null, soloMios: true };

export const useFiltrosExplorar = create<FiltrosExplorar>()(() => INICIALES);

/** Cambios de filtro: funciones fijas (no invalidan memos). */
export const filtros = {
  setQ: (q: string) => useFiltrosExplorar.setState({ q }),
  setCat: (cat: string | null) => useFiltrosExplorar.setState({ cat }),
  setGoal: (goal: string | null) => useFiltrosExplorar.setState({ goal }),
  /** Tocar el objetivo activo lo quita; tocar otro lo pone. */
  alternarGoal: (id: string) => useFiltrosExplorar.setState(s => ({ goal: s.goal === id ? null : id })),
  setSoloMios: (soloMios: boolean) => useFiltrosExplorar.setState({ soloMios }),
  reiniciar: () => useFiltrosExplorar.setState(INICIALES, true),
};

export interface ResultadosExplorar {
  ejercicios: ReturnType<typeof filtrarEjercicios>;
  rutinas: ReturnType<typeof filtrarRutinas>;
  programas: ReturnType<typeof filtrarProgramas>;
  musculos: ReturnType<typeof filtrarMusculos>;
}

/**
 * Lo que muestran la lista y el contador, con los filtros diferidos: mientras React pinta la
 * tecla o el chip, esto conserva el resultado anterior y lo recalcula en segundo plano.
 */
export function useResultadosExplorar(): ResultadosExplorar {
  const f = useDeferredValue(useFiltrosExplorar());
  const equipo = useEstadoSel(e => e.perfil.equipo);
  const contra = useEstadoSel(e => e.perfil.contra);
  const modoSinSaltos = useEstadoSel(e => e.perfil.modoSinSaltos);
  return useMemo(() => resultados(f, equipo, contra, modoSinSaltos), [f, equipo, contra, modoSinSaltos]);
}

/**
 * La lista, el contador y el muro piden el mismo resultado en el mismo render: se calcula una
 * vez por cambio de filtros o de perfil y los demas lo reciben hecho.
 */
let ultimo: { f: FiltrosExplorar; equipo: string[]; contra: string[]; modoSinSaltos: boolean; r: ResultadosExplorar } | null = null;
function resultados(f: FiltrosExplorar, equipo: string[], contra: string[], modoSinSaltos: boolean): ResultadosExplorar {
  if (ultimo && ultimo.f === f && ultimo.equipo === equipo && ultimo.contra === contra && ultimo.modoSinSaltos === modoSinSaltos) {
    return ultimo.r;
  }
  const r = {
    ejercicios: filtrarEjercicios(EJERCICIOS, f, { equipo, contra, modoSinSaltos }),
    rutinas: filtrarRutinas(RUTINAS, f),
    programas: filtrarProgramas(PROGRAMAS, f),
    musculos: filtrarMusculos(MUSCULOS, f),
  };
  ultimo = { f, equipo, contra, modoSinSaltos, r };
  return r;
}
