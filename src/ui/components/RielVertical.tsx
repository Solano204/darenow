import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation, runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat,
  withSequence, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { Canvas, Group, Path, Skia, vec } from '@shopify/react-native-skia';
import { paleta, conAlfa, easing, resortePlaca } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { ALTO_ENCABEZADO, CENTRO_NODO, LADO_NODO, SANGRIA_RIEL } from './EncabezadoBloque';

/** Un tramo del riel: un nodo, su encabezado y su contenido (los ejercicios de un bloque, las rutinas de una fase). */
export interface SegmentoRiel {
  clave: string;
  /** Color del nodo (el aro y, cuando el riel lo alcanza, su relleno). */
  color: string;
  /** El riel se engrosa a 4 px hasta el final del contenido y cierra con una flecha curva de regreso. */
  repite?: boolean;
  /** Ya recorrido: su riel esta lleno de `magnesia2` sin esperar al scroll. */
  pasado?: boolean;
  /** El nodo lleva un anillo que pulsa (el tramo en que va el usuario). */
  pulsa?: boolean;
  /** Sube cada vez que hay que resaltar este tramo: su borde brilla una vez. */
  resalta?: number;
  /** El contenido llega hasta el borde derecho de la pantalla (un carrusel) en vez de respetar el margen. */
  alBorde?: boolean;
  /** `visto` pasa a verdadero la primera vez que el tramo entra en pantalla. */
  encabezado: (e: { visto: boolean }) => React.ReactNode;
  contenido: (e: { visto: boolean }) => React.ReactNode;
}

const RIEL_X = LADO_NODO / 2;
const GROSOR = 2;
const GROSOR_REPITE = 4;
const MARGEN = 24;
/** El punto de la pantalla, a esta fraccion desde arriba, hasta donde se llena el riel. */
const LECTURA = 0.6;
/** Un tramo «entra» cuando su borde de arriba pasa de esta fraccion de la pantalla. */
const ENTRADA = 0.92;
const RESPIRO_FINAL = 8;
const ALTO_FLECHA = 28;
const GIRO_MS = 500;
const PULSO_MS = 2000;
const BRILLO_SUBE_MS = 200;
const BRILLO_BAJA_MS = 400;
const OPACIDAD_BRILLO = 0.4;

/** La flecha de regreso se dibuja en un lienzo de 40 con su trazo desplazado (8, 6) para que al girar no se recorte. */
const LIENZO_FLECHA = 40;
const DESPL_FLECHA = { x: 8, y: 6 };
const INICIO_FLECHA = { x: 6, y: 4 };
const CENTRO_GIRO = vec(21.5, 19);
/** Baja de la raiz del riel, sale a la derecha y sube con la punta hacia arriba: «esto se repite». */
const RUTA_FLECHA = 'M6 4 L6 10 C6 26 18 26 18 14 M14.5 17.5 L18 14 L21.5 17.5';

/**
 * El riel vertical de 2 px a la izquierda que une los tramos de una lista (los bloques de una
 * rutina, las fases de un programa). Cada tramo empieza con un nodo en el riel; con el scroll
 * el riel pasa de `gomaBorde` a `magnesia2`, cada nodo se llena al ser alcanzado y, en un tramo
 * que se repite, la flecha de regreso da una vuelta (500 ms) cuando el llenado llega a ella.
 * Con movimiento reducido el riel ya esta lleno y la flecha no gira.
 *
 * Debe ser hijo directo del contenido del scroll (mide su posicion con `onLayout`). `zonas`
 * recibe los limites de cada tramo en ese contenido, `[arriba0, abajo0, arriba1, ...]`, para
 * que quien dibuje algo ligado al scroll (el perfil, el mapa de carga) sepa cual esta en pantalla.
 * `respiro` es el aire entre un tramo y el siguiente.
 */
export function RielVertical({ segmentos, y, zonas, respiro = 20 }: {
  segmentos: SegmentoRiel[];
  y: SharedValue<number>;
  zonas: SharedValue<number[]>;
  respiro?: number;
}) {
  const origen = useSharedValue(Number.POSITIVE_INFINITY);
  const raiz = useRef(0);
  const medidas = useRef<({ top: number; alto: number } | undefined)[]>([]);

  const publicar = () => {
    const limites: number[] = [];
    for (let i = 0; i < segmentos.length; i++) {
      const m = medidas.current[i];
      if (!m) return;
      limites.push(raiz.current + m.top, raiz.current + m.top + m.alto);
    }
    zonas.value = limites;
  };

  return (
    <View
      style={s.raiz}
      onLayout={e => { raiz.current = e.nativeEvent.layout.y; origen.value = e.nativeEvent.layout.y; publicar(); }}
    >
      {segmentos.map((seg, i) => (
        <TramoConNodo
          key={seg.clave} seg={seg} esUltimo={i === segmentos.length - 1} respiro={respiro} y={y} origen={origen}
          alMedir={(top, alto) => { medidas.current[i] = { top, alto }; publicar(); }}
        />
      ))}
    </View>
  );
}

