import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, conAlfa, degradado, resorteMagnesia } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { Entrada } from '@/components/fx/Entrada';
import { FotoTratada, ALTO_VELO_ARRIBA } from '@/components/fx/FotoTratada';

const FRACCION_DEGRADADO = '35%';
const JALON_PARA_ESTIRAR_PX = 160;
const ESTIRAMIENTO_MAX = 1.12;
const VELOCIDAD_PARALLAX = 0.5;
const DESVANECE_HASTA = 0.6;
const ESCALA_ENTRADA = 0.94;
/** La foto de una sala se ve mejor con el centro un poco por encima del medio. */
const FOCO_FOTO = { x: 0.5, y: 0.35 };

/**
 * La foto de la rutina a sangre, con el tratamiento Goma y Magnesia (`FotoTratada`), un velo
 * oscuro arriba que deja leer los botones y un degradado a `goma` en el 35 % de abajo. Con el
 * scroll sube a 0.5x la velocidad y se desvanece entre 0 y 60 % de su alto; al jalar hacia
 * abajo (iOS) se estira hasta 1.12 desde su base. Con movimiento reducido no se mueve. Al
 * abrirse entra con escala 0.94 y fundido, como el modelo de la ficha de ejercicio.
 */
export function HeroRutina({ fuente, y, alto, matriz }: {
  fuente: number;
  y: SharedValue<number>;
  alto: number;
  /** Otro tratamiento de color (el hero de un mito, mas desaturado). Sin el, el de siempre. */
  matriz?: number[];
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { width } = useWindowDimensions();

  const movimiento = useAnimatedStyle(() => {
    if (reducido) return {};
    const v = y.value;
    return {
      opacity: interpolate(v, [0, alto * DESVANECE_HASTA], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: v > 0 ? v * VELOCIDAD_PARALLAX : 0 },
        { scale: v < 0 ? interpolate(v, [-JALON_PARA_ESTIRAR_PX, 0], [ESTIRAMIENTO_MAX, 1], Extrapolation.CLAMP) : 1 },
      ],
    };
  }, [reducido, alto, tick]);

  return (
    <Entrada activo escala={ESCALA_ENTRADA} resorte={resorteMagnesia} estilo={{ height: alto }}>
      <Animated.View style={[{ height: alto }, s.origen, movimiento]}>
        <FotoTratada fuente={fuente} ancho={width} alto={alto} foco={FOCO_FOTO} />
        <LinearGradient
          colors={[conAlfa(paleta.goma, 0), paleta.goma]} pointerEvents="none"
          style={[s.degradado, { height: FRACCION_DEGRADADO }]}
        />
        <LinearGradient colors={degradado.veloArriba} pointerEvents="none" style={s.velo} />
      </Animated.View>
    </Entrada>
  );
}

const s = StyleSheet.create({
  origen: { transformOrigin: 'bottom' },
  degradado: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  velo: { position: 'absolute', top: 0, left: 0, right: 0, height: ALTO_VELO_ARRIBA },
});
