import React, { useCallback, useRef } from 'react';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { easing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';

const SALIDA_MS = 180;
const REDUCIDO_MS = 150;
const DESPLAZAMIENTO = 24;
const RESPALDO_MS = 500;

/**
 * Coreografia de salida del cuestionario. `ir(dir, despues)` saca el contenido
 * actual (24 px hacia el lado contrario a `dir` y opacidad 0), ejecuta
 * `despues` (el cambio de paso) y espera a `reponer()` para devolver el
 * contenedor a su sitio cuando el paso nuevo ya esta montado, que es lo que
 * entra con sus propias animaciones. Ignora toques mientras corre. Con
 * movimiento reducido es solo un fundido de 150 ms.
 */
export function useTransicionPaso() {
  const reducido = useReducedMotion();
  const t = useSharedValue(0);
  const direccion = useSharedValue(1);
  const ocupado = useRef(false);
  const ultima = useRef<1 | -1>(1);
  const epoca = useRef(0);
  const tick = useTick();

  const reponer = useCallback(() => {
    t.value = 0;
    ocupado.current = false;
  }, []);

  const ir = useCallback((dir: 1 | -1, despues: () => void) => {
    if (ocupado.current) return;
    ocupado.current = true;
    ultima.current = dir;
    direccion.value = dir;
    epoca.current += 1;
    const miEpoca = epoca.current;
    const salir = () => {
      despues();
      // Respaldo por si el paso nuevo no llega a montarse; una transicion posterior lo anula.
      setTimeout(() => { if (epoca.current === miEpoca) reponer(); }, RESPALDO_MS);
    };
    t.value = withTiming(1, { duration: reducido ? REDUCIDO_MS : SALIDA_MS, easing: easing.entrada }, terminado => {
      if (terminado) runOnJS(salir)();
    });
  }, [reducido, reponer]);

  const estilo = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateX: reducido ? 0 : -direccion.value * DESPLAZAMIENTO * t.value }],
  }), [reducido, tick]);

  return { ir, reponer, estilo, ultima };
}

/** Contenedor que recibe el estilo de `useTransicionPaso`. */
export function TransicionPaso({ estilo, children }: { estilo: object; children: React.ReactNode }) {
  return <Animated.View style={[{ flex: 1 }, estilo]}>{children}</Animated.View>;
}
