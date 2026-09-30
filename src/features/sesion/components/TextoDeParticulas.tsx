import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Path, Points, Skia, useFont, type SkPoint } from '@shopify/react-native-skia';
import {
  Easing, cancelAnimation, useDerivedValue, useSharedValue, withDelay, withRepeat, withTiming,
} from 'react-native-reanimated';
import { easing } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const FUENTE = require('@expo-google-fonts/big-shoulders-display/BigShouldersDisplay_800ExtraBold.ttf');

const FRACCION_CONTORNO = 0.55;
const INTENTOS_RELLENO = 6000;
const GRANO_PX = 4;
const OPACIDAD_NUBE = 0.9;
const POLVO_PARTICULAS = 8;
const POLVO_CAIDA_PX = 70;
const POLVO_CICLO_MS = 2200;
const SOLIDO_MS = 260;
const REDUCIDO_MS = 150;

interface Geometria {
  texto: SkPointPath;
  sx: number[]; sy: number[]; tx: number[]; ty: number[]; dx: number[]; vel: number[];
  polvoX: number[]; polvoY: number[]; polvoFase: number[];
}
type SkPointPath = ReturnType<typeof Skia.Path.MakeFromText>;

/**
 * Un texto que se forma con particulas de magnesia. Las particulas parten
 * dispersas por toda la pantalla y viajan hasta puntos del contorno y del
 * relleno de las letras (el contorno sale de `Skia.Path.MakeFromText` y de un
 * `ContourMeasureIter`, el relleno de un muestreo con `path.contains`). Al llegar,
 * el texto solido aparece encima y las particulas se apagan; despues cae un
 * polvo muy leve de las letras. Con `disolver` las letras se deshacen en polvo
 * hacia arriba. Con movimiento reducido solo hay un fundido del texto.
 * Es un unico `Canvas`; `centroY` es la fraccion de la altura donde va el texto.
 */
