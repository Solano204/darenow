import { useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { NavigationContext } from '@react-navigation/native';

/**
 * Si un loop de animacion (pulso, respiracion, polvo) debe correr: su pantalla esta enfocada y la
 * app en primer plano (R6). `freezeOnBlur` congela los renders de una pantalla tapada, pero no las
 * animaciones del hilo de UI: sin esto, un pulso seguia corriendo detras de otra pantalla (H-19).
 * Fuera de un navegador (un modal suelto) cuenta como enfocada.
 */
export function useLoopActivo(): boolean {
  const navegacion = useContext(NavigationContext);
  const [enfocada, setEnfocada] = useState(() => navegacion?.isFocused() ?? true);
  const [primerPlano, setPrimerPlano] = useState(() => AppState.currentState !== 'background');

  useEffect(() => {
    if (!navegacion) return;
    const alEnfocar = navegacion.addListener('focus', () => setEnfocada(true));
    const alSalir = navegacion.addListener('blur', () => setEnfocada(false));
    return () => { alEnfocar(); alSalir(); };
  }, [navegacion]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', estado => setPrimerPlano(estado !== 'background'));
    return () => sub.remove();
  }, []);

  return enfocada && primerPlano;
}
