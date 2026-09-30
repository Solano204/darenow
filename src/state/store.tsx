/**
 * FORJA · estado del usuario
 *
 * AsyncStorage en vez de SQLite para esta build de prueba: corre en Expo Go
 * sin pasos extra y el volumen de datos lo aguanta de sobra (unos 90 KB por
 * semestre de uso). El esquema SQL sigue en db/user_schema.sql para cuando
 * pases a build nativa; los campos son los mismos.
 *
 * Regla del producto: nada se pierde. Una sesion abandonada se guarda igual
 * y cuenta para la racha si hubo al menos una serie real.
 *
 * Desde R4 el estado vive en `tienda.ts` (Zustand) y se lee con selectores: un componente se
 * re-renderiza solo cuando cambia lo que selecciona. Las acciones estan en `acciones.ts`.
 * `ProveedorEstado` ya no reparte un contexto: solo carga lo guardado al montar.
 */

import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { mark as perfMark } from '@/dev/perfMarks'; // perf:R1
import { useTienda, cargarEstado, escribirPendiente } from './tienda';
import type { Estado, Favoritos, PerfilUsuario, SesionGuardada, RutinaPropia } from './tipos';

export type {
  SesionGuardada, MedicionGuardada, PerfilUsuario, Racha, ItemPropio, RutinaPropia, Favoritos, Estado,
} from './tipos';
export {
  hoy, imagenRutina, calcularRacha, revisarPausa, estadisticas, ultimos7, minutosPorDia, diasEntrenados, ultimaVezEn,
} from './derivados';

/** Lee lo guardado al montar y escribe lo pendiente al pasar a segundo plano. */
export function ProveedorEstado({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    perfMark('providers-montados'); // perf:R1
    cargarEstado().then(() => perfMark('storage-ready')); // perf:R1
    const sub = AppState.addEventListener('change', st => { if (st !== 'active') escribirPendiente(); });
    return () => sub.remove();
  }, []);
  return <>{children}</>;
}

/* ------------------------------------------------------------------ */
/* Selectores                                                          */
/* ------------------------------------------------------------------ */

const VACIO: string[] = [];

/**
 * Lee una parte del estado. El componente se re-renderiza solo si lo que devuelve `sel` cambia
 * (comparado con Object.is): devuelve un campo o un valor calculado primitivo, no un objeto nuevo.
 * Para varios campos a la vez, un selector por campo o `useShallow` de zustand.
 */
export function useEstadoSel<T>(sel: (e: Estado) => T): T {
  return useTienda(s => sel(s.estado));
}

/** true mientras se lee lo guardado al arrancar. */
export const useCargandoEstado = (): boolean => useTienda(s => s.cargando);

export const usePerfil = (): PerfilUsuario => useTienda(s => s.estado.perfil);
export const useSesiones = (): SesionGuardada[] => useTienda(s => s.estado.sesiones);
export const useRutinasPropias = (): RutinaPropia[] => useTienda(s => s.estado.rutinasPropias);

/** Los favoritos de un tipo (para una lista: cada fila recibe su booleano). */
export const useFavoritos = (tipo: keyof Favoritos): string[] => useTienda(s => s.estado.favoritos[tipo] ?? VACIO);

/** Si un elemento es favorito. Solo re-renderiza cuando cambia ESTE elemento. */
export const useEsFavorito = (tipo: keyof Favoritos, id: string): boolean =>
  useTienda(s => (s.estado.favoritos[tipo] ?? VACIO).includes(id));
