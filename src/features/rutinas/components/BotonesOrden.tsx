import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, resorteTap } from '@/ui/theme';

const LADO = 36;
const ICONO = 18;
const ESCALA_PRESIONADO = 0.1;
const SEPARACION = 6;
/** 36 de circulo y 4 de margen tactil por cada lado: 44 de area sin que los dos se pisen del todo. */
const MARGEN_TACTIL = { top: 4, bottom: 4, left: 4, right: 4 };

/**
 * ↑ ↓ para reordenar: dos botones circulares de 36 (`goma` con borde) apilados. Solo avisan
 * del toque; el limite (primero, ultimo) lo resuelve quien los usa, igual que antes: no se
 * apagan.
 */
export function BotonesOrden({ nombre, onSubir, onBajar }: { nombre: string; onSubir: () => void; onBajar: () => void }) {
  return (
    <View style={s.pila}>
      <Boton icono="arrow-up" etiqueta={`Mover ${nombre} arriba`} onPress={onSubir} />
      <Boton icono="arrow-down" etiqueta={`Mover ${nombre} abajo`} onPress={onBajar} />
    </View>
  );
}

function Boton({ icono, etiqueta, onPress }: { icono: 'arrow-up' | 'arrow-down'; etiqueta: string; onPress: () => void }) {
  const presion = useSharedValue(0);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }] }));
  return (
    <Pressable
      onPressIn={() => { presion.set(withSpring(1, resorteTap)); }}
      onPressOut={() => { presion.set(withSpring(0, resorteTap)); }}
      onPress={onPress} hitSlop={MARGEN_TACTIL}
      accessibilityRole="button" accessibilityLabel={etiqueta}
    >
      <Animated.View style={[s.boton, estilo]}>
        <Ionicons name={icono} size={ICONO} color={paleta.magnesia} />
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pila: { gap: SEPARACION },
  boton: {
    width: LADO, height: LADO, borderRadius: LADO / 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
});
