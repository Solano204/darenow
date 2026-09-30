/**
 * DARENOW · tienda del estado del usuario (R4)
 *
 * El estado guardado vive en un store de Zustand en vez de un contexto que envolvía toda la app:
 * cada componente lee con un selector solo lo que pinta y se re-renderiza solo si eso cambia.
 *
 * Persistencia: la MISMA que antes. Una clave (`forja:v1`) con el JSON de `Estado` tal cual, sin
 * el envoltorio `{ state, version }` del middleware `persist` (que habría cambiado el formato).
 * El guardado se agrupa (350 ms) y lo pendiente se escribe al pasar a segundo plano.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLAVE_ESTADO as CLAVE } from '@/storage/claves';
import { leerAlArrancar } from '@/storage/lecturaInicial';
import { ESTADO_INICIAL, PERFIL_INICIAL } from './estadoInicial';
import { revisarPausa } from './derivados';
import type { Estado } from './tipos';

export interface Tienda {
  estado: Estado;
  /** true hasta terminar de leer lo guardado (App muestra el splash mientras). */
  cargando: boolean;
}

export const useTienda = create<Tienda>()(() => ({ estado: ESTADO_INICIAL, cargando: true }));

/* ------------------------------------------------------------------ */
/* Guardado diferido                                                   */
/* ------------------------------------------------------------------ */

/**
 * Antes cada cambio serializaba el estado completo, y tocar "cambiar programa" congelaba la
 * pantalla medio segundo. La interfaz responde de inmediato y el guardado se agrupa: si llegan
 * varios cambios seguidos, se escribe una sola vez.
 */
let pendiente: Estado | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;

function guardar(e: Estado) {
  pendiente = e;
  if (temporizador) return;
  temporizador = setTimeout(() => {
    temporizador = null;
    const x = pendiente;
    pendiente = null;
    if (x) AsyncStorage.setItem(CLAVE, JSON.stringify(x)).catch(() => {});
  }, 350);
}

/** Si la app se va a segundo plano, se escribe ya lo que quede pendiente. */
export function escribirPendiente() {
  if (!pendiente) return;
  AsyncStorage.setItem(CLAVE, JSON.stringify(pendiente)).catch(() => {});
  pendiente = null;
}

/**
 * Aplica un cambio al estado y pide el guardado. Si `fn` devuelve el mismo objeto no cambia nada
 * (ni se guarda), igual que las acciones que antes hacían `return prev`.
 */
export function cambiar(fn: (prev: Estado) => Estado) {
  const prev = useTienda.getState().estado;
  const e = fn(prev);
  if (e === prev) return;
  useTienda.setState({ estado: e });
  guardar(e);
}

/** Vuelve al estado inicial y borra lo guardado (borrar todos los datos). */
export function reiniciarTienda() {
  // Sin esto, una escritura diferida que ya estaba en el temporizador de 350 ms se dispara
  // DESPUES del borrado y resucita el progreso viejo en AsyncStorage.
  if (temporizador) { clearTimeout(temporizador); temporizador = null; }
  pendiente = null;
  AsyncStorage.removeItem(CLAVE).catch(() => {});
  useTienda.setState({ estado: ESTADO_INICIAL });
}

/** Convierte lo guardado en `Estado`. La misma lectura de siempre: mismas claves, mismos rellenos. */
function interpretarGuardado(raw: string): Estado {
  const cargado = { ...ESTADO_INICIAL, ...JSON.parse(raw) } as Estado;
  // El merge de arriba es superficial: un perfil guardado antes de que existiera un campo nuevo
  // lo dejaria en undefined. Se rellena con los valores iniciales para que anadir ajustes no
  // rompa a quien ya venia usando la app.
  cargado.perfil = { ...PERFIL_INICIAL, ...cargado.perfil };
  cargado.racha = revisarPausa(cargado.racha);
  return cargado;
}

/** Lee lo guardado al arrancar. Si no hay nada o está corrupto, arranca limpio. */
export async function cargarEstado() {
  let estado: Estado | null = null;
  try {
    const raw = await leerAlArrancar(CLAVE);
    if (raw) estado = interpretarGuardado(raw);
  } catch { /* arranca limpio */ }
  useTienda.setState(estado ? { estado, cargando: false } : { cargando: false });
}
