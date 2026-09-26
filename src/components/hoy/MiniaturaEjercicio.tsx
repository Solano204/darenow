import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { paleta, tinte, familia } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { nombreVisible } from '../../data/nombresVisibles';
import { FotoOscura } from '../ui/FotoOscura';
import type { ItemSesion } from '../../engine/session';

export const LADO_MINIATURA = 112;
export const SEPARACION_MINIATURA = 12;
export const PASO_MINIATURA = LADO_MINIATURA + SEPARACION_MINIATURA;

/** La foto interior se mueve al 85 % de la velocidad del carrusel: un 15 % del desplazamiento, con este tope. */
const FRACCION_PARALLAX = 0.15;
const TOPE_PARALLAX = 16;
const ESCALA_FOTO = 1.3;

/**
 * Ejercicio de la sesion: foto de 112x112 con su numero de orden y el nombre
 * completo debajo (dos lineas como minimo, sin recortar). No es tocable, igual
 * que antes del rediseno. `scrollX` es el desplazamiento del carrusel.
 */
export function MiniaturaEjercicio({ item, indice, scrollX }: {
  item: ItemSesion;
  indice: number;
  scrollX: SharedValue<number>;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const nombre = nombreVisible(item.name);

  const parallax = useAnimatedStyle(() => {
    if (reducido) return { transform: [{ scale: 1 }] };
    const d = scrollX.value - indice * PASO_MINIATURA;
    const tope = TOPE_PARALLAX / FRACCION_PARALLAX;
    return {
      transform: [
        { scale: ESCALA_FOTO },
        { translateX: interpolate(d, [-tope, tope], [-TOPE_PARALLAX, TOPE_PARALLAX], Extrapolation.CLAMP) },
      ],
    };
  }, [reducido, indice, tick]);

  return (
    <View style={s.caja} accessible accessibilityLabel={`Ejercicio ${indice + 1}: ${nombre}`}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <FotoOscura
          tipo="ejercicio" id={item.id} ancho={LADO_MINIATURA} alto={LADO_MINIATURA}
          radioEsquina={16} estiloImagen={parallax}
        />
        <View style={s.orden}><Text style={s.ordenTexto}>{indice + 1}</Text></View>
      </View>
      <Text style={s.nombre} maxFontSizeMultiplier={1.2}>{nombre}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  caja: { width: LADO_MINIATURA, marginRight: SEPARACION_MINIATURA },
  orden: {
    position: 'absolute', top: 6, left: 6, minWidth: 24, height: 24, borderRadius: 12,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: tinte.notaEntrenador, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  ordenTexto: { fontFamily: familia.display, fontSize: 15, lineHeight: 18, color: paleta.magnesia },
  nombre: {
    marginTop: 8, minHeight: 34, fontFamily: familia.medio, fontSize: 13, lineHeight: 17, color: paleta.magnesia,
  },
});
