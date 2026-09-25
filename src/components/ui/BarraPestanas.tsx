import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { color, paleta, tipo, ALTO_BARRA, resortePlaca, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const ANCHO_INDICADOR = 16;
const ALTO_INDICADOR = 3;
const TOP_INDICADOR = 56;

type Icono = keyof typeof Ionicons.glyphMap;
const ICONOS: Record<string, [activo: Icono, inactivo: Icono]> = {
  Hoy: ['home', 'home-outline'],
  Explorar: ['compass', 'compass-outline'],
  Aprender: ['book', 'book-outline'],
  Yo: ['person', 'person-outline'],
};

/** Alto de la barra incluyendo el hueco del gesto del telefono. Es el mismo calculo que `useHuecoAbajo`. */
export const altoBarra = (insetAbajo: number) => ALTO_BARRA + Math.max(insetAbajo - 10, 0);

/**
 * Barra de pestanas: `gomaAlta` con desenfoque en iOS (color casi solido en
 * Android), borde superior de 1 px y una barrita azul de 16x3 que se desliza
 * bajo la pestana activa con `resortePlaca`. Cambiar de pestana da un toque
 * de seleccion.
 */
export function BarraPestanas({ state, descriptors, navigation }: BottomTabBarProps) {
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducido = useReducedMotion();
  const ancho = width / state.routes.length;
  const x = useSharedValue(state.index * ancho);

  useEffect(() => {
    const destino = state.index * ancho;
    x.value = reducido ? destino : withSpring(destino, { ...resortePlaca, overshootClamping: true });
  }, [state.index, ancho, reducido]);

  const indicador = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value + (ancho - ANCHO_INDICADOR) / 2 }],
  }));

  return (
    <View style={[s.barra, { height: altoBarra(inset.bottom), paddingBottom: Math.max(inset.bottom, 10) }]}>
      {Platform.OS === 'ios'
        ? <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'ios' ? color.barraPestanasBlur : color.barraPestanas }]} />

      <View style={s.fila} accessibilityRole="tablist">
        {state.routes.map((ruta, i) => {
          const activa = state.index === i;
          const { options } = descriptors[ruta.key];
          const etiqueta = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : ruta.name;
          const [lleno, contorno] = ICONOS[ruta.name] ?? ['ellipse', 'ellipse-outline'];

          const alTocar = () => {
            const evento = navigation.emit({ type: 'tabPress', target: ruta.key, canPreventDefault: true });
            if (activa || evento.defaultPrevented) return;
            haptico.pestana();
            navigation.navigate(ruta.name, ruta.params);
          };

          return (
            <Pressable
              key={ruta.key}
              onPress={alTocar}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: ruta.key })}
              accessibilityRole="tab"
              accessibilityLabel={etiqueta}
              accessibilityState={{ selected: activa }}
              style={s.item}
            >
              <Ionicons name={activa ? lleno : contorno} size={22} color={activa ? paleta.magnesia : paleta.magnesia3} />
              <Text style={[s.etiqueta, { color: activa ? paleta.magnesia : color.textoTenue }]} numberOfLines={1}>
                {etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={[s.indicador, indicador]} pointerEvents="none" />
    </View>
  );
}

const s = StyleSheet.create({
  barra: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopWidth: 1, borderTopColor: paleta.gomaBorde, overflow: 'hidden',
  },
  fila: { flex: 1, flexDirection: 'row', paddingTop: 10 },
  item: { flex: 1, alignItems: 'center', gap: 2, minHeight: 44 },
  etiqueta: { ...tipo.etiqueta, fontSize: 12, lineHeight: 16 },
  indicador: {
    position: 'absolute', top: TOP_INDICADOR, left: 0, width: ANCHO_INDICADOR, height: ALTO_INDICADOR,
    borderRadius: ALTO_INDICADOR / 2, backgroundColor: paleta.placaAzul,
  },
});
