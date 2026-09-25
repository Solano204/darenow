import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Platform, StyleSheet, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { paleta, tipo, radio, sombra, esp, ALTO_BOTON, resorteTap, dur, easing, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useMagnesia } from '../fx/MagnesiaOverlay';

const ALTO_TEXTO = 22;
const ESCALA_PRESIONADO = 0.03;
const PULSO_OCUPADO_MS = 900;

export interface BotonPlacaProps {
  texto: string;
  onPress: () => void;
  deshabilitado?: boolean;
  ocupado?: boolean;
  /** Gerundio para cuando el movimiento reducido apaga el pulso y el texto es lo unico que dice "espera". */
  textoOcupado?: string;
  /** Dispara el aplauso de magnesia (nube, velo y haptica) al soltar, sin retrasar `onPress`. */
  aplauso?: boolean;
  estilo?: StyleProp<ViewStyle>;
}

export function BotonPlaca({ texto, onPress, deshabilitado, ocupado, textoOcupado, aplauso, estilo }: BotonPlacaProps) {
  const reducido = useReducedMotion();
  const magnesia = useMagnesia();
  const ref = useRef<View>(null);
  const centro = useRef<{ x: number; y: number } | null>(null);
  const presion = useSharedValue(0);
  const inactivo = !!deshabilitado || !!ocupado;
  const visible = ocupado && reducido ? (textoOcupado ?? texto) : texto;

  const cuerpo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }],
    backgroundColor: interpolateColor(presion.value, [0, 1], [paleta.placaAzul, paleta.placaAzulPresionado]),
  }));

  return (
    <Pressable
      ref={ref}
      onPressIn={() => {
        if (inactivo) return;
        presion.value = withSpring(1, resorteTap);
        haptico.toque();
        if (aplauso) ref.current?.measureInWindow((x, y, w, h) => { centro.current = { x: x + w / 2, y: y + h / 2 }; });
      }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={inactivo ? undefined : e => {
        if (aplauso) {
          const c = centro.current ?? { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
          haptico.aplauso();
          magnesia.aplaudir(c.x, c.y);
        }
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={visible}
      accessibilityState={{ disabled: !!deshabilitado, busy: !!ocupado }}
      style={estilo}
    >
      <Animated.View style={[s.cuerpo, Platform.OS === 'ios' && sombra.brasa, deshabilitado && s.apagado, cuerpo]}>
        <TextoRueda texto={visible} ocupado={!!ocupado && !reducido} reducido={reducido} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Etiqueta con cambio vertical: la vieja sube y sale, la nueva entra desde
 * abajo. Con movimiento reducido solo hay fundido.
 */
function TextoRueda({ texto, ocupado, reducido }: { texto: string; ocupado: boolean; reducido: boolean }) {
  const [actual, setActual] = useState(texto);
  const [previo, setPrevio] = useState<string | null>(null);
  const t = useSharedValue(1);
  const pulso = useSharedValue(1);
  const anterior = useRef(texto);

  useEffect(() => {
    if (texto === anterior.current) return;
    setPrevio(anterior.current);
    setActual(texto);
    anterior.current = texto;
    t.value = 0;
    t.value = withTiming(1, { duration: reducido ? 150 : dur.medio, easing: easing.salida }, fin => {
      if (fin) runOnJS(setPrevio)(null);
    });
  }, [texto, reducido]);

  useEffect(() => {
    if (!ocupado) { cancelAnimation(pulso); pulso.value = withTiming(1, { duration: dur.rapido }); return; }
    pulso.value = withRepeat(
      withSequence(withTiming(0.55, { duration: PULSO_OCUPADO_MS / 2 }), withTiming(1, { duration: PULSO_OCUPADO_MS / 2 })),
      -1,
    );
    return () => cancelAnimation(pulso);
  }, [ocupado]);

  const distancia = reducido ? 0 : ALTO_TEXTO;
  const entrante = useAnimatedStyle(() => ({
    opacity: t.value * pulso.value,
    transform: [{ translateY: (1 - t.value) * distancia }],
  }));
  const saliente = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateY: -t.value * distancia }],
  }));

  return (
    <Animated.View style={s.ventana}>
      <Animated.Text style={[s.texto, entrante]} numberOfLines={1}>{actual}</Animated.Text>
      {previo !== null && (
        <Animated.Text style={[s.texto, s.encima, saliente]} numberOfLines={1}>{previo}</Animated.Text>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  cuerpo: {
    minHeight: ALTO_BOTON, borderRadius: radio.pastilla, paddingHorizontal: esp.lg + esp.sm,
    alignItems: 'center', justifyContent: 'center', backgroundColor: paleta.placaAzul,
  },
  apagado: { opacity: 0.35 },
  ventana: { height: ALTO_TEXTO, justifyContent: 'center', overflow: 'hidden' },
  texto: { ...tipo.cuerpoEnfasis, color: paleta.blanco, textAlign: 'center' },
  encima: { position: 'absolute', left: 0, right: 0 },
});
