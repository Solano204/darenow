import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { paleta, tipo, MARGEN_PANTALLA, resortePlaca } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { TarjetaGoma } from '../ui/TarjetaGoma';
import { NotaEntrenador } from '../ui/NotaEntrenador';
import { Odometro } from '../fx/Odometro';

const INICIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const ALTO_MAX_BARRA = 64;
const ANCHO_BARRA = 14;
const MIN_REFERENCIA = 30;
const ESCALONADO_BARRA_MS = 60;
const ESTILO_RACHA = { ...tipo.numero, fontSize: 72, lineHeight: 72, color: paleta.magnesia };

/**
 * «Tu semana»: la racha en un numero enorme que rueda y, al lado, los minutos de
 * los ultimos siete dias como siete barras que se llenan. Si la racha esta en
 * pausa, la nota de siempre. `activo` arranca las animaciones cuando el bloque
 * entra en pantalla.
 */
export function TuSemana({ dias, enPausa, semana, activo }: {
  dias: number;
  enPausa: boolean;
  semana: { fecha: string; min: number }[];
  activo: boolean;
}) {
  const etiqueta = dias === 1 ? 'Día seguido' : 'Días seguidos';
  return (
    <View style={s.raiz}>
      <TarjetaGoma relleno={20}>
        <View style={s.fila}>
          <View style={s.racha} accessible accessibilityLabel={`${dias} ${etiqueta.toLowerCase()}`}>
            <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Odometro valor={dias} continuo activo={activo} estilo={ESTILO_RACHA} />
            </View>
            <Text style={s.etiqueta}>{etiqueta}</Text>
          </View>
          <SieteDias semana={semana} activo={activo} />
        </View>
        {enPausa && (
          <NotaEntrenador estilo={s.nota}>
            Tu racha está en pausa, no perdida. Entrena hoy y sigue desde donde estaba.
          </NotaEntrenador>
        )}
      </TarjetaGoma>
    </View>
  );
}

function SieteDias({ semana, activo }: { semana: { fecha: string; min: number }[]; activo: boolean }) {
  const max = Math.max(MIN_REFERENCIA, ...semana.map(d => d.min));
  return (
    <View
      style={s.siete} accessible
      accessibilityLabel={`Minutos de los últimos siete días: ${semana.map(d => d.min).join(', ')}`}
    >
      {semana.map((d, i) => (
        <BarraDia
          key={d.fecha} min={d.min} alto={Math.max(6, (d.min / max) * ALTO_MAX_BARRA)}
          inicial={INICIALES[new Date(d.fecha + 'T00:00:00').getDay()]} activo={activo} retraso={i * ESCALONADO_BARRA_MS}
        />
      ))}
    </View>
  );
}

function BarraDia({ min, alto, inicial, activo, retraso }: {
  min: number; alto: number; inicial: string; activo: boolean; retraso: number;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(reducido ? 1 : 0);

  useEffect(() => {
    if (reducido) { t.value = 1; return; }
    if (!activo) return;
    t.value = withDelay(retraso, withSpring(1, { ...resortePlaca, overshootClamping: true }));
    return () => cancelAnimation(t);
  }, [activo, reducido]);

  const relleno = useAnimatedStyle(() => ({ transform: [{ scaleY: t.value }] }), [tick]);
  return (
    <View style={s.dia} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={s.pista}>
        <Animated.View style={[s.barra, { height: alto, backgroundColor: min > 0 ? paleta.magnesia : paleta.gomaBorde }, relleno]} />
      </View>
      <Text style={s.inicial}>{inicial}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  fila: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  racha: { minWidth: 96 },
  etiqueta: { ...tipo.etiqueta, color: paleta.magnesia2 },
  siete: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  dia: { alignItems: 'center', gap: 6 },
  pista: { width: ANCHO_BARRA, height: ALTO_MAX_BARRA, justifyContent: 'flex-end' },
  barra: { width: ANCHO_BARRA, borderRadius: 4, transformOrigin: 'bottom' },
  inicial: { ...tipo.etiqueta, fontSize: 12, color: paleta.magnesia3Texto },
  nota: { alignSelf: 'stretch', marginTop: 16 },
});
