import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Points, Rect } from '@shopify/react-native-skia';
import {
  Easing, cancelAnimation, runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, polvo } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { aparcar, crearPuntos, type Punto } from './particulas';
import { fraccionAplauso, useCalidadVisual } from './useCalidadVisual';

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

/**
 * Angulo y velocidad de cada particula. Con `fraccion` < 1 (calidad baja) cada grupo conserva solo
 * sus primeras particulas en esa proporcion; las demas quedan sin velocidad (`NaN`) y no se dibujan.
 */
function sortear(m: Motor, fraccion = 1): number[] {
  const p: number[] = [];
  for (let i = 0; i < m.particulas; i++) p.push(anguloAzar(m.haciaArriba), m.velMin + Math.random() * m.velRango);
  if (fraccion < 1) {
    for (const g of m.grupos) {
      const quedan = g.desde + Math.round((g.hasta - g.desde) * fraccion);
      for (let i = quedan; i < g.hasta; i++) p[i * 2 + 1] = Number.NaN;
    }
  }
  return p;
}

/** Tras la ultima nube, el lienzo se queda montado este rato por si llega otra enseguida. */
const LIENZO_OCIOSO_MS = 1500;

/**
 * Overlay global del aplauso de magnesia. Vive en la raiz, por encima del
 * navegador, para que la nube siga a la vista durante la transicion. Una nube
 * de 72 particulas sale hacia arriba y a los lados, frena, se expande y se
 * desvanece en 700 ms; un velo de polvo (magnesia al 35 %) cubre la pantalla
 * 180 ms y se disipa sobre la siguiente. Con movimiento reducido es solo un
 * fundido de 300 ms. `mini` reutiliza el motor a escala pequena y `destello`
 * es solo el velo.
 *
 * R6: el `Canvas` a pantalla completa solo existe mientras hay una nube en el
 * aire (y un momento despues); el resto del tiempo no hay capa de Skia sobre la
 * app (H-10). Las particulas viven en pools creados una vez y reusados entre
 * aplausos. Disparar no espera a nada: la navegacion sigue en el mismo toque.
 */
export function ProveedorMagnesia({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const reducido = useReducedMotion();
  // Calidad baja: el aplauso lleva el 40 % de las particulas (R6).
  const fraccion = fraccionAplauso(useCalidadVisual());

  // El lienzo se monta al disparar y se desmonta cuando no queda ninguna nube en el aire.
  const [lienzo, setLienzo] = useState(false);
  const enVuelo = useRef(0);
  const apagado = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const despegar = useCallback(() => {
    enVuelo.current += 1;
    clearTimeout(apagado.current);
    setLienzo(true);
  }, []);
  const aterrizar = useCallback(() => {
    enVuelo.current = Math.max(0, enVuelo.current - 1);
    if (enVuelo.current > 0) return;
    clearTimeout(apagado.current);
    apagado.current = setTimeout(() => setLienzo(false), LIENZO_OCIOSO_MS);
  }, []);

  const t = useSharedValue(1);
  const origen = useSharedValue({ x: 0, y: 0 });
  const params = useSharedValue<number[]>([]);
  const soloVelo = useSharedValue(0);

  const tMini = useSharedValue(1);
  const origenMini = useSharedValue({ x: 0, y: 0 });
  const paramsMini = useSharedValue<number[]>([]);

  const lanzar = useCallback((x: number, y: number, velo: boolean) => {
    despegar();
    params.set(sortear(NUBE, fraccion));
    origen.set({ x, y });
    soloVelo.set(velo || reducido ? 1 : 0);
    cancelAnimation(t);
    t.set(0);
    // Al terminar (o al cortarla otra nube) avisa una vez: un evento, no un cuadro.
    t.set(withTiming(1, { duration: velo || reducido ? REDUCIDO_MS : NUBE.duracionMs, easing: Easing.linear }, () => {
      runOnJS(aterrizar)();
    }));
  }, [reducido, fraccion, params, origen, soloVelo, t, despegar, aterrizar]);

  const aplaudir = useCallback((x: number, y: number) => lanzar(x, y, false), [lanzar]);
  const destello = useCallback(() => lanzar(0, 0, true), [lanzar]);

  const mini = useCallback((x: number, y: number, particulas?: number) => {
    if (reducido) return;
    despegar();
    paramsMini.set(sortear(particulas === undefined ? MINI : { ...MINI, particulas }));
    origenMini.set({ x, y });
    cancelAnimation(tMini);
    tMini.set(0);
    tMini.set(withTiming(1, { duration: MINI.duracionMs, easing: Easing.linear }, () => {
      runOnJS(aterrizar)();
    }));
  }, [reducido, paramsMini, origenMini, tMini, despegar, aterrizar]);

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
        {lienzo && (
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

  // Un pool por grupo, creado una vez: cada cuadro mueve las mismas particulas.
  const puntos = useSharedValue<Punto[]>(crearPuntos(hasta - desde));
  useAnimatedReaction(() => t.value, valor => {
    puntos.modify(pool => {
      'worklet';
      if (soloVelo !== undefined && soloVelo.value === 1) { aparcar(pool, 0); return pool; }
      const seg = valor * (duracionMs / 1000);
      const p = params.value;
      const o = origen.value;
      let k = 0;
      for (let i = desde; i < hasta; i++) {
        const a = p[i * 2];
        const v = p[i * 2 + 1];
        if (v === undefined) break;
        if (Number.isNaN(v)) continue;   // particula apagada por la calidad
        const d = v * frenadoS * (1 - Math.exp(-seg / frenadoS));
        pool[k].x = o.x + Math.cos(a) * d;
        pool[k].y = o.y + Math.sin(a) * d - elevacionPxS * seg;
        k++;
      }
      aparcar(pool, k);
      return pool;
    }, true);
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
