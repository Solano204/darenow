import { useCallback, useRef } from 'react';

/**
 * Recuerda que pasos ya reprodujeron su animacion de entrada. `debeAnimar`
 * decide una sola vez por visita (no cambia a mitad de la animacion);
 * `soltar` cierra la visita, y la siguiente vez el paso aparece estatico.
 */
export function useFirstView() {
  const vistos = useRef(new Set<number>());
  const decididos = useRef(new Map<number, boolean>());

  const debeAnimar = useCallback((id: number): boolean => {
    let d = decididos.current.get(id);
    if (d === undefined) {
      d = !vistos.current.has(id);
      decididos.current.set(id, d);
    }
    return d;
  }, []);

  const marcarVisto = useCallback((id: number) => { vistos.current.add(id); }, []);
  const soltar = useCallback((id: number) => { decididos.current.delete(id); }, []);

  return { debeAnimar, marcarVisto, soltar };
}
