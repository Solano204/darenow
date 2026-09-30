/**
 * Rutas de Skia que se redibujan cada cuadro sin crear objetos (R6).
 *
 * `useDerivedValue(() => { const p = Skia.Path.Make(); ... })` crea una ruta nueva (y un rectangulo
 * por forma) en cada cuadro de la animacion. Aqui la ruta se crea una vez y cada cuadro se vacia y se
 * vuelve a llenar en su sitio (`modify`, que avisa a Skia sin copiar), solo cuando cambia lo que la
 * mueve (`cuando`).
 */
import { useState } from 'react';
import { Skia, type SkPath } from '@shopify/react-native-skia';
import { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';

export function useRutaAnimada(cuando: () => unknown, dibujar: (ruta: SkPath) => void): SharedValue<SkPath> {
  const [inicial] = useState(() => Skia.Path.Make());
  const ruta = useSharedValue<SkPath>(inicial);
  useAnimatedReaction(cuando, () => {
    ruta.modify(p => {
      'worklet';
      p.reset();
      dibujar(p);
      return p;
    }, true);
  });
  return ruta;
}

/** Un rectangulo redondeado en la ruta sin crear objetos intermedios (worklet). */
export function agregarPlaca(ruta: SkPath, x: number, y: number, ancho: number, alto: number, radio: number): void {
  'worklet';
  ruta.addRRect({ rect: { x, y, width: ancho, height: alto }, rx: radio, ry: radio });
}
