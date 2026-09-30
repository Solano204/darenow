import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { paleta, conAlfa, familia, MARGEN_PANTALLA } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { BotonPlaca } from '@/components/ui/BotonPlaca';
import { BotonSecundario } from '@/components/ui/BotonSecundario';

const ENTRADA_MS = 240;
const REDUCIDO_MS = 150;
const VELO_IOS = 0.4;
const VELO_ANDROID = 0.85;

/**
 * Pausa manual: el fondo se oscurece un 40 %, se desenfoca (en Android, un velo
 * `goma` al 85 %) y aparece «Pausa» con las acciones que ya habia (seguir y
 * salir). El anillo y el numero quedan congelados debajo. Se retira en 240 ms.
 */
export function OverlayPausa({ visible, hablando, onSeguir, onSalir }: {
  visible: boolean;
  hablando: boolean;
  onSeguir: () => void;
  onSalir: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(0);

  React.useEffect(() => {
    t.value = withTiming(visible ? 1 : 0, { duration: reducido ? REDUCIDO_MS : ENTRADA_MS });
  }, [visible, reducido]);

  const estilo = useAnimatedStyle(() => ({ opacity: t.value }), [tick]);

  return (
    <Animated.View style={[s.raiz, estilo]} pointerEvents={visible ? 'auto' : 'none'}>
      {Platform.OS === 'ios' ? <BlurView intensity={30} tint="dark" style={s.llena} /> : null}
      <View style={[s.llena, { backgroundColor: conAlfa(paleta.goma, Platform.OS === 'ios' ? VELO_IOS : VELO_ANDROID) }]} />
      <View style={s.contenido}>
        <Text style={s.titulo} accessibilityRole="header">Pausa</Text>
        <View style={s.acciones}>
          <BotonPlaca texto="Seguir" onPress={onSeguir} deshabilitado={hablando} />
          <BotonSecundario texto="Salir" onPress={onSalir} />
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  raiz: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 },
  llena: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  contenido: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: MARGEN_PANTALLA, gap: 32 },
  titulo: { fontFamily: familia.display, fontSize: 56, lineHeight: 56, color: paleta.magnesia },
  acciones: { alignSelf: 'stretch', gap: 12 },
});
