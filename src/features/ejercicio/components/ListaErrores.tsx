import React, { useEffect, useEffectEvent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { paleta, familia, easing } from '@/ui/theme';
import { textoVisible } from '@/lib/presentacion';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const LADO_ICONO = 18;
const LARGO_TRAZO = 18;
const GROSOR_TRAZO = 2.4;
const TRAZO_MS = 140;
const ESCALONADO_MS = 80;

/**
 * Los errores comunes, con la misma estructura que las claves pero con una X roja
 * (`placaRoja`) de 18 px: el rojo significa «esto no», igual que «Mito». Cada X se
 * dibuja en dos trazos, escalonada 80 ms, una sola vez cuando `activo`. Sin haptica.
 */
export function ListaErrores({ errores, activo }: { errores: string[]; activo: boolean }) {
  return (
    <View>
      {errores.map((e, i) => <FilaError key={i} texto={textoVisible(e)} retraso={i * ESCALONADO_MS} activo={activo} />)}
    </View>
  );
}

function FilaError({ texto, retraso, activo }: { texto: string; retraso: number; activo: boolean }) {
  return (
    <View style={s.fila} accessible accessibilityLabel={`Error: ${texto}`}>
      <View style={s.icono} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Trazo grados={45} retraso={retraso} activo={activo} />
        <Trazo grados={-45} retraso={retraso + TRAZO_MS} activo={activo} />
      </View>
      <Text style={s.texto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{texto}</Text>
    </View>
  );
}

/** Un trazo de la X: una barra que crece desde su centro. */
function Trazo({ grados, retraso, activo }: { grados: number; retraso: number; activo: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(reducido ? 1 : 0);

  const alCambiarActivo = useEffectEvent(() => {
    if (reducido) { t.set(1); return; }
    if (!activo) return;
    t.set(withDelay(retraso, withTiming(1, { duration: TRAZO_MS, easing: easing.salida })));
    return () => cancelAnimation(t);
  });
  useEffect(() => alCambiarActivo(), [activo, reducido]);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ rotate: `${grados}deg` }, { scaleX: t.value }],
  }), [tick]);

  return <Animated.View style={[s.trazo, estilo]} />;
}

const s = StyleSheet.create({
  fila: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  icono: { width: LADO_ICONO, height: LADO_ICONO, alignItems: 'center', justifyContent: 'center' },
  trazo: {
    position: 'absolute', width: LARGO_TRAZO, height: GROSOR_TRAZO, borderRadius: GROSOR_TRAZO / 2,
    backgroundColor: paleta.placaRoja,
  },
  texto: { flex: 1, fontFamily: familia.medio, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
});
