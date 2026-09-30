import { useRef } from 'react';

/**
 * Cuenta los renders del componente. Se pasa como dependencia de un
 * `useAnimatedStyle` cuyo valor final no se puede recuperar desde su estilo
 * inicial: Reanimated congela ese estilo al montar y un commit de React puede
 * volver a aplicarlo; con esta cuenta el mapper se reevalua tras cada commit.
 */
export function useTick(): number {
  // Excluido del React Compiler (R4) a proposito: contar renders ES mutar una ref durante el
  // render. Quien lo usa sigue compilado; para el compilador el valor devuelto por un hook cambia
  // en cada render, que es justo lo que se necesita. Se revisa junto con H-03 (R6).
  'use no memo';
  const n = useRef(0);
  // eslint-disable-next-line react-hooks/refs -- ver arriba
  n.current += 1;
  // eslint-disable-next-line react-hooks/refs -- ver arriba
  return n.current;
}
