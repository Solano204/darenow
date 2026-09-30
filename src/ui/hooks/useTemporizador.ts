import { useEffect, useRef, useState } from 'react';

/**
 * Un temporizador para programar desde un manejador (un toque) sin dejarlo suelto (R6, H-20).
 * `programar` sustituye al que estuviera pendiente (dos toques seguidos no apilan dos), `cancelar`
 * lo quita y al desmontar nunca queda uno vivo: con `alDesmontar: 'ejecutar'` lo pendiente corre
 * en ese momento (una accion ya confirmada, como la de una hoja de confirmacion); si no, se descarta.
 */
export function useTemporizador({ alDesmontar = 'cancelar' }: { alDesmontar?: 'cancelar' | 'ejecutar' } = {}) {
  const pendiente = useRef<{ id: ReturnType<typeof setTimeout>; fn: () => void } | null>(null);
  // Un objeto estable, creado una vez.
  const [api] = useState(() => ({
    programar(fn: () => void, ms: number) {
      if (pendiente.current) clearTimeout(pendiente.current.id);
      const id = setTimeout(() => { pendiente.current = null; fn(); }, ms);
      pendiente.current = { id, fn };
    },
    cancelar() {
      if (pendiente.current) clearTimeout(pendiente.current.id);
      pendiente.current = null;
    },
    /** Si hay algo esperando (para no aceptar un segundo toque mientras tanto). */
    ocupado: () => pendiente.current !== null,
  }));
  useEffect(() => () => {
    const p = pendiente.current;
    if (!p) return;
    clearTimeout(p.id);
    pendiente.current = null;
    if (alDesmontar === 'ejecutar') p.fn();
  }, [alDesmontar]);
  return api;
}
