import { useState } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

/**
 * El numero que se toca para escribirlo (lo comparten `ContadorPlacas` y `Stepper`): mientras no
 * se edita, el texto sigue al valor; al terminar de escribir se acota a `min` y `max` y solo avisa
 * a `onCambio` si cambio.
 */
export function useNumeroEditable(valor: number, min: number, max: number, onCambio: (n: number) => void) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(String(valor));

  // Mientras no se edita, el texto sigue al valor.
  if (!editando && texto !== String(valor)) setTexto(String(valor));

  const confirmar = () => {
    const n = parseInt(texto, 10);
    const limpio = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : valor;
    setTexto(String(limpio));
    setEditando(false);
    if (limpio !== valor) onCambio(limpio);
  };

  return { editando, setEditando, texto, setTexto, confirmar };
}

/**
 * La sacudida de un limite: aviso haptico y, sin movimiento reducido, `amplitud` px a un lado y al
 * otro en 240 ms. `estilo` va en la vista que se sacude.
 */
export function useSacudida(amplitud: number) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const sacudida = useSharedValue(0);

  const sacudir = () => {
    haptico.aviso();
    if (reducido) return;
    sacudida.set(withSequence(
      withTiming(amplitud, { duration: 40 }), withTiming(-amplitud, { duration: 80 }),
      withTiming(amplitud, { duration: 80 }), withTiming(0, { duration: 40 }),
    ));
  };

  const estilo = useAnimatedStyle(() => ({ transform: [{ translateX: sacudida.value }] }), [tick]);

  return { sacudir, estilo };
}
