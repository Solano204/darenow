import React, { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { Canvas, Points } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { paleta } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

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
 * foto: 25 particulas en un solo Canvas, sin estado por fotograma. Se pausa
 * si la pantalla pierde foco (`pausado`) o la app pasa a segundo plano, y no
 * se dibuja con movimiento reducido.
 */
export function MagnesiaParticles({ ancho, alto, pausado = false }: { ancho: number; alto: number; pausado?: boolean }) {
  const reducido = useReducedMotion();
  const [enPrimerPlano, setEnPrimerPlano] = useState(AppState.currentState === 'active');
  const tiempo = useSharedValue(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', e => setEnPrimerPlano(e === 'active'));
    return () => sub.remove();
  }, []);

  const frame = useFrameCallback(info => {
    tiempo.value += (info.timeSincePreviousFrame ?? 0) / 1000;
  }, false);

  const activo = !pausado && !reducido && enPrimerPlano;
  useEffect(() => {
    frame.setActive(activo);
    return () => frame.setActive(false);
  }, [activo]);

  const grupos = useMemo(
    () => CLASES.map((c, k) => generar(c.cantidad, ancho, alto, SEMILLA + k)),
    [ancho, alto],
  );

  if (reducido) return null;

  return (
    <Canvas
      style={{ position: 'absolute', top: 0, left: 0, width: ancho, height: alto }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {CLASES.map((c, k) => (
        <Grupo key={k} particulas={grupos[k]} tiempo={tiempo} alto={alto} ancho={c.ancho} opacidad={c.opacidad} />
      ))}
    </Canvas>
  );
}

function Grupo({ particulas, tiempo, alto, ancho, opacidad }: {
  particulas: Particula[]; tiempo: SharedValue<number>; alto: number; ancho: number; opacidad: number;
}) {
  const puntos = useDerivedValue(() => {
    const t = tiempo.value;
    return particulas.map(p => ({
      x: p.x0 + Math.sin(t * p.freq + p.fase) * p.amp,
      y: (((p.y0 - p.v * t) % alto) + alto) % alto,
    }));
  });

  return (
    <Points points={puntos} mode="points" style="stroke" strokeWidth={ancho} strokeCap="round" color={paleta.magnesia} opacity={opacidad} />
  );
}
