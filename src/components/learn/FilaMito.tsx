import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, familia, insignia, resorteTap, haptico } from '@/theme';
import type { Mito } from '@/data/catalog';
import { textoVisible } from '@/utils/presentacion';
import { textoDeLectura } from '@/utils/aprender';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { FotoOscura } from '@/components/ui/FotoOscura';
import { InsigniaEvidencia } from '@/components/ui/InsigniaEvidencia';
import { TextoDesvanecido } from '@/components/ui/TextoDesvanecido';
import { PalomitaTrazo } from '@/components/fx/PalomitaTrazo';
import { AfirmacionTachada } from './AfirmacionTachada';

const LADO_MINIATURA = 72;
const ESCALA_MINIATURA = 0.96;
const OPACIDAD_PRESIONADA = 0.6;
const ESCALA_SELLO = 1.35;
const GIRO_SELLO = -3;
/** El tachon arranca cuando el sello ya cayo. */
const ESPERA_TACHADO_MS = 120;
/** Cuanto se desatura la miniatura de mas: el mito se ve como «lo que se cree». */
const DESATURACION_EXTRA = 0.2;

/** Lo que la lista sabe de una fila que acaba de entrar en pantalla: si su sello da golpe de haptica. */
export interface Activacion { golpe: boolean }

/**
 * Fila de un mito (112 de alto como minimo): la miniatura de 72 (ligeramente desaturada), la
 * afirmacion en Big Shoulders con su insignia debajo y la explicacion en dos lineas que se
 * desvanecen. Cuando la fila entra 60 % en pantalla por primera vez (`activacion`) su insignia se
 * estampa y, 120 ms despues, un tachon rojo recorre la afirmacion linea por linea; solo si el
 * veredicto es «Mito» (un «Comprobado» lleva palomita verde, un «Parcial» nada). Con `animar` en
 * falso (la fila ya se animo en esta sesion) aparece ya colocada. Al presionar, un fondo `gomaAlta`
 * al 60 % cubre la fila y la miniatura se hunde a 0.96. El lector de pantalla oye la afirmacion y su
 * veredicto («Los abdominales queman la panza. Mito.»).
 */
export const FilaMito = React.memo(function FilaMito({ mito, activacion, animar, onPress }: {
  mito: Mito;
  activacion?: Activacion;
  animar: boolean;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const afirmacion = textoVisible(mito.titulo);
  const activo = activacion !== undefined;

  const fondo = useAnimatedStyle(() => ({ opacity: OPACIDAD_PRESIONADA * presion.value }), [tick]);
  const miniatura = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 1 - (1 - ESCALA_MINIATURA) * presion.value }],
  }), [reducido, tick]);

  return (
    <View style={s.fila}>
      <Pressable
        style={s.cuerpo}
        onPressIn={() => { presion.value = withSpring(1, resorteTap); haptico.toque(); }}
        onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
        onPress={() => onPress(mito.id)}
        accessibilityRole="button" accessibilityLabel={`${afirmacion}. ${insignia[mito.veredicto].texto}.`}
      >
        <Animated.View style={[s.fondo, fondo]} pointerEvents="none" />
        <View style={s.contenido} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Animated.View style={miniatura}>
            <View style={s.foto}>
              <FotoOscura tipo="mito" id={mito.id} ancho={LADO_MINIATURA} alto={LADO_MINIATURA} radioEsquina={16} velo={false} />
              <View style={s.grisado} pointerEvents="none" />
            </View>
          </Animated.View>
          <View style={s.info}>
            <AfirmacionTachada
              texto={afirmacion} estilo={s.afirmacion} tachar={mito.veredicto === 'mito'}
              activo={activo} animar={animar} retraso={ESPERA_TACHADO_MS}
            />
            <View style={s.veredicto}>
              <InsigniaEvidencia
                tipo={mito.veredicto} pequena
                estampar={{ activo, animar, retraso: 0, escala: ESCALA_SELLO, giro: GIRO_SELLO, haptica: activacion?.golpe ?? false }}
              />
              {mito.veredicto === 'ok' && <PalomitaTrazo visible={activo || !animar} tamano={18} color={paleta.placaVerde} />}
            </View>
            <TextoDesvanecido
              texto={textoDeLectura(mito.explicacion)} lineas={2} alturaLinea={20} estilo={s.explicacion} fondo={paleta.goma} horizontal
            />
          </View>
        </View>
      </Pressable>
      <View style={s.separador} pointerEvents="none" />
    </View>
  );
});

const s = StyleSheet.create({
  fila: { minHeight: 112 },
  cuerpo: { paddingVertical: 16 },
  fondo: { position: 'absolute', top: 0, bottom: 0, left: -12, right: -12, borderRadius: 16, backgroundColor: paleta.gomaAlta },
  contenido: { flexDirection: 'row', gap: 16 },
  foto: { width: LADO_MINIATURA, height: LADO_MINIATURA, borderRadius: 16, overflow: 'hidden' },
  // Un gris neutro mezclado en modo «saturacion» quita el 20 % del color de la foto sin tocar su luz.
  grisado: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: paleta.magnesia3, opacity: DESATURACION_EXTRA, mixBlendMode: 'saturation',
  },
  info: { flex: 1, gap: 6 },
  afirmacion: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 23, color: paleta.magnesia },
  veredicto: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  explicacion: { fontFamily: familia.cuerpo, fontSize: 14, color: paleta.magnesia2 },
  separador: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: paleta.gomaBorde },
});
