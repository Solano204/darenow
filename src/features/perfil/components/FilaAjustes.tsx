import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, familia, resortePlaca, haptico, MARGEN_PANTALLA } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const ALTO = 56;
const GIRO_GRADOS = 60;

/**
 * «Ajustes» como una fila de 56 con el borde de arriba y de abajo de 1 px `gomaBorde`: el engrane de 20 px
 * `magnesia2`, el texto en Figtree 600 de 16 y un chevron a la derecha. Al presionar el engrane gira 60 grados
 * con `resortePlaca` y da un toque suave; lleva a la misma pantalla de siempre. Con movimiento reducido no gira.
 * Debajo, con 32 px de aire, el wordmark DARENOW en `gomaBorde` como cierre de la pestana (decorativo, oculto
 * al lector de pantalla).
 */
export function FilaAjustes({ onPress }: { onPress: () => void }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const giro = useSharedValue(0);
  const engrane = useAnimatedStyle(() => ({ transform: [{ rotate: `${GIRO_GRADOS * giro.value}deg` }] }), [tick]);

  return (
    <View>
      <Pressable
        onPressIn={() => { if (!reducido) giro.value = withSpring(1, resortePlaca); }}
        onPressOut={() => { giro.value = withSpring(0, resortePlaca); }}
        onPress={() => { haptico.toque(); onPress(); }}
        accessibilityRole="button" accessibilityLabel="Ajustes" style={s.fila}
      >
        <Animated.View style={engrane}><Ionicons name="settings-outline" size={20} color={paleta.magnesia2} /></Animated.View>
        <Text style={s.texto} maxFontSizeMultiplier={1.3}>Ajustes</Text>
        <Ionicons name="chevron-forward" size={18} color={paleta.magnesia2} />
      </Pressable>
      <Text style={s.wordmark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">DARENOW</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fila: {
    height: ALTO, marginHorizontal: MARGEN_PANTALLA, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: paleta.gomaBorde,
  },
  texto: { flex: 1, fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
  wordmark: {
    marginTop: 32, textAlign: 'center', fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, letterSpacing: 2, color: paleta.gomaBorde,
  },
});
