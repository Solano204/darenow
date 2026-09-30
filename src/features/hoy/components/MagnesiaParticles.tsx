import React, { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { Group, Points } from '@shopify/react-native-skia';
import { useAnimatedReaction, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { crearPuntos, type Punto } from '@/ui/fx/particulas';
import { paleta } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const CLASES = [
  { cantidad: 9, ancho: 2, opacidad: 0.4 },
  { cantidad: 9, ancho: 3, opacidad: 0.28 },
  { cantidad: 7, ancho: 4, opacidad: 0.18 },
] as const;
const VELOCIDAD_MIN = 6;
const VELOCIDAD_MAX = 12;
const DERIVA_MAX = 10;
const SEMILLA = 7;

interface Particula { x0: number; y0: number; v: number; fase: number; freq: number; amp: number }

function azar(n: number) {
  return () => {
    n |= 0; n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generar(cantidad: number, ancho: number, alto: number, semilla: number): Particula[] {
  const r = azar(semilla);
  return Array.from({ length: cantidad }, () => ({
    x0: r() * ancho,
    y0: r() * alto,
    v: VELOCIDAD_MIN + r() * (VELOCIDAD_MAX - VELOCIDAD_MIN),
    fase: r() * Math.PI * 2,
    freq: 0.2 + r() * 0.4,
    amp: 2 + r() * DERIVA_MAX,
  }));
}

/**
 * Polvo de magnesia flotando muy lento (6 a 12 px/s) dentro del haz de la
 * foto: 25 particulas, sin estado por fotograma. Se pausa si la pantalla
 * pierde foco (`pausado`) o la app pasa a segundo plano, y no se dibuja con
 * movimiento reducido. Son elementos de Skia sin `Canvas` propio: van dentro
 * del lienzo de la foto (`FotoTratada`), un solo `Canvas` para foto, velo y
 * polvo (R6).
 */
export function PolvoMagnesia({ ancho, alto, pausado = false }: { ancho: number; alto: number; pausado?: boolean }) {
  const reducido = useReducedMotion();
  const [enPrimerPlano, setEnPrimerPlano] = useState(AppState.currentState === 'active');
  const tiempo = useSharedValue(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', e => setEnPrimerPlano(e === 'active'));
    return () => sub.remove();
  }, []);

  const frame = useFrameCallback(info => {
    tiempo.set(tiempo.get() + (info.timeSincePreviousFrame ?? 0) / 1000);
  }, false);

  const activo = !pausado && !reducido && enPrimerPlano;
  const alCambiarActivo = useEffectEvent(() => {
    frame.setActive(activo);
    return () => frame.setActive(false);
  });
  useEffect(() => alCambiarActivo(), [activo]);

  const grupos = useMemo(
    () => CLASES.map((c, k) => generar(c.cantidad, ancho, alto, SEMILLA + k)),
    [ancho, alto],
  );

  if (reducido) return null;

  return (
    <Group>
      {CLASES.map((c, k) => (
        <Grupo key={k} particulas={grupos[k]} tiempo={tiempo} alto={alto} ancho={c.ancho} opacidad={c.opacidad} />
      ))}
    </Group>
  );
}

function Grupo({ particulas, tiempo, alto, ancho, opacidad }: {
  particulas: Particula[]; tiempo: SharedValue<number>; alto: number; ancho: number; opacidad: number;
}) {
  // Pool creado una vez (R6): cada cuadro mueve las mismas particulas, sin crear objetos.
  const puntos = useSharedValue<Punto[]>(crearPuntos(particulas.length));
  useAnimatedReaction(() => tiempo.value, t => {
    puntos.modify(pool => {
      'worklet';
      for (let i = 0; i < particulas.length && i < pool.length; i++) {
        const p = particulas[i];
        pool[i].x = p.x0 + Math.sin(t * p.freq + p.fase) * p.amp;
        pool[i].y = (((p.y0 - p.v * t) % alto) + alto) % alto;
      }
      return pool;
    }, true);
  });

  return (
    <Points points={puntos} mode="points" style="stroke" strokeWidth={ancho} strokeCap="round" color={paleta.magnesia} opacity={opacidad} />
  );
}
