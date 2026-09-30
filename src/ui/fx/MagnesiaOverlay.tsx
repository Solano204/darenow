import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { InteractionManager, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Points, Rect } from '@shopify/react-native-skia';
import {
  Easing, cancelAnimation, useDerivedValue, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, polvo } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useSplashOculto } from '@/ui/hooks/useSplash';

const VELO_SUBE_MS = 60;
const VELO_FIJO_MS = 180;
const REDUCIDO_MS = 300;

interface Grupo { desde: number; hasta: number; base: number; opacidad: number }

interface Motor {
  particulas: number;
  duracionMs: number;
  velMin: number;
  velRango: number;
  frenadoS: number;
  elevacionPxS: number;
  crecimiento: number;
  /** true: la nube sale sobre todo hacia arriba; false: en todas direcciones. */
  haciaArriba: boolean;
  grupos: Grupo[];
}

/** El aplauso: 72 particulas, 700 ms. */
const NUBE: Motor = {
  particulas: 72, duracionMs: 700, velMin: 180, velRango: 340, frenadoS: 0.35,
  elevacionPxS: 30, crecimiento: 1.4, haciaArriba: true,
  grupos: [
    { desde: 0, hasta: 24, base: 5, opacidad: 0.5 },
    { desde: 24, hasta: 48, base: 8, opacidad: 0.35 },
    { desde: 48, hasta: 72, base: 12, opacidad: 0.22 },
  ],
};

/** El mismo motor a escala pequena: un toque de magnesia al marcar una opcion. */
const MINI: Motor = {
  particulas: 10, duracionMs: 400, velMin: 70, velRango: 110, frenadoS: 0.2,
  elevacionPxS: 10, crecimiento: 1.2, haciaArriba: false,
  grupos: [
    { desde: 0, hasta: 5, base: 3, opacidad: 0.6 },
    { desde: 5, hasta: 10, base: 5, opacidad: 0.4 },
  ],
};

interface Api {
  /** Aplauso completo: nube y velo. `x`, `y` en coordenadas de ventana. */
  aplaudir: (x: number, y: number) => void;
  /** Nube pequena, sin velo. `particulas` la achica aun mas (Ajustes suelta 6). */
  mini: (x: number, y: number, particulas?: number) => void;
  /** Solo el velo de polvo, para marcar un momento sin nube. */
  destello: () => void;
}

const Contexto = createContext<Api>({ aplaudir: () => {}, mini: () => {}, destello: () => {} });

export const useMagnesia = () => useContext(Contexto);

