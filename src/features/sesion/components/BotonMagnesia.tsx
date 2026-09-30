import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, familia, ALTO_BOTON, radio, resorteTap, haptico } from '@/ui/theme';

/** «Ya estoy» del descanso: solido `magnesia` con texto `goma`, para no competir con el azul del ambiente. */
export function BotonMagnesia({ texto, onPress, deshabilitado }: { texto: string; onPress: () => void; deshabilitado: boolean }) {
  const presion = useSharedValue(0);
  const cuerpo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.03 * presion.value }] }));
  return (
    <Pressable
      onPressIn={() => { if (deshabilitado) return; presion.set(withSpring(1, resorteTap)); haptico.toque(); }}
      onPressOut={() => { presion.set(withSpring(0, resorteTap)); }}
      onPress={deshabilitado ? undefined : onPress}
      accessibilityRole="button" accessibilityLabel={texto} accessibilityState={{ disabled: deshabilitado }}
    >
      <Animated.View style={[s.magnesia, deshabilitado && s.apagado, cuerpo]}>
        <Text style={s.magnesiaTexto}>{texto}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  apagado: { opacity: 0.4 },
  magnesia: {
    minHeight: ALTO_BOTON, borderRadius: radio.pastilla, alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.magnesia,
  },
  magnesiaTexto: { fontFamily: familia.negrita, fontSize: 17, lineHeight: 22, color: paleta.goma },
});
