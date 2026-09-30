import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, conAlfa, familia, tipo } from '@/ui/theme';
import { fuente } from '@/media/registry';
import { nombreVisible } from '@/data/nombresVisibles';
import type { EjercicioIndice } from '@/data/catalog';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Tocable } from './Tocable';
import { FotoOscura } from './FotoOscura';
import { NivelPlacas } from './NivelPlacas';
import { BotonCompacto } from './BotonCompacto';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import type { Progreso } from '@/ui/fx/CarruselProfundidad';

export const ANCHO_ENFOQUE = 280;
export const ALTO_ENFOQUE = 300;
/** Espacio sobre la tarjeta por el que el atleta recortado se sale del marco. */
export const CABEZA_ENFOQUE = 24;
const PASO_ENFOQUE = ANCHO_ENFOQUE + 16;
const ESCALA_FOTO = 1.25;
const PX_FOTO_POR_PASO = 44;
/** El atleta se adelanta a 1.2x: un 20 % mas de recorrido que la tarjeta. */
const PX_ATLETA_POR_PASO = 0.2 * PASO_ENFOQUE;
const GIRO_ATLETA_GRADOS = 4;
const SUBE_ATLETA_PX = 6;
const ESCALA_ATLETA_PRESIONADO = 0.03;
const OSCURECE_PRESIONADO = 0.06;

/**
 * Tarjeta de enfoque de 280x300: el ejercicio, su nivel en placas y un boton
 * «Inicio». Si existe `<id>_recorte` (PNG sin fondo del atleta, ver
 * `docs/IMAGENES.md`) el atleta rompe el marco 24 px por arriba, sobre un foco de
 * `magnesia` al 10 %; si no, la foto va dentro de la tarjeta con el tratamiento
 * de color. `progreso` mueve la foto y el atleta a otra velocidad que la tarjeta
 * (el atleta a 1.2x, girando 4 grados en Y). Al presionar, la tarjeta se
 * oscurece un 6 % y el atleta sube 6 px y escala 1.03.
 */
export function TarjetaEnfoque({ ejercicio, progreso, onPress }: {
  ejercicio: EjercicioIndice;
  progreso: Progreso;
  onPress: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const nombre = nombreVisible(ejercicio.name);
  const recorte = fuente('ejercicio', `${ejercicio.id}_recorte`);

  const foto = useAnimatedStyle(() => {
    if (reducido) return { transform: [{ scale: 1 }] };
    const tope = (ANCHO_ENFOQUE * (ESCALA_FOTO - 1)) / 2;
    return {
      transform: [
        { scale: ESCALA_FOTO + ESCALA_ATLETA_PRESIONADO * presion.value },
        { translateX: interpolate(progreso.value * PX_FOTO_POR_PASO, [-tope, tope], [-tope, tope], Extrapolation.CLAMP) },
        { translateY: -SUBE_ATLETA_PX * presion.value },
      ],
    };
  }, [reducido, tick]);
  const atleta = useAnimatedStyle(() => {
    if (reducido) return { transform: [{ translateY: 0 }] };
    return {
      transform: [
        { perspective: 700 },
        { translateX: interpolate(progreso.value * PX_ATLETA_POR_PASO, [-PX_ATLETA_POR_PASO, PX_ATLETA_POR_PASO], [-PX_ATLETA_POR_PASO, PX_ATLETA_POR_PASO], Extrapolation.CLAMP) },
        { rotateY: `${interpolate(progreso.value, [-1, 0, 1], [GIRO_ATLETA_GRADOS, 0, -GIRO_ATLETA_GRADOS], Extrapolation.CLAMP)}deg` },
        { translateY: -SUBE_ATLETA_PX * presion.value },
        { scale: 1 + ESCALA_ATLETA_PRESIONADO * presion.value },
      ],
    };
  }, [reducido, tick]);
  const oscurece = useAnimatedStyle(() => ({ opacity: OSCURECE_PRESIONADO * presion.value }), [tick]);

  return (
    <Tocable
      onPress={onPress} etiqueta={`${nombre}. Nivel ${ejercicio.level} de 3`}
      escala={0} presion={presion} estilo={s.raiz}
    >
      <View style={s.tarjeta}>
        <GomaTexture />
        {recorte
          ? <View style={s.foco} />
          : <FotoOscura
              tipo="ejercicio" id={ejercicio.id} ancho={ANCHO_ENFOQUE} alto={ALTO_ENFOQUE}
              radioEsquina={0} velo={false} estiloImagen={foto}
            />}
        <LinearGradient
          colors={[conAlfa(paleta.gomaAlta, 0), paleta.gomaAlta]} locations={[0, 0.85]} pointerEvents="none" style={s.degradado}
        />
        <Animated.View pointerEvents="none" style={[s.oscurece, oscurece]} />
        <View style={s.pie}>
          <Text style={s.nombre} numberOfLines={3}>{nombre}</Text>
          <View style={s.fila}>
            <View style={s.nivel}>
              <NivelPlacas nivel={ejercicio.level} />
              <Text style={s.nivelTexto}>Nivel {ejercicio.level}</Text>
            </View>
            <BotonCompacto texto="Inicio" onPress={onPress} etiqueta={`Inicio, ${nombre}`} />
          </View>
        </View>
      </View>
      {recorte && (
        <Animated.View style={[s.atleta, atleta]} pointerEvents="none">
          <Image source={recorte} style={s.atletaImagen} contentFit="contain" cachePolicy="memory-disk" />
        </Animated.View>
      )}
    </Tocable>
  );
}

const s = StyleSheet.create({
  raiz: { width: ANCHO_ENFOQUE, height: ALTO_ENFOQUE + CABEZA_ENFOQUE, paddingTop: CABEZA_ENFOQUE },
  tarjeta: {
    height: ALTO_ENFOQUE, borderRadius: 28, overflow: 'hidden',
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  foco: {
    position: 'absolute', top: 10, left: 30, width: 220, height: 220, borderRadius: 110,
    backgroundColor: conAlfa(paleta.magnesia, 0.1),
  },
  degradado: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
  oscurece: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: paleta.goma },
  atleta: { position: 'absolute', top: 0, left: 40, width: 200, height: 250 },
  atletaImagen: { width: '100%', height: '100%' },
  pie: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 10 },
  nombre: { fontFamily: familia.display, fontSize: 28, lineHeight: 30, color: paleta.magnesia },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nivel: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  nivelTexto: { ...tipo.etiqueta, fontSize: 13, color: paleta.magnesia2 },
});
