import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion as useReducedMotionRea } from 'react-native-reanimated';

/**
 * Movimiento reducido del sistema. El valor inicial es sincrono (el de
 * Reanimated), asi que una animacion de entrada no arranca antes de saberlo;
 * el listener cubre el cambio en caliente desde Ajustes del telefono.
 */
export function useReducedMotion(): boolean {
  const inicial = useReducedMotionRea();
  const [reducido, setReducido] = useState(inicial);

  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => { if (vivo) setReducido(v); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducido);
    return () => { vivo = false; sub.remove(); };
  }, []);

  return reducido;
}
