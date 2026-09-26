import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, easing, resorteTap, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

export type VarianteChip = 'objetivo' | 'categoria';
type Icono = keyof typeof Ionicons.glyphMap;

const MEDIDAS = {
  objetivo: { alto: 36, radio: 10, fondo: paleta.gomaAlta },
  categoria: { alto: 32, radio: 8, fondo: 'transparent' },
} as const;
const RELLENO_MS = 200;
const FUNDIDO_REDUCIDO_MS = 150;
const HUNDIMIENTO = 0.95;
const PADDING_X = 12;
const TAMANO_ICONO = 16;
const MIN_ESCALA = 0.001;

/**
 * Chip de filtro (estado, no navegacion). Sin marcar: borde de 1 px y texto
 * `magnesia2`; marcado: relleno `magnesia` con el texto y el icono en `goma` (el
 * azul es de la accion, no del estado). Al marcarlo el relleno crece desde el
 * punto donde se toco como un circulo que se expande (200 ms) y el chip se hunde
 * un 5 % con `resorteTap`; al desmarcarlo el relleno se retira al mismo punto. Con
 * movimiento reducido, el relleno aparece con un fundido de 150 ms.
 *
 * La palabra se reserva con su version en negrita, invisible, para que el chip no
 * cambie de ancho al pasar de 500 a 600 y la fila no se corra.
 */
export function ChipFiltro({ texto, activo, onPress, icono, variante = 'objetivo' }: {
  texto: string;
  activo: boolean;
  onPress: () => void;
  icono?: Icono;
  variante?: VarianteChip;
}) {
  const { alto, radio, fondo } = MEDIDAS[variante];
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(activo ? 1 : 0);
  const escala = useSharedValue(1);
  const ox = useSharedValue(0);
  const oy = useSharedValue(0);
  const tocado = useRef(false);
  const [diametro, setDiametro] = useState(0);

  useEffect(() => {
    t.value = withTiming(activo ? 1 : 0, { duration: reducido ? FUNDIDO_REDUCIDO_MS : RELLENO_MS, easing: easing.salida });
  }, [activo, reducido]);

  const alMedir = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDiametro(2 * Math.hypot(width, height));
    if (!tocado.current) { ox.value = width / 2; oy.value = height / 2; }
  };

  const cuerpo = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
    borderColor: interpolateColor(t.value, [0, 1], [paleta.gomaBorde, paleta.magnesia]),
  }), [tick]);
  const relleno = useAnimatedStyle(() => ({
    left: ox.value - diametro / 2,
    top: oy.value - diametro / 2,
    opacity: reducido ? t.value : 1,
    transform: [{ scale: reducido ? 1 : Math.max(t.value, MIN_ESCALA) }],
  }), [reducido, diametro, tick]);
  const colorTexto = useAnimatedStyle(() => ({
    color: interpolateColor(t.value, [0, 1], [paleta.magnesia2, paleta.goma]),
  }), [tick]);
  const iconoMarcado = useAnimatedStyle(() => ({ opacity: t.value }), [tick]);

  return (
    <Pressable
      onPressIn={e => {
        if (!reducido) { tocado.current = true; ox.value = e.nativeEvent.locationX; oy.value = e.nativeEvent.locationY; }
        escala.value = withSpring(HUNDIMIENTO, resorteTap);
      }}
      onPressOut={() => { escala.value = withSpring(1, resorteTap); }}
      onPress={() => { haptico.seleccion(); onPress(); }}
      accessibilityRole="button" accessibilityLabel={texto} accessibilityState={{ selected: activo }}
    >
      <Animated.View
        style={[s.chip, { height: alto, borderRadius: radio, backgroundColor: fondo }, cuerpo]}
        onLayout={alMedir} pointerEvents="none"
      >
        <Animated.View style={[s.relleno, { width: diametro, height: diametro, borderRadius: diametro / 2 }, relleno]} />
        {icono && (
          <View style={s.icono}>
            <Ionicons name={icono} size={TAMANO_ICONO} color={paleta.magnesia2} />
            <Animated.View style={[s.iconoMarcado, iconoMarcado]}>
              <Ionicons name={icono} size={TAMANO_ICONO} color={paleta.goma} />
            </Animated.View>
          </View>
        )}
        <View>
          <Text style={[s.texto, s.reserva]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{texto}</Text>
          <Animated.Text
            style={[s.texto, s.visible, { fontFamily: activo ? familia.enfasis : familia.medio }, colorTexto]}
            numberOfLines={1}
          >
            {texto}
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: PADDING_X,
    borderWidth: 1, overflow: 'hidden',
  },
  relleno: { position: 'absolute', backgroundColor: paleta.magnesia },
  icono: { width: TAMANO_ICONO, height: TAMANO_ICONO },
  iconoMarcado: { position: 'absolute', top: 0, left: 0 },
  texto: { fontSize: 14, lineHeight: 20 },
  reserva: { fontFamily: familia.enfasis, opacity: 0 },
  visible: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
});
