import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { degradado, resorteMagnesia } from '@/ui/theme';
import { fuente } from '@/media/registry';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Entrada } from '@/ui/fx/Entrada';
import { ALTO_VELO_ARRIBA } from '@/ui/fx/FotoTratada';
import { FichaRender } from '@/ui/components/FichaRender';

const RADIO_INFERIOR = 28;
const JALON_PARA_ESTIRAR_PX = 160;
const ESTIRAMIENTO_MAX = 1.12;
const VELOCIDAD_PARALLAX = 0.5;
const DESVANECE_HASTA = 0.6;
const ESCALA_ENTRADA = 0.96;
/** El musculo se enciende 200 ms despues de que termina la transicion de entrada de la pantalla (unos 300 ms). */
const ESPERA_ENCENDIDO_MS = 500;

/**
 * El render del musculo, grande y a sangre, sobre una ficha `magnesia` con las esquinas de abajo de
 * 28 (el mismo criterio de fondo que el catalogo) y un velo oscuro arriba que deja leer los botones.
 * Si existe la version neutra (`<id>_neutra`), el musculo se enciende con un fundido de 400 ms y
 * un unico brillo de +10 %; si solo hay una version, el render entra con escala 0.96 a 1. Con el
 * scroll sube a 0.5x la velocidad y se desvanece entre 0 y 60 % de su alto; al jalar hacia abajo
 * (iOS) se estira hasta 1.12 desde su base. Con movimiento reducido no se mueve ni se enciende.
 */
export function HeroMusculo({ id, y, alto }: {
  id: string;
  y: SharedValue<number>;
  alto: number;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { width } = useWindowDimensions();
  const conNeutra = fuente('musculo', `${id}_neutra`) !== null;

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
    <Entrada activo escala={conNeutra ? 1 : ESCALA_ENTRADA} resorte={resorteMagnesia} estilo={{ height: alto }}>
      <Animated.View style={[{ height: alto }, s.origen, movimiento]}>
        <View style={s.ficha}>
          <FichaRender id={id} ancho={width} alto={alto} radio={0} retraso={ESPERA_ENCENDIDO_MS} pulso />
        </View>
        <LinearGradient colors={degradado.veloArriba} pointerEvents="none" style={s.velo} />
      </Animated.View>
    </Entrada>
  );
}

const s = StyleSheet.create({
  origen: { transformOrigin: 'bottom' },
  ficha: { flex: 1, overflow: 'hidden', borderBottomLeftRadius: RADIO_INFERIOR, borderBottomRightRadius: RADIO_INFERIOR },
  velo: { position: 'absolute', top: 0, left: 0, right: 0, height: ALTO_VELO_ARRIBA },
});
