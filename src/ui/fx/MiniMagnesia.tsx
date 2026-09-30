import { useCallback, useRef } from 'react';
import type { View } from 'react-native';
import { useMagnesia } from './MagnesiaOverlay';

/**
 * Nube pequena de magnesia (10 particulas, 400 ms) que sale del centro de una
 * vista. El motor es el de `MagnesiaOverlay`: aqui solo se mide donde esta la
 * vista en la ventana. `ref` va en la vista de origen y `disparar` la suelta.
 */
export function useMiniMagnesia() {
  const magnesia = useMagnesia();
  const ref = useRef<View>(null);

  const disparar = useCallback((particulas?: number) => {
    ref.current?.measureInWindow((x, y, ancho, alto) => magnesia.mini(x + ancho / 2, y + alto / 2, particulas));
  }, [magnesia]);

  return { ref, disparar };
}
