import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor, LinearTransition, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring,
  withTiming, type EntryExitAnimationFunction,
} from 'react-native-reanimated';
import { paleta, familia, easing, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const MAX_PLACAS_POR_MANGA = 6;
export const ALTO_BARRA = 72;
export const ALTO_BARRA_COMPACTA = 40;

const PLACAS_DEL_CICLO = 4;
/** Verde, amarilla, azul y roja; la verde se repite para que el paso de roja a verde tambien interpole. */
const CICLO = [paleta.placaVerde, paleta.placaAmarilla, paleta.placaAzul, paleta.placaRoja, paleta.placaVerde];

/** Color de la placa de la posicion `i` (0 es la primera y mas alta). */
export const colorDePlaca = (i: number): string => CICLO[i % PLACAS_DEL_CICLO];

/** Color en la posicion `t`, que es fraccionaria mientras una placa cambia de sitio. */
export const colorAnimadoDePlaca = (t: number): string => {
  'worklet';
  const p = ((t % PLACAS_DEL_CICLO) + PLACAS_DEL_CICLO) % PLACAS_DEL_CICLO;
  return interpolateColor(p, [0, 1, 2, 3, 4], CICLO);
};

interface Medidas {
  alto: number; eje: number; manga: number; collar: number; placa: number; sep: number;
  /** Alto de la primera placa, lo que baja cada una y el minimo. */
  base: number; paso: number; min: number;
  /** Manga desnuda que queda tras el collar de una manga llena. */
  punta: number; letra: number;
}

const NORMAL: Medidas = {
  alto: ALTO_BARRA, eje: 6, manga: 10, collar: 4, placa: 10, sep: 2, base: 64, paso: 4, min: 40, punta: 28, letra: 13,
};
const COMPACTA: Medidas = {
  alto: ALTO_BARRA_COMPACTA, eje: 4, manga: 6, collar: 3, placa: 6, sep: 2, base: 36, paso: 3, min: 22, punta: 22, letra: 12,
};

const DESPLAZAMIENTO_MS = 240;
const SALIDA_MS = 240;
const FUNDIDO_MS = 150;
/** Distancia desde la que entra y a la que sale una placa: mas alla del borde de la pantalla. */
const DESDE_FUERA_PX = 420;
const ASENTAMIENTO_MS = 260;
const LEVANTE_PX = 12;
const LEVANTE_SUBE_MS = 180;
/** La carga inicial (al abrir una copia): una placa cada 30 ms, tras dejar terminar la transicion de la pantalla. */
const ESCALONADO_CARGA_MS = 30;
const ESPERA_CARGA_MS = 300;

const entradaPlaca = (lado: -1 | 1, reducido: boolean, retraso = 0): EntryExitAnimationFunction => () => {
  'worklet';
  if (reducido) return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, { duration: FUNDIDO_MS }) } };
  return {
    initialValues: { transform: [{ translateX: lado * DESDE_FUERA_PX }] },
    animations: { transform: [{ translateX: withDelay(retraso, withSpring(0, resortePlaca)) }] },
  };
};

const salidaPlaca = (lado: -1 | 1, reducido: boolean): EntryExitAnimationFunction => () => {
  'worklet';
  if (reducido) return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: FUNDIDO_MS }) } };
  return {
    initialValues: { transform: [{ translateX: 0 }] },
    animations: { transform: [{ translateX: withTiming(lado * DESDE_FUERA_PX, { duration: SALIDA_MS }) }] },
  };
};

/**
 * La rutina como una barra olimpica: una placa por ejercicio en cada manga, de
 * adentro hacia afuera (la primera, la mas alta), en el ciclo verde, amarillo, azul,
 * rojo. Solo se dibujan 6 por lado; del septimo ejercicio en adelante sale «+N» junto
 * al collar. Recibe los ids en orden y nada mas: no lee ni escribe la rutina.
 *
 * Agregar: las dos placas nuevas entran desde fuera de la pantalla con `resortePlaca`, la
 * barra vibra 1 px al asentarse y suena un golpe Medium. Quitar: salen hacia afuera y las
 * de fuera se corren hacia adentro (golpe Light). Reordenar: cada placa cruza a su sitio y
 * cambia de altura y de color en 240 ms. `levantar` (un contador) la sube 12 px y la baja.
 * Con movimiento reducido solo hay fundidos. `silenciosa` apaga golpes y vibracion (la copia
 * compacta de la cabecera pegajosa).
 *
 * Es de Views y no de Skia: agregar, quitar y reordenar son transiciones de layout, que
 * Reanimated da hechas, y un `Canvas` obligaria a calcular cada posicion a mano.
 */
