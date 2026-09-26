import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { paleta, tipo, MARGEN_PANTALLA, resortePlaca } from '../../theme';
import type { Programa } from '../../data/catalog';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { Presionable } from '../ui/Presionable';
import { FotoOscura } from '../ui/FotoOscura';

const ESCALONADO_SEGMENTO_MS = 35;
const LADO_FOTO = 88;

/**
 * «Tu programa»: la foto, el nombre y una barra con un segmento por semana; las
 * semanas hechas y la actual se llenan de izquierda a derecha cuando el bloque
 * entra en pantalla. Toda la tarjeta lleva al programa, como antes.
 */
export function TuPrograma({ programa, semanaActual, activo, onPress }: {
  programa: Programa;
  semanaActual: number;
  activo: boolean;
  onPress: () => void;
}) {
  const total = Math.max(1, programa.semanas);
  const actual = Math.min(Math.max(semanaActual, 0), total);
  return (
    <View style={s.raiz}>
      <Presionable
        onPress={onPress}
        etiqueta={`${programa.name}. Semana ${actual} de ${total}`}
        rol="link"
        estilo={s.caja}
      >
        <View style={s.fila}>
          <FotoOscura tipo="programa" id={programa.id} ancho={LADO_FOTO} alto={LADO_FOTO} radioEsquina={16} velo={false} />
          <View style={s.textos}>
            <Text style={s.nombre} numberOfLines={2}>{programa.name}</Text>
            <Text style={s.descripcion} numberOfLines={2}>{programa.desc}</Text>
          </View>
        </View>
        <View style={s.barra} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {Array.from({ length: total }, (_, i) => (
            <Segmento key={i} lleno={i < actual} actual={i === actual - 1} activo={activo} retraso={i * ESCALONADO_SEGMENTO_MS} />
          ))}
        </View>
        <Text style={s.semana}>Semana {actual} de {total}</Text>
      </Presionable>
    </View>
  );
}

function Segmento({ lleno, actual, activo, retraso }: { lleno: boolean; actual: boolean; activo: boolean; retraso: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(reducido ? 1 : 0);

  useEffect(() => {
    if (reducido) { t.value = 1; return; }
    if (!activo) return;
    t.value = withDelay(retraso, withSpring(1, { ...resortePlaca, overshootClamping: true }));
    return () => cancelAnimation(t);
  }, [activo, reducido]);

  const relleno = useAnimatedStyle(() => ({ transform: [{ scaleX: t.value }] }), [tick]);
  return (
    <View style={s.pista}>
      {lleno && (
        <Animated.View
          style={[s.relleno, { backgroundColor: actual ? paleta.magnesia : paleta.magnesia3 }, relleno]}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  caja: {
    padding: 12, borderRadius: 24, gap: 12,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textos: { flex: 1, gap: 2 },
  nombre: { ...tipo.h3, color: paleta.magnesia },
  descripcion: { ...tipo.pie, color: paleta.magnesia2 },
  barra: { flexDirection: 'row', gap: 2 },
  pista: { flex: 1, height: 6, borderRadius: 3, backgroundColor: paleta.gomaBorde, overflow: 'hidden' },
  relleno: { flex: 1, transformOrigin: 'left' },
  semana: { ...tipo.etiqueta, color: paleta.magnesia2 },
});
