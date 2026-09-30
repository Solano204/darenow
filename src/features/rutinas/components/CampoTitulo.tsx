import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { paleta, familia, easing, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const MAX_NOMBRE = 48;
const PLACEHOLDER = 'Nombre de la rutina';
const LINEA_MS = 200;
const FUNDIDO_REDUCIDO_MS = 150;
const PARPADEO_MS = 600;
const AMPLITUD_SACUDIDA = 6;
const TAMANO = 36;
const INTERLINEA = 40;
const MIN_ESCALA = 0.001;

/**
 * El nombre de la rutina como titulo: sin caja, Big Shoulders 36 y hasta dos lineas,
 * con el mismo limite de caracteres de siempre. Debajo, una linea de 1 px que al enfocar
 * se dibuja de izquierda a derecha en azul de accion (200 ms). Vacio y sin foco, un guion
 * bajo parpadea tras el placeholder para invitar a escribir; con movimiento reducido no
 * parpadea y la linea aparece con un fundido.
 *
 * El placeholder lo dibujamos nosotros (el nativo no admite el guion): el campo lleva el
 * suyo transparente para que el lector de pantalla lo siga anunciando.
 */
export function CampoTitulo({ valor, onCambio }: { valor: string; onCambio: (texto: string) => void }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [enfocado, setEnfocado] = useState(false);
  const linea = useSharedValue(0);
  const guion = useSharedValue(1);
  const vacio = valor.length === 0;
  const invitando = vacio && !enfocado;

  useEffect(() => {
    linea.set(withTiming(enfocado ? 1 : 0, { duration: reducido ? FUNDIDO_REDUCIDO_MS : LINEA_MS, easing: easing.salida }));
  }, [enfocado, reducido]);

  useEffect(() => {
    cancelAnimation(guion);
    if (!invitando || reducido) { guion.set(0); return; }
    guion.set(1);
    guion.set(withRepeat(
      withSequence(withTiming(0.15, { duration: PARPADEO_MS }), withTiming(1, { duration: PARPADEO_MS })), -1,
    ));
    return () => cancelAnimation(guion);
  }, [invitando, reducido]);

  const estiloLinea = useAnimatedStyle(() => (
    reducido ? { opacity: linea.value } : { transform: [{ scaleX: Math.max(linea.value, MIN_ESCALA) }] }
  ), [reducido, tick]);
  const estiloGuion = useAnimatedStyle(() => ({ opacity: guion.value }), [tick]);

  return (
    <View style={s.caja}>
      <TextInput
        value={valor}
        onChangeText={t => onCambio(t.replace(/\n/g, ''))}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        placeholder={PLACEHOLDER} placeholderTextColor="transparent"
        multiline submitBehavior="blurAndSubmit" returnKeyType="done" maxLength={MAX_NOMBRE}
        keyboardAppearance="dark" selectionColor={paleta.placaAzul} cursorColor={paleta.placaAzul}
        maxFontSizeMultiplier={1.1} accessibilityLabel={PLACEHOLDER}
        style={s.entrada}
      />
      {vacio && (
        <View style={s.marcador} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={s.texto} maxFontSizeMultiplier={1.1}>{PLACEHOLDER}</Text>
          <Animated.Text style={[s.texto, estiloGuion]} maxFontSizeMultiplier={1.1}>_</Animated.Text>
        </View>
      )}
      <View style={s.linea}>
        <Animated.View style={[s.lineaFoco, estiloLinea]} />
      </View>
    </View>
  );
}

/**
 * Error de un campo: Figtree 13 en rojo legible, una sacudida de 6 px (2 ciclos, 240 ms)
 * y haptica de error, como el de Google en el acceso. Se vuelve a sacudir si se monta de
 * nuevo: quien lo usa le cambia la `key` en cada intento.
 */
export function TextoError({ texto }: { texto: string }) {
  const reducido = useReducedMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    haptico.error();
    if (reducido) return;
    x.set(withSequence(
      withTiming(AMPLITUD_SACUDIDA, { duration: 40 }), withTiming(-AMPLITUD_SACUDIDA, { duration: 80 }),
      withTiming(AMPLITUD_SACUDIDA, { duration: 80 }), withTiming(0, { duration: 40 }),
    ));
  }, [texto]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.Text style={[s.error, estilo]} accessibilityRole="alert" accessibilityLiveRegion="polite">{texto}</Animated.Text>
  );
}

const s = StyleSheet.create({
  caja: { position: 'relative' },
  entrada: {
    minHeight: INTERLINEA, maxHeight: INTERLINEA * 2, padding: 0, textAlignVertical: 'top', includeFontPadding: false,
    fontFamily: familia.display, fontSize: TAMANO, lineHeight: INTERLINEA, letterSpacing: -0.5, color: paleta.magnesia,
  },
  marcador: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row' },
  texto: {
    fontFamily: familia.display, fontSize: TAMANO, lineHeight: INTERLINEA, letterSpacing: -0.5, color: paleta.magnesia3,
  },
  linea: { height: 1, marginTop: 8, backgroundColor: paleta.gomaBorde },
  lineaFoco: {
    position: 'absolute', left: 0, right: 0, bottom: -0.5, height: 2, backgroundColor: paleta.placaAzul,
    transformOrigin: 'left center',
  },
  error: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.placaRojaTexto, marginTop: 8 },
});