function TramoConNodo({ seg, esUltimo, respiro, y, origen, alMedir }: {
  seg: SegmentoRiel;
  esUltimo: boolean;
  respiro: number;
  y: SharedValue<number>;
  origen: SharedValue<number>;
  alMedir: (top: number, alto: number) => void;
}) {
  const reducido = useReducedMotion();
  const { height: ventana } = useWindowDimensions();
  const top = useSharedValue(Number.POSITIVE_INFINITY);
  const alto = useSharedValue(0);
  const filasFin = useSharedValue(0);
  const lleno = useSharedValue(reducido || seg.pasado ? 1 : 0);
  const llenoFlecha = useSharedValue(reducido ? 1 : 0);
  const giro = useSharedValue(0);
  const halo = useSharedValue(0);
  const [visto, setVisto] = useState(reducido);
  const repite = !!seg.repite;

  useAnimatedReaction(
    () => y.value + ventana * LECTURA >= origen.value + top.value + CENTRO_NODO,
    (alcanzado, previo) => {
      if (reducido || seg.pasado || alcanzado === previo) return;
      lleno.value = withSpring(alcanzado ? 1 : 0, resortePlaca);
    },
    [reducido, ventana, seg.pasado],
  );

  useAnimatedReaction(
    () => y.value + ventana * ENTRADA >= origen.value + top.value,
    (dentro, previo) => { if (dentro && !previo) runOnJS(setVisto)(true); },
    [ventana],
  );

  useAnimatedReaction(
    () => repite && y.value + ventana * LECTURA >= origen.value + top.value + filasFin.value + ALTO_FLECHA / 2,
    (alcanzado, previo) => {
      if (reducido || alcanzado === previo) return;
      llenoFlecha.value = withSpring(alcanzado ? 1 : 0, resortePlaca);
      if (alcanzado) {
        giro.value = 0;
        giro.value = withTiming(1, { duration: GIRO_MS, easing: easing.salida });
      }
    },
    [reducido, ventana, repite],
  );

  useEffect(() => {
    if (!seg.resalta) return;
    halo.value = 0;
    halo.value = withSequence(withTiming(1, { duration: BRILLO_SUBE_MS }), withTiming(0, { duration: BRILLO_BAJA_MS }));
  }, [seg.resalta]);

  const tick = useTick();
  const resplandor = useAnimatedStyle(() => ({ opacity: halo.value }), [tick]);
  const inicioTronco = useDerivedValue(() => CENTRO_NODO);
  const largoTronco = useDerivedValue(() => Math.max(0, filasFin.value - CENTRO_NODO));
  const inicioCola = useDerivedValue(() => filasFin.value);
  const largoCola = useDerivedValue(() => Math.max(
    0, esUltimo ? (repite ? ALTO_FLECHA : 0) : alto.value - filasFin.value + CENTRO_NODO,
  ));
  const pie = repite ? ALTO_FLECHA : esUltimo ? RESPIRO_FINAL : respiro;

  return (
    <View
      style={{ paddingBottom: pie }}
      onLayout={e => {
        top.value = e.nativeEvent.layout.y;
        alto.value = e.nativeEvent.layout.height;
        alMedir(e.nativeEvent.layout.y, e.nativeEvent.layout.height);
      }}
    >
      <TramoRiel
        inicio={inicioTronco} largo={largoTronco} grosor={repite ? GROSOR_REPITE : GROSOR} lleno={!!seg.pasado}
        y={y} origen={origen} top={top} ventana={ventana} reducido={reducido}
      />
      <TramoRiel
        inicio={inicioCola} largo={largoCola} grosor={GROSOR} lleno={!!seg.pasado}
        y={y} origen={origen} top={top} ventana={ventana} reducido={reducido}
      />
      <Nodo color={seg.color} lleno={lleno} pulsa={!!seg.pulsa && !reducido} />
      <View style={s.encabezado}>{seg.encabezado({ visto })}</View>
      <View
        style={seg.alBorde ? undefined : s.contenido}
        onLayout={e => { filasFin.value = e.nativeEvent.layout.y + e.nativeEvent.layout.height; }}
      >
        {seg.contenido({ visto })}
      </View>
      {repite && <FlechaRegreso filasFin={filasFin} lleno={llenoFlecha} giro={giro} />}
      <Animated.View style={[s.halo, { bottom: pie - 4 }, resplandor]} pointerEvents="none" />
    </View>
  );
}

