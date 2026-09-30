import React, { useEffect, useRef, useState } from 'react';
import { PixelRatio, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { easing, resortePlaca } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

const CELDAS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const DURACION_COLUMNA = 700;
const ESCALONADO = 80;
const ASENTAMIENTO_MS = 90;
const SOBREIMPULSO = 0.06;
const DESVANECER_MS = 220;
const ESCALA_MAX = 1.2;

const digitosDe = (n: number, columnas: number): number[] =>
  String(Math.max(0, Math.round(n))).padStart(columnas, '0').split('').map(Number);

/**
 * Posicion final de una columna. Sin `desde` rueda hacia adelante desde 0 y
 * siempre recorre al menos cinco digitos (los que quedan cerca de 0 dan una
 * vuelta mas, asi un valor de un digito tambien se nota). Con `desde` rueda
 * de un digito al otro; si son iguales, da una vuelta hacia atras.
 */
function destinoDe(inicio: number, fin: number, hayDesde: boolean): number {
  if (!hayDesde) return fin < 5 ? fin + 10 : fin;
  return inicio === fin ? fin - 10 : fin;
}

interface Props {
  valor: number;
  /** Valor inicial para una cuenta atras (45 -> 5). Sin el, rueda desde 0. */
  desde?: number;
  /** Arranca cuando pasa a true. Con `animar=false` muestra el valor final ya puesto. */
  activo?: boolean;
  animar?: boolean;
  retraso?: number;
  duracionColumna?: number;
  /** Con `desde`, oculta los ceros a la izquierda del valor final y recentra (45 -> 5). */
  ocultarCerosIzq?: boolean;
  /**
   * Contador: tras la primera entrada, cada cambio de `valor` mueve solo las columnas
   * que cambian, hacia arriba si el valor sube y hacia abajo si baja, con `resortePlaca`.
   */
  continuo?: boolean;
  estilo: StyleProp<TextStyle>;
}

/**
 * Numeros que ruedan digito por digito. Cada digito es una columna 0 a 9 con
 * su propia animacion, escalonada 80 ms, con un asentamiento al final. El
 * ancho de celda se mide con el digito mas ancho (Big Shoulders no trae
 * tabular-nums), asi el numero no baila mientras rueda.
 */
export function Odometro({
  valor, desde, activo = true, animar = true, retraso = 0,
  duracionColumna = DURACION_COLUMNA, ocultarCerosIzq, continuo, estilo,
}: Props) {
  const reducido = useReducedMotion();
  const plano = StyleSheet.flatten(estilo) ?? {};
  const escalaFuente = Math.min(PixelRatio.getFontScale(), ESCALA_MAX);
  const alto = Math.round((plano.lineHeight ?? (plano.fontSize ?? 16) * 1.25) * escalaFuente);
  const [celda, setCelda] = useState(0);

  const columnas = Math.max(String(valor).length, desde !== undefined ? String(desde).length : 0);
  const fin = digitosDe(valor, columnas);
  const inicio = desde !== undefined ? digitosDe(desde, columnas) : fin.map(() => 0);
  const ceros = ocultarCerosIzq ? fin.findIndex(d => d !== 0) : 0;
  const cerosIzq = ceros < 0 ? columnas - 1 : ceros;
  const estatico = reducido || !animar;
  // Hacia donde giran los digitos: el sentido del ultimo cambio de valor.
  const [ultimo, setUltimo] = useState({ valor, sentido: 1 });
  if (valor !== ultimo.valor) setUltimo({ valor, sentido: valor >= ultimo.valor ? 1 : -1 });
  const sentido = valor !== ultimo.valor ? (valor >= ultimo.valor ? 1 : -1) : ultimo.sentido;

  const desplazamiento = useSharedValue(0);
  useEffect(() => {
    if (cerosIzq === 0) return;
    const meta = -(cerosIzq * celda) / 2;
    if (estatico || !activo) { desplazamiento.set(estatico ? meta : 0); return; }
    const total = retraso + (columnas - 1) * ESCALONADO + duracionColumna + ASENTAMIENTO_MS;
    desplazamiento.set(withDelay(total, withTiming(meta, { duration: DESVANECER_MS, easing: easing.salida })));
    return () => cancelAnimation(desplazamiento);
  }, [estatico, activo, celda, cerosIzq]);

  const estiloFila = useAnimatedStyle(() => ({ transform: [{ translateX: desplazamiento.value }] }));

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={String(valor)}
      style={{ height: alto }}
    >
      <Text
        style={[estilo, s.medidor]}
        maxFontSizeMultiplier={ESCALA_MAX}
        onLayout={e => setCelda(Math.ceil(e.nativeEvent.layout.width))}
        importantForAccessibility="no-hide-descendants"
      >
        8
      </Text>
      {celda > 0 && (
        <Animated.View style={[s.fila, estiloFila]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {fin.map((d, c) => (
            <Columna
              key={continuo ? `${columnas}-${c}` : c}
              indice={c}
              inicio={inicio[c]}
              fin={d}
              destino={destinoDe(inicio[c], d, desde !== undefined)}
              oculta={c < cerosIzq}
              activo={activo}
              estatico={estatico}
              retraso={retraso + c * ESCALONADO}
              duracion={duracionColumna}
              alto={alto}
              ancho={celda}
              continuo={!!continuo}
              animarCambios={!reducido}
              sentido={sentido}
              estilo={estilo}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

function Columna({ inicio, fin, destino, oculta, activo, estatico, retraso, duracion, alto, ancho, continuo, animarCambios, sentido, estilo }: {
  indice: number; inicio: number; fin: number; destino: number; oculta: boolean; activo: boolean;
  estatico: boolean; retraso: number; duracion: number; alto: number; ancho: number;
  continuo: boolean;
  /** Un cambio de valor posterior a la entrada rueda aunque la entrada no se animara (solo movimiento reducido lo salta). */
  animarCambios: boolean;
  sentido: number; estilo: StyleProp<TextStyle>;
}) {
  const pos = useSharedValue(estatico ? fin : inicio);
  const visible = useSharedValue(1);
  const objetivo = useRef(estatico ? fin : destino);
  const finPrevio = useRef(fin);
  const primera = useRef(true);

  useEffect(() => {
    objetivo.current = estatico ? fin : destino;
    if (estatico) { pos.set(fin); visible.set(oculta ? 0 : 1); return; }
    pos.set(inicio);
    visible.set(1);
    if (!activo) return;
    const sentido = destino >= inicio ? 1 : -1;
    pos.set(withDelay(retraso, withSequence(
      withTiming(destino + sentido * SOBREIMPULSO, { duration: duracion, easing: easing.salida }),
      withTiming(destino, { duration: ASENTAMIENTO_MS }),
    )));
    if (oculta) visible.set(withDelay(retraso + duracion + ASENTAMIENTO_MS, withTiming(0, { duration: DESVANECER_MS })));
    return () => { cancelAnimation(pos); cancelAnimation(visible); };
  }, continuo ? [estatico, activo] : [estatico, activo, destino, inicio, fin, oculta]);

  useEffect(() => {
    if (!continuo) return;
    if (primera.current) { primera.current = false; finPrevio.current = fin; return; }
    const delta = sentido >= 0 ? (fin - finPrevio.current + 10) % 10 : -((finPrevio.current - fin + 10) % 10);
    finPrevio.current = fin;
    if (delta === 0) return;
    objetivo.current += delta;
    pos.set(animarCambios ? withSpring(objetivo.current, { ...resortePlaca, overshootClamping: true }) : objetivo.current);
  }, [fin]);

  const columna = useAnimatedStyle(() => {
    const p = ((pos.value % 10) + 10) % 10;
    return { opacity: visible.value, transform: [{ translateY: -p * alto }] };
  });

  return (
    <View style={{ width: ancho, height: alto, overflow: 'hidden' }}>
      <Animated.View style={columna}>
        {CELDAS.map((n, i) => (
          <Text key={i} style={[estilo, { width: ancho, height: alto, textAlign: 'center' }]} maxFontSizeMultiplier={ESCALA_MAX}>{n}</Text>
        ))}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row' },
  medidor: { position: 'absolute', opacity: 0, left: 0, top: 0 },
});
