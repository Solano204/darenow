import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { paleta, tipo, conAlfa, MARGEN_PANTALLA, resorteTap } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Odometro } from '@/ui/fx/Odometro';

const ESCALA_PULSO = 1.06;
const ESTILO_TOTAL = { ...tipo.numero, fontSize: 44, lineHeight: 46, color: paleta.magnesia };

/**
 * Los minutos totales de la rutina. Va como cabecera pegajosa del scroll: se
 * queda arriba (`goma` al 92 % con borde inferior). Cada vez que un ajuste
 * cambia el total, el numero rueda y hace un pulso de escala 1.06.
 */
export function TotalPegajoso({ minutos }: { minutos: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const pulso = useSharedValue(1);
  const previo = useRef(minutos);

  useEffect(() => {
    if (previo.current === minutos) return;
    previo.current = minutos;
    if (reducido) return;
    pulso.value = withSequence(withTiming(ESCALA_PULSO, { duration: 80 }), withSpring(1, resorteTap));
  }, [minutos, reducido]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: pulso.value }] }), [tick]);

  return (
    <View style={s.barra} accessible accessibilityLabel={`${minutos} minutos en total`}>
      <View style={s.fila} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Animated.View style={[s.numero, estilo]}>
          <Odometro valor={minutos} continuo estilo={ESTILO_TOTAL} />
        </Animated.View>
        <Text style={s.unidad}>min en total</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  barra: {
    paddingHorizontal: MARGEN_PANTALLA, paddingVertical: 8,
    backgroundColor: conAlfa(paleta.goma, 0.92), borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde,
  },
  fila: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  numero: { transformOrigin: 'left bottom' },
  unidad: { ...tipo.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
});
