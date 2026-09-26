import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, tipo, radio, resorteTap, haptico } from '../../theme';

const ALTO = 36;
const ESCALA_PRESIONADO = 0.05;

/**
 * Boton azul pequeno (36 px de alto, area tactil de 44 por `hitSlop`) para
 * acciones dentro de una tarjeta. Es la version compacta de `BotonPlaca`: mismo
 * azul, sin resplandor ni llenado.
 */
export function BotonCompacto({ texto, onPress, etiqueta, estilo }: {
  texto: string;
  onPress: () => void;
  /** Si el texto solo no describe la accion (p. ej. incluye el ejercicio). */
  etiqueta?: string;
  estilo?: StyleProp<ViewStyle>;
}) {
  const presion = useSharedValue(0);
  const cuerpo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }],
    backgroundColor: interpolateColor(presion.value, [0, 1], [paleta.placaAzul, paleta.placaAzulPresionado]),
  }));

  return (
    <Pressable
      onPressIn={() => { presion.value = withSpring(1, resorteTap); haptico.toque(); }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? texto}
      style={estilo}
    >
      <Animated.View style={[s.cuerpo, cuerpo]}>
        <Text style={s.texto} numberOfLines={1} maxFontSizeMultiplier={1.15}>{texto}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cuerpo: {
    height: ALTO, minWidth: 84, paddingHorizontal: 18, borderRadius: radio.pastilla,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
  },
  texto: { ...tipo.dato, fontSize: 15, lineHeight: 20, color: paleta.blanco },
});
