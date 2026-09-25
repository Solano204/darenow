import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type AccessibilityActionEvent } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, tipo, familia, esp, resorteTap, resortePlaca, haptico } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { Odometro } from '../fx/Odometro';

const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const LADO_BOTON = 64;
const ESCALA_BOTON = 0.08;
const AMPLITUD_SACUDIDA = 4;
const TAMANO_NUMERO = 120;
const ESTILO_NUMERO = { ...tipo.reloj, fontSize: TAMANO_NUMERO, lineHeight: TAMANO_NUMERO, color: paleta.magnesia };

/**
 * Contador del cuestionario: numero enorme que rueda al sumar y restar,
 * botones de 64 px y, para los dias por semana, una barra de siete placas que
 * se cargan. El numero se puede tocar para escribirlo: mismo comportamiento
 * que antes (se acota a `min` y `max` al terminar de escribir).
 */
export function ContadorPlacas({ valor, min, max, sufijo, onCambio, semana }: {
  valor: number;
  min: number;
  max: number;
  sufijo?: string;
  onCambio: (n: number) => void;
  /** Muestra la semana de placas (solo para los dias por semana). */
  semana?: boolean;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(String(valor));
  const sacudida = useSharedValue(0);
  const resto = sufijo ? ` ${sufijo}` : '';

  useEffect(() => { if (!editando) setTexto(String(valor)); }, [valor, editando]);

  const sacudir = () => {
    haptico.aviso();
    if (reducido) return;
    sacudida.value = withSequence(
      withTiming(AMPLITUD_SACUDIDA, { duration: 40 }), withTiming(-AMPLITUD_SACUDIDA, { duration: 80 }),
      withTiming(AMPLITUD_SACUDIDA, { duration: 80 }), withTiming(0, { duration: 40 }),
    );
  };
  const restar = () => { if (valor <= min) sacudir(); else haptico.toque(); onCambio(Math.max(min, valor - 1)); };
  const sumar = () => { if (valor >= max) sacudir(); else haptico.toque(); onCambio(Math.min(max, valor + 1)); };

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

  const numero = useAnimatedStyle(() => ({ transform: [{ translateX: sacudida.value }] }), [tick]);

  return (
    <View style={s.raiz}>
      <Animated.View style={[s.zonaNumero, numero]}>
        {editando ? (
          <TextInput
            autoFocus
            value={texto}
            onChangeText={t => setTexto(t.replace(/[^0-9]/g, ''))}
            onEndEditing={confirmar} onSubmitEditing={confirmar}
            maxLength={String(max).length}
            keyboardType="number-pad" returnKeyType="done"
            keyboardAppearance="dark" selectionColor={paleta.placaAzul}
            style={[ESTILO_NUMERO, s.entrada]}
            maxFontSizeMultiplier={1.2} accessibilityLabel={`Escribir número${resto}`}
          />
        ) : (
          <Pressable
            onPress={() => setEditando(true)}
            accessibilityRole="adjustable"
            accessibilityLabel={`${valor}${resto}`}
            accessibilityHint="Toca dos veces para escribir un número"
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={alAccesibilidad}
          >
            <Odometro valor={valor} continuo estilo={ESTILO_NUMERO} />
          </Pressable>
        )}
      </Animated.View>
      {sufijo && <Text style={s.sufijo}>{sufijo}</Text>}

      <View style={s.botones}>
        <BotonCirculo icono="remove" etiqueta={`Restar${resto}`} apagado={valor <= min} onPress={restar} />
        <BotonCirculo icono="add" etiqueta={`Sumar${resto}`} apagado={valor >= max} onPress={sumar} />
      </View>

      {semana && (
        <View style={s.semana} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <View style={s.dias}>
            {INICIALES.map((l, n) => (
              <View key={n} style={s.dia}>
                <PlacaSemana activa={n < valor} />
                <Text style={s.inicial}>{l}</Text>
              </View>
            ))}
          </View>
          <Text style={s.pie}>Tú decides qué días; esto solo es cuántos.</Text>
        </View>
      )}
    </View>
  );
}

function BotonCirculo({ icono, etiqueta, apagado, onPress }: {
  icono: 'add' | 'remove'; etiqueta: string; apagado: boolean; onPress: () => void;
}) {
  const presion = useSharedValue(0);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - ESCALA_BOTON * presion.value }] }));
  return (
    <Pressable
      onPressIn={() => { presion.value = withSpring(1, resorteTap); }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={onPress}
      accessibilityRole="button" accessibilityLabel={etiqueta} accessibilityState={{ disabled: apagado }}
    >
      <Animated.View style={[s.boton, apagado && s.botonApagado, estilo]}>
        <Ionicons name={icono} size={24} color={paleta.magnesia} />
      </Animated.View>
    </Pressable>
  );
}

function PlacaSemana({ activa }: { activa: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(activa ? 1 : 0);

  useEffect(() => {
    t.value = reducido ? (activa ? 1 : 0) : withSpring(activa ? 1 : 0, { ...resortePlaca, overshootClamping: true });
  }, [activa, reducido]);

  const relleno = useAnimatedStyle(() => ({ transform: [{ scaleY: t.value }] }), [tick]);

  return (
    <View style={s.placa}>
      <Animated.View style={[StyleSheet.absoluteFill, s.placaLlena, relleno]} />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: esp.md },
  zonaNumero: { minHeight: TAMANO_NUMERO, alignItems: 'center', justifyContent: 'center' },
  entrada: { textAlign: 'center', padding: 0, minWidth: 120 },
  sufijo: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia2, marginTop: -esp.sm },
  botones: { flexDirection: 'row', gap: esp.lg, marginTop: esp.sm },
  boton: {
    width: LADO_BOTON, height: LADO_BOTON, borderRadius: LADO_BOTON / 2,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
    alignItems: 'center', justifyContent: 'center',
  },
  botonApagado: { opacity: 0.4 },
  semana: { alignItems: 'center', gap: esp.sm + 4, marginTop: esp.md },
  dias: { flexDirection: 'row', gap: esp.sm + 2 },
  dia: { alignItems: 'center', gap: 6 },
  placa: { width: 18, height: 56, borderRadius: 4, backgroundColor: paleta.gomaBorde, overflow: 'hidden' },
  placaLlena: { backgroundColor: paleta.placaAzul, transformOrigin: 'bottom' },
  inicial: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  pie: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
});
