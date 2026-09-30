import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, familia, AREA_TACTIL_MIN, MARGEN_PANTALLA, resorteTap, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const EMPUJE_FLECHA_PX = 4;

/**
 * Enlace de seccion («Ver todas ›»): texto en `magnesia2` con una flecha que se
 * adelanta 4 px al tocar. Area tactil de 44 px de alto, nunca un texto suelto.
 */
export function AccionSeccion({ texto, onPress }: { texto: string; onPress: () => void }) {
  const reducido = useReducedMotion();
  const presion = useSharedValue(0);
  const flecha = useAnimatedStyle(() => ({
    transform: [{ translateX: reducido ? 0 : EMPUJE_FLECHA_PX * presion.value }],
  }), [reducido]);

  return (
    <Pressable
      onPressIn={() => { presion.value = withSpring(1, resorteTap); }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={() => { haptico.toque(); onPress(); }}
      accessibilityRole="button" accessibilityLabel={texto}
      style={s.boton}
    >
      <Text style={s.texto}>{texto}</Text>
      <Animated.View style={flecha}><Ionicons name="chevron-forward" size={16} color={paleta.magnesia2} /></Animated.View>
    </Pressable>
  );
}

/** Encabezado de un modulo: titulo a la izquierda y, si hay, su accion a la derecha. */
export function CabeceraSeccion({ titulo, accion, onAccion, grande }: {
  titulo: string; accion?: string; onAccion?: () => void;
  /** 26 px (Elige tu enfoque y otras rutinas) en vez de los 24 del resto del feed. */
  grande?: boolean;
}) {
  return (
    <View style={s.cabecera}>
      <Text style={[s.titulo, grande && s.tituloGrande]} accessibilityRole="header">{titulo}</Text>
      {accion && onAccion ? <AccionSeccion texto={accion} onPress={onAccion} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  cabecera: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: MARGEN_PANTALLA, marginBottom: 12, minHeight: AREA_TACTIL_MIN,
  },
  titulo: { fontFamily: familia.titulo, fontSize: 24, lineHeight: 28, flexShrink: 1, color: paleta.magnesia },
  tituloGrande: { fontSize: 26, lineHeight: 30 },
  boton: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: AREA_TACTIL_MIN, paddingLeft: 12 },
  texto: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
});
