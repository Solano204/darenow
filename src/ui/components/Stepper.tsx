import { Pressable, StyleSheet, Text, TextInput, View, type AccessibilityActionEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, tipo, familia, AREA_TACTIL_MIN, resorteTap, haptico } from '@/ui/theme';
import { useNumeroEditable, useSacudida } from '@/ui/hooks/useNumeroEditable';
import { Odometro } from '@/ui/fx/Odometro';

const LADO_BOTON = AREA_TACTIL_MIN;
const LADO_BOTON_COMPACTO = 36;
const ESCALA_PRESIONADO = 0.1;
const SACUDIDA_PX = 4;
const ANCHO_VALOR = 64;
const ESTILO_VALOR = { ...tipo.numero, fontSize: 24, lineHeight: 26, color: paleta.magnesia };
const ESTILO_VALOR_COMPACTO = { ...tipo.numero, fontSize: 22, lineHeight: 24, color: paleta.magnesia };
/** Los botones de 36 llegan a 44 de area; el valor, a 44 de alto. */
const MARGEN_BOTON_COMPACTO = { top: 4, bottom: 4, left: 2, right: 2 };
const MARGEN_VALOR_COMPACTO = { top: 6, bottom: 6 };

/**
 * Ajuste compacto de un numero: boton − y + de 44 px, el valor al centro en
 * Big Shoulders con ancho fijo y su unidad. El valor rueda al cambiar y se
 * puede tocar para escribirlo (se acota a `min` y `max` al terminar, igual que
 * antes). En un limite el boton se apaga, sacude 4 px y da un aviso.
 *
 * `compacto` es la version de las tarjetas del editor de rutinas, donde tres ajustes
 * comparten fila: botones de 36 (con margen tactil hasta 44) bajo el valor de 22, en vez
 * de a sus lados.
 */
export function Stepper({ etiqueta, valor, min, max, paso = 1, sufijo, compacto, onCambio }: {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso?: number;
  sufijo?: string;
  compacto?: boolean;
  onCambio: (v: number) => void;
}) {
  const { editando, setEditando, texto, setTexto, confirmar } = useNumeroEditable(valor, min, max, onCambio);
  const { sacudir, estilo: zonaValor } = useSacudida(SACUDIDA_PX);
  const nombre = etiqueta.toLowerCase();
  const unidad = sufijo ? ` ${sufijo}` : '';

  const restar = () => { if (valor <= min) { sacudir(); return; } haptico.toque(); onCambio(Math.max(min, valor - paso)); };
  const sumar = () => { if (valor >= max) { sacudir(); return; } haptico.toque(); onCambio(Math.min(max, valor + paso)); };

  const alAccesibilidad = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'increment') sumar();
    if (e.nativeEvent.actionName === 'decrement') restar();
  };

  const estiloValor = compacto ? ESTILO_VALOR_COMPACTO : ESTILO_VALOR;
  const lado = compacto ? LADO_BOTON_COMPACTO : LADO_BOTON;

  const zona = (
    <Animated.View style={[compacto ? s.valorCompacto : s.valor, zonaValor]}>
      {editando ? (
        <TextInput
          autoFocus value={texto}
          onChangeText={t => setTexto(t.replace(/[^0-9]/g, ''))}
          onEndEditing={confirmar} onSubmitEditing={confirmar}
          maxLength={String(max).length}
          keyboardType="number-pad" returnKeyType="done" keyboardAppearance="dark" selectionColor={paleta.placaAzul}
          style={[s.entrada, estiloValor, compacto && s.entradaCompacta]} maxFontSizeMultiplier={1.2}
          accessibilityLabel={`Escribir ${nombre}`}
        />
      ) : (
        <Pressable
          onPress={() => setEditando(true)}
          accessibilityRole="adjustable"
          accessibilityLabel={`${etiqueta}: ${valor}${unidad}`}
          accessibilityHint="Toca dos veces para escribir un número"
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={alAccesibilidad}
          style={compacto ? s.zonaToqueCompacta : s.zonaToque} hitSlop={compacto ? MARGEN_VALOR_COMPACTO : undefined}
        >
          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Odometro valor={valor} continuo estilo={estiloValor} />
          </View>
        </Pressable>
      )}
      {sufijo ? <Text style={[s.unidad, compacto && s.unidadCompacta]}>{sufijo}</Text> : null}
    </Animated.View>
  );
  const restarBoton = <BotonPaso lado={lado} icono="remove" etiqueta={`Restar ${nombre}`} apagado={valor <= min} onPress={restar} />;
  const sumarBoton = <BotonPaso lado={lado} icono="add" etiqueta={`Sumar ${nombre}`} apagado={valor >= max} onPress={sumar} />;

  if (compacto) {
    return (
      <View style={s.columna}>
        {zona}
        <View style={s.pasos}>{restarBoton}{sumarBoton}</View>
      </View>
    );
  }
  return <View style={s.fila}>{restarBoton}{zona}{sumarBoton}</View>;
}

function BotonPaso({ lado, icono, etiqueta, apagado, onPress }: {
  lado: number; icono: 'add' | 'remove'; etiqueta: string; apagado: boolean; onPress: () => void;
}) {
  const presion = useSharedValue(0);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - ESCALA_PRESIONADO * presion.value }] }));
  return (
    <Pressable
      onPressIn={() => { presion.set(withSpring(1, resorteTap)); }}
      onPressOut={() => { presion.set(withSpring(0, resorteTap)); }}
      onPress={onPress} hitSlop={lado < LADO_BOTON ? MARGEN_BOTON_COMPACTO : undefined}
      accessibilityRole="button" accessibilityLabel={etiqueta} accessibilityState={{ disabled: apagado }}
    >
      <Animated.View style={[s.boton, { width: lado, height: lado, borderRadius: lado / 2 }, apagado && s.botonApagado, estilo]}>
        <Ionicons name={icono} size={lado < LADO_BOTON ? 20 : 22} color={paleta.magnesia} />
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  columna: { alignItems: 'center', gap: 6 },
  pasos: { flexDirection: 'row', gap: 4 },
  boton: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  botonApagado: { opacity: 0.4 },
  valor: { width: ANCHO_VALOR, minHeight: LADO_BOTON, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 2 },
  valorCompacto: { minHeight: 32, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 2 },
  zonaToque: { minHeight: LADO_BOTON, justifyContent: 'center' },
  zonaToqueCompacta: { minHeight: 32, justifyContent: 'center' },
  entrada: { textAlign: 'center', padding: 0, minWidth: 40 },
  entradaCompacta: { minWidth: 32 },
  unidad: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 18, color: paleta.magnesia2 },
  unidadCompacta: { fontSize: 13 },
});
