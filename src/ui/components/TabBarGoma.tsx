import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { DesenfoqueIos } from './DesenfoqueIos';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  color, paleta, familia, ALTO_BARRA, SEPARACION_BARRA, separacionBarra, resortePlaca, haptico,
} from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { barraBajada } from '@/ui/hooks/useBarraFlotante';

const ANCHO_INDICADOR = 16;
const ALTO_INDICADOR = 3;
const TOP_INDICADOR = 56;
const RADIO_BARRA = 24;
const BAJADA_PX = 8;
const TRANSPARENCIA_EXTRA = 0.1;
const ESCALA_ICONO_INICIAL = 0.9;

type Icono = keyof typeof Ionicons.glyphMap;
const ICONOS: Record<string, [activo: Icono, inactivo: Icono]> = {
  Hoy: ['home', 'home-outline'],
  Explorar: ['compass', 'compass-outline'],
  Aprender: ['book', 'book-outline'],
  Yo: ['person', 'person-outline'],
};

/**
 * Barra de pestanas flotante: margen de 12 px, esquinas de 24, `gomaAlta` con
 * desenfoque en iOS (96 % de opacidad en Android) y una barrita azul de 16x3
 * que se desliza bajo la pestana activa. El icono que se activa entra de 0.9
 * a 1 con un toque de seleccion. Mientras se baja por una lista, la barra baja
 * 8 px y se vuelve un 10 % mas transparente.
 */
export function TabBarGoma({ state, descriptors, navigation }: BottomTabBarProps) {
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducido = useReducedMotion();
  const tick = useTick();
  const ancho = (width - 2 * SEPARACION_BARRA - 2) / state.routes.length;
  const x = useSharedValue(state.index * ancho);

  useEffect(() => {
    const destino = state.index * ancho;
    x.set(reducido ? destino : withSpring(destino, { ...resortePlaca, overshootClamping: true }));
  }, [state.index, ancho, reducido, x]);

  const indicador = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value + (ancho - ANCHO_INDICADOR) / 2 }],
  }), [tick]);
  const flota = useAnimatedStyle(() => (
    reducido ? {} : { transform: [{ translateY: BAJADA_PX * barraBajada.value }] }
  ), [reducido, tick]);
  const cuerpo = useAnimatedStyle(() => ({ opacity: 1 - TRANSPARENCIA_EXTRA * barraBajada.value }), [tick]);

  return (
    <Animated.View style={[s.barra, { bottom: separacionBarra(inset.bottom) }, flota]}>
      <Animated.View style={[StyleSheet.absoluteFill, cuerpo]}>
        <DesenfoqueIos intensidad={40} estilo={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'ios' ? color.barraPestanasBlur : color.barraPestanas }]} />
      </Animated.View>

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
              <IconoPestana activa={activa} lleno={lleno} contorno={contorno} />
              <Text style={[s.etiqueta, activa ? s.etiquetaActiva : s.etiquetaInactiva]} numberOfLines={1}>
                {etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={[s.indicador, indicador]} pointerEvents="none" />
    </Animated.View>
  );
}

function IconoPestana({ activa, lleno, contorno }: { activa: boolean; lleno: Icono; contorno: Icono }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const escala = useSharedValue(1);

  useEffect(() => {
    if (!activa || reducido) { escala.set(1); return; }
    escala.set(ESCALA_ICONO_INICIAL);
    escala.set(withSpring(1, resortePlaca));
  }, [activa, escala, reducido]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }), [tick]);
  return (
    <Animated.View style={estilo}>
      <Ionicons name={activa ? lleno : contorno} size={22} color={activa ? paleta.magnesia : paleta.magnesia3} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  barra: {
    position: 'absolute', left: SEPARACION_BARRA, right: SEPARACION_BARRA, height: ALTO_BARRA,
    borderRadius: RADIO_BARRA, borderWidth: 1, borderColor: paleta.gomaBorde, overflow: 'hidden',
  },
  fila: { flex: 1, flexDirection: 'row', paddingTop: 10 },
  item: { flex: 1, alignItems: 'center', gap: 2, minHeight: 44 },
  etiqueta: { fontSize: 12, lineHeight: 16 },
  etiquetaActiva: { fontFamily: familia.enfasis, color: paleta.magnesia },
  etiquetaInactiva: { fontFamily: familia.medio, color: paleta.magnesia3Texto },
  indicador: {
    position: 'absolute', top: TOP_INDICADOR, left: 0, width: ANCHO_INDICADOR, height: ALTO_INDICADOR,
    borderRadius: ALTO_INDICADOR / 2, backgroundColor: paleta.placaAzul,
  },
});
