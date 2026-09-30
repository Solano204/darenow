import { useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, type NativeEventSubscription } from 'react-native';
import { NavigationContext } from '@react-navigation/native';

/**
 * Si la app esta en primer plano, con UNA sola escucha de AppState para toda la app: cada loop que la
 * pide se suscribe aqui (un arreglo en JS), no al modulo nativo. La escucha nativa existe mientras
 * haya al menos un suscriptor.
 */
const oyentes = new Set<() => void>();
let nativa: NativeEventSubscription | null = null;
let primerPlano = AppState.currentState !== 'background';

function suscribir(avisar: () => void): () => void {
  oyentes.add(avisar);
  nativa ??= AppState.addEventListener('change', estado => {
    primerPlano = estado !== 'background';
    oyentes.forEach(o => o());
  });
  return () => {
    oyentes.delete(avisar);
    if (oyentes.size === 0) { nativa?.remove(); nativa = null; }
  };
}
const leer = () => primerPlano;

/**
 * Si un loop de animacion (pulso, respiracion, polvo, brillo) debe correr: su pantalla esta
 * enfocada y la app en primer plano (R6). `freezeOnBlur` congela los renders de una pantalla
 * tapada, pero no las animaciones del hilo de UI: sin esto, un pulso seguia corriendo detras de
 * otra pantalla (H-19). Fuera de un navegador (un modal suelto) cuenta como enfocada.
 */
export function useLoopActivo(): boolean {
  const navegacion = useContext(NavigationContext);
  const [enfocada, setEnfocada] = useState(() => navegacion?.isFocused() ?? true);
  const enPrimerPlano = useSyncExternalStore(suscribir, leer);

  useEffect(() => {
    if (!navegacion) return;
    const alEnfocar = navegacion.addListener('focus', () => setEnfocada(true));
    const alSalir = navegacion.addListener('blur', () => setEnfocada(false));
    return () => { alEnfocar(); alSalir(); };
  }, [navegacion]);

  return enfocada && enPrimerPlano;
}
