import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { paleta, familia } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';

const ALTO = 64;
const FOCO_MS = 160;

/**
 * Campo de texto grande. El borde de 1 px pasa a 2 px de azul de accion al
 * enfocarse: el aro es una capa aparte que solo cambia de opacidad, asi el
 * campo no se mueve.
 */
export function CampoTexto({ valor, onCambio, placeholder, etiqueta }: {
  valor: string;
  onCambio: (t: string) => void;
  placeholder: string;
  etiqueta: string;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [foco, setFoco] = useState(false);
  const aro = useSharedValue(0);

  useEffect(() => {
    aro.set(withTiming(foco ? 1 : 0, { duration: reducido ? 150 : FOCO_MS }));
  }, [aro, foco, reducido]);

  const estiloAro = useAnimatedStyle(() => ({ opacity: aro.value }), [tick]);

  return (
    <View style={s.caja}>
      <TextInput
        value={valor}
        onChangeText={onCambio}
        placeholder={placeholder}
        placeholderTextColor={paleta.magnesia3Texto}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        style={s.entrada}
        keyboardAppearance="dark"
        selectionColor={paleta.placaAzul}
        cursorColor={paleta.placaAzul}
        autoCapitalize="words"
        maxFontSizeMultiplier={1.3}
        accessibilityLabel={etiqueta}
      />
      <Animated.View pointerEvents="none" style={[s.aro, estiloAro]} />
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    height: ALTO, borderRadius: 16, backgroundColor: paleta.gomaAlta,
    borderWidth: 1, borderColor: paleta.gomaBorde, justifyContent: 'center',
  },
  entrada: {
    flex: 1, paddingHorizontal: 18, color: paleta.magnesia,
    fontFamily: familia.medio, fontSize: 18, lineHeight: 24,
  },
  aro: {
    position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
    borderRadius: 16, borderWidth: 2, borderColor: paleta.placaAzul,
  },
});