export function TextoDeParticulas({
  texto, tamano, color, centroY = 0.46, cantidad = 200, ensambleMs = 700, disolver = false, disolverMs = 400,
}: {
  texto: string;
  tamano: number;
  color: string;
  centroY?: number;
  cantidad?: number;
  ensambleMs?: number;
  disolver?: boolean;
  disolverMs?: number;
}) {
  const reducido = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const font = useFont(FUENTE, tamano);
  // Una semilla por montaje: cada vez que aparece el texto las particulas salen de sitios
  // distintos, como antes, pero el calculo del render es puro (el React Compiler lo exige).
  const [semilla] = useState(() => Math.floor(Math.random() * 0xffffffff));

  const geo = useMemo<Geometria | null>(() => {
    if (!font) return null;
    const caja = font.measureText(texto);
    const x = (width - caja.width) / 2 - caja.x;
    const y = height * centroY - caja.y - caja.height / 2;
    const camino = Skia.Path.MakeFromText(texto, x, y, font);
    if (!camino) return null;

    const objetivos: SkPoint[] = [];
    const contornos: { medida: ReturnType<ReturnType<typeof Skia.ContourMeasureIter>['next']>; largo: number }[] = [];
    const it = Skia.ContourMeasureIter(camino, false, 1);
    let total = 0;
    for (let c = it.next(); c; c = it.next()) {
      const largo = c.length();
      contornos.push({ medida: c, largo });
      total += largo;
    }
    const nContorno = Math.round(cantidad * FRACCION_CONTORNO);
    const paso = total / Math.max(1, nContorno);
    for (const { medida, largo } of contornos) {
      for (let d = 0; d < largo && objetivos.length < nContorno; d += paso) objetivos.push(medida!.getPosTan(d)[0]);
    }
    const aleatorio = generadorAleatorio(semilla);
    const b = camino.getBounds();
    for (let n = 0; n < INTENTOS_RELLENO && objetivos.length < cantidad; n++) {
      const px = b.x + aleatorio() * b.width;
      const py = b.y + aleatorio() * b.height;
      if (camino.contains(px, py)) objetivos.push({ x: px, y: py });
    }

    const n = objetivos.length;
    const azar = (a: number, z: number) => a + aleatorio() * (z - a);
    const polvo = Array.from({ length: POLVO_PARTICULAS }, () => objetivos[Math.floor(aleatorio() * n)]);
    return {
      texto: camino,
      sx: objetivos.map(() => azar(0, width)), sy: objetivos.map(() => azar(0, height)),
      tx: objetivos.map(p => p.x), ty: objetivos.map(p => p.y),
      dx: objetivos.map(() => azar(-30, 30)), vel: objetivos.map(() => azar(60, 150)),
      polvoX: polvo.map(p => p.x), polvoY: polvo.map(p => p.y),
      polvoFase: polvo.map((_, i) => i / POLVO_PARTICULAS),
    };
  }, [font, texto, width, height, centroY, cantidad, semilla]);

  const ensamble = useSharedValue(0);
  const solido = useSharedValue(0);
  const caida = useSharedValue(0);
  const disuelve = useSharedValue(0);

  useEffect(() => {
    if (!geo) return;
    if (reducido) { solido.set(withTiming(1, { duration: REDUCIDO_MS })); return; }
    ensamble.set(withTiming(1, { duration: ensambleMs, easing: easing.salida }));
    solido.set(withDelay(ensambleMs - 120, withTiming(1, { duration: SOLIDO_MS })));
    caida.set(withDelay(ensambleMs + 200, withRepeat(
      withTiming(1, { duration: POLVO_CICLO_MS, easing: Easing.linear }), -1, false,
    )));
    return () => { cancelAnimation(ensamble); cancelAnimation(solido); cancelAnimation(caida); };
  }, [geo, reducido, ensambleMs]);

  useEffect(() => {
    if (!disolver) return;
    if (reducido) { solido.set(withTiming(0, { duration: REDUCIDO_MS })); return; }
    disuelve.set(withTiming(1, { duration: disolverMs, easing: easing.salida }));
  }, [disolver, reducido, disolverMs]);

  const sx = geo?.sx ?? []; const sy = geo?.sy ?? []; const tx = geo?.tx ?? []; const ty = geo?.ty ?? [];
  const dx = geo?.dx ?? []; const vel = geo?.vel ?? [];
  const polvoX = geo?.polvoX ?? []; const polvoY = geo?.polvoY ?? []; const polvoFase = geo?.polvoFase ?? [];

  const nube = useDerivedValue<SkPoint[]>(() => {
    const e = ensamble.value; const u = disuelve.value;
    const salida: SkPoint[] = [];
    for (let i = 0; i < tx.length; i++) {
      salida.push({ x: sx[i] + (tx[i] - sx[i]) * e + dx[i] * u, y: sy[i] + (ty[i] - sy[i]) * e - vel[i] * u });
    }
    return salida;
  });
  const opacidadNube = useDerivedValue(() => {
    const u = disuelve.value;
    const armando = OPACIDAD_NUBE * (1 - solido.value);
    const deshaciendo = u > 0 ? OPACIDAD_NUBE * (1 - u) * Math.min(1, u * 8) : 0;
    return Math.max(armando, deshaciendo);
  });
  const opacidadTexto = useDerivedValue(() => solido.value * (1 - Math.min(1, disuelve.value * 3)));
  const polvo = useDerivedValue<SkPoint[]>(() => {
    const salida: SkPoint[] = [];
    for (let i = 0; i < polvoX.length; i++) {
      const f = (caida.value + polvoFase[i]) % 1;
      salida.push({ x: polvoX[i] + Math.sin(f * 6.28) * 4, y: polvoY[i] + f * POLVO_CAIDA_PX });
    }
    return salida;
  });
  const opacidadPolvo = useDerivedValue(() => 0.45 * solido.value * (1 - disuelve.value));

  if (!geo) return null;
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path path={geo.texto!} color={color} opacity={opacidadTexto} />
      <Points points={nube} mode="points" color={color} style="stroke" strokeWidth={GRANO_PX} strokeCap="round" opacity={opacidadNube} />
      <Points points={polvo} mode="points" color={color} style="stroke" strokeWidth={GRANO_PX - 1} strokeCap="round" opacity={opacidadPolvo} />
    </Canvas>
  );
}

/** mulberry32: numeros en [0, 1) a partir de una semilla, sin estado global. */
function generadorAleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
