import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { paleta, tipo } from '../../theme';
import { useTick } from '../../hooks/useTick';
import { Odometro } from '../fx/Odometro';

/** Con minutos («1:05») el numero baja al 87.5 % para que quepa dentro del anillo: sigue siendo de 140 px o mas en el tamano minimo. */
const ESCALA_CON_MINUTOS = 0.875;

/**
 * El numero enorme del temporizador, con `Odometro`: solo rueda el digito que
 * cambia. Con minutos se compone «m:ss» de tres columnas. `golpe` es la escala
 * del golpe de los ultimos 3 segundos.
 */
export function NumeroTemporizador({ segundos, tamano, apagado, golpe, fijo }: {
  segundos: number;
  tamano: number;
  /** En pausa el numero baja a media opacidad. */
  apagado?: boolean;
  golpe: SharedValue<number>;
  /** Si viene, se muestra este texto tal cual (trabajo por repeticiones, sin reloj). */
  fijo?: string;
}) {
  const tick = useTick();
  const m = Math.floor(segundos / 60);
  const r = segundos % 60;
  const conMinutos = fijo === undefined && m > 0;
  const px = conMinutos ? Math.round(tamano * ESCALA_CON_MINUTOS) : tamano;
  const estilo = { ...tipo.reloj, fontSize: px, lineHeight: px, color: paleta.magnesia };

  const animado = useAnimatedStyle(() => ({ transform: [{ scale: golpe.value }], opacity: apagado ? 0.5 : 1 }), [apagado, tick]);

  return (
    <Animated.View style={[s.caja, animado]}>
      {fijo !== undefined ? (
        <Text style={estilo} maxFontSizeMultiplier={1.2}>{fijo}</Text>
      ) : conMinutos ? (
        <View style={s.fila}>
          <Odometro valor={m} continuo estilo={estilo} />
          <Text style={estilo}>:</Text>
          <Odometro valor={Math.floor(r / 10)} continuo estilo={estilo} />
          <Odometro valor={r % 10} continuo estilo={estilo} />
        </View>
      ) : (
        <Odometro valor={r} continuo estilo={estilo} />
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  caja: { alignItems: 'center', justifyContent: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center' },
});
