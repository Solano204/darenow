import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { cancelAnimation, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { paleta, tipo, MARGEN_PANTALLA, easing } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hoy } from '../../store/store';
import { Huella } from '../fx/Huella';

const LADO_CELDA = 44;
const GROSOR_ANILLO = 2;
const INICIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const RETRASO_ANILLO_MS = 400;
const DIBUJO_ANILLO_MS = 700;

/**
 * Los ultimos siete dias en siete columnas. Un dia con sesion lleva una huella
 * de mano; hoy lleva un anillo azul que se dibuja al aparecer; los dias sin
 * sesion son un circulo apagado, sin cruces ni rojos: aqui no se castiga a
 * nadie. Mismos datos que la grafica de barras (`ultimos7`).
 */
export function FilaSemana({ semana }: { semana: { fecha: string; min: number }[] }) {
  const hoyStr = hoy();
  return (
    <View style={s.fila}>
      {semana.map(d => <Dia key={d.fecha} fecha={d.fecha} min={d.min} esHoy={d.fecha === hoyStr} />)}
    </View>
  );
}

function Dia({ fecha, min, esHoy }: { fecha: string; min: number; esHoy: boolean }) {
  const f = new Date(fecha + 'T00:00:00');
  const dow = f.getDay();
  const numero = f.getDate();
  const entreno = min > 0;
  const etiqueta = `${NOMBRES[dow]} ${numero}${esHoy ? ', hoy' : ''}, ${entreno ? `entrenaste ${min} minutos` : 'sin sesión'}`;

  return (
    <View style={s.dia} accessible accessibilityLabel={etiqueta}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={s.dia}>
        <Text style={s.inicial}>{INICIALES[dow]}</Text>
        <View style={s.celda}>
          {esHoy && <AnilloHoy />}
          {entreno ? <Huella lado={26} /> : !esHoy && <View style={s.vacia} />}
        </View>
        <Text style={[s.numero, esHoy && s.numeroHoy]}>{numero}</Text>
      </View>
    </View>
  );
}

/** Anillo azul de hoy: se dibuja de 0 a 360 grados desde arriba. Con movimiento reducido ya esta dibujado. */
function AnilloHoy() {
  const reducido = useReducedMotion();
  const fin = useSharedValue(reducido ? 1 : 0);
  const camino = useMemo(
    () => Skia.PathBuilder.Make().addCircle(LADO_CELDA / 2, LADO_CELDA / 2, LADO_CELDA / 2 - GROSOR_ANILLO).detach(),
    [],
  );

  useEffect(() => {
    if (reducido) { fin.value = 1; return; }
    fin.value = withDelay(RETRASO_ANILLO_MS, withTiming(1, { duration: DIBUJO_ANILLO_MS, easing: easing.salida }));
    return () => cancelAnimation(fin);
  }, [reducido]);

  return (
    <View style={s.anillo} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={[{ rotate: -Math.PI / 2 }]} origin={{ x: LADO_CELDA / 2, y: LADO_CELDA / 2 }}>
          <Path
            path={camino} style="stroke" strokeWidth={GROSOR_ANILLO} strokeCap="round"
            color={paleta.placaAzul} start={0} end={fin}
          />
        </Group>
      </Canvas>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', paddingHorizontal: MARGEN_PANTALLA - 4 },
  dia: { flex: 1, alignItems: 'center', gap: 6 },
  inicial: { ...tipo.etiqueta, color: paleta.magnesia3Texto },
  celda: { width: LADO_CELDA, height: LADO_CELDA, alignItems: 'center', justifyContent: 'center' },
  anillo: { position: 'absolute', top: 0, left: 0, width: LADO_CELDA, height: LADO_CELDA },
  vacia: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: paleta.gomaBorde },
  numero: { ...tipo.dato, color: paleta.magnesia3Texto },
  numeroHoy: { color: paleta.magnesia },
});
