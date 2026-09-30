import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring,
} from 'react-native-reanimated';
import { paleta, conAlfa, familia, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const ESCALONADO_MS = 60;
const SEGUNDO_GOLPE_MS = 70;

interface Opcion { valor: number; texto: string; color: string; alto: number; golpe: () => void }

/** Cuatro placas de altura creciente, en el orden real de peso: verde, amarilla, azul, roja. Los valores (3, 5, 7, 9) son los de siempre. */
const OPCIONES: Opcion[] = [
  { valor: 3, texto: 'Suave', color: paleta.placaVerde, alto: 32, golpe: haptico.toque },
  { valor: 5, texto: 'Bien', color: paleta.placaAmarilla, alto: 44, golpe: haptico.placa },
  { valor: 7, texto: 'Exigente', color: paleta.placaAzul, alto: 56, golpe: haptico.golpe },
  {
    valor: 9, texto: 'Al límite', color: paleta.placaRoja, alto: 68,
    golpe: () => { haptico.golpe(); setTimeout(haptico.sello, SEGUNDO_GOLPE_MS); },
  },
];

/**
 * «Como se sintio» como una escala de esfuerzo: cuatro placas verticales cuya
 * altura crece con la exigencia. Sin elegir, la placa esta vacia con el borde
 * de su color al 60 %; elegida, se llena desde abajo. Misma logica de seleccion
 * que antes: una sola, opcional, y el valor es el mismo (3, 5, 7 o 9).
 */
export function EscalaEsfuerzo({ valor, onElegir, retraso, animar = true }: {
  valor: number | null;
  onElegir: (v: number) => void;
  retraso: number;
  animar?: boolean;
}) {
  return (
    <View style={s.fila} accessibilityRole="radiogroup" accessibilityLabel="Cómo se sintió">
      {OPCIONES.map((o, i) => (
        <PlacaEsfuerzo
          key={o.valor} opcion={o} elegida={valor === o.valor} retraso={retraso + i * ESCALONADO_MS} animar={animar}
          onPress={() => { o.golpe(); onElegir(o.valor); }}
        />
      ))}
    </View>
  );
}

function PlacaEsfuerzo({ opcion, elegida, retraso, animar, onPress }: {
  opcion: Opcion; elegida: boolean; retraso: number; animar: boolean; onPress: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const estatico = reducido || !animar;
  const crece = useSharedValue(estatico ? 1 : 0);
  const llena = useSharedValue(elegida ? 1 : 0);

  useEffect(() => {
    if (estatico) { crece.set(1); return; }
    crece.set(withDelay(retraso, withSpring(1, { ...resortePlaca, overshootClamping: true })));
    return () => cancelAnimation(crece);
  }, [estatico]);

  useEffect(() => {
    llena.set(reducido ? (elegida ? 1 : 0) : withSpring(elegida ? 1 : 0, { ...resortePlaca, overshootClamping: true }));
  }, [elegida, reducido]);

  const entrada = useAnimatedStyle(() => ({ transform: [{ scaleY: crece.value }] }), [tick]);
  const relleno = useAnimatedStyle(() => ({ transform: [{ scaleY: llena.value }] }), [tick]);

  return (
    <Pressable
      onPress={onPress} style={s.opcion}
      accessibilityRole="radio" accessibilityLabel={opcion.texto} accessibilityState={{ selected: elegida }}
    >
      <View style={s.pista}>
        <Animated.View style={[s.placa, { height: opcion.alto, borderColor: conAlfa(opcion.color, 0.6) }, entrada]}>
          <Animated.View style={[s.relleno, { backgroundColor: opcion.color }, relleno]} />
        </Animated.View>
      </View>
      <Text style={[s.etiqueta, elegida && s.etiquetaElegida]} maxFontSizeMultiplier={1.2}>{opcion.texto}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  opcion: { flex: 1, alignItems: 'center', gap: 8 },
  pista: { height: 68, alignSelf: 'stretch', justifyContent: 'flex-end' },
  placa: {
    borderRadius: 6, borderWidth: 1.5, overflow: 'hidden', backgroundColor: paleta.gomaBorde, transformOrigin: 'bottom',
  },
  relleno: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transformOrigin: 'bottom' },
  etiqueta: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2, textAlign: 'center' },
  etiquetaElegida: { fontFamily: familia.enfasis, color: paleta.magnesia },
});
