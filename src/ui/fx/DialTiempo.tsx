import React, { useEffect, useEffectEvent, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import {
  cancelAnimation, interpolateColor, useDerivedValue, useSharedValue,
  withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { paleta, tipo, easing, resortePlaca } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { Odometro } from './Odometro';

const MIN_INICIO = 45;
const MIN_FIN = 5;
const MIN_POR_VUELTA = 60;
const DURACION_ARCO = 900;
const DURACION_COLUMNA = 820;
const MARCAS = 60;
const GROSOR_ARCO = 1.5;
const MARGEN_ARO = 18;

/**
 * Dial de temporizador: marcas de minutos, un arco magnesia que recorre de 45
 * a 5 minutos y un numero central que rueda igual. Al llegar a 5 el arco pasa
 * a azul de accion y da un unico pulso. Es decorativo: no guarda nada.
 */
export function DialTiempo({ tamano, activo, animar = true, retraso = 0, medida }: {
  tamano: number;
  activo: boolean;
  animar?: boolean;
  retraso?: number;
  /**
   * Modo medidor (los minutos por sesion de Ajustes): el arco refleja `valor` respecto a `maximo` y se
   * mueve con `resortePlaca` al cambiar; no hay cuenta atras ni numero central (el numero va debajo).
   */
  medida?: { valor: number; maximo: number };
}) {
  const reducido = useReducedMotion();
  const estatico = reducido || !animar;
  const c = tamano / 2;
  const radioMarcas = c - 2;

  const marcas = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < MARCAS; i++) {
      const a = (i * 2 * Math.PI) / MARCAS;
      const largo = i % 5 === 0 ? 10 : 5;
      p.moveTo(c + Math.sin(a) * (radioMarcas - largo), c - Math.cos(a) * (radioMarcas - largo));
      p.lineTo(c + Math.sin(a) * radioMarcas, c - Math.cos(a) * radioMarcas);
    }
    return p.detach();
  }, [c, radioMarcas]);

  const aro = useMemo(() => Skia.PathBuilder.Make().addCircle(c, c, radioMarcas - MARGEN_ARO).detach(), [c, radioMarcas]);

  const fraccion = medida === undefined ? 0 : Math.min(1, Math.max(0, medida.valor / medida.maximo));
  const fin = useSharedValue(medida !== undefined ? fraccion : estatico ? MIN_FIN / MIN_POR_VUELTA : MIN_INICIO / MIN_POR_VUELTA);
  const azul = useSharedValue(medida === undefined && estatico ? 1 : 0);
  const pulso = useSharedValue(1);

  const alCambiarFraccion = useEffectEvent(() => {
    if (medida === undefined) return;
    fin.set(estatico ? fraccion : withSpring(fraccion, { ...resortePlaca, overshootClamping: true }));
  });
  useEffect(() => alCambiarFraccion(), [fraccion, estatico]);

  const alCambiarEstatico = useEffectEvent(() => {
    if (medida !== undefined) return;
    const meta = MIN_FIN / MIN_POR_VUELTA;
    if (estatico) { fin.set(meta); azul.set(1); pulso.set(1); return; }
    fin.set(MIN_INICIO / MIN_POR_VUELTA);
    azul.set(0);
    if (!activo) return;
    fin.set(withDelay(retraso, withTiming(meta, { duration: DURACION_ARCO, easing: easing.salida })));
    azul.set(withDelay(retraso + DURACION_ARCO, withTiming(1, { duration: 200 })));
    pulso.set(withDelay(retraso + DURACION_ARCO, withSequence(
      withTiming(1.06, { duration: 120 }),
      withSpring(1, resortePlaca),
    )));
    return () => { cancelAnimation(fin); cancelAnimation(azul); cancelAnimation(pulso); };
  });
  useEffect(() => alCambiarEstatico(), [estatico, activo]);

  const colorArco = useDerivedValue(() => interpolateColor(azul.value, [0, 1], [paleta.magnesia, paleta.placaAzul]));
  const escala = useDerivedValue(() => [{ scale: pulso.value }]);

  return (
    <View
      style={{ width: tamano, height: tamano }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={escala} origin={{ x: c, y: c }}>
          <Path path={marcas} style="stroke" strokeWidth={1} color={paleta.magnesia} opacity={0.3} />
          <Group transform={[{ rotate: -Math.PI / 2 }]} origin={{ x: c, y: c }}>
            <Path
              path={aro} style="stroke" strokeWidth={GROSOR_ARCO} strokeCap="round"
              color={colorArco} start={0} end={fin}
            />
          </Group>
        </Group>
      </Canvas>
      {medida === undefined && (
        <View style={[StyleSheet.absoluteFill, s.centro]}>
          <Odometro
            desde={MIN_INICIO} valor={MIN_FIN} ocultarCerosIzq
            activo={activo} animar={animar} retraso={retraso} duracionColumna={DURACION_COLUMNA}
            estilo={[tipo.numero, { fontSize: 64, lineHeight: 64, color: paleta.magnesia }]}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
});
