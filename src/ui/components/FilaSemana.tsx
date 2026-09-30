import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { paleta, familia, MARGEN_PANTALLA, easing, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { hoy } from '@/state/store';
import { Huella } from '@/ui/fx/Huella';
import { Entrada } from '@/ui/fx/Entrada';
import { useMiniMagnesia } from '@/ui/fx/MiniMagnesia';
import { acumuladosPrevios } from '@/lib/acumulados';

const ANCHO_CELDA = 44;
const ALTO_CELDA = 56;
const RADIO_CELDA = 14;
const GROSOR_MARCO = 2;
const INICIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ESCALONADO_COLUMNA_MS = 35;
const ESCALONADO_HUELLA_MS = 60;
const DIBUJO_MARCO_MS = 300;
const ESCALA_SELLO = 1.4;
const OPACIDAD_HUELLA = 0.7;

/** La franja ya se armo en esta sesion de la app: las siguientes veces aparece puesta. */
let franjaAnimadaEnEstaSesion = false;

/**
 * Los ultimos siete dias en siete columnas iguales. Un dia con sesion lleva una
 * huella de mano bajo su numero; hoy lleva un marco azul que se dibuja al final;
 * los dias sin sesion son solo el numero, sin cruces ni rojos: aqui no se castiga
 * a nadie. Mismos datos que la grafica de barras (`ultimos7`). Al entrar, las
 * columnas aparecen de izquierda a derecha y las huellas se estampan; si al volver
 * de una sesion hoy pasa a estar entrenado, su huella se estampa con un golpe medio.
 */
export function FilaSemana({ semana, sello }: { semana: { fecha: string; min: number }[]; sello: number }) {
  const hoyStr = hoy();
  const [animar] = useState(() => !franjaAnimadaEnEstaSesion);
  useEffect(() => { franjaAnimadaEnEstaSesion = true; }, []);

  const rangos = acumuladosPrevios(semana.map(d => (d.min > 0 ? 1 : 0)));
  const dias = semana.map((d, i) => {
    const entreno = d.min > 0;
    return { ...d, i, entreno, rango: entreno ? rangos[i] : -1, esHoy: d.fecha === hoyStr, futuro: d.fecha > hoyStr };
  });
  const entrenados = dias.filter(d => d.entreno).length;
  const finHuellas = 7 * ESCALONADO_COLUMNA_MS + entrenados * ESCALONADO_HUELLA_MS;

  return (
    <View style={s.fila}>
      {dias.map(d => (
        <Dia
          key={d.fecha} d={d} animar={animar} sello={sello}
          retrasoMarco={finHuellas + 100}
        />
      ))}
    </View>
  );
}

interface DatosDia {
  fecha: string; min: number; i: number; entreno: boolean; rango: number; esHoy: boolean; futuro: boolean;
}

function Dia({ d, animar, sello, retrasoMarco }: { d: DatosDia; animar: boolean; sello: number; retrasoMarco: number }) {
  const f = new Date(d.fecha + 'T00:00:00');
  const dow = f.getDay();
  const numero = f.getDate();
  const etiqueta = `${NOMBRES[dow]} ${numero}${d.esHoy ? ', hoy' : ''}${d.entreno ? ', entrenaste' : ''}`;
  const colorNumero = d.futuro ? paleta.gomaBorde : d.esHoy || d.entreno ? paleta.magnesia : paleta.magnesia3Texto;

  return (
    <Entrada activo animar={animar} retraso={d.i * ESCALONADO_COLUMNA_MS} y={8} estilo={s.dia}>
      <View style={s.dia} accessible accessibilityLabel={etiqueta}>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={s.dia}>
          <Text style={s.inicial}>{INICIALES[dow]}</Text>
          <View style={[s.celda, d.entreno && s.celdaEntrenada]}>
            {d.esHoy && <MarcoHoy animar={animar} retraso={retrasoMarco} />}
            <Text style={[s.numero, { color: colorNumero }]}>{numero}</Text>
            {d.entreno && (
              <HuellaDia
                animar={animar} retraso={7 * ESCALONADO_COLUMNA_MS + d.rango * ESCALONADO_HUELLA_MS}
                sello={d.esHoy ? sello : 0}
              />
            )}
          </View>
        </View>
      </View>
    </Entrada>
  );
}

/** Huella de 14 px. Se estampa (1.4 a 1) al entrar la franja y, en hoy, al volver de una sesion nueva (golpe medio y nube chica). */
function HuellaDia({ animar, retraso, sello }: { animar: boolean; retraso: number; sello: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { ref: magnesiaRef, disparar: dispararMagnesia } = useMiniMagnesia();
  const estatico = reducido || !animar;
  const t = useSharedValue(estatico ? 1 : 0);
  const previo = useRef(sello);

  const alCambiarEstatico = useEffectEvent(() => {
    if (estatico) { t.set(1); return; }
    t.set(withDelay(retraso, withSpring(1, resortePlaca)));
    return () => cancelAnimation(t);
  });
  useEffect(() => alCambiarEstatico(), [estatico]);

  const alCambiarSello = useEffectEvent(() => {
    if (sello === previo.current) return;
    previo.current = sello;
    haptico.placa();
    dispararMagnesia();
    if (reducido) return;
    t.set(0);
    t.set(withSpring(1, resortePlaca));
  });
  useEffect(() => alCambiarSello(), [sello, reducido]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ scale: ESCALA_SELLO - (ESCALA_SELLO - 1) * t.value }],
  }), [tick]);

  return (
    <Animated.View ref={magnesiaRef as never} collapsable={false} style={estilo}>
      <Huella lado={14} opacidad={OPACIDAD_HUELLA} />
    </Animated.View>
  );
}