/** El nodo del riel: un aro del color del tramo que se llena al ser alcanzado; con `pulsa`, un anillo lo rodea cada 2 s. */
function Nodo({ color, lleno, pulsa }: { color: string; lleno: SharedValue<number>; pulsa: boolean }) {
  const tick = useTick();
  const pulso = useSharedValue(0);

  useEffect(() => {
    if (!pulsa) { cancelAnimation(pulso); pulso.value = 0; return; }
    pulso.value = withRepeat(withTiming(1, { duration: PULSO_MS, easing: easing.salida }), -1, false);
    return () => cancelAnimation(pulso);
  }, [pulsa]);

  const relleno = useAnimatedStyle(() => ({
    opacity: lleno.value, transform: [{ scale: 0.5 + 0.5 * lleno.value }],
  }), [tick]);
  const anillo = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulso.value), transform: [{ scale: 1 + 1.4 * pulso.value }],
  }), [tick]);

  return (
    <View style={s.nodoCaja} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {pulsa && <Animated.View style={[s.nodo, s.anillo, { borderColor: color }, anillo]} />}
      <View style={[s.nodo, { borderColor: color }]}>
        <Animated.View style={[s.nodoRelleno, { backgroundColor: color }, relleno]} />
      </View>
    </View>
  );
}

/** Un trozo del riel: la pista de `gomaBorde` y encima el relleno de `magnesia2` que crece con el scroll (o ya lleno si el tramo es pasado). */
function TramoRiel({ inicio, largo, grosor, lleno, y, origen, top, ventana, reducido }: {
  inicio: SharedValue<number>;
  largo: SharedValue<number>;
  grosor: number;
  lleno: boolean;
  y: SharedValue<number>;
  origen: SharedValue<number>;
  top: SharedValue<number>;
  ventana: number;
  reducido: boolean;
}) {
  const tick = useTick();
  const pista = useAnimatedStyle(() => ({ top: inicio.value, height: largo.value }), [tick]);
  const relleno = useAnimatedStyle(() => ({
    top: inicio.value,
    height: reducido || lleno
      ? largo.value
      : Math.min(largo.value, Math.max(0, y.value + ventana * LECTURA - (origen.value + top.value + inicio.value))),
  }), [reducido, lleno, ventana, tick]);
  const columna = { width: grosor, left: RIEL_X - grosor / 2 };

  return (
    <>
      <Animated.View style={[s.pista, columna, pista]} pointerEvents="none" />
      <Animated.View style={[s.relleno, columna, relleno]} pointerEvents="none" />
    </>
  );
}

/** La flecha curva que cierra el tramo repetido. Da una vuelta completa al llenarse el riel hasta ella. */
function FlechaRegreso({ filasFin, lleno, giro }: {
  filasFin: SharedValue<number>;
  lleno: SharedValue<number>;
  giro: SharedValue<number>;
}) {
  const tick = useTick();
  const ruta = useMemo(() => Skia.Path.MakeFromSVGString(RUTA_FLECHA), []);
  const posicion = useAnimatedStyle(() => ({ top: filasFin.value - (INICIO_FLECHA.y + DESPL_FLECHA.y) }), [tick]);
  const desplazar = useDerivedValue(() => [{ translateX: DESPL_FLECHA.x }, { translateY: DESPL_FLECHA.y }]);
  const girar = useDerivedValue(() => [{ rotate: giro.value * 2 * Math.PI }]);
  if (!ruta) return null;

  return (
    <Animated.View
      style={[s.flecha, posicion]} pointerEvents="none"
      importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
    >
      <Canvas style={{ width: LIENZO_FLECHA, height: LIENZO_FLECHA }}>
        <Group transform={girar} origin={CENTRO_GIRO}>
          <Group transform={desplazar}>
            <Path path={ruta} style="stroke" strokeWidth={GROSOR} strokeCap="round" strokeJoin="round" color={paleta.gomaBorde} />
            <Path
              path={ruta} style="stroke" strokeWidth={GROSOR} strokeCap="round" strokeJoin="round" color={paleta.magnesia2}
              opacity={lleno}
            />
          </Group>
        </Group>
      </Canvas>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  raiz: { marginLeft: MARGEN, marginTop: 24 },
  encabezado: { height: ALTO_ENCABEZADO, paddingLeft: SANGRIA_RIEL, marginRight: MARGEN },
  contenido: { marginRight: MARGEN },
  pista: { position: 'absolute', backgroundColor: paleta.gomaBorde },
  relleno: { position: 'absolute', backgroundColor: paleta.magnesia2 },
  nodoCaja: { position: 'absolute', left: 0, top: (ALTO_ENCABEZADO - LADO_NODO) / 2, width: LADO_NODO, height: LADO_NODO },
  nodo: { width: LADO_NODO, height: LADO_NODO, borderRadius: LADO_NODO / 2, borderWidth: 2, backgroundColor: paleta.goma },
  anillo: { position: 'absolute', top: 0, left: 0, backgroundColor: 'transparent' },
  nodoRelleno: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: LADO_NODO / 2 },
  flecha: { position: 'absolute', left: RIEL_X - (INICIO_FLECHA.x + DESPL_FLECHA.x), width: LIENZO_FLECHA, height: LIENZO_FLECHA },
  halo: {
    position: 'absolute', top: -4, left: -8, right: MARGEN - 12, borderRadius: 16,
    borderWidth: 1.5, borderColor: conAlfa(paleta.magnesia, OPACIDAD_BRILLO),
  },
});
