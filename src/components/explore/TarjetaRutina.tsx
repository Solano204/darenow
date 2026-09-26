import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia } from '../../theme';
import { nombreGoal, type Rutina } from '../../data/catalog';
import { nombreVisible } from '../../data/nombresVisibles';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { Presionable } from '../ui/Presionable';
import { FotoOscura } from '../ui/FotoOscura';
import { NivelPlacas } from '../ui/NivelPlacas';
import { InsigniaFoto, EtiquetaFoto } from '../ui/InsigniaFoto';
import { ICONOS_OBJETIVO } from '../ui/iconosObjetivo';
import { EstrellaFavorito } from '../hoy/EstrellaFavorito';

export const ALTO_FOTO_TARJETA = 180;
const ZOOM_PRESIONADO = 0.04;
const ESCALA_PRESIONADA = 0.02;
const ALTO_NIVEL = 12;

/**
 * Tarjeta de rutina del catalogo, a lo ancho: foto de 180 con el degradado hacia
 * `gomaAlta` en el 25 % de abajo, la duracion una sola vez (pastilla abajo a la
 * izquierda), «Silenciosa» arriba a la izquierda si lo es y la estrella de favorito
 * arriba a la derecha. Debajo, el titulo (2 lineas) y una linea con el objetivo y su
 * icono a la izquierda y el nivel en placas a la derecha. Al presionar se hunde un 2 %,
 * la foto hace zoom a 1.04 y da un toque suave.
 */
export function TarjetaRutina({ r, favorito, onPress, onFavorito }: {
  r: Rutina;
  favorito: boolean;
  onPress: () => void;
  onFavorito: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const nombre = nombreVisible(r.name);
  const objetivo = nombreGoal(r.goal);
  const etiqueta = `${nombre}, ${r.min} minutos, ${objetivo}, nivel ${r.level} de 3${r.modo_sin_saltos ? ', silenciosa' : ''}`;

  const foto = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 1 + ZOOM_PRESIONADO * presion.value }],
  }), [reducido, tick]);

  return (
    <View style={s.caja}>
      <Presionable onPress={onPress} etiqueta={etiqueta} presion={presion} escala={ESCALA_PRESIONADA} estilo={s.tarjeta}>
        <View>
          <FotoOscura
            tipo="rutina" id={r.id} ancho="100%" alto={ALTO_FOTO_TARJETA} radioEsquina={0}
            alturaVelo="25%" fondoVelo={paleta.gomaAlta} estiloImagen={foto}
          />
          <View style={s.duracion}><InsigniaFoto numero={r.min} unidad="min" /></View>
          {r.modo_sin_saltos && <View style={s.silenciosa}><EtiquetaFoto icono="volume-mute-outline" texto="Silenciosa" /></View>}
        </View>
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
      </Presionable>
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
