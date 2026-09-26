import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { paleta, tinte, radio, familia, resortePlaca, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type TipoEvidencia = 'ok' | 'parcial' | 'mito' | 'cuidado';

const DATOS: Record<TipoEvidencia, { fondo: string; punto: string; texto: string; etiqueta: string }> = {
  ok: { fondo: tinte.verde, punto: paleta.placaVerde, texto: paleta.placaVerdeTexto, etiqueta: 'Comprobado' },
  parcial: { fondo: tinte.amarilla, punto: paleta.placaAmarilla, texto: paleta.placaAmarilla, etiqueta: 'Parcial' },
  mito: { fondo: tinte.roja, punto: paleta.placaRoja, texto: paleta.placaRojaTexto, etiqueta: 'Mito' },
  cuidado: { fondo: tinte.neutra, punto: paleta.magnesia2, texto: paleta.magnesia2, etiqueta: 'Cuidado' },
};

const IMPACTO_MS = 120;
const ESCALA_INICIAL = 1.3;

export interface Estampado {
  activo: boolean;
  animar?: boolean;
  retraso: number;
  /** Escala con la que cae (1.3 por defecto). */
  escala?: number;
  /** Giro inicial en grados, que se deshace al asentarse (0 por defecto). */
  giro?: number;
  /** Golpe Rigid al asentarse (verdadero por defecto). */
  haptica?: boolean;
}

/** Insignia de evidencia: el punto lleva el color de la placa; el texto, su variante legible (AA). */
export function InsigniaEvidencia({ tipo, pequena, estampar, estilo }: {
  tipo: TipoEvidencia;
  pequena?: boolean;
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
    const golpe = estampar.haptica === false ? undefined : setTimeout(haptico.sello, estampar.retraso + IMPACTO_MS);
    return () => { if (golpe) clearTimeout(golpe); cancelAnimation(t); };
  }, [estatico, estampar?.activo]);

  const escalaIni = estampar?.escala ?? ESCALA_INICIAL;
  const giroIni = estampar?.giro ?? 0;
  const animado = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [
      { scale: escalaIni - (escalaIni - 1) * t.value },
      { rotate: `${giroIni * (1 - t.value)}deg` },
    ],
  }), [escalaIni, giroIni]);

  return (
    <Animated.View
      accessible
      accessibilityLabel={d.etiqueta}
      style={[s.caja, pequena && s.pequena, { backgroundColor: d.fondo }, estilo, animado]}
    >
      <View style={[s.punto, { backgroundColor: d.punto }]} />
      <Text style={[s.texto, { color: d.texto }]} importantForAccessibility="no" accessibilityElementsHidden>{d.etiqueta}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  caja: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderRadius: radio.insignia, paddingVertical: 6, paddingHorizontal: 10,
  },
  pequena: { paddingVertical: 3, paddingHorizontal: 8 },
  punto: { width: 6, height: 6, borderRadius: 3 },
  texto: { fontFamily: familia.enfasis, fontSize: 13, lineHeight: 18 },
});