export function BarraRutina({ ids, etiqueta, compacta, levantar = 0, silenciosa, cargaInicial }: {
  ids: readonly string[];
  /** Lo que dice el lector de pantalla: el resumen completo. Las placas no se leen. */
  etiqueta: string;
  compacta?: boolean;
  levantar?: number;
  silenciosa?: boolean;
  /**
   * Las placas del arranque entran una por una (30 ms entre cada una, tras 300 ms para dejar
   * terminar la transicion) con un solo golpe al final: la copia de una rutina del catalogo.
   * Sin esto las placas del arranque aparecen puestas.
   */
  cargaInicial?: boolean;
}) {
  const m = compacta ? COMPACTA : NORMAL;
  const reducido = useReducedMotion();
  const tick = useTick();
  // Las placas con las que se monta la barra no entran animadas; las que llegan despues si. Una
  // placa nueva siempre llega con un `ids` nuevo, asi que basta comparar con el del montaje.
  const [idsDelMontaje] = useState(ids);
  const previo = useRef(ids.length);
  const vibracion = useSharedValue(0);
  const alzada = useSharedValue(0);
  const visibles = ids.slice(0, MAX_PLACAS_POR_MANGA);
  const resto = ids.length - visibles.length;
  const animar = ids !== idsDelMontaje;
  const carga = !!cargaInicial && !animar;

  const alCambiarMontar = useEffectEvent(() => {
    if (!cargaInicial || silenciosa || ids.length === 0) return;
    const n = Math.min(ids.length, MAX_PLACAS_POR_MANGA);
    const id = setTimeout(haptico.placa, reducido ? 0 : ESPERA_CARGA_MS + (n - 1) * ESCALONADO_CARGA_MS + ASENTAMIENTO_MS);
    return () => clearTimeout(id);
  });
  useEffect(() => alCambiarMontar(), []);

  const alCambiarIdsLength = useEffectEvent(() => {
    const antes = previo.current;
    previo.current = ids.length;
    if (silenciosa || ids.length === antes) return;
    if (ids.length < antes) { haptico.toque(); return; }
    const id = setTimeout(haptico.placa, reducido ? 0 : ASENTAMIENTO_MS);
    if (!reducido) {
      vibracion.set(withDelay(ASENTAMIENTO_MS, withSequence(withTiming(1, { duration: 50 }), withTiming(0, { duration: 110 }))));
    }
    return () => clearTimeout(id);
  });
  useEffect(() => alCambiarIdsLength(), [ids.length]);

  const alCambiarLevantar = useEffectEvent(() => {
    if (!levantar || reducido) return;
    alzada.set(withSequence(withTiming(1, { duration: LEVANTE_SUBE_MS, easing: easing.salida }), withSpring(0, resortePlaca)));
  });
  useEffect(() => alCambiarLevantar(), [levantar]);

  const cuerpo = useAnimatedStyle(() => ({
    transform: [{ translateY: vibracion.value - LEVANTE_PX * alzada.value }],
  }), [tick]);

  return (
    <Animated.View
      accessible accessibilityRole="image" accessibilityLabel={etiqueta}
      style={[s.barra, { height: m.alto }, cuerpo]}
    >
      <Lado lado={-1} ids={visibles} resto={resto} m={m} animar={animar} carga={carga} reducido={reducido} />
      <View style={[s.eje, { height: m.eje, borderRadius: m.eje / 2 }]} />
      <Lado lado={1} ids={visibles} resto={resto} m={m} animar={animar} carga={carga} reducido={reducido} />
    </Animated.View>
  );
}

function Lado({ lado, ids, resto, m, animar, carga, reducido }: {
  lado: -1 | 1; ids: readonly string[]; resto: number; m: Medidas; animar: boolean; carga: boolean; reducido: boolean;
}) {
  const ancho = MAX_PLACAS_POR_MANGA * (m.placa + m.sep) + m.collar + m.punta;
  const n = ids.length;
  const entradas = useMemo(() => Array.from({ length: n }, (_, i) => {
    if (carga) return entradaPlaca(lado, reducido, ESPERA_CARGA_MS + i * ESCALONADO_CARGA_MS);
    return animar ? entradaPlaca(lado, reducido) : undefined;
  }), [animar, carga, lado, reducido, n]);
  const salida = useMemo(() => salidaPlaca(lado, reducido), [lado, reducido]);
  const desplazar = reducido ? undefined : LinearTransition.duration(DESPLAZAMIENTO_MS);
  const radioExterno = m.manga / 2;

  return (
    <View style={{ width: ancho, height: m.alto, justifyContent: 'center' }}>
      <View
        style={[
          s.manga, { height: m.manga },
          lado < 0
            ? { left: 0, borderTopLeftRadius: radioExterno, borderBottomLeftRadius: radioExterno }
            : { right: 0, borderTopRightRadius: radioExterno, borderBottomRightRadius: radioExterno },
        ]}
      />
      <View style={{ flexDirection: lado < 0 ? 'row-reverse' : 'row', alignItems: 'center', gap: m.sep }}>
        {ids.map((id, i) => (
          <Placa key={id} i={i} lado={lado} m={m} entrada={entradas[i]} salida={salida} desplazar={desplazar} />
        ))}
        <Animated.View layout={desplazar} style={[s.collar, { width: m.collar, height: m.manga + 8 }]} />
        {resto > 0 && (
          <Animated.Text layout={desplazar} style={[s.resto, { fontSize: m.letra, lineHeight: m.letra + 4 }]}>+{resto}</Animated.Text>
        )}
      </View>
    </View>
  );
}

function Placa({ i, m, entrada, salida, desplazar }: {
  i: number; lado: -1 | 1; m: Medidas; entrada?: EntryExitAnimationFunction; salida: EntryExitAnimationFunction;
  desplazar?: ReturnType<typeof LinearTransition.duration>;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(i);
  const { base, paso, min } = m;

  useEffect(() => {
    t.set(reducido ? i : withTiming(i, { duration: DESPLAZAMIENTO_MS, easing: easing.salida }));
  }, [i, reducido, t]);

  const estilo = useAnimatedStyle(() => ({
    height: Math.max(min, base - paso * t.value),
    backgroundColor: colorAnimadoDePlaca(t.value),
  }), [base, paso, min, tick]);

  return (
    <Animated.View
      entering={entrada} exiting={salida} layout={desplazar}
      style={[{ width: m.placa, borderRadius: 2 }, estilo]}
    />
  );
}

const s = StyleSheet.create({
  barra: { flexDirection: 'row', alignItems: 'center' },
  eje: { flex: 1, backgroundColor: paleta.magnesia3 },
  manga: { position: 'absolute', backgroundColor: paleta.magnesia3 },
  collar: { borderRadius: 1, backgroundColor: paleta.magnesia2 },
  resto: { fontFamily: familia.enfasis, color: paleta.magnesia2, marginHorizontal: 2 },
});
