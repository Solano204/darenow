import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, resorteTap, resorteMagnesia, haptico } from '@/theme';
import { porId } from '@/data/catalog';
import { textoVisible } from '@/utils/presentacion';
import { plural } from '@/utils/plural';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { FotoOscura } from '@/components/ui/FotoOscura';
import { Entrada } from '@/components/fx/Entrada';
import { SANGRIA_RIEL } from './EncabezadoBloque';

/** Un ejercicio de una rutina con su prescripcion: series y repeticiones o segundos. */
export interface ItemVista {
  id: string;
  series: number;
  reps?: number;
  seg?: number;
  /** Solo las rutinas propias traen estos dos. */
  porLado?: boolean;
  descansoS?: number;
}

const ALTO_FILA_RUTINA = 80;
const LADO_MINIATURA = 56;
const ESCALA_MINIATURA = 0.96;
const OPACIDAD_PRESIONADA = 0.6;
/** Las primeras filas (las que se ven al abrir) entran escalonadas; las de mas abajo, no. */
const FILAS_CON_ENTRADA = 6;
const ESCALONADO_MS = 40;
const DESDE_EL_RIEL_PX = -8;

/** «3 series de 60 segundos, por lado, 45 segundos de descanso»: lo que oye el lector de pantalla. */
function frasePrescripcion(it: ItemVista): string {
  const medida = it.seg
    ? `${it.seg} ${plural(it.seg, 'segundo')}`
    : it.reps ? `${it.reps} ${plural(it.reps, 'repetición', 'repeticiones')}` : '';
  const base = `${it.series} ${plural(it.series, 'serie')}${medida ? ` de ${medida}` : ''}`;
  return `${base}${it.porLado ? ' por lado' : ''}${it.descansoS !== undefined ? `, ${it.descansoS} segundos de descanso` : ''}`;
}

/**
 * Fila de ejercicio, de 80 como minimo: miniatura de 56, nombre (2 lineas) y debajo la
 * prescripcion con los numeros en Big Shoulders 20 y el «×» y la unidad en Figtree 14 (se
 * separan solo al mostrarlos). Toda la fila abre la ficha. Al presionar, un fondo `gomaAlta`
 * al 60 % y la miniatura a 0.96. El separador empieza en la miniatura.
 */
export const FilaEjercicioRutina = React.memo(function FilaEjercicioRutina({ item, indice, ultima, onPress }: {
  item: ItemVista;
  indice: number;
  ultima?: boolean;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const fondo = useAnimatedStyle(() => ({ opacity: OPACIDAD_PRESIONADA * presion.value }), [tick]);
  const miniatura = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 1 - (1 - ESCALA_MINIATURA) * presion.value }],
  }), [reducido, tick]);

  const e = porId.get(item.id);
  if (!e) return null;
  const nombre = textoVisible(e.name);

  return (
    <Entrada
      activo animar={indice < FILAS_CON_ENTRADA} retraso={indice * ESCALONADO_MS} x={DESDE_EL_RIEL_PX} resorte={resorteMagnesia}
      estilo={s.caja}
    >
      <Pressable
        style={s.cuerpo}
        onPressIn={() => { presion.value = withSpring(1, resorteTap); haptico.toque(); }}
        onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
        onPress={() => onPress(item.id)}
        accessibilityRole="button" accessibilityLabel={`${nombre}, ${frasePrescripcion(item)}`}
      >
        <Animated.View style={[s.fondo, fondo]} pointerEvents="none" />
        <Animated.View style={miniatura} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <FotoOscura tipo="ejercicio" id={e.id} ancho={LADO_MINIATURA} alto={LADO_MINIATURA} radioEsquina={14} velo={false} />
        </Animated.View>
        <View style={s.info} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={s.nombre} numberOfLines={2}>{nombre}</Text>
          <Text style={s.prescripcion}>
            <Text style={s.numero}>{item.series}</Text>
            {item.seg || item.reps ? <Text style={s.unidad}> × </Text> : <Text style={s.unidad}> {plural(item.series, 'serie')}</Text>}
            {item.seg ? <Text style={s.numero}>{item.seg}</Text> : item.reps ? <Text style={s.numero}>{item.reps}</Text> : null}
            {item.seg ? <Text style={s.unidad}> s</Text> : null}
            {item.porLado ? <Text style={s.unidad}> por lado</Text> : null}
          </Text>
          {item.descansoS !== undefined ? <Text style={s.descanso}>{item.descansoS} s de descanso</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={paleta.magnesia3} />
      </Pressable>
      {!ultima && <View style={s.separador} pointerEvents="none" />}
    </Entrada>
  );
});

const s = StyleSheet.create({
  caja: { minHeight: ALTO_FILA_RUTINA, marginLeft: SANGRIA_RIEL },
  cuerpo: { minHeight: ALTO_FILA_RUTINA, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  fondo: {
    position: 'absolute', top: 0, bottom: 0, left: -6, right: -6, borderRadius: 16, backgroundColor: paleta.gomaAlta,
  },
  info: { flex: 1, gap: 2 },
  nombre: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 21, color: paleta.magnesia },
  prescripcion: { lineHeight: 26 },
  numero: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 26, color: paleta.magnesia },
  unidad: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 26, color: paleta.magnesia2 },
  descanso: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  separador: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: paleta.gomaBorde },
});
