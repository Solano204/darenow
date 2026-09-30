import React, { useEffect, useRef, useState } from 'react';
import { PixelRatio, Pressable, Platform, StyleSheet, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, tipo, radio, sombra, esp, degradado, ALTO_BOTON, resorteTap, dur, easing, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { useMagnesia } from '@/ui/fx/MagnesiaOverlay';

const ALTO_TEXTO = 22;
const ESCALA_MAX = 1.15;
const ESCALA_PRESIONADO = 0.03;
const PULSO_OCUPADO_MS = 900;
const LLENADO_MS = 320;
const BRILLO_MS = 600;
const ANCHO_BRILLO = 70;

export interface BotonPlacaProps {
  texto: string;
  onPress: () => void;
  deshabilitado?: boolean;
  ocupado?: boolean;
  /** Gerundio para cuando el movimiento reducido apaga el pulso y el texto es lo unico que dice "espera". */
  textoOcupado?: string;
  /** Dispara el aplauso de magnesia (nube, velo y haptica) al soltar, sin retrasar `onPress`. */
  aplauso?: boolean;
  /** Un unico barrido de luz en diagonal, con este retraso en ms. Sin el, no hay brillo. */
  brillo?: number;
  estilo?: StyleProp<ViewStyle>;
}

export function BotonPlaca({ texto, onPress, deshabilitado, ocupado, textoOcupado, aplauso, brillo, estilo }: BotonPlacaProps) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const magnesia = useMagnesia();
  const ref = useRef<View>(null);
  const centro = useRef<{ x: number; y: number } | null>(null);
  const presion = useSharedValue(0);
  const inactivo = !!deshabilitado || !!ocupado;
  const visible = ocupado && reducido ? (textoOcupado ?? texto) : texto;

  // Bloqueado se ve como una superficie vacia; al habilitarse el azul la llena de izquierda a derecha.
  const llenado = useSharedValue(deshabilitado ? 0 : 1);
  const previoDeshabilitado = useRef(!!deshabilitado);
  const [ancho, setAncho] = useState(0);
  const barrido = useSharedValue(0);
  const brilloHecho = useRef(false);

  useEffect(() => {
    const habilitando = previoDeshabilitado.current && !deshabilitado;
    previoDeshabilitado.current = !!deshabilitado;
    if (habilitando) haptico.toque();
    llenado.value = withTiming(deshabilitado ? 0 : 1, {
      duration: reducido ? 150 : LLENADO_MS,
      easing: deshabilitado ? easing.entrada : easing.salida,
    });
  }, [deshabilitado, reducido]);

  useEffect(() => {
    if (brillo === undefined || brilloHecho.current || ancho === 0 || reducido || deshabilitado) return;
    brilloHecho.current = true;
    barrido.value = withDelay(brillo, withTiming(1, { duration: BRILLO_MS, easing: easing.salida }));
  }, [brillo, ancho, reducido, deshabilitado]);

  const cuerpo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }],
  }));
  const marco = useAnimatedStyle(() => ({
    borderColor: interpolateColor(llenado.value, [0, 1], [paleta.gomaBorde, paleta.placaAzul]),
  }), [tick]);
  const relleno = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(presion.value, [0, 1], [paleta.placaAzul, paleta.placaAzulPresionado]),
    ...(reducido ? { opacity: llenado.value } : { transform: [{ scaleX: llenado.value }] }),
  }), [reducido, tick]);
  const luz = useAnimatedStyle(() => ({
    opacity: interpolate(barrido.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    transform: [{ translateX: -ANCHO_BRILLO + barrido.value * (ancho + ANCHO_BRILLO * 2) }, { rotate: '18deg' }],
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
      <Animated.View style={[s.sombra, Platform.OS === 'ios' && !deshabilitado && sombra.brasa, cuerpo]}>
        <Animated.View style={[s.cuerpo, marco]} onLayout={e => setAncho(e.nativeEvent.layout.width)}>
          <Animated.View style={[StyleSheet.absoluteFill, s.relleno, relleno]} />
          {brillo !== undefined && (
            <Animated.View pointerEvents="none" style={[s.luz, luz]}>
              <LinearGradient colors={degradado.brillo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          )}
          <TextoRueda texto={visible} ocupado={!!ocupado && !reducido} reducido={reducido} llenado={llenado} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Etiqueta con cambio vertical: la vieja sube y sale, la nueva entra desde
 * abajo. Con movimiento reducido solo hay fundido.
 */
function TextoRueda({ texto, ocupado, reducido, llenado }: {
  texto: string; ocupado: boolean; reducido: boolean; llenado: SharedValue<number>;
}) {
  const alto = Math.round(ALTO_TEXTO * Math.min(PixelRatio.getFontScale(), ESCALA_MAX));
  const tick = useTick();
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

  const distancia = reducido ? 0 : alto;
  const entrante = useAnimatedStyle(() => ({
    opacity: t.value * pulso.value,
    color: interpolateColor(llenado.value, [0, 1], [paleta.magnesia3Texto, paleta.blanco]),
    transform: [{ translateY: (1 - t.value) * distancia }],
  }), [distancia, tick]);
  const saliente = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    color: interpolateColor(llenado.value, [0, 1], [paleta.magnesia3Texto, paleta.blanco]),
    transform: [{ translateY: -t.value * distancia }],
  }), [distancia, tick]);

  return (
    <Animated.View style={[s.ventana, { height: alto }]}>
      <Animated.Text style={[s.texto, entrante]} numberOfLines={1} maxFontSizeMultiplier={ESCALA_MAX}>{actual}</Animated.Text>
      {previo !== null && (
        <Animated.Text style={[s.texto, s.encima, saliente]} numberOfLines={1} maxFontSizeMultiplier={ESCALA_MAX}>{previo}</Animated.Text>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  sombra: { borderRadius: radio.pastilla },
  cuerpo: {
    minHeight: ALTO_BOTON, borderRadius: radio.pastilla, paddingHorizontal: esp.lg + esp.sm,
    alignItems: 'center', justifyContent: 'center', backgroundColor: paleta.gomaAlta,
    borderWidth: 1, overflow: 'hidden',
  },
  relleno: { transformOrigin: 'left center' },
  luz: { position: 'absolute', top: -20, bottom: -20, left: 0, width: ANCHO_BRILLO },
  ventana: { justifyContent: 'center', overflow: 'hidden' },
  texto: { ...tipo.cuerpoEnfasis, color: paleta.blanco, textAlign: 'center' },
  encima: { position: 'absolute', left: 0, right: 0 },
});
