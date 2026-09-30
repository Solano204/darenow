import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, type SharedValue,
} from 'react-native-reanimated';
import { resorteMagnesia } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const DESPLAZAMIENTO_PX = 12;
const MARGEN_VISIBLE_PX = 80;
/** Un bloque sin medir todavia nunca esta «dentro». */
const SIN_MEDIR = Number.POSITIVE_INFINITY;

/**
 * Una sola deteccion de visibilidad por pantalla (R6): cada `BloqueRevela` anota donde se activa
 * (su `umbral`, en coordenadas del scroll) y una unica reaccion al scroll revisa todos y avisa una
 * vez a cada uno. Sin proveedor, cada bloque vigila el scroll por su cuenta (como antes).
 */
interface Revelador {
  reservar: (alActivar: () => void) => number;
  soltar: (i: number) => void;
  umbrales: SharedValue<number[]>;
}
const ContextoRevela = createContext<Revelador | null>(null);

export function ProveedorRevela({ y, children }: { y: SharedValue<number>; children: React.ReactNode }) {
  const { height: alturaVentana } = useWindowDimensions();
  const umbrales = useSharedValue<number[]>([]);
  const vistos = useSharedValue<number[]>([]);
  const [avisos] = useState<(() => void)[]>(() => []);
  const [revelador] = useState<Revelador>(() => ({
    reservar: alActivar => { avisos.push(alActivar); return avisos.length - 1; },
    soltar: i => { avisos[i] = () => {}; },
    umbrales,
  }));
  const activar = (i: number) => avisos[i]?.();

  // Se revisa con cada movimiento del scroll y cada vez que un bloque anota su umbral (un bloque que
  // ya esta a la vista al medirse se activa sin esperar al scroll): la condicion lee los dos.
  useAnimatedReaction(() => (umbrales.value.length >= 0 ? y.value + alturaVentana : 0), borde => {
    const u = umbrales.value;
    for (let i = 0; i < u.length; i++) {
      if (vistos.value[i] === 1 || !(borde > u[i])) continue;
      vistos.modify(v => { 'worklet'; v[i] = 1; return v; }, false);
      runOnJS(activar)(i);
    }
  }, [alturaVentana]);

  return <ContextoRevela.Provider value={revelador}>{children}</ContextoRevela.Provider>;
}

/**
 * Modulo bajo el pliegue que se revela una sola vez, cuando el scroll lo trae
 * a la vista: sube 12 px y aparece con `resorteMagnesia`. `children` recibe
 * `activo` para arrancar, en ese momento, las animaciones propias del modulo
 * (numeros que ruedan, barras que se llenan). Con movimiento reducido aparece
 * ya puesto y `activo` es verdadero desde el inicio. Debe ser hijo directo del
 * contenido del scroll. Dentro de un `ProveedorRevela`, la pantalla vigila el
 * scroll una sola vez para todos sus bloques.
 */
export function BloqueRevela({ y, estilo, sinMovimiento, fraccion, children }: {
  y: SharedValue<number>;
  estilo?: StyleProp<ViewStyle>;
  /** Solo avisa a `children` cuando entra en pantalla (`activo`): no sube ni se desvanece. */
  sinMovimiento?: boolean;
  /** Fraccion del bloque que debe estar en pantalla para activarlo (0.4 = el 40 %). Sin ella, cuando asoma 80 px. */
  fraccion?: number;
  children: (activo: boolean) => React.ReactNode;
}) {
  const revelador = useContext(ContextoRevela);
  const reducido = useReducedMotion();
  const tick = useTick();
  const { height: alturaVentana } = useWindowDimensions();
  const arriba = useSharedValue(SIN_MEDIR);
  const altoBloque = useSharedValue(0);
  const visto = useSharedValue(reducido || sinMovimiento ? 1 : 0);
  const [activo, setActivo] = useState(reducido);

  // Con proveedor, el bloque se anota una vez al montar (su aviso solo usa un setter y un shared
  // value, estables) y se borra al desmontar.
  const [ranura] = useState<number | null>(() => revelador?.reservar(() => {
    if (!sinMovimiento) visto.set(withSpring(1, resorteMagnesia));
    setActivo(true);
  }) ?? null);
  useEffect(() => () => { if (ranura !== null) revelador?.soltar(ranura); }, [revelador, ranura]);

  /** Donde se activa, en coordenadas del scroll (borde inferior de la ventana). */
  const anotar = (y0: number, alto: number) => {
    arriba.set(y0);
    altoBloque.set(alto);
    if (!revelador || ranura === null) return;
    const umbral = y0 + (fraccion === undefined ? MARGEN_VISIBLE_PX : fraccion * alto);
    revelador.umbrales.modify(u => { 'worklet'; u[ranura] = umbral; return u; }, true);
  };

  // Sin proveedor: cada bloque vigila el scroll (la forma de antes).
  useAnimatedReaction(
    () => revelador === null
      && y.value + alturaVentana - (fraccion === undefined ? MARGEN_VISIBLE_PX : fraccion * altoBloque.value) > arriba.value,
    (dentro, previo) => {
      if (!dentro || previo) return;
      if (!sinMovimiento) visto.set(withSpring(1, resorteMagnesia));
      runOnJS(setActivo)(true);
    },
    [alturaVentana, fraccion, revelador],
  );

  const animado = useAnimatedStyle(() => ({
    opacity: Math.min(1, visto.value * 2),
    transform: [{ translateY: reducido ? 0 : (1 - visto.value) * DESPLAZAMIENTO_PX }],
  }), [reducido, tick]);

  return (
    <Animated.View style={[estilo, animado]} onLayout={e => anotar(e.nativeEvent.layout.y, e.nativeEvent.layout.height)}>
      {children(activo)}
    </Animated.View>
  );
}
