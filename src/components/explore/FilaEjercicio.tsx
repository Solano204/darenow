import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, resorteTap } from '../../theme';
import { evidenciaDe, type Ejercicio } from '../../data/catalog';
import { textoDeEquipo, textoVisible } from '../../utils/presentacion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { FotoOscura } from '../ui/FotoOscura';
import { NivelPlacas } from '../ui/NivelPlacas';
import { EstrellaFavorito } from '../hoy/EstrellaFavorito';
import { contarVeredictos, resumenDeConteos } from '../exercise/MedidorEvidencia';
import { MiniMedidorEvidencia } from './MiniMedidorEvidencia';

const LADO_MINIATURA = 64;
const ESCALA_MINIATURA = 0.96;
const OPACIDAD_PRESIONADA = 0.6;
const PADDING_LATERAL = 12;
const SEPARACION = 12;
const LADO_ESTRELLA = 44;
const TAMANO_ESTRELLA = 22;
const TAMANO_ICONO_EQUIPO = 14;
const ALTO_NIVEL = 12;

/**
 * Fila del segmento Ejercicios, de 88 de alto como minimo: miniatura de 64 con la foto
 * tratada, nombre (2 lineas), equipo con su icono y el nivel en placas, y bajo ellos el
 * mini medidor de la evidencia. Termina en la estrella de favorito (44 de area, 22 de
 * glifo). El separador empieza despues de la miniatura. Al presionar, un fondo
 * `gomaAlta` al 60 % cubre la fila y la miniatura se hunde a 0.96.
 *
 * Memoizada: cada tecla en el buscador re-renderiza `Explorar` y sin esto React
 * reconciliaria las filas montadas aunque ninguna cambie. `onFav` y `onPress` toman el
 * id y llegan estables desde el padre.
 */
export const FilaEjercicio = React.memo(function FilaEjercicio({ e, favorito, onFav, onPress }: {
  e: Ejercicio;
  favorito: boolean;
  onFav: (id: string) => void;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const nombre = textoVisible(e.name);
  const equipo = textoDeEquipo(e.equipment);
  const sinEquipo = e.equipment.every(q => q === 'ninguno');
  const conteos = useMemo(() => contarVeredictos(evidenciaDe(e).mapa), [e]);
  const resumen = resumenDeConteos(conteos);

  const fondo = useAnimatedStyle(() => ({ opacity: OPACIDAD_PRESIONADA * presion.value }), [tick]);
  const miniatura = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 1 - (1 - ESCALA_MINIATURA) * presion.value }],
  }), [reducido, tick]);

  const etiqueta = `${nombre}. ${equipo}. Nivel ${e.level} de 3.${resumen ? ` Evidencia: ${resumen}.` : ''}`;

  return (
    <View style={s.fila}>
      <Pressable
        style={s.cuerpo}
        onPressIn={() => { presion.value = withSpring(1, resorteTap); }}
        onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
        onPress={() => onPress(e.id)}
        accessibilityRole="button" accessibilityLabel={etiqueta}
      >
        <Animated.View style={[s.fondo, fondo]} pointerEvents="none" />
        <Animated.View style={miniatura} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <FotoOscura tipo="ejercicio" id={e.id} ancho={LADO_MINIATURA} alto={LADO_MINIATURA} radioEsquina={16} velo={false} />
        </Animated.View>
        <View style={s.info} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={s.nombre} numberOfLines={2}>{nombre}</Text>
          <View style={s.segunda}>
            <Ionicons name={sinEquipo ? 'body-outline' : 'barbell-outline'} size={TAMANO_ICONO_EQUIPO} color={paleta.magnesia3} />
            <Text style={s.equipo} numberOfLines={1}>{equipo}</Text>
            <NivelPlacas nivel={e.level} alto={ALTO_NIVEL} />
            <Text style={s.nivel}>Nivel {e.level}</Text>
          </View>
          <MiniMedidorEvidencia conteos={conteos} />
        </View>
      </Pressable>
      <EstrellaFavorito
        activo={favorito} onPress={() => onFav(e.id)} nombre={nombre}
        lado={LADO_ESTRELLA} tamanoIcono={TAMANO_ESTRELLA} sinFondo contorno={paleta.magnesia3}
      />
      <View style={s.separador} pointerEvents="none" />
    </View>
  );
});

const s = StyleSheet.create({
  fila: {
    minHeight: 88, marginHorizontal: -PADDING_LATERAL, paddingHorizontal: PADDING_LATERAL,
    flexDirection: 'row', alignItems: 'center',
  },
  cuerpo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SEPARACION, paddingVertical: 12 },
  fondo: {
    position: 'absolute', top: 0, bottom: 0, left: -PADDING_LATERAL, right: 0, borderRadius: 16, backgroundColor: paleta.gomaAlta,
  },
  info: { flex: 1, gap: 4 },
  nombre: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 21, color: paleta.magnesia },
  segunda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  equipo: { flexShrink: 1, fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  nivel: { fontFamily: familia.medio, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  separador: {
    position: 'absolute', bottom: 0, left: PADDING_LATERAL + LADO_MINIATURA + SEPARACION, right: PADDING_LATERAL,
    height: 1, backgroundColor: paleta.gomaBorde,
  },
});
