import { useSyncExternalStore } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { mark as perfMark } from '@/dev/perfMarks'; // perf:R1

/**
 * El splash nativo se queda hasta que la primera pantalla con datos hizo su layout (Presentacion,
 * Acceso, Onboarding, Bienvenida o Hoy): asi no se ve un spinner ni un fondo vacio entre el
 * splash y la app. `useSplashOculto()` avisa cuando ya se fue, para que la entrada de Hoy empiece
 * a la vista y no debajo del splash.
 *
 * Respaldo: si por lo que sea la primera pantalla nunca llega a su layout, el splash se oculta
 * solo a los RESPALDO_MS de haber pedido mantenerlo, para que la app nunca se quede pegada.
 */
const RESPALDO_MS = 8000;

let oculto = false;
const oyentes = new Set<() => void>();

export function mantenerSplash(): void {
  SplashScreen.preventAutoHideAsync().catch(() => {});
  setTimeout(ocultarSplash, RESPALDO_MS);
}

export function ocultarSplash(): void {
  if (oculto) return;
  oculto = true;
  perfMark('primer-layout'); // perf:R1
  SplashScreen.hideAsync().catch(() => {});
  oyentes.forEach(o => o());
}

const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => { oyentes.delete(o); };
};

/** true cuando el splash ya se oculto. */
export function useSplashOculto(): boolean {
  return useSyncExternalStore(suscribir, () => oculto, () => oculto);
}