function anguloAzar(haciaArriba: boolean): number {
  if (!haciaArriba) return Math.random() * Math.PI * 2;
  if (Math.random() < 0.7) return -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
  return (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5;
}

function sortear(m: Motor): number[] {
  const p: number[] = [];
  for (let i = 0; i < m.particulas; i++) p.push(anguloAzar(m.haciaArriba), m.velMin + Math.random() * m.velRango);
  return p;
}

/**
 * Overlay global del aplauso de magnesia. Vive en la raiz, por encima del
 * navegador, para que la nube siga a la vista durante la transicion. Una nube
 * de 72 particulas sale hacia arriba y a los lados, frena, se expande y se
 * desvanece en 700 ms; un velo de polvo (magnesia al 35 %) cubre la pantalla
 * 180 ms y se disipa sobre la siguiente. Con movimiento reducido es solo un
 * fundido de 300 ms. `mini` reutiliza el motor a escala pequena y `destello`
 * es solo el velo.
 */
export function ProveedorMagnesia({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const reducido = useReducedMotion();

  // El Canvas de Skia a pantalla completa no hace falta para pintar la primera pantalla: se monta
  // cuando esta ya se ve (splash oculto) y terminaron sus animaciones de entrada
  // (runAfterInteractions), mucho antes del primer aplauso.
  const splashOculto = useSplashOculto();
  const [lienzoListo, setLienzoListo] = useState(false);
  useEffect(() => {
    if (!splashOculto) return;
    const tarea = InteractionManager.runAfterInteractions(() => setLienzoListo(true));
    return () => tarea.cancel();
  }, [splashOculto]);

  const t = useSharedValue(1);
  const origen = useSharedValue({ x: 0, y: 0 });
  const params = useSharedValue<number[]>([]);
  const soloVelo = useSharedValue(0);

  const tMini = useSharedValue(1);
  const origenMini = useSharedValue({ x: 0, y: 0 });
  const paramsMini = useSharedValue<number[]>([]);

  const lanzar = useCallback((x: number, y: number, velo: boolean) => {
    params.value = sortear(NUBE);
    origen.value = { x, y };
    soloVelo.value = velo || reducido ? 1 : 0;
    cancelAnimation(t);
    t.value = 0;
    t.value = withTiming(1, { duration: velo || reducido ? REDUCIDO_MS : NUBE.duracionMs, easing: Easing.linear });
  }, [reducido]);

  const aplaudir = useCallback((x: number, y: number) => lanzar(x, y, false), [lanzar]);
  const destello = useCallback(() => lanzar(0, 0, true), [lanzar]);

  const mini = useCallback((x: number, y: number, particulas?: number) => {
    if (reducido) return;
    paramsMini.value = sortear(particulas === undefined ? MINI : { ...MINI, particulas });
    origenMini.value = { x, y };
    cancelAnimation(tMini);
    tMini.value = 0;
    tMini.value = withTiming(1, { duration: MINI.duracionMs, easing: Easing.linear });
  }, [reducido]);

  const opacidadVelo = useDerivedValue(() => {
    if (soloVelo.value === 1) {
      const mitad = REDUCIDO_MS / 2;
      const ms = t.value * REDUCIDO_MS;
      return ms < mitad ? ms / mitad : Math.max(0, 1 - (ms - mitad) / mitad);
    }
    const ms = t.value * NUBE.duracionMs;
    if (ms < VELO_SUBE_MS) return ms / VELO_SUBE_MS;
    if (ms < VELO_FIJO_MS) return 1;
    return Math.max(0, 1 - (ms - VELO_FIJO_MS) / (NUBE.duracionMs - VELO_FIJO_MS));
  });

  const api = useMemo(() => ({ aplaudir, mini, destello }), [aplaudir, mini, destello]);

  return (
    <Contexto.Provider value={api}>
      <View style={s.raiz}>
        {children}
        {lienzoListo && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Canvas style={{ width, height }} pointerEvents="none">
              <Rect x={0} y={0} width={width} height={height} color={polvo.velo} opacity={opacidadVelo} />
              {NUBE.grupos.map(g => (
                <Nube key={`n${g.desde}`} motor={NUBE} grupo={g} t={t} origen={origen} params={params} soloVelo={soloVelo} />
              ))}
              {MINI.grupos.map(g => (
                <Nube key={`m${g.desde}`} motor={MINI} grupo={g} t={tMini} origen={origenMini} params={paramsMini} />
              ))}
            </Canvas>
          </View>
        )}
      </View>
    </Contexto.Provider>
  );
}

function Nube({ motor, grupo, t, origen, params, soloVelo }: {
  motor: Motor;
  grupo: Grupo;
  t: SharedValue<number>;
  origen: SharedValue<{ x: number; y: number }>;
  params: SharedValue<number[]>;
  soloVelo?: SharedValue<number>;
}) {
  const { desde, hasta, base, opacidad } = grupo;
  const { duracionMs, frenadoS, elevacionPxS, crecimiento } = motor;

  const puntos = useDerivedValue(() => {
    const salida: { x: number; y: number }[] = [];
    if (soloVelo !== undefined && soloVelo.value === 1) return salida;
    const seg = t.value * (duracionMs / 1000);
    const p = params.value;
    const o = origen.value;
    for (let i = desde; i < hasta; i++) {
      const a = p[i * 2];
      const v = p[i * 2 + 1];
      if (v === undefined) break;
      const d = v * frenadoS * (1 - Math.exp(-seg / frenadoS));
      salida.push({ x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d - elevacionPxS * seg });
    }
    return salida;
  });
  const grosor = useDerivedValue(() => base * (1 + crecimiento * t.value));
  const alfa = useDerivedValue(() => opacidad * Math.pow(1 - t.value, 1.5));

  return (
    <Points points={puntos} mode="points" style="stroke" strokeWidth={grosor} strokeCap="round" color={paleta.magnesia} opacity={alfa} />
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
});
