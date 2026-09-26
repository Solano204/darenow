import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { paleta, familia, resortePlaca } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

const LADO_CIRCULO = 28;
const CENTRO_CIRCULO = LADO_CIRCULO / 2;
const GROSOR_LINEA = 1.5;
/** La «linea de lectura»: el punto de la pantalla, a esta fraccion desde arriba, hasta donde se llena la linea. */
const LECTURA = 0.6;

/**
 * Los pasos como una linea de tiempo vertical: un circulo con su numero por paso,
 * unidos por una linea. La linea se va llenando de `magnesia` conforme se baja por
 * la seccion y cada circulo se rellena cuando la linea lo alcanza (`resortePlaca`);
 * al subir se vacia. Con movimiento reducido todo esta lleno. Debe ser hijo
 * directo del contenido del scroll (mide su posicion con `onLayout`). `titulo` y
 * `pie` van dentro de la seccion.
 */
export function PasosLineaTiempo({ titulo, pasos, y, pie, estilo }: {
  titulo: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
  pasos: string[];
  y: SharedValue<number>;
  pie?: React.ReactNode;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { height: ventana } = useWindowDimensions();
  const raizY = useSharedValue(Number.POSITIVE_INFINITY);
  const listaY = useSharedValue(0);
  const ultimoTop = useSharedValue(0);
  const base = useDerivedValue(() => raizY.value + listaY.value);

  const relleno = useAnimatedStyle(() => ({
    height: reducido
      ? ultimoTop.value
      : Math.min(ultimoTop.value, Math.max(0, y.value + ventana * LECTURA - base.value - CENTRO_CIRCULO)),
  }), [reducido, ventana, tick]);
  const pista = useAnimatedStyle(() => ({ height: ultimoTop.value }), [tick]);

  return (
    <View style={estilo} onLayout={e => { raizY.value = e.nativeEvent.layout.y; }}>
      {titulo}
      <View onLayout={e => { listaY.value = e.nativeEvent.layout.y; }} style={s.lista}>
        <Animated.View style={[s.pista, pista]} pointerEvents="none" />
        <Animated.View style={[s.relleno, relleno]} pointerEvents="none" />
        {pasos.map((texto, i) => (
          <Paso
            key={i} n={i + 1} texto={texto} y={y} base={base} ventana={ventana} ultimo={i === pasos.length - 1}
            alTop={top => { if (i === pasos.length - 1) ultimoTop.value = top; }}
          />
        ))}
      </View>
      {pie}
    </View>
  );
}

function Paso({ n, texto, y, base, ventana, ultimo, alTop }: {
  n: number; texto: string; y: SharedValue<number>; base: { value: number }; ventana: number; ultimo: boolean;
  alTop: (top: number) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const top = useSharedValue(Number.POSITIVE_INFINITY);
  const lleno = useSharedValue(reducido ? 1 : 0);

  useAnimatedReaction(
    () => y.value + ventana * LECTURA - base.value >= top.value + CENTRO_CIRCULO,
    (alcanzado, previo) => {
      if (reducido || alcanzado === previo) return;
      lleno.value = withSpring(alcanzado ? 1 : 0, resortePlaca);
    },
    [reducido, ventana],
  );

  const disco = useAnimatedStyle(() => ({ opacity: lleno.value, transform: [{ scale: 0.6 + 0.4 * lleno.value }] }), [tick]);
  const numero = useAnimatedStyle(() => ({
    color: interpolateColor(lleno.value, [0, 1], [paleta.magnesia, paleta.goma]),
  }), [tick]);

  return (
    <View
      style={[s.paso, !ultimo && s.pasoConSeparacion]} accessible accessibilityLabel={`Paso ${n}. ${texto}`}
      onLayout={e => { top.value = e.nativeEvent.layout.y; alTop(e.nativeEvent.layout.y); }}
    >
      <View style={s.circulo} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Animated.View style={[s.disco, disco]} />
        <Animated.Text style={[s.numero, numero]}>{n}</Animated.Text>
      </View>
      <Text style={s.texto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  lista: { position: 'relative' },
  pista: {
    position: 'absolute', top: CENTRO_CIRCULO, left: CENTRO_CIRCULO - GROSOR_LINEA / 2, width: GROSOR_LINEA,
    backgroundColor: paleta.gomaBorde,
  },
  relleno: {
    position: 'absolute', top: CENTRO_CIRCULO, left: CENTRO_CIRCULO - GROSOR_LINEA / 2, width: GROSOR_LINEA,
    backgroundColor: paleta.magnesia,
  },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  pasoConSeparacion: { paddingBottom: 20 },
  circulo: {
    width: LADO_CIRCULO, height: LADO_CIRCULO, borderRadius: LADO_CIRCULO / 2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: paleta.magnesia2, backgroundColor: paleta.goma,
  },
  disco: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: LADO_CIRCULO / 2, backgroundColor: paleta.magnesia,
  },
  numero: { fontFamily: familia.titulo, fontSize: 15, lineHeight: 18 },
  texto: { flex: 1, fontFamily: familia.cuerpo, fontSize: 17, lineHeight: 25, color: paleta.magnesia, paddingTop: 1 },
});
