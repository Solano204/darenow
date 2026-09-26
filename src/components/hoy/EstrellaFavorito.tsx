import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { color, paleta, resortePlaca, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { useMiniMagnesia } from '../fx/MiniMagnesia';

const LADO = 36;
const TAMANO_ICONO = 20;
const SALIDA_MS = 140;

/**
 * Estrella de favorito sobre una foto. El contorno siempre esta; al marcarla se
 * llena con un resorte y suelta una nube pequena de magnesia. Al quitarla el
 * relleno se apaga. El estado y el efecto sobre los datos son los de siempre:
 * `onPress` alterna el favorito y `activo` viene del almacen.
 */
export function EstrellaFavorito({ activo, onPress, nombre }: {
  activo: boolean;
  onPress: () => void;
  nombre: string;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const magnesia = useMiniMagnesia();
  const t = useSharedValue(activo ? 1 : 0);
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    if (reducido) { t.value = activo ? 1 : 0; return; }
    t.value = activo ? withSpring(1, resortePlaca) : withTiming(0, { duration: SALIDA_MS });
    if (activo) magnesia.disparar();
  }, [activo, reducido]);

  const relleno = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ scale: reducido ? 1 : t.value }],
  }), [reducido, tick]);

  return (
    <Pressable
      onPress={() => { haptico.seleccion(); onPress(); }}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={activo ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
      accessibilityState={{ selected: activo }}
    >
      <View ref={magnesia.ref} collapsable={false} style={s.disco}>
        <Ionicons name="star-outline" size={TAMANO_ICONO} color={activo ? paleta.magnesia : paleta.magnesia2} />
        <Animated.View style={[s.relleno, relleno]} pointerEvents="none">
          <Ionicons name="star" size={TAMANO_ICONO} color={paleta.magnesia} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  disco: {
    width: LADO, height: LADO, borderRadius: LADO / 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.chipVidrioFondo, borderWidth: 1, borderColor: color.chipVidrioBorde,
  },
  relleno: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
