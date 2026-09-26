import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, radio, easing, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { GomaTexture } from '../fx/GomaTexture';
import { PalomitaTrazo } from '../fx/PalomitaTrazo';

const ANCHO_FILO = 3;
const FILO_MS = 300;
const LADO_ICONO = 20;

/**
 * La respuesta de un mito («Qué hacer en su lugar») y el consejo practico de una tarjeta de
 * alimentacion: una `TarjetaGoma` con un filo de 3 px `placaVerde` a la izquierda y, al inicio, una
 * palomita de 20 px (un veredicto) o una flecha hacia adelante (una accion). El texto va en
 * `magnesia`: es la respuesta, no una nota. Cuando `activo` pasa a verdadero la palomita se dibuja,
 * el filo crece de arriba abajo en 300 ms y da un toque suave. Con movimiento reducido, o con
 * `animar` en falso, aparece ya dibujada y sin toque.
 */
export function TarjetaEnSuLugar({ texto, activo, animar = true, icono = 'palomita', tamano = 'grande', haptica = true }: {
  texto: string;
  activo: boolean;
  animar?: boolean;
  icono?: 'palomita' | 'flecha';
  /** Figtree 17/26 (la respuesta de un mito) o 16/24 (el consejo de una tarjeta). */
  tamano?: 'grande' | 'normal';
  /** El toque suave al asentarse el filo (una lista de tarjetas no debe dar uno por cada una). */
  haptica?: boolean;
}) {
  const reducido = useReducedMotion();
  const estatico = reducido || !animar;
  const crece = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { crece.value = 1; return; }
    if (!activo) { crece.value = 0; return; }
    crece.value = withTiming(1, { duration: FILO_MS, easing: easing.salida });
    if (haptica) haptico.toque();
    return () => cancelAnimation(crece);
  }, [estatico, activo]);

  const filo = useAnimatedStyle(() => ({ transform: [{ scaleY: crece.value }] }));

  return (
    <View style={s.caja} accessible accessibilityLabel={texto}>
      <GomaTexture />
      <Animated.View style={[s.filo, filo]} />
      <View style={s.fila} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={s.icono}>
          {icono === 'palomita'
            ? <PalomitaTrazo visible={activo || estatico} tamano={LADO_ICONO} color={paleta.placaVerde} />
            : <Ionicons name="arrow-forward" size={LADO_ICONO} color={paleta.placaVerde} />}
        </View>
        <Text style={[s.texto, tamano === 'grande' ? s.grande : s.normal]} maxFontSizeMultiplier={1.3}>{texto}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    backgroundColor: paleta.gomaAlta, borderRadius: radio.tarjeta, borderWidth: 1, borderColor: paleta.gomaBorde, overflow: 'hidden',
  },
  filo: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: ANCHO_FILO, backgroundColor: paleta.placaVerde,
    transformOrigin: 'top',
  },
  fila: { flexDirection: 'row', gap: 12, padding: 20, paddingLeft: 20 + ANCHO_FILO },
  icono: { width: LADO_ICONO, height: LADO_ICONO, marginTop: 3 },
  texto: { flex: 1, fontFamily: familia.cuerpo, color: paleta.magnesia },
  grande: { fontSize: 17, lineHeight: 26 },
  normal: { fontSize: 16, lineHeight: 24 },
});
