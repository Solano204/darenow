import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, tipo, radio, resorteTap, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { PalomitaTrazo } from '@/ui/fx/PalomitaTrazo';
import { useMiniMagnesia } from '@/ui/fx/MiniMagnesia';

const ESCALA_HUNDIDO = 0.02;
const LADO_INDICADOR = 24;

export type IconoOpcion = keyof typeof Ionicons.glyphMap;

/**
 * Fila de opcion del cuestionario (unica o multiple). Al marcarla se hunde, el
 * borde y el fondo pasan al azul de accion, el indicador se llena con
 * `resortePlaca`, la palomita se dibuja de trazo y sale un toque de magnesia.
 * Al desmarcarla todo vuelve en 200 ms, sin particulas.
 */
export function OpcionCuestionario({ texto, detalle, icono, activa, multiple, onPress }: {
  texto: string;
  detalle?: string;
  icono?: IconoOpcion;
  activa: boolean;
  multiple?: boolean;
  onPress: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { ref: miniRef, disparar: dispararMini } = useMiniMagnesia();
  const presion = useSharedValue(0);
  const seleccion = useSharedValue(activa ? 1 : 0);
  const relleno = useSharedValue(activa ? 1 : 0);

  useEffect(() => {
    seleccion.set(withTiming(activa ? 1 : 0, { duration: reducido ? 150 : 200 }));
    relleno.set(reducido
      ? withTiming(activa ? 1 : 0, { duration: 150 })
      : withSpring(activa ? 1 : 0, { ...resortePlaca, overshootClamping: true }));
  }, [activa, reducido]);

  const fila = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - ESCALA_HUNDIDO * presion.value }],
    backgroundColor: interpolateColor(seleccion.value, [0, 1], [paleta.gomaAlta, paleta.gomaAltaAzul]),
    borderColor: interpolateColor(seleccion.value, [0, 1], [paleta.gomaBorde, paleta.placaAzul]),
  }), [tick]);

  const lleno = useAnimatedStyle(() => ({
    opacity: relleno.value,
    transform: [{ scale: 0.4 + 0.6 * relleno.value }],
  }), [tick]);

  const forma = multiple ? s.cuadrado : s.circulo;

  return (
    <Pressable
      onPressIn={() => { presion.set(withSpring(1, resorteTap)); }}
      onPressOut={() => { presion.set(withSpring(0, resorteTap)); }}
      onPress={() => {
        if (!activa) { haptico.seleccion(); dispararMini(); }
        onPress();
      }}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityLabel={detalle ? `${texto}, ${detalle}` : texto}
      accessibilityState={multiple ? { checked: activa } : { selected: activa }}
    >
      <Animated.View style={[s.fila, fila]}>
        {icono && (
          <Ionicons name={icono} size={24} color={paleta.magnesia2} importantForAccessibility="no" accessibilityElementsHidden />
        )}
        <View style={s.textos} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={s.titulo} maxFontSizeMultiplier={1.3}>{texto}</Text>
          {detalle && <Text style={s.detalle} maxFontSizeMultiplier={1.3}>{detalle}</Text>}
        </View>
        <View ref={miniRef} style={[s.indicador, forma]} collapsable={false}>
          <Animated.View style={[StyleSheet.absoluteFill, forma, s.relleno, lleno]} />
          <View style={s.palomita}><PalomitaTrazo visible={activa} tamano={LADO_INDICADOR} /></View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 72,
    paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1,
  },
  textos: { flex: 1 },
  titulo: { ...tipo.cuerpoEnfasis, color: paleta.magnesia },
  detalle: { fontFamily: tipo.cuerpo.fontFamily, fontSize: 14, lineHeight: 20, color: paleta.magnesia2, marginTop: 2 },
  indicador: {
    width: LADO_INDICADOR, height: LADO_INDICADOR, borderWidth: 1.5, borderColor: paleta.magnesia3,
    alignItems: 'center', justifyContent: 'center',
  },
  circulo: { borderRadius: LADO_INDICADOR / 2 },
  cuadrado: { borderRadius: radio.nota - 2 },
  relleno: { backgroundColor: paleta.placaAzul },
  palomita: { position: 'absolute', top: -1.5, left: -1.5 },
});
