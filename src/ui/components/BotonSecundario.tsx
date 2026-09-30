import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, tipo, radio, esp, ALTO_BOTON, resorteTap, haptico } from '@/ui/theme';

const ESCALA_PRESIONADO = 0.03;

/** Boton secundario solido: superficie `gomaAlta` con borde de 1 px. Nunca un boton fantasma. */
export function BotonSecundario({ texto, onPress, deshabilitado, estilo }: {
  texto: string;
  onPress: () => void;
  deshabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}) {
  const presion = useSharedValue(0);
  const cuerpo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }] }));

  return (
    <Pressable
      onPressIn={() => { if (deshabilitado) return; presion.set(withSpring(1, resorteTap)); haptico.toque(); }}
      onPressOut={() => { presion.set(withSpring(0, resorteTap)); }}
      onPress={deshabilitado ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: !!deshabilitado }}
      style={estilo}
    >
      <Animated.View style={[s.cuerpo, cuerpo]}>
        <Text style={[s.texto, deshabilitado && s.apagado]} numberOfLines={1} maxFontSizeMultiplier={1.15}>{texto}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cuerpo: {
    minHeight: ALTO_BOTON, borderRadius: radio.pastilla, paddingHorizontal: esp.lg + esp.sm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  texto: { ...tipo.cuerpoEnfasis, color: paleta.magnesia, textAlign: 'center' },
  apagado: { color: paleta.magnesia3Texto },
});
