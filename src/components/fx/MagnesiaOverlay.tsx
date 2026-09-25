import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Points, Rect } from '@shopify/react-native-skia';
import {
  Easing, cancelAnimation, useDerivedValue, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, polvo } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const PARTICULAS = 72;
const DURACION_MS = 700;
const VELO_SUBE_MS = 60;
const VELO_FIJO_MS = 180;
const REDUCIDO_MS = 300;
const VELOCIDAD_MIN = 180;
const VELOCIDAD_RANGO = 340;
const FRENADO_S = 0.35;
const ELEVACION_PX_S = 30;
const CRECIMIENTO = 1.4;

const CLASES = [
  { desde: 0, hasta: 24, base: 5, opacidad: 0.5 },
  { desde: 24, hasta: 48, base: 8, opacidad: 0.35 },
  { desde: 48, hasta: 72, base: 12, opacidad: 0.22 },
] as const;

interface Api { aplaudir: (x: number, y: number) => void }

const Contexto = createContext<Api>({ aplaudir: () => {} });

/** API imperativa del aplauso: `aplaudir(x, y)` con el centro del boton, en coordenadas de ventana. */
export const useMagnesia = () => useContext(Contexto);

function anguloAzar(): number {
  if (Math.random() < 0.7) return -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
  return (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5;
}

/**
 * Overlay global del aplauso de magnesia. Vive en la raiz, por encima del
 * navegador, para que la nube siga a la vista durante la transicion. Una nube
 * de 72 particulas sale hacia arriba y a los lados, frena, se expande y se
 * desvanece en 700 ms; un velo de polvo (magnesia al 35 %) cubre la pantalla
 * 180 ms y se disipa sobre la siguiente. Con movimiento reducido es solo un
 * fundido de 300 ms.
 */
export function ProveedorMagnesia({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const reducido = useReducedMotion();
  const t = useSharedValue(1);
  const origen = useSharedValue({ x: 0, y: 0 });
  const params = useSharedValue<number[]>([]);
  const soloVelo = useSharedValue(0);

  const aplaudir = useCallback((x: number, y: number) => {
    const p: number[] = [];
    for (let i = 0; i < PARTICULAS; i++) p.push(anguloAzar(), VELOCIDAD_MIN + Math.random() * VELOCIDAD_RANGO);
    params.value = p;
    origen.value = { x, y };
    soloVelo.value = reducido ? 1 : 0;
    cancelAnimation(t);
    t.value = 0;
    t.value = withTiming(1, { duration: reducido ? REDUCIDO_MS : DURACION_MS, easing: Easing.linear });
  }, [reducido]);

  const opacidadVelo = useDerivedValue(() => {
    if (soloVelo.value === 1) {
      const mitad = REDUCIDO_MS / 2;
      const ms = t.value * REDUCIDO_MS;
      return ms < mitad ? ms / mitad : Math.max(0, 1 - (ms - mitad) / mitad);
    }
    const ms = t.value * DURACION_MS;
    if (ms < VELO_SUBE_MS) return ms / VELO_SUBE_MS;
    if (ms < VELO_FIJO_MS) return 1;
    return Math.max(0, 1 - (ms - VELO_FIJO_MS) / (DURACION_MS - VELO_FIJO_MS));
  });

  const api = useMemo(() => ({ aplaudir }), [aplaudir]);

  return (
    <Contexto.Provider value={api}>
      <View style={s.raiz}>
        {children}
        <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Canvas style={{ width, height }} pointerEvents="none">
            <Rect x={0} y={0} width={width} height={height} color={polvo.velo} opacity={opacidadVelo} />
            {CLASES.map(c => (
              <Nube key={c.desde} clase={c} t={t} origen={origen} params={params} soloVelo={soloVelo} />
            ))}
          </Canvas>
        </View>
      </View>
    </Contexto.Provider>
  );
}

function Nube({ clase, t, origen, params, soloVelo }: {
  clase: typeof CLASES[number];
  t: SharedValue<number>;
  origen: SharedValue<{ x: number; y: number }>;
  params: SharedValue<number[]>;
  soloVelo: SharedValue<number>;
}) {
  const { desde, hasta, base, opacidad } = clase;

  const puntos = useDerivedValue(() => {
    const salida: { x: number; y: number }[] = [];
    if (soloVelo.value === 1) return salida;
    const s = t.value * (DURACION_MS / 1000);
    const p = params.value;
    const o = origen.value;
    for (let i = desde; i < hasta; i++) {
      const a = p[i * 2];
      const v = p[i * 2 + 1];
      if (v === undefined) break;
      const d = v * FRENADO_S * (1 - Math.exp(-s / FRENADO_S));
      salida.push({ x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d - ELEVACION_PX_S * s });
    }
    return salida;
  });
  const grosor = useDerivedValue(() => base * (1 + CRECIMIENTO * t.value));
  const alfa = useDerivedValue(() => opacidad * Math.pow(1 - t.value, 1.5));

  return (
    <Points points={puntos} mode="points" style="stroke" strokeWidth={grosor} strokeCap="round" color={paleta.magnesia} opacity={alfa} />
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
});
