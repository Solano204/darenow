import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, easing, resortePlaca, resorteTap, resorteMagnesia, MARGEN_PANTALLA } from '@/ui/theme';
import type { Musculo } from '@/data/catalog';
import type { Relacionado } from '@/features/musculos/utils/musculos';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Entrada } from '@/ui/fx/Entrada';
import { AccionSeccion } from '@/ui/components/AccionSeccion';
import { FichaRender } from '@/ui/components/FichaRender';
import { FichaMusculoNombre } from '@/ui/components/FichaMusculoNombre';
import { ConectorRelacion, ALTO_CONECTOR } from './ConectorRelacion';
import { lineasDeNombre } from '@/ui/components/disposicionCatalogo';

export type TipoRelacion = 'sinergico' | 'antagonista';

const LADO_FICHA = 104;
const LADO_MINI = 40;
const RADIO_MINI = 12;
const SEPARACION = 12;
const ESCALONADO_MS = 60;
/** De cuanto lejos llegan las fichas, a la derecha de su sitio. */
const DESDE_PX = 90;
/** Los antagonistas llegan este tanto mas cerca de lo que les toca y rebotan hacia atras. */
const REBOTE_PX = 12;
const LLEGADA_MS = 260;
const INCLINACION_GRADOS = -4;

/** Los dos iconos de flecha: `››` (misma direccion) o `›‹` (una contra otra), de 16 px. */
function IconoRelacion({ tipo }: { tipo: TipoRelacion }) {
  return (
    <View style={s.icono} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Ionicons name="chevron-forward" size={16} color={paleta.magnesia2} />
      <Ionicons name={tipo === 'sinergico' ? 'chevron-forward' : 'chevron-back'} size={16} color={paleta.magnesia2} style={s.segundo} />
    </View>
  );
}

/**
 * Una relacion del musculo: «Trabaja junto a» (sinergicos) o «Antagonistas». El encabezado lleva el
 * titulo en Big Shoulders 700 de 24 con su icono (`››` o `›‹`) y, a la derecha, «Todos» como texto
 * con un chevron (area de 44×44). Debajo, un carrusel con la mini ficha del musculo actual (40 px,
 * solo visual), el conector y las fichas de 104 con su nombre.
 *
 * Al entrar la seccion (`activo`, una vez), los sinergicos llegan deslizandose **hacia** la mini
 * ficha, escalonados 60 ms con `resortePlaca`, y se asientan pegados; el conector continuo se dibuja
 * de izquierda a derecha. Los antagonistas llegan un poco mas cerca de lo que les toca y **rebotan
 * hacia atras** 12 px antes de asentarse, la mini ficha se inclina −4° en ese instante y regresa, y
 * el conector discontinuo aparece con su tope. Sin haptica. Con movimiento reducido todo aparece
 * colocado. Las citas a musculos que no existen (BUG-13) salen sin accion.
 */
export function RelacionMuscular({ tipo, titulo, actual, items, activo, onTodos, onAbrir }: {
  tipo: TipoRelacion;
  titulo: string;
  actual: Musculo;
  items: Relacionado[];
  /** Verdadero cuando la seccion ya entro en pantalla. */
  activo: boolean;
  onTodos: () => void;
  onAbrir: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const inclinacion = useSharedValue(0);
  const lineas = Math.max(2, ...items.map(r => lineasDeNombre(r.nombre)));

  useEffect(() => {
    if (tipo !== 'antagonista' || reducido || !activo || items.length === 0) return;
    inclinacion.value = withDelay(LLEGADA_MS, withSequence(
      withTiming(INCLINACION_GRADOS, { duration: 80 }), withSpring(0, resorteTap),
    ));
  }, [activo, reducido]);

  const mini = useAnimatedStyle(() => ({ transform: [{ rotate: `${inclinacion.value}deg` }] }), [tick]);

  return (
    <View>
      <View style={s.encabezado}>
        <View
          style={s.tituloFila} accessible accessibilityRole="header"
          accessibilityLabel={`${titulo}: ${items.map(r => r.nombre).join(', ')}`}
        >
          <Text style={s.titulo} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{titulo}</Text>
          <IconoRelacion tipo={tipo} />
        </View>
        <AccionSeccion texto="Todos" onPress={onTodos} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.carrusel}>
        <Entrada activo={activo} animar={!reducido} escala={0.8} resorte={resorteMagnesia}>
          <Animated.View
            style={[s.mini, mini]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden pointerEvents="none"
          >
            <FichaRender id={actual.id} ancho={LADO_MINI} alto={LADO_MINI} radio={RADIO_MINI} activo={false} />
          </Animated.View>
        </Entrada>
        <View style={s.conector}><ConectorRelacion tipo={tipo} activo={activo} /></View>
        {items.map((r, i) => (
          <LlegaHaciaLaMini key={r.id} tipo={tipo} indice={i} activo={activo} reducido={reducido}>
            <FichaMusculoNombre
              id={r.id} nombre={r.nombre} lado={LADO_FICHA} lineas={lineas}
              onPress={r.musculo ? () => onAbrir(r.id) : undefined}
            />
          </LlegaHaciaLaMini>
        ))}
      </ScrollView>
    </View>
  );
}

/** Una ficha que llega desde la derecha hacia la mini ficha; los antagonistas se pasan de largo y rebotan. */
function LlegaHaciaLaMini({ tipo, indice, activo, reducido, children }: {
  tipo: TipoRelacion; indice: number; activo: boolean; reducido: boolean; children: React.ReactNode;
}) {
  const tick = useTick();
  const p = useSharedValue(reducido ? 1 : 0);

  useEffect(() => {
    if (reducido || !activo) return;
    const espera = indice * ESCALONADO_MS;
    p.value = tipo === 'sinergico'
      ? withDelay(espera, withSpring(1, resortePlaca))
      : withDelay(espera, withSequence(
        withTiming(1 + REBOTE_PX / DESDE_PX, { duration: LLEGADA_MS, easing: easing.salida }),
        withSpring(1, resortePlaca),
      ));
  }, [activo, reducido]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 3), transform: [{ translateX: (1 - p.value) * DESDE_PX }],
  }), [tick]);

  return <Animated.View style={[s.ficha, estilo]}>{children}</Animated.View>;
}

const s = StyleSheet.create({
  encabezado: {
    marginHorizontal: MARGEN_PANTALLA, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  tituloFila: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontFamily: familia.titulo, fontSize: 24, lineHeight: 28, color: paleta.magnesia },
  icono: { flexDirection: 'row', alignItems: 'center' },
  segundo: { marginLeft: -9 },
  carrusel: { paddingHorizontal: MARGEN_PANTALLA, alignItems: 'flex-start', overflow: 'visible' },
  mini: { marginTop: (LADO_FICHA - LADO_MINI) / 2 },
  conector: { marginTop: (LADO_FICHA - ALTO_CONECTOR) / 2, marginHorizontal: 4 },
  ficha: { marginRight: SEPARACION },
});
