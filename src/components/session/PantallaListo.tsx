import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { paleta, tipo } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { GomaTexture } from '../fx/GomaTexture';
import { Entrada } from '../fx/Entrada';
import { TextoDeParticulas } from '../fx/TextoDeParticulas';

const TAMANO_TITULO = 72;
const CENTRO_Y = 0.46;
const ENSAMBLE_MS = 700;
const RETRASO_SUBTITULO_MS = 150;
const DISOLVER_MS = 400;
const SEPARACION_SUBTITULO_PX = 52;

/**
 * «¿Listo?»: la magnesia se junta y forma el texto. Dura lo que dura la pantalla,
 * que fija el reproductor (`duracionMs`, 3000): no alarga la espera ni la corta.
 * Las letras empiezan a deshacerse en polvo hacia arriba 400 ms antes de que
 * termine, para que el polvo ya este en el aire cuando entra lo siguiente.
 */
export function PantallaListo({ duracionMs }: { duracionMs: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { height } = useWindowDimensions();
  const [disolver, setDisolver] = useState(false);
  const subtitulo = useSharedValue(1);

  useEffect(() => {
    const id = setTimeout(() => {
      setDisolver(true);
      subtitulo.value = withTiming(0, { duration: reducido ? 150 : DISOLVER_MS });
    }, Math.max(0, duracionMs - DISOLVER_MS));
    return () => clearTimeout(id);
  }, [duracionMs, reducido]);

  const estiloSubtitulo = useAnimatedStyle(() => ({ opacity: subtitulo.value }), [tick]);

  return (
    <View style={s.raiz} accessible accessibilityLabel="¿Listo? Empezamos en un momento">
      <GomaTexture />
      <TextoDeParticulas
        texto="¿Listo?" tamano={TAMANO_TITULO} color={paleta.magnesia} centroY={CENTRO_Y}
        ensambleMs={ENSAMBLE_MS} disolver={disolver} disolverMs={DISOLVER_MS}
      />
      <Animated.View
        style={[s.subtitulo, { top: height * CENTRO_Y + SEPARACION_SUBTITULO_PX }, estiloSubtitulo]}
        pointerEvents="none"
      >
        <Entrada activo retraso={ENSAMBLE_MS + RETRASO_SUBTITULO_MS} y={8}>
          <Text style={s.texto}>Empezamos en un momento</Text>
        </Entrada>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  subtitulo: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  texto: { ...tipo.cuerpo, color: paleta.magnesia2 },
});
