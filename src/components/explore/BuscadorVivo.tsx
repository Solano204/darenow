import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, easing, resorteMagnesia, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';

export const ALTO_BUSCADOR = 52;
const RADIO = 16;
const PADDING_X = 16;
const ANCHO_ICONO = 20;
const SEPARACION = 10;
const ALTO_LINEA = 24;
const CADA_MS = 2500;
const RODAR_MS = 380;
const FUNDIDO_REDUCIDO_MS = 150;
const AREA_LIMPIAR = 44;

const PALABRAS = ['ejercicio', 'rutina', 'músculo'] as const;
/** Se repite la primera al final: al llegar a ella el modulo devuelve la columna al principio sin que se note. */
const COLUMNA = [...PALABRAS, PALABRAS[0]];

/** El texto de siempre: lo lee el lector de pantalla y es lo que se ve con movimiento reducido. */
export const PLACEHOLDER_COMPLETO = 'Buscar ejercicio, rutina, músculo';

/**
 * Campo de busqueda de 52 px. Con el campo vacio y sin enfocar, la palabra final
 * del placeholder rueda en vertical cada 2.5 s entre ejercicio, rutina y musculo
 * (el placeholder real, `PLACEHOLDER_COMPLETO`, es la etiqueta de accesibilidad y
 * lo que se ve con movimiento reducido). Al enfocar, el borde pasa a un aro azul
 * de 2 px y `foco` sube a 1 con `resorteMagnesia` para que la pantalla pliegue su
 * titulo. La X que borra el texto es la de iOS de siempre, ahora propia y tambien
 * en Android.
 */
export function BuscadorVivo({ valor, onCambio, foco }: {
  valor: string;
  onCambio: (texto: string) => void;
  foco: SharedValue<number>;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [enfocado, setEnfocado] = useState(false);

  const aro = useAnimatedStyle(() => ({ opacity: foco.value }), [tick]);
  const vacio = valor === '';

  const cambiarFoco = (v: boolean) => {
    setEnfocado(v);
    foco.value = reducido
      ? withTiming(v ? 1 : 0, { duration: FUNDIDO_REDUCIDO_MS })
      : withSpring(v ? 1 : 0, resorteMagnesia);
  };

  return (
    <View style={s.caja}>
      <Ionicons name="search-outline" size={ANCHO_ICONO} color={paleta.magnesia2} />
      <TextInput
        value={valor} onChangeText={onCambio}
        style={s.campo} placeholder="" cursorColor={paleta.placaAzul} selectionColor={paleta.placaAzul}
        onFocus={() => cambiarFoco(true)} onBlur={() => cambiarFoco(false)}
        keyboardAppearance="dark" accessibilityLabel={PLACEHOLDER_COMPLETO}
      />
      {vacio && <Placeholder animado={!reducido} girando={!enfocado} />}
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

/**
 * Texto de guia sobre el campo vacio; no recibe toques y no lo lee el lector de pantalla.
 * Al enfocar (`girando` en false) deja de rodar donde este, sin saltar: la animacion en
 * curso termina y ya no se programa otra.
 */
function Placeholder({ animado, girando }: { animado: boolean; girando: boolean }) {
  const tick = useTick();
  const pos = useSharedValue(0);
  const paso = useRef(0);

  useEffect(() => {
    if (!animado || !girando) return;
    const id = setInterval(() => {
      paso.current += 1;
      pos.value = withTiming(paso.current, { duration: RODAR_MS, easing: easing.salida });
    }, CADA_MS);
    return () => clearInterval(id);
  }, [animado, girando]);

  const columna = useAnimatedStyle(() => ({
    transform: [{ translateY: -(pos.value % PALABRAS.length) * ALTO_LINEA }],
  }), [tick]);

  return (
    <View style={s.guia} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {animado ? (
        <>
          <Text style={s.guiaTexto}>Buscar </Text>
          <View style={s.ventana}>
            <Animated.View style={columna}>
              {COLUMNA.map((p, i) => <Text key={i} style={s.guiaTexto}>{p}</Text>)}
            </Animated.View>
          </View>
        </>
      ) : (
        <Text style={s.guiaTexto}>{PLACEHOLDER_COMPLETO}</Text>
      )}
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
  guia: {
    position: 'absolute', left: PADDING_X + ANCHO_ICONO + SEPARACION, top: 0, bottom: 0, right: PADDING_X,
    flexDirection: 'row', alignItems: 'center',
  },
  ventana: { height: ALTO_LINEA, overflow: 'hidden' },
  guiaTexto: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: ALTO_LINEA, color: paleta.magnesia3Texto },
});
