import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { paleta, tipo, familia, resortePlaca, resorteTap, haptico } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { Odometro } from '@/components/fx/Odometro';

const CAIDA_PX = 40;
const ESCALA_INICIAL = 1.1;
const IMPACTO_MS = 260;
const VIBRACION_PX = 2;
const NUMERO_RETRASO_MS = 350;
const TAMANO_NUMERO = 48;

/**
 * Placa de dato del plan: una tarjeta vertical que cae desde 40 px arriba y
 * asienta con `resortePlaca` y una vibracion de 2 px, con un golpe Medium al
 * impactar. El numero rueda cuando se asienta. El filo superior de 3 px lleva
 * el color de la placa que le toca.
 */
export function PlacaDato({
  numero, etiqueta, lector, filo, retraso, activo = true, animar = true, haptica = true, tamano = TAMANO_NUMERO, continuo, adorno,
}: {
  numero: number;
  etiqueta: string;
  /** Lo que oye el lector de pantalla si la etiqueta visible va abreviada («días/sem» → «días por semana»). */
  lector?: string;
  filo: string;
  retraso: number;
  activo?: boolean;
  animar?: boolean;
  /** Golpe Medium al asentarse. En un grupo de placas solo la ultima lo lleva. */
  haptica?: boolean;
  /** Tamano del numero (48 por defecto; 32 cuando van cuatro en fila). */
  tamano?: number;
  /** El numero vuelve a rodar cuando cambia su valor (con `animar` en falso, solo esos cambios ruedan). */
  continuo?: boolean;
  /** Una marca pequena en la esquina de arriba a la derecha, junto al numero (la huella de la racha). */
  adorno?: React.ReactNode;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const estatico = reducido || !animar;
  const caida = useSharedValue(estatico ? 1 : 0);
  const golpe = useSharedValue(0);

  useEffect(() => {
    if (estatico) { caida.value = 1; return; }
    if (!activo) return;
    caida.value = withDelay(retraso, withSpring(1, resortePlaca));
    golpe.value = withDelay(retraso + IMPACTO_MS, withSequence(withTiming(1, { duration: 40 }), withSpring(0, resorteTap)));
    const impacto = haptica ? setTimeout(haptico.placa, retraso + IMPACTO_MS) : undefined;
    return () => { if (impacto) clearTimeout(impacto); cancelAnimation(caida); cancelAnimation(golpe); };
  }, [estatico, activo]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, caida.value * 3),
    transform: [
      { translateY: -CAIDA_PX * (1 - caida.value) + VIBRACION_PX * golpe.value },
      { scale: ESCALA_INICIAL - (ESCALA_INICIAL - 1) * caida.value },
    ],
  }), [tick]);

  return (
    <Animated.View style={[s.tarjeta, estilo]} accessible accessibilityLabel={`${numero} ${lector ?? etiqueta}`}>
      <View style={[s.filo, { backgroundColor: filo }]} />
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={s.contenido}>
        <Odometro
          valor={numero} activo={activo} animar={animar} continuo={continuo} retraso={retraso + NUMERO_RETRASO_MS}
          estilo={[s.numero, { fontSize: tamano, lineHeight: tamano + 2 }]}
        />
        <Text style={s.etiqueta} maxFontSizeMultiplier={1.3}>{etiqueta}</Text>
      </View>
      {adorno ? <View style={s.adorno} pointerEvents="none">{adorno}</View> : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  tarjeta: {
    flex: 1, borderRadius: 20, overflow: 'hidden',
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  filo: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  contenido: { alignItems: 'center', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 8, gap: 4 },
  adorno: { position: 'absolute', top: 8, right: 8 },
  numero: { ...tipo.numero, fontSize: 48, lineHeight: 50, color: paleta.magnesia },
  etiqueta: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2, textAlign: 'center' },
});
