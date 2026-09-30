import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, resorteMagnesia, haptico } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';

const ALTO_BUSCADOR = 52;
const RADIO = 16;
const PADDING_X = 16;
const ANCHO_ICONO = 20;
const SEPARACION = 10;
const FUNDIDO_REDUCIDO_MS = 150;
const AREA_LIMPIAR = 44;

/** Texto por defecto del placeholder nativo, fijo y sin animación. */
const PLACEHOLDER_COMPLETO = 'Buscar ejercicio, rutina, músculo';

/**
 * Campo de busqueda de 52 px con el placeholder nativo del TextInput, estatico.
 * Al enfocar, el borde pasa a un aro azul de 2 px y `foco` sube a 1 con
 * `resorteMagnesia` para que la pantalla pliegue su titulo. La X que borra el
 * texto es la de iOS de siempre, ahora propia y tambien en Android.
 */
export function BuscadorVivo({ valor, onCambio, foco, placeholder }: {
  valor: string;
  onCambio: (texto: string) => void;
  foco: SharedValue<number>;
  /** Texto fijo del placeholder; por defecto el completo. */
  placeholder?: string;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();

  const aro = useAnimatedStyle(() => ({ opacity: foco.value }), [tick]);
  const vacio = valor === '';

  const cambiarFoco = (v: boolean) => {
    foco.value = reducido
      ? withTiming(v ? 1 : 0, { duration: FUNDIDO_REDUCIDO_MS })
      : withSpring(v ? 1 : 0, resorteMagnesia);
  };

  return (
    <View style={s.caja}>
      <Ionicons name="search-outline" size={ANCHO_ICONO} color={paleta.magnesia2} />
      <TextInput
        value={valor} onChangeText={onCambio}
        style={s.campo} placeholder={placeholder ?? PLACEHOLDER_COMPLETO} placeholderTextColor={paleta.magnesia3}
        cursorColor={paleta.placaAzul} selectionColor={paleta.placaAzul}
        onFocus={() => cambiarFoco(true)} onBlur={() => cambiarFoco(false)}
        keyboardAppearance="dark"
      />
      {!vacio && (
        <Pressable
          onPress={() => { haptico.toque(); onCambio(''); }}
          accessibilityRole="button" accessibilityLabel="Borrar búsqueda" style={s.limpiar}
        >
          <Ionicons name="close-circle" size={18} color={paleta.magnesia3Texto} />
        </Pressable>
      )}
      <Animated.View style={[s.aro, aro]} pointerEvents="none" />
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    height: ALTO_BUSCADOR, borderRadius: RADIO, paddingHorizontal: PADDING_X, flexDirection: 'row', alignItems: 'center',
    gap: SEPARACION, backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  campo: { flex: 1, height: ALTO_BUSCADOR, padding: 0, fontFamily: familia.cuerpo, fontSize: 16, color: paleta.magnesia },
  aro: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: RADIO, borderWidth: 2, borderColor: paleta.placaAzul },
  limpiar: { width: AREA_LIMPIAR, height: AREA_LIMPIAR, marginRight: -14, alignItems: 'center', justifyContent: 'center' },
});
