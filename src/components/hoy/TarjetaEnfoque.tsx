import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { paleta, tinte, familia, tipo } from '../../theme';
import { fuente } from '../../media/registry';
import { nombreVisible } from '../../data/nombresVisibles';
import type { Ejercicio } from '../../data/catalog';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { Presionable } from '../ui/Presionable';
import { FotoOscura } from '../ui/FotoOscura';
import { NivelPlacas } from '../ui/NivelPlacas';
import { BotonCompacto } from '../ui/BotonCompacto';
import { GomaTexture } from '../fx/GomaTexture';
import type { Progreso } from './CarruselProfundidad';

export const ANCHO_ENFOQUE = 280;
export const ALTO_ENFOQUE = 300;
/** Espacio sobre la tarjeta por el que el atleta recortado se sale del marco. */
export const CABEZA_ENFOQUE = 44;
const ALTO_FOTO = 168;
const ESCALA_FOTO = 1.25;
const PX_FOTO_POR_PASO = 44;
const PX_ATLETA_POR_PASO = 60;

/**
 * Tarjeta de enfoque de 280x300: el ejercicio, su nivel en placas y un boton
 * «Inicio». Si existe `<id>_recorte` (PNG sin fondo del atleta, ver
 * `docs/IMAGENES.md`) el atleta rompe el marco por arriba; si no, la foto va
 * dentro de la tarjeta con el tratamiento de color. `progreso` mueve la foto y el
 * atleta a distinta velocidad que la tarjeta.
 */
export function TarjetaEnfoque({ ejercicio, progreso, onPress }: {
  ejercicio: Ejercicio;
  progreso: Progreso;
  onPress: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const nombre = nombreVisible(ejercicio.name);
  const recorte = fuente('ejercicio', `${ejercicio.id}_recorte`);

  const foto = useAnimatedStyle(() => {
    if (reducido) return { transform: [{ scale: 1 }] };
    const tope = (ANCHO_ENFOQUE * (ESCALA_FOTO - 1)) / 2;
    return {
      transform: [
        { scale: ESCALA_FOTO },
        { translateX: interpolate(progreso.value * PX_FOTO_POR_PASO, [-tope, tope], [-tope, tope], Extrapolation.CLAMP) },
      ],
    };
  }, [reducido, tick]);
  const atleta = useAnimatedStyle(() => ({
    transform: [{
      translateX: reducido ? 0 : interpolate(
        progreso.value * PX_ATLETA_POR_PASO, [-PX_ATLETA_POR_PASO, PX_ATLETA_POR_PASO], [-PX_ATLETA_POR_PASO, PX_ATLETA_POR_PASO], Extrapolation.CLAMP,
      ),
    }],
  }), [reducido, tick]);

  return (
    <Presionable onPress={onPress} etiqueta={`${nombre}. Nivel ${ejercicio.level} de 3`} estilo={s.raiz}>
      <View style={s.tarjeta}>
        <GomaTexture />
        {recorte
          ? <View style={s.halo} />
          : <FotoOscura
              tipo="ejercicio" id={ejercicio.id} ancho={ANCHO_ENFOQUE} alto={ALTO_FOTO}
              radioEsquina={0} estiloImagen={foto}
            />}
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
    </Presionable>
  );
}

const s = StyleSheet.create({
  raiz: { width: ANCHO_ENFOQUE, height: ALTO_ENFOQUE + CABEZA_ENFOQUE, paddingTop: CABEZA_ENFOQUE },
  tarjeta: {
    height: ALTO_ENFOQUE, borderRadius: 28, overflow: 'hidden',
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  halo: {
    position: 'absolute', top: 24, left: 40, width: 200, height: 200, borderRadius: 100,
    backgroundColor: tinte.neutra,
  },
  atleta: { position: 'absolute', top: 0, left: 40, width: 200, height: 236 },
  atletaImagen: { width: '100%', height: '100%' },
  pie: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 10 },
  nombre: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 22, color: paleta.magnesia },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nivel: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  nivelTexto: { ...tipo.etiqueta, color: paleta.magnesia2 },
});
