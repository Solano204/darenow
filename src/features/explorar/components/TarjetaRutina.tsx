import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation, interpolate, measure, useAnimatedRef, useAnimatedStyle, useSharedValue, type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia } from '@/ui/theme';
import { nombreGoal, type Rutina } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Tocable } from '@/ui/components/Tocable';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { NivelPlacas } from '@/ui/components/NivelPlacas';
import { InsigniaFoto, EtiquetaFoto } from '@/ui/components/InsigniaFoto';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';
import { EstrellaFavorito } from '@/ui/components/EstrellaFavorito';

const ALTO_FOTO_TARJETA = 180;
const ZOOM_PRESIONADO = 0.04;
const ESCALA_PRESIONADA = 0.02;
const ALTO_NIVEL = 12;
/** Cuanto se desplaza la foto dentro de su marco mientras la tarjeta cruza la pantalla. */
const PARALLAX_PX: number = 12;
/** La foto crece lo justo para que ese desplazamiento nunca deje un borde a la vista. */
const ESCALA_PARALLAX = 1 + (2 * PARALLAX_PX) / ALTO_FOTO_TARJETA;

/**
 * Tarjeta de rutina del catalogo, a lo ancho: foto de 180 con el degradado hacia
 * `gomaAlta` en el 25 % de abajo, la duracion una sola vez (pastilla abajo a la
 * izquierda), «Silenciosa» arriba a la izquierda si lo es y la estrella de favorito
 * arriba a la derecha. Debajo, el titulo (2 lineas) y una linea con el objetivo y su
 * icono a la izquierda y el nivel en placas a la derecha. Al presionar se hunde un 2 %,
 * la foto hace zoom a 1.04 y da un toque suave.
 *
 * Parallax: con el scroll (`scrollY`) la foto se desplaza hasta 12 px dentro de su marco
 * segun donde este la tarjeta en pantalla (se mide en el hilo de UI, sin pasar por React).
 * Si en un Android de gama media no sostiene 60 fps, se apaga con `PARALLAX_PX` en 0.
 */
export function TarjetaRutina({ r, favorito, scrollY, onPress, onFavorito }: {
  r: Rutina;
  favorito: boolean;
  scrollY: SharedValue<number>;
  onPress: () => void;
  onFavorito: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { height: pantalla } = useWindowDimensions();
  const marco = useAnimatedRef<Animated.View>();
  const presion = useSharedValue(0);
  const nombre = nombreVisible(r.name);
  const objetivo = nombreGoal(r.goal);
  const etiqueta = `${nombre}, ${r.min} minutos, ${objetivo}, nivel ${r.level} de 3${r.modo_sin_saltos ? ', silenciosa' : ''}`;

  const foto = useAnimatedStyle(() => {
    const zoom = reducido ? 1 : 1 + ZOOM_PRESIONADO * presion.value;
    // Leer `scrollY` es lo que vuelve a calcular este estilo en cada fotograma del scroll.
    const caja = reducido || PARALLAX_PX === 0 || !Number.isFinite(scrollY.value) ? null : measure(marco);
    if (!caja) return { transform: [{ scale: zoom }] };
    const centro = caja.pageY + caja.height / 2;
    const desplazamiento = interpolate(
      centro, [-caja.height / 2, pantalla + caja.height / 2], [PARALLAX_PX, -PARALLAX_PX], Extrapolation.CLAMP,
    );
    return { transform: [{ translateY: desplazamiento }, { scale: zoom * ESCALA_PARALLAX }] };
  }, [reducido, pantalla, tick]);

  return (
    <View style={s.caja}>
      <Tocable onPress={onPress} etiqueta={etiqueta} presion={presion} escala={ESCALA_PRESIONADA} estilo={s.tarjeta}>
        <Animated.View ref={marco} collapsable={false}>
          <FotoOscura
            tipo="rutina" id={r.id} ancho="100%" alto={ALTO_FOTO_TARJETA} radioEsquina={0}
            alturaVelo="25%" fondoVelo={paleta.gomaAlta} estiloImagen={foto}
          />
          <View style={s.duracion}><InsigniaFoto numero={r.min} unidad="min" /></View>
          {r.modo_sin_saltos && <View style={s.silenciosa}><EtiquetaFoto icono="volume-mute-outline" texto="Silenciosa" /></View>}
        </Animated.View>
        <View style={s.cuerpo}>
          <Text style={s.titulo} numberOfLines={2}>{nombre}</Text>
          <View style={s.meta}>
            <View style={s.objetivo}>
              <Ionicons name={ICONOS_OBJETIVO[r.goal] ?? 'flag-outline'} size={14} color={paleta.magnesia2} />
              <Text style={s.metaTexto} numberOfLines={1}>{objetivo}</Text>
            </View>
            <View style={s.nivel}>
              <NivelPlacas nivel={r.level} alto={ALTO_NIVEL} />
              <Text style={s.metaTexto}>Nivel {r.level}</Text>
            </View>
          </View>
        </View>
      </Tocable>
      <View style={s.estrella}>
        <EstrellaFavorito activo={favorito} onPress={onFavorito} nombre={nombre} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: { marginBottom: 16 },
  tarjeta: {
    borderRadius: 24, overflow: 'hidden', backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  duracion: { position: 'absolute', bottom: 8, left: 12 },
  silenciosa: { position: 'absolute', top: 12, left: 12 },
  estrella: { position: 'absolute', top: 8, right: 8 },
  cuerpo: { padding: 16, paddingTop: 12, gap: 8 },
  titulo: { fontFamily: familia.enfasis, fontSize: 17, lineHeight: 22, color: paleta.magnesia },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  objetivo: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTexto: { fontFamily: familia.medio, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
});
