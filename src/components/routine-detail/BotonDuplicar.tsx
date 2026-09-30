import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, radio, familia, resorteTap, easing, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const ALTO = 56;
const ESCALA_PRESIONADO = 0.03;
const FANTASMA_MS = 260;
const FANTASMA_PX = 6;
const OPACIDAD_FANTASMA = 0.4;

/**
 * Boton secundario solido para «Duplicar y editar»: `gomaAlta` con borde de 1 px, un
 * icono de copiar a la izquierda y el texto en Figtree 700. Al tocarlo se hunde a 0.97 y una
 * copia fantasma del boton (opacidad 0.4) se desliza 6 px abajo a la derecha mientras se
 * desvanece, 260 ms: la metafora de «copiar». La accion no espera la animacion. Con movimiento
 * reducido no hay copia fantasma.
 */
export function BotonDuplicar({ texto, onPress }: { texto: string; onPress: () => void }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const fantasma = useSharedValue(0);

  const cuerpo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }] }));
  const copia = useAnimatedStyle(() => ({
    opacity: fantasma.value === 0 ? 0 : OPACIDAD_FANTASMA * (1 - fantasma.value),
    transform: [{ translateX: FANTASMA_PX * fantasma.value }, { translateY: FANTASMA_PX * fantasma.value }],
  }), [tick]);

  const alTocar = () => {
    if (!reducido) {
      fantasma.value = 0;
      fantasma.value = withTiming(1, { duration: FANTASMA_MS, easing: easing.salida });
    }
    onPress();
  };

  return (
    <Pressable
      onPressIn={() => { presion.value = withSpring(1, resorteTap); haptico.toque(); }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={alTocar}
      accessibilityRole="button" accessibilityLabel={texto}
    >
      <View style={s.caja}>
        <Animated.View style={[s.forma, s.fantasma, copia]} pointerEvents="none" />
        <Animated.View style={[s.forma, s.cuerpo, cuerpo]}>
          <Ionicons name="copy-outline" size={18} color={paleta.magnesia} />
          <Text style={s.texto} numberOfLines={1} maxFontSizeMultiplier={1.15}>{texto}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  caja: { height: ALTO },
  forma: { height: ALTO, borderRadius: radio.pastilla, backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde },
  fantasma: { position: 'absolute', top: 0, left: 0, right: 0 },
  cuerpo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  texto: { fontFamily: familia.negrita, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
});
