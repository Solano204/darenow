import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type AccessibilityActionEvent } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, tipo, familia, AREA_TACTIL_MIN, resorteTap, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { Odometro } from '../fx/Odometro';

const LADO_BOTON = AREA_TACTIL_MIN;
const ESCALA_PRESIONADO = 0.1;
const SACUDIDA_PX = 4;
const ANCHO_VALOR = 64;
const ESTILO_VALOR = { ...tipo.numero, fontSize: 24, lineHeight: 26, color: paleta.magnesia };

/**
 * Ajuste compacto de un numero: boton − y + de 44 px, el valor al centro en
 * Big Shoulders con ancho fijo y su unidad. El valor rueda al cambiar y se
 * puede tocar para escribirlo (se acota a `min` y `max` al terminar, igual que
 * antes). En un limite el boton se apaga, sacude 4 px y da un aviso.
 */
export function Stepper({ etiqueta, valor, min, max, paso = 1, sufijo, onCambio }: {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso?: number;
  sufijo?: string;
  onCambio: (v: number) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(String(valor));
  const sacudida = useSharedValue(0);
  const nombre = etiqueta.toLowerCase();
  const unidad = sufijo ? ` ${sufijo}` : '';

  useEffect(() => { if (!editando) setTexto(String(valor)); }, [valor, editando]);

  const sacudir = () => {
    haptico.aviso();
    if (reducido) return;
    sacudida.value = withSequence(
      withTiming(SACUDIDA_PX, { duration: 40 }), withTiming(-SACUDIDA_PX, { duration: 80 }),
      withTiming(SACUDIDA_PX, { duration: 80 }), withTiming(0, { duration: 40 }),
    );
  };
  const restar = () => { if (valor <= min) { sacudir(); return; } haptico.toque(); onCambio(Math.max(min, valor - paso)); };
  const sumar = () => { if (valor >= max) { sacudir(); return; } haptico.toque(); onCambio(Math.min(max, valor + paso)); };

  const confirmar = () => {
    const n = parseInt(texto, 10);
    const limpio = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : valor;
    setTexto(String(limpio));
    setEditando(false);
    if (limpio !== valor) onCambio(limpio);
  };

  const alAccesibilidad = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'increment') sumar();
    if (e.nativeEvent.actionName === 'decrement') restar();
  };

  const zonaValor = useAnimatedStyle(() => ({ transform: [{ translateX: sacudida.value }] }), [tick]);

  return (
    <View style={s.fila}>
      <BotonPaso icono="remove" etiqueta={`Restar ${nombre}`} apagado={valor <= min} onPress={restar} />
      <Animated.View style={[s.valor, zonaValor]}>
        {editando ? (
          <TextInput
            autoFocus value={texto}
            onChangeText={t => setTexto(t.replace(/[^0-9]/g, ''))}
            onEndEditing={confirmar} onSubmitEditing={confirmar}
            maxLength={String(max).length}
            keyboardType="number-pad" returnKeyType="done" keyboardAppearance="dark" selectionColor={paleta.placaAzul}
            style={s.entrada} maxFontSizeMultiplier={1.2} accessibilityLabel={`Escribir ${nombre}`}
          />
        ) : (
          <Pressable
            onPress={() => setEditando(true)}
            accessibilityRole="adjustable"
            accessibilityLabel={`${etiqueta}: ${valor}${unidad}`}
            accessibilityHint="Toca dos veces para escribir un número"
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={alAccesibilidad}
            style={s.zonaToque}
          >
            <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Odometro valor={valor} continuo estilo={ESTILO_VALOR} />
            </View>
          </Pressable>
        )}
        {sufijo ? <Text style={s.unidad}>{sufijo}</Text> : null}
      </Animated.View>
      <BotonPaso icono="add" etiqueta={`Sumar ${nombre}`} apagado={valor >= max} onPress={sumar} />
    </View>
  );
}

function BotonPaso({ icono, etiqueta, apagado, onPress }: {
  icono: 'add' | 'remove'; etiqueta: string; apagado: boolean; onPress: () => void;
}) {
  const presion = useSharedValue(0);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }] }));
  return (
    <Pressable
      onPressIn={() => { presion.value = withSpring(1, resorteTap); }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={onPress}
      accessibilityRole="button" accessibilityLabel={etiqueta} accessibilityState={{ disabled: apagado }}
    >
      <Animated.View style={[s.boton, apagado && s.botonApagado, estilo]}>
        <Ionicons name={icono} size={22} color={paleta.magnesia} />
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  boton: {
    width: LADO_BOTON, height: LADO_BOTON, borderRadius: LADO_BOTON / 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  botonApagado: { opacity: 0.4 },
  valor: { width: ANCHO_VALOR, minHeight: LADO_BOTON, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 2 },
  zonaToque: { minHeight: LADO_BOTON, justifyContent: 'center' },
  entrada: { ...ESTILO_VALOR, textAlign: 'center', padding: 0, minWidth: 40 },
  unidad: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 18, color: paleta.magnesia2 },
});
