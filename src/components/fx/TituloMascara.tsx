import React, { useEffect, useState } from 'react';
import { PixelRatio, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { resortePlaca } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const ESCALONADO_LINEAS_MS = 90;
const ESCALONADO_LETRAS_MS = 18;
const RESORTE_MASCARA = { ...resortePlaca, overshootClamping: true };

interface Comun {
  estilo: StyleProp<TextStyle>;
  activo: boolean;
  animar?: boolean;
  retraso?: number;
}

/** Cada linea del titulo sube desde una mascara inferior. Las lineas se miden del propio texto, asi se respeta el salto real. */
export function TituloMascara({ texto, estilo, activo, animar = true, retraso = 0 }: Comun & { texto: string }) {
  const [lineas, setLineas] = useState<{ texto: string; alto: number }[] | null>(null);

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={texto}>
      {lineas === null ? (
        <Text
          style={[estilo, { opacity: 0 }]}
          onTextLayout={e => setLineas(e.nativeEvent.lines.map(l => ({ texto: l.text.trim(), alto: l.height })))}
        >
          {texto}
        </Text>
      ) : (
        lineas.map((l, k) => (
          <Mascara key={k} alto={l.alto} activo={activo} animar={animar} espera={retraso + k * ESCALONADO_LINEAS_MS}>
            <Text style={estilo}>{l.texto}</Text>
          </Mascara>
        ))
      )}
    </View>
  );
}

/** Igual, pero letra por letra: cada caracter sube 100 % de su alto, escalonado 18 ms. */
export function TituloLetras({ lineas, estilo, activo, animar = true, retraso = 0 }: Comun & { lineas: string[] }) {
  const alto = (StyleSheet.flatten(estilo)?.lineHeight ?? 0) * PixelRatio.getFontScale();
  let indice = 0;

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={lineas.join(' ')}>
      {lineas.map(linea => (
        <View key={linea} style={s.fila}>
          {(linea.match(/\S+\s*/g) ?? [linea]).map((palabra, w) => (
            <View key={w} style={s.palabra}>
              {palabra.split('').map((c, k) => (
                <Mascara key={k} alto={alto} activo={activo} animar={animar} espera={retraso + indice++ * ESCALONADO_LETRAS_MS}>
                  <Text style={estilo}>{c}</Text>
                </Mascara>
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Mascara({ alto, activo, animar, espera, children }: {
  alto: number; activo: boolean; animar: boolean; espera: number; children: React.ReactNode;
}) {
  const reducido = useReducedMotion();
  const estatico = reducido || !animar;
  const t = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { t.value = 1; return; }
    if (!activo) { t.value = 0; return; }
    t.value = withDelay(espera, withSpring(1, RESORTE_MASCARA));
    return () => cancelAnimation(t);
  }, [estatico, activo]);

  const sube = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - t.value) * alto }] }));

  return (
    <View style={{ height: alto, overflow: 'hidden' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Animated.View style={sube}>{children}</Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap' },
  palabra: { flexDirection: 'row' },
});
