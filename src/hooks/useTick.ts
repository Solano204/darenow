import { useRef } from 'react';

/**
 * Cuenta los renders del componente. Se pasa como dependencia de un
 * `useAnimatedStyle` cuyo valor final no se puede recuperar desde su estilo
 * inicial: Reanimated congela ese estilo al montar y un commit de React puede
 * volver a aplicarlo; con esta cuenta el mapper se reevalua tras cada commit.
 */
export function useTick(): number {
  const n = useRef(0);
  n.current += 1;
  return n.current;
}
