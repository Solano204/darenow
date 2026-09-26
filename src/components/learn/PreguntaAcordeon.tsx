import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  LinearTransition, useAnimatedStyle, useSharedValue, withSpring, withTiming, type EntryExitAnimationFunction,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, resortePlaca, haptico } from '../../theme';
import { textoDePregunta } from '../../utils/presentacion';
import { partirInsignias, textoDeLectura } from '../../utils/aprender';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { InsigniaEvidencia } from '../ui/InsigniaEvidencia';

const ABRIR_MS = 260;
const CERRAR_MS = 200;
const DESPLAZAMIENTO_RESPUESTA_PX = 6;
/** La animacion de altura tarda 260 ms: la pantalla espera a que asiente para revisar si la respuesta cabe. */
const ESPERA_ASENTAR_MS = ABRIR_MS + 40;
/**
 * Las palabras «Comprobado», «Parcial» y «Mito» de una respuesta se ven como insignias en linea. Si
 * en un telefono rompen el salto de linea, se apaga aqui y la respuesta vuelve a ser texto corrido.
 */
const INSIGNIAS_EN_LINEA = true;

const transicion = LinearTransition.duration(ABRIR_MS);
const entra: EntryExitAnimationFunction = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: -DESPLAZAMIENTO_RESPUESTA_PX }] },
    animations: {
      opacity: withTiming(1, { duration: ABRIR_MS }),
      transform: [{ translateY: withTiming(0, { duration: ABRIR_MS }) }],
    },
  };
};
const sale: EntryExitAnimationFunction = () => {
  'worklet';
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: CERRAR_MS }),
      transform: [{ translateY: withTiming(-DESPLAZAMIENTO_RESPUESTA_PX, { duration: CERRAR_MS }) }],
    },
  };
};

/**
 * Una pregunta frecuente con su respuesta desplegable. Cerrada: la pregunta en Figtree 600 de 17/24
 * (hasta 3 lineas) y un «+» de 18 px en un area de 44. Abierta: la pregunta pasa a Big Shoulders 700 de
 * 20, el «+» gira 45 grados y se vuelve «×», y la respuesta baja con un fundido y un filo de 2 px a
 * su izquierda mientras la fila crece en altura (260 ms). Cada pregunta se abre y se cierra sola,
 * como siempre. Con movimiento reducido no hay animacion de altura ni giro: el «+» cambia a «×».
 * `onAbierta` avisa (con la fila) cuando ya asento, para que la lista la traiga a la vista.
 */
export function PreguntaAcordeon({ pregunta, respuesta, onAbierta }: {
  pregunta: string;
  respuesta: string;
  onAbierta: (fila: View | null) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [abierta, setAbierta] = useState(false);
  const fila = useRef<View>(null);
  const giro = useSharedValue(0);
  const texto = textoDePregunta(pregunta);

  useEffect(() => {
    if (reducido) return;
    giro.value = withSpring(abierta ? 1 : 0, resortePlaca);
  }, [abierta, reducido]);

  const icono = useAnimatedStyle(() => ({ transform: [{ rotate: `${45 * giro.value}deg` }] }), [tick]);

  const alternar = () => {
    haptico.seleccion();
    const abre = !abierta;
    setAbierta(abre);
    if (abre) setTimeout(() => onAbierta(fila.current), reducido ? 0 : ESPERA_ASENTAR_MS);
  };

  return (
    <Animated.View ref={fila} layout={reducido ? undefined : transicion} style={s.fila}>
      <Pressable
        onPress={alternar} style={s.cabeza}
        accessibilityRole="button" accessibilityLabel={texto} accessibilityState={{ expanded: abierta }}
      >
        <Text style={[s.pregunta, abierta && s.preguntaAbierta]} numberOfLines={abierta ? undefined : 3} maxFontSizeMultiplier={1.3}>
          {texto}
        </Text>
        <View style={s.zona} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {reducido ? (
            <Ionicons name={abierta ? 'close' : 'add'} size={18} color={paleta.magnesia2} />
          ) : (
            <Animated.View style={icono}><Ionicons name="add" size={18} color={paleta.magnesia2} /></Animated.View>
          )}
        </View>
      </Pressable>
      {abierta && (
        <Animated.View entering={reducido ? undefined : entra} exiting={reducido ? undefined : sale} style={s.respuesta}>
          <Respuesta texto={textoDeLectura(respuesta)} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** La respuesta en Figtree 16/25; si nombra un veredicto, esa palabra sale como su insignia. El lector oye el texto completo. */
function Respuesta({ texto }: { texto: string }) {
  return (
    <Text style={s.respuestaTexto} accessibilityLabel={texto} maxFontSizeMultiplier={1.3}>
      {INSIGNIAS_EN_LINEA
        ? partirInsignias(texto).map((trozo, i) => (typeof trozo === 'string'
          ? trozo
          : <InsigniaEvidencia key={i} tipo={trozo.tipo} pequena />))
        : texto}
    </Text>
  );
}

const s = StyleSheet.create({
  fila: { borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, paddingVertical: 8 },
  pregunta: { flex: 1, fontFamily: familia.enfasis, fontSize: 17, lineHeight: 24, color: paleta.magnesia },
  preguntaAbierta: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24 },
  zona: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  respuesta: { borderLeftWidth: 2, borderLeftColor: paleta.magnesia3, paddingLeft: 14, marginBottom: 16 },
  respuestaTexto: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 25, color: paleta.magnesia2 },
});
