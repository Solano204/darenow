import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Imagen } from '@/ui/components/Imagen';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, conAlfa, degradado, resorteMagnesia } from '@/ui/theme';
import { fuente } from '@/media/registry';
import type { EjercicioIndice } from '@/data/catalog';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import Clip from '@/ui/components/Clip';
import { Entrada } from '@/ui/fx/Entrada';
import { ALTO_VELO_ARRIBA } from '@/ui/fx/FotoTratada';

const RADIO_INFERIOR = 28;
const FRACCION_DEGRADADO = '20%';
const ESTIRAMIENTO_MAX = 1.12;
const JALON_PARA_ESTIRAR_PX = 160;
const VELOCIDAD_PARALLAX = 0.5;
const DESVANECE_HASTA = 0.6;
const ESCALA_ENTRADA = 0.94;

/**
 * El modelo del ejercicio, grande y sin marco. Con un PNG transparente
 * (`<id>_recorte`, ver `docs/IMAGENES.md`) va directamente sobre `goma` con un
 * foco de `magnesia` al 10 % y una elipse de piso; si solo hay el clip o la foto
 * (fondo claro), va en una ficha `magnesia` a sangre con las esquinas inferiores
 * de 28 y un degradado a `goma` en el 20 % de abajo. Un velo oscuro arriba deja
 * leer la hora y los botones. `alto` es el 46 % de la pantalla.
 *
 * Con el scroll el modelo sube a 0.5x la velocidad y se desvanece entre 0 y 60 %
 * de su alto; al jalar hacia abajo (iOS) se estira hasta 1.12 desde su base. Con
 * movimiento reducido no se mueve. Al abrirse entra con escala 0.94 y fundido.
 */
export function HeroEjercicio({ ejercicio, y, alto }: {
  ejercicio: EjercicioIndice;
  y: SharedValue<number>;
  alto: number;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const recorte = fuente('ejercicio', `${ejercicio.id}_recorte`);

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
        {recorte ? (
          <View style={s.recorte}>
            <View style={[s.foco, { top: alto * 0.12 }]} />
            <View style={s.piso} />
            <Imagen source={recorte} id={`${ejercicio.id}_recorte`} style={[s.modelo, { height: alto * 0.88 }]} contentFit="contain" />
          </View>
        ) : (
          <View style={s.ficha}>
            <Clip
              id={ejercicio.id} nombre={ejercicio.name} alto={alto} ancho="100%" forma="tarjeta"
              estilo={{ borderRadius: 0 }}
            />
            <LinearGradient
              colors={[conAlfa(paleta.goma, 0), paleta.goma]} pointerEvents="none"
              style={[s.degradado, { height: FRACCION_DEGRADADO }]}
            />
          </View>
        )}
        <LinearGradient colors={degradado.veloArriba} pointerEvents="none" style={s.velo} />
      </Animated.View>
    </Entrada>
  );
}

const s = StyleSheet.create({
  origen: { transformOrigin: 'bottom' },
  ficha: {
    flex: 1, backgroundColor: paleta.magnesia, overflow: 'hidden',
    borderBottomLeftRadius: RADIO_INFERIOR, borderBottomRightRadius: RADIO_INFERIOR,
  },
  degradado: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  velo: { position: 'absolute', top: 0, left: 0, right: 0, height: ALTO_VELO_ARRIBA },
  recorte: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', backgroundColor: paleta.goma },
  foco: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: conAlfa(paleta.magnesia, 0.1),
  },
  piso: {
    position: 'absolute', bottom: 18, width: 220, height: 22, borderRadius: 11, backgroundColor: conAlfa(paleta.gomaAlta, 0.9),
  },
  modelo: { width: '100%' },
});
