import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { paleta, tinte, radio, familia, resortePlaca, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type TipoEvidencia = 'ok' | 'parcial' | 'mito';

const DATOS: Record<TipoEvidencia, { fondo: string; punto: string; texto: string; etiqueta: string }> = {
  ok: { fondo: tinte.verde, punto: paleta.placaVerde, texto: paleta.placaVerdeTexto, etiqueta: 'Comprobado' },
  parcial: { fondo: tinte.amarilla, punto: paleta.placaAmarilla, texto: paleta.placaAmarilla, etiqueta: 'Parcial' },
  mito: { fondo: tinte.roja, punto: paleta.placaRoja, texto: paleta.placaRojaTexto, etiqueta: 'Mito' },
};

const IMPACTO_MS = 120;
const ESCALA_INICIAL = 1.3;

export interface Estampado {
  activo: boolean;
  animar?: boolean;
  retraso: number;
}

/** Insignia de evidencia: el punto lleva el color de la placa; el texto, su variante legible (AA). */
export function InsigniaEvidencia({ tipo, estampar, estilo }: {
  tipo: TipoEvidencia;
  /** Si se pasa, la insignia se estampa (escala 1.3 a 1, golpe Rigid) cuando `activo`. */
  estampar?: Estampado;
  estilo?: StyleProp<ViewStyle>;
}) {
  const reducido = useReducedMotion();
  const d = DATOS[tipo];
  const estatico = !estampar || reducido || estampar.animar === false;
  const t = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { t.value = 1; return; }
    if (!estampar?.activo) { t.value = 0; return; }
    t.value = withDelay(estampar.retraso, withSpring(1, resortePlaca));
    const golpe = setTimeout(haptico.sello, estampar.retraso + IMPACTO_MS);
    return () => { clearTimeout(golpe); cancelAnimation(t); };
  }, [estatico, estampar?.activo]);

  const animado = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ scale: ESCALA_INICIAL - (ESCALA_INICIAL - 1) * t.value }],
  }));

  return (
    <Animated.View
      accessible
      accessibilityLabel={d.etiqueta}
      style={[s.caja, { backgroundColor: d.fondo }, estilo, animado]}
    >
      <View style={[s.punto, { backgroundColor: d.punto }]} />
      <Text style={[s.texto, { color: d.texto }]}>{d.etiqueta}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  caja: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderRadius: radio.insignia, paddingVertical: 6, paddingHorizontal: 10,
  },
  punto: { width: 6, height: 6, borderRadius: 3 },
  texto: { fontFamily: familia.enfasis, fontSize: 13, lineHeight: 18 },
});
