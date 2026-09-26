import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { Canvas, DashPathEffect, RoundedRect } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, resortePlaca } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { Presionable } from '../ui/Presionable';

export const ALTO_FILA_CREAR = 64;
const RADIO = 20;
const GROSOR_BORDE = 1.5;
const RAYA = 6;
const HUECO = 4;
const LADO_PLACA = 36;
const GIRO_GRADOS = 90;
const ESCALA_PRESIONADA = 0.02;

/**
 * «Crear mi rutina» como un hueco por llenar: 64 de alto, sin relleno y con un borde
 * discontinuo de 1.5 px (raya 6, hueco 4, dibujado con Skia, que es lo unico que deja
 * elegir la raya). A la izquierda, una placa azul de 36 con un «+» blanco; a la derecha,
 * un chevron. Al presionar se hunde un 2 % y la placa gira 90° con `resortePlaca`. La
 * accion es la de siempre: abrir el editor de rutinas.
 */
export function FilaCrear({ onPress }: { onPress: () => void }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const giro = useDerivedValue(() => withSpring(presion.value * GIRO_GRADOS, resortePlaca));
  const [ancho, setAncho] = useState(0);

  const placa = useAnimatedStyle(() => ({
    transform: [{ rotate: `${reducido ? 0 : giro.value}deg` }],
  }), [reducido, tick]);

  return (
    <Presionable onPress={onPress} etiqueta="Crear mi rutina" presion={presion} escala={ESCALA_PRESIONADA} estilo={s.fila}>
      <View style={s.borde} onLayout={e => setAncho(e.nativeEvent.layout.width)} pointerEvents="none">
        {ancho > 0 && (
          <Canvas style={{ width: ancho, height: ALTO_FILA_CREAR }}>
            <RoundedRect
              x={GROSOR_BORDE / 2} y={GROSOR_BORDE / 2} width={ancho - GROSOR_BORDE} height={ALTO_FILA_CREAR - GROSOR_BORDE}
              r={RADIO - GROSOR_BORDE / 2} style="stroke" strokeWidth={GROSOR_BORDE} color={paleta.gomaBorde}
            >
              <DashPathEffect intervals={[RAYA, HUECO]} />
            </RoundedRect>
          </Canvas>
        )}
      </View>
      <Animated.View style={[s.placa, placa]}>
        <Ionicons name="add" size={18} color={paleta.blanco} />
      </Animated.View>
      <Text style={s.texto}>Crear mi rutina</Text>
      <Ionicons name="chevron-forward" size={16} color={paleta.magnesia3Texto} />
    </Presionable>
  );
}

const s = StyleSheet.create({
  fila: {
    height: ALTO_FILA_CREAR, borderRadius: RADIO, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14,
  },
  borde: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  placa: {
    width: LADO_PLACA, height: LADO_PLACA, borderRadius: LADO_PLACA / 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.placaAzul,
  },
  texto: { flex: 1, fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
});