/**
 * Marco azul de hoy: se dibuja alrededor de la celda en 300 ms. Con movimiento reducido ya esta dibujado.
 * `alto` es el de la celda (56 en la franja de Hoy, 48 en el calendario de Yo).
 */
export function MarcoHoy({ animar, retraso, alto = ALTO_CELDA }: { animar: boolean; retraso: number; alto?: number }) {
  const reducido = useReducedMotion();
  const estatico = reducido || !animar;
  const fin = useSharedValue(estatico ? 1 : 0);
  const camino = useMemo(() => {
    const m = GROSOR_MARCO / 2;
    const rect = Skia.XYWHRect(m, m, ANCHO_CELDA - GROSOR_MARCO, alto - GROSOR_MARCO);
    return Skia.PathBuilder.Make().addRRect(Skia.RRectXY(rect, RADIO_CELDA, RADIO_CELDA)).detach();
  }, [alto]);

  useEffect(() => {
    if (estatico) { fin.set(1); return; }
    fin.set(withDelay(retraso, withTiming(1, { duration: DIBUJO_MARCO_MS, easing: easing.salida })));
    return () => cancelAnimation(fin);
  }, [estatico, fin, retraso]);

  return (
    <View style={[s.marco, { height: alto }]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={camino} style="stroke" strokeWidth={GROSOR_MARCO} strokeCap="round"
          color={paleta.placaAzul} start={0} end={fin}
        />
      </Canvas>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', paddingHorizontal: MARGEN_PANTALLA - 4 },
  dia: { flex: 1, alignItems: 'center', gap: 6 },
  inicial: { fontFamily: familia.medio, fontSize: 12, lineHeight: 16, color: paleta.magnesia3Texto },
  celda: {
    width: ANCHO_CELDA, height: ALTO_CELDA, borderRadius: RADIO_CELDA, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  celdaEntrenada: { backgroundColor: paleta.gomaAlta },
  marco: { position: 'absolute', top: 0, left: 0, width: ANCHO_CELDA, height: ALTO_CELDA },
  numero: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24 },
});
