import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { paleta, familia, resortePlaca } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const LADO_CIRCULO = 28;
/** Los pasos de un protocolo de medicion, dentro de una tarjeta: circulos de 24. */
const LADO_COMPACTO = 24;
const GROSOR_LINEA = 1.5;
/** La «linea de lectura»: el punto de la pantalla, a esta fraccion desde arriba, hasta donde se llena la linea. */
const LECTURA = 0.6;

/**
 * Los pasos como una linea de tiempo vertical: un circulo con su numero por paso,
 * unidos por una linea. La linea se va llenando de `magnesia` conforme se baja por
 * la seccion y cada circulo se rellena cuando la linea lo alcanza (`resortePlaca`);
 * al subir se vacia. Con movimiento reducido todo esta lleno. Debe ser hijo
 * directo del contenido del scroll (mide su posicion con `onLayout`); dentro de una
 * tarjeta, `y` debe llegar ya desplazado por la posicion de esa tarjeta. `titulo` y
 * `pie` van dentro de la seccion. `compacto` los dibuja mas chicos (circulos de 24).
 */
export function PasosLineaTiempo({ titulo, pasos, y, pie, estilo, compacto }: {
  titulo: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
  pasos: string[];
  y: SharedValue<number>;
  pie?: React.ReactNode;
  compacto?: boolean;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { height: ventana } = useWindowDimensions();
  const lado = compacto ? LADO_COMPACTO : LADO_CIRCULO;
  const centro = lado / 2;
  const raizY = useSharedValue(Number.POSITIVE_INFINITY);
  const listaY = useSharedValue(0);
  const ultimoTop = useSharedValue(0);
  const base = useDerivedValue(() => raizY.value + listaY.value);

  const relleno = useAnimatedStyle(() => ({
    height: reducido
      ? ultimoTop.value
      : Math.min(ultimoTop.value, Math.max(0, y.value + ventana * LECTURA - base.value - centro)),
  }), [reducido, ventana, centro, tick]);
  const pista = useAnimatedStyle(() => ({ height: ultimoTop.value }), [tick]);
  const columna = { top: centro, left: centro - GROSOR_LINEA / 2 };

  return (
    <View style={estilo} onLayout={e => { raizY.value = e.nativeEvent.layout.y; }}>
      {titulo}
      <View onLayout={e => { listaY.value = e.nativeEvent.layout.y; }} style={s.lista}>
        <Animated.View style={[s.pista, columna, pista]} pointerEvents="none" />
        <Animated.View style={[s.relleno, columna, relleno]} pointerEvents="none" />
        {pasos.map((texto, i) => (
          <Paso
            key={i} n={i + 1} texto={texto} y={y} base={base} ventana={ventana} ultimo={i === pasos.length - 1} lado={lado}
            compacto={!!compacto}
            alTop={top => { if (i === pasos.length - 1) ultimoTop.value = top; }}
          />
        ))}
      </View>
      {pie}
    </View>
  );
}

function Paso({ n, texto, y, base, ventana, ultimo, lado, compacto, alTop }: {
  n: number; texto: string; y: SharedValue<number>; base: { value: number }; ventana: number; ultimo: boolean;
  lado: number; compacto: boolean; alTop: (top: number) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const centro = lado / 2;
  const top = useSharedValue(Number.POSITIVE_INFINITY);
  const lleno = useSharedValue(reducido ? 1 : 0);

  useAnimatedReaction(
    () => y.value + ventana * LECTURA - base.value >= top.value + centro,
    (alcanzado, previo) => {
      if (reducido || alcanzado === previo) return;
      lleno.value = withSpring(alcanzado ? 1 : 0, resortePlaca);
    },
    [reducido, ventana, centro],
  );

  const disco = useAnimatedStyle(() => ({ opacity: lleno.value, transform: [{ scale: 0.6 + 0.4 * lleno.value }] }), [tick]);
  const numero = useAnimatedStyle(() => ({
    color: interpolateColor(lleno.value, [0, 1], [paleta.magnesia, paleta.goma]),
  }), [tick]);

  return (
    <View
      style={[s.paso, !ultimo && s.pasoConSeparacion, compacto && s.pasoCompacto]} accessible accessibilityLabel={`Paso ${n}. ${texto}`}
      onLayout={e => { top.value = e.nativeEvent.layout.y; alTop(e.nativeEvent.layout.y); }}
    >
      <View style={[s.circulo, { width: lado, height: lado, borderRadius: centro }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Animated.View style={[s.disco, { borderRadius: centro }, disco]} />
        <Animated.Text style={[s.numero, compacto && s.numeroCompacto, numero]}>{n}</Animated.Text>
      </View>
      <Text
        style={[s.texto, compacto && s.textoCompacto]}
        importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      >
        {texto}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  lista: { position: 'relative' },
  pista: { position: 'absolute', width: GROSOR_LINEA, backgroundColor: paleta.gomaBorde },
  relleno: { position: 'absolute', width: GROSOR_LINEA, backgroundColor: paleta.magnesia },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  pasoConSeparacion: { paddingBottom: 20 },
  pasoCompacto: { gap: 12 },
  circulo: {
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: paleta.magnesia2, backgroundColor: paleta.goma,
  },
  disco: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: paleta.magnesia },
  numero: { fontFamily: familia.titulo, fontSize: 15, lineHeight: 18 },
  numeroCompacto: { fontSize: 13, lineHeight: 16 },
  texto: { flex: 1, fontFamily: familia.cuerpo, fontSize: 17, lineHeight: 25, color: paleta.magnesia, paddingTop: 1 },
  textoCompacto: { fontSize: 15, lineHeight: 22, paddingTop: 1 },
});
