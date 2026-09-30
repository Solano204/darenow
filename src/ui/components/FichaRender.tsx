import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { paleta, easing } from '@/ui/theme';
import { fuente } from '@/media/registry';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { FotoOscura } from './FotoOscura';
import { RADIO_FICHA } from './disposicionCatalogo';

const CRUCE_MS = 400;
const PULSO_SUBE_MS = 150;
const PULSO_BAJA_MS = 150;
const OPACIDAD_PULSO = 0.1;

/**
 * El render de un musculo sobre una ficha `magnesia` (nunca sobre blanco puro): los renders
 * traen fondo claro, asi que la ficha es la superficie y la foto va a su opacidad completa.
 * Es el «criterio de fondo del catalogo» que comparten la rejilla, las fichas relacionadas y
 * el hero de la ficha.
 *
 * Si existe `<id>_neutra` (la version sin el musculo resaltado, ver `docs/IMAGENES.md`), al
 * activarse se cruza de la neutra a la resaltada en 400 ms (tras `retraso`) y, con `pulso`, hace
 * un unico brillo de +10 % durante 300 ms. Hoy no existe ninguna: entonces el render aparece
 * ya resaltado y no se hace nada. Con movimiento reducido nunca hay cruce ni brillo.
 */
export function FichaRender({ id, ancho, alto, radio = RADIO_FICHA, activo = true, retraso = 0, pulso }: {
  id: string;
  ancho: number;
  alto: number;
  radio?: number;
  /** Arranca el cruce (si hay version neutra). */
  activo?: boolean;
  retraso?: number;
  pulso?: boolean;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const neutra = fuente('musculo', `${id}_neutra`);
  const t = useSharedValue(neutra && !reducido ? 0 : 1);
  const brillo = useSharedValue(0);

  useEffect(() => {
    if (!neutra || reducido || !activo) return;
    t.set(withDelay(retraso, withTiming(1, { duration: CRUCE_MS, easing: easing.salida })));
    if (pulso) {
      brillo.set(withDelay(retraso + CRUCE_MS, withSequence(
        withTiming(1, { duration: PULSO_SUBE_MS }), withTiming(0, { duration: PULSO_BAJA_MS }),
      )));
    }
  }, [activo, reducido, neutra]);

  const estiloNeutra = useAnimatedStyle(() => ({ opacity: 1 - t.value }), [tick]);
  const estiloBrillo = useAnimatedStyle(() => ({ opacity: OPACIDAD_PULSO * brillo.value }), [tick]);

  return (
    <View style={[s.ficha, { width: ancho, height: alto, borderRadius: radio }]}>
      <FotoOscura
        tipo="musculo" id={id} ancho={ancho} alto={alto} radioEsquina={radio} velo={false}
        fondo={paleta.magnesia} exposicion={1}
      />
      {neutra ? (
        <Animated.View style={[s.encima, estiloNeutra]} pointerEvents="none">
          <FotoOscura
            tipo="musculo" id={`${id}_neutra`} ancho={ancho} alto={alto} radioEsquina={radio} velo={false}
            fondo={paleta.magnesia} exposicion={1}
          />
        </Animated.View>
      ) : null}
      {neutra && pulso ? <Animated.View style={[s.encima, s.brillo, estiloBrillo]} pointerEvents="none" /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  ficha: { overflow: 'hidden', backgroundColor: paleta.magnesia },
  encima: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  brillo: { backgroundColor: paleta.blanco },
});
