import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type AccessibilityActionEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, tipo, familia, esp, resorteTap, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { useNumeroEditable, useSacudida } from '@/ui/hooks/useNumeroEditable';
import { Odometro } from '@/ui/fx/Odometro';

const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const LADO_BOTON = 64;
const LADO_BOTON_COMPACTO = 56;
const ESCALA_BOTON = 0.08;
const AMPLITUD_SACUDIDA = 4;
const TAMANO_NUMERO = 120;
const TAMANO_NUMERO_COMPACTO = 56;
const estiloDelNumero = (tamano: number) => ({ ...tipo.reloj, fontSize: tamano, lineHeight: tamano, color: paleta.magnesia });

/**
 * Contador del cuestionario: numero enorme que rueda al sumar y restar,
 * botones de 64 px y, para los dias por semana, una barra de siete placas que
 * se cargan. El numero se puede tocar para escribirlo: mismo comportamiento
 * que antes (se acota a `min` y `max` al terminar de escribir). `compacto` es
 * el tamano medio de Ajustes (numero de 56, botones de 56), `encima` lo que va
 * sobre el numero (el dial de los minutos) y `estilo` sustituye el `flex: 1`
 * de la raiz para usarlo dentro de una pantalla que se desplaza.
 */
export function ContadorPlacas({ valor, min, max, sufijo, onCambio, semana, compacto, encima, estilo }: {
  valor: number;
  min: number;
  max: number;
  sufijo?: string;
  onCambio: (n: number) => void;
  /** Muestra la semana de placas (solo para los dias por semana). */
  semana?: boolean;
  compacto?: boolean;
  encima?: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
}) {
  const { editando, setEditando, texto, setTexto, confirmar } = useNumeroEditable(valor, min, max, onCambio);
  const { sacudir, estilo: numero } = useSacudida(AMPLITUD_SACUDIDA);
  const resto = sufijo ? ` ${sufijo}` : '';
  const tamanoNumero = compacto ? TAMANO_NUMERO_COMPACTO : TAMANO_NUMERO;
  const lado = compacto ? LADO_BOTON_COMPACTO : LADO_BOTON;
  const estiloNumero = estiloDelNumero(tamanoNumero);

  const restar = () => { if (valor <= min) sacudir(); else haptico.toque(); onCambio(Math.max(min, valor - 1)); };
  const sumar = () => { if (valor >= max) sacudir(); else haptico.toque(); onCambio(Math.min(max, valor + 1)); };

  const alAccesibilidad = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'increment') sumar();
    if (e.nativeEvent.actionName === 'decrement') restar();
  };

  return (
    <View style={[s.raiz, estilo]}>
      {encima}
      <Animated.View style={[s.zonaNumero, { minHeight: tamanoNumero }, numero]}>
        {editando ? (
          <TextInput
            autoFocus
            value={texto}
            onChangeText={t => setTexto(t.replace(/[^0-9]/g, ''))}
            onEndEditing={confirmar} onSubmitEditing={confirmar}
            maxLength={String(max).length}
            keyboardType="number-pad" returnKeyType="done"
            keyboardAppearance="dark" selectionColor={paleta.placaAzul}
            style={[estiloNumero, s.entrada, compacto && s.entradaCompacta]}
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
            <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Odometro valor={valor} continuo estilo={estiloNumero} />
            </View>
          </Pressable>
        )}
      </Animated.View>
      {sufijo && <Text style={s.sufijo}>{sufijo}</Text>}

      <View style={s.botones}>
        <BotonCirculo icono="remove" lado={lado} etiqueta={`Restar${resto}`} apagado={valor <= min} onPress={restar} />
        <BotonCirculo icono="add" lado={lado} etiqueta={`Sumar${resto}`} apagado={valor >= max} onPress={sumar} />
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

function BotonCirculo({ icono, lado, etiqueta, apagado, onPress }: {
  icono: 'add' | 'remove'; lado: number; etiqueta: string; apagado: boolean; onPress: () => void;
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
      <Animated.View style={[s.boton, { width: lado, height: lado, borderRadius: lado / 2 }, apagado && s.botonApagado, estilo]}>
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
  zonaNumero: { alignItems: 'center', justifyContent: 'center' },
  entrada: { textAlign: 'center', padding: 0, minWidth: 120 },
  entradaCompacta: { minWidth: 64 },
  sufijo: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia2, marginTop: -esp.sm },
  botones: { flexDirection: 'row', gap: esp.lg, marginTop: esp.sm },
  boton: {
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
