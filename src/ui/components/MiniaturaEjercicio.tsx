import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { paleta, tinte, familia, resortePlaca } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { nombreVisible } from '@/data/nombresVisibles';
import { FotoOscura } from './FotoOscura';
import { Entrada } from '@/ui/fx/Entrada';
import type { ItemSesion } from '@/engine/session';

const LADO_MINIATURA = 112;
const LADO_MINIATURA_ANCHA = 128;
export const SEPARACION_MINIATURA = 12;

/** La foto interior se mueve al 85 % de la velocidad del carrusel: un 15 % del desplazamiento, con este tope de 8 px. */
const FRACCION_PARALLAX = 0.15;
const TOPE_PARALLAX = 8;
const ESCALA_FOTO = 1 + (2 * TOPE_PARALLAX) / LADO_MINIATURA;
const DESDE_LA_DERECHA_PX = 60;

/** Largo de nombre hasta el que caben dos lineas completas a 13 px en 112 px; luego 12 px; luego la miniatura se ensancha a 128. */
const LARGO_MAX_13 = 30;
const LARGO_MAX_12 = 34;

/** Tamano comun de las miniaturas de una sesion, segun el nombre mas largo: nunca se trunca un nombre. */
export function medidasMiniatura(nombres: string[]): { lado: number; letra: number } {
  const largo = Math.max(0, ...nombres.map(n => n.length));
  if (largo <= LARGO_MAX_13) return { lado: LADO_MINIATURA, letra: 13 };
  if (largo <= LARGO_MAX_12) return { lado: LADO_MINIATURA, letra: 12 };
  return { lado: LADO_MINIATURA_ANCHA, letra: 12 };
}

/**
 * Ejercicio de la sesion: foto cuadrada con su numero de orden y el nombre
 * completo debajo (dos lineas como maximo, sin recortar). No es tocable, igual
 * que antes del rediseno. `scrollX` es el desplazamiento del carrusel. En la
 * entrada «cargar la barra» llega desde la derecha con `resortePlaca`.
 */
export function MiniaturaEjercicio({ item, indice, lado, letra, scrollX, animar, retraso }: {
  item: ItemSesion;
  indice: number;
  lado: number;
  letra: number;
  scrollX: SharedValue<number>;
  animar: boolean;
  retraso: number;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const nombre = nombreVisible(item.name);
  const paso = lado + SEPARACION_MINIATURA;

  const parallax = useAnimatedStyle(() => {
    if (reducido) return { transform: [{ scale: 1 }] };
    const d = scrollX.value - indice * paso;
    const tope = TOPE_PARALLAX / FRACCION_PARALLAX;
    return {
      transform: [
        { scale: ESCALA_FOTO },
        { translateX: interpolate(d, [-tope, tope], [-TOPE_PARALLAX, TOPE_PARALLAX], Extrapolation.CLAMP) },
      ],
    };
  }, [reducido, indice, paso, tick]);

  return (
    <Entrada activo animar={animar} retraso={retraso} x={DESDE_LA_DERECHA_PX} resorte={resortePlaca}>
      <View style={[s.caja, { width: lado }]} accessible accessibilityLabel={`Ejercicio ${indice + 1}: ${nombre}, nivel ${item.level} de 3`}>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <FotoOscura
            tipo="ejercicio" id={item.id} ancho={lado} alto={lado}
            radioEsquina={16} estiloImagen={parallax}
          />
          <View style={s.orden}><Text style={s.ordenTexto}>{indice + 1}</Text></View>
        </View>
        <Text
          style={[s.nombre, { fontSize: letra, lineHeight: letra + 4 }]} numberOfLines={2}
          adjustsFontSizeToFit minimumFontScale={0.85} maxFontSizeMultiplier={1.2}
        >
          {nombre}
        </Text>
      </View>
    </Entrada>
  );
}

const s = StyleSheet.create({
  caja: { marginRight: SEPARACION_MINIATURA },
  orden: {
    position: 'absolute', top: 6, left: 6, minWidth: 22, height: 22, borderRadius: 11,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: tinte.notaEntrenador, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  ordenTexto: { fontFamily: familia.titulo, fontSize: 14, lineHeight: 16, color: paleta.magnesia3Texto },
  nombre: { marginTop: 8, minHeight: 34, fontFamily: familia.medio, color: paleta.magnesia },
});
