import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { paleta, radio, tipo, familia, easing, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const TACHADO_MS = 300;
const PAUSA_SELLO_MS = 80;
const IMPACTO_MS = 130;
const ROTACION_SELLO = -6;
const ROTACION_INICIAL = -16;
const ESCALA_SELLO = 1.7;
const GROSOR_TACHON = 2;

export interface Linea { x: number; y: number; width: number; height: number }

/**
 * La afirmacion falsa se tacha con una linea roja de izquierda a derecha
 * (300 ms) y despues cae el sello «Mito», girado -6 grados. Con movimiento
 * reducido aparece ya tachada y sellada.
 */
export function TachadoMito({ texto, activo, animar = true, retraso = 0 }: {
  texto: string;
  activo: boolean;
  animar?: boolean;
  retraso?: number;
}) {
  const reducido = useReducedMotion();
  const estatico = reducido || !animar;
  const [lineas, setLineas] = useState<Linea[]>([]);

  return (
    <View style={s.caja} accessible accessibilityLabel={`${texto}. Mito`}>
      <View style={s.texto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text
          style={s.afirmacion}
          onTextLayout={e => setLineas(e.nativeEvent.lines.map(l => ({ x: l.x, y: l.y, width: l.width, height: l.height })))}
        >
          {texto}
        </Text>
        {lineas.map((l, n) => (
          <Tachon
            key={n} linea={l} activo={activo} estatico={estatico}
            duracion={TACHADO_MS / lineas.length}
            espera={retraso + (n * TACHADO_MS) / lineas.length}
          />
        ))}
      </View>
      <Sello activo={activo} estatico={estatico} espera={retraso + TACHADO_MS + PAUSA_SELLO_MS} />
    </View>
  );
}

export function Tachon({ linea, activo, estatico, duracion, espera }: {
  linea: Linea; activo: boolean; estatico: boolean; duracion: number; espera: number;
}) {
  const t = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { t.value = 1; return; }
    if (!activo) { t.value = 0; return; }
    t.value = withDelay(espera, withTiming(1, { duration: duracion, easing: easing.salida }));
    return () => cancelAnimation(t);
  }, [estatico, activo]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ scaleX: t.value }] }));

  return (
    <Animated.View
      style={[
        s.tachon,
        { left: linea.x, top: linea.y + linea.height / 2 - GROSOR_TACHON / 2, width: linea.width },
        estilo,
      ]}
    />
  );
}

function Sello({ activo, estatico, espera }: { activo: boolean; estatico: boolean; espera: number }) {
  const t = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { t.value = 1; return; }
    if (!activo) { t.value = 0; return; }
    t.value = withDelay(espera, withSpring(1, resortePlaca));
    const golpe = setTimeout(haptico.sello, espera + IMPACTO_MS);
    return () => { clearTimeout(golpe); cancelAnimation(t); };
  }, [estatico, activo]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [
      { scale: ESCALA_SELLO - (ESCALA_SELLO - 1) * t.value },
      { rotate: `${ROTACION_SELLO + (ROTACION_INICIAL - ROTACION_SELLO) * (1 - t.value)}deg` },
    ],
  }));

  return (
    <Animated.View style={[s.sello, estilo]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Text style={s.selloTexto}>Mito</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  caja: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: paleta.gomaAlta,
    borderWidth: 1, borderColor: paleta.gomaBorde, borderRadius: radio.nota,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  texto: { flex: 1, marginRight: 12 },
  afirmacion: { ...tipo.etiqueta, fontSize: 14, lineHeight: 20, color: paleta.magnesia },
  tachon: { position: 'absolute', height: GROSOR_TACHON, backgroundColor: paleta.placaRoja, transformOrigin: 'left center' },
  sello: {
    borderWidth: 2, borderColor: paleta.placaRoja, borderRadius: 6,
    paddingVertical: 2, paddingHorizontal: 8,
  },
  selloTexto: { fontFamily: familia.display, fontSize: 22, lineHeight: 24, color: paleta.placaRojaTexto },
});
