import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, familia, resortePlaca } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { ContadorPlacas } from '@/ui/components/ContadorPlacas';

const MIN_CM = 120;
const MAX_CM = 220;
const PX_POR_CM = 8;
const ALTO_REGLA = 48;
const ALTO_MARCA = 10;
const ALTO_MARCA_DECENA = 20;
const ANCHO_NUMERO = 32;
const ALTO_AGUJA = 30;

/**
 * La estatura como los demas contadores (numero que rueda y botones − y +, mismos limites y mismo consentimiento) con
 * una regla decorativa debajo: una marca por centimetro, mas alta cada 10 con su numero, que se desplaza con
 * `resortePlaca` para dejar el valor actual bajo una aguja `magnesia`. Es solo visual: el valor se cambia con − y +.
 */
export function ContadorEstatura({ valor, onCambio }: { valor: number; onCambio: (cm: number) => void }) {
  return (
    <View style={s.raiz}>
      <ContadorPlacas compacto estilo={s.contador} valor={valor} min={MIN_CM} max={MAX_CM} sufijo="cm" onCambio={onCambio} />
      <Regla valor={valor} />
    </View>
  );
}

function Regla({ valor }: { valor: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [ancho, setAncho] = useState(0);
  const colocada = useRef(false);
  const x = useSharedValue(0);
  const objetivo = ancho / 2 - (valor - MIN_CM) * PX_POR_CM;

  useEffect(() => {
    if (ancho === 0) return;
    if (!colocada.current || reducido) { x.set(objetivo); colocada.current = true; return; }
    x.set(withSpring(objetivo, resortePlaca));
  }, [objetivo, ancho, reducido, x]);

  const pista = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }), [tick]);

  const marcas = useMemo(() => Array.from({ length: MAX_CM - MIN_CM + 1 }, (_, i) => {
    const cm = MIN_CM + i;
    const decena = cm % 10 === 0;
    return (
      <React.Fragment key={cm}>
        <View style={[s.marca, { left: i * PX_POR_CM, height: decena ? ALTO_MARCA_DECENA : ALTO_MARCA }]} />
        {decena && <Text style={[s.numero, { left: i * PX_POR_CM - ANCHO_NUMERO / 2 }]}>{cm}</Text>}
      </React.Fragment>
    );
  }), []);

  return (
    <View
      style={s.regla} onLayout={e => setAncho(e.nativeEvent.layout.width)} pointerEvents="none"
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[s.pista, pista]}>{marcas}</Animated.View>
      <View style={[s.aguja, { left: ancho / 2 - 1 }]} />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { alignSelf: 'stretch', gap: 16 },
  contador: { flex: 0 },
  regla: { height: ALTO_REGLA, overflow: 'hidden' },
  pista: { position: 'absolute', top: 0, left: 0, height: ALTO_REGLA, width: (MAX_CM - MIN_CM) * PX_POR_CM + 1 },
  marca: { position: 'absolute', top: 0, width: 1, backgroundColor: paleta.gomaBorde },
  numero: {
    position: 'absolute', top: ALTO_MARCA_DECENA + 4, width: ANCHO_NUMERO, textAlign: 'center',
    fontFamily: familia.cuerpo, fontSize: 11, lineHeight: 16, color: paleta.magnesia3Texto,
  },
  aguja: { position: 'absolute', top: 0, width: 2, height: ALTO_AGUJA, borderRadius: 1, backgroundColor: paleta.magnesia },
});
