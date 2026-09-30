import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Easing, runOnJS, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { paleta, familia, haptico, MARGEN_PANTALLA } from '@/ui/theme';
import { hoy } from '@/state/store';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { fechaLocal } from '@/lib/fechas';
import { placasPorDia, resumenDeSemana, semanaEnCero, MAX_PLACAS_DIA } from '@/lib/perfil';
import { ALTO_MAPA, ALTO_PLACA, SEPARACION_PLACA, PASO_PLACA, geometriaMapa } from './disposicionMapa';
import { acumuladosPrevios } from '@/lib/acumulados';

const ALTO_COMPACTO = 64;
/** Las placas que caben en 64 px: la version compacta lleva esas como maximo, en lugar de las 12 del alto completo. */
const PLACAS_COMPACTO = Math.floor((ALTO_COMPACTO + SEPARACION_PLACA) / PASO_PLACA);
const ALTO_LETRAS = 26;
const PISO_PX = 2;
const CAIDA_MS = 380;
const ENTRE_PLACAS_MS = 25;
const ENTRE_DIAS_MS = 40;
const RADIO_PLACA = 2;
const INICIALES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/**
 * Los ultimos siete dias como el mapa de carga de la Parte 9: cada dia es una pila de placas (discos de
 * 8 px con 2 de separacion, dibujados con Skia); mas minutos, mas placas, a escala de la semana. Un dia
 * sin actividad es solo un piso de 2 px en `gomaBorde`, sin color de alerta. Hoy lleva su letra en
 * `magnesia` y un punto azul de 4 px; los demas, la letra en `magnesia3`. Si toda la semana esta en cero
 * baja a 64 px (los pisos y las letras) para no dejar un hueco.
 *
 * Al entrar en pantalla (`activo`, una vez) las placas caen dia por dia de izquierda a derecha, 25 ms
 * entre placas, con un solo golpe Medium al asentarse la ultima si la columna de hoy tiene placas. Con
 * movimiento reducido esta completo desde el inicio. El lector de pantalla oye los minutos de cada dia.
 *
 * `compacto` (los dias seguidos de Hoy) es la misma grafica en 64 px de alto y de hasta 6 placas por dia, sin
 * margen propio, que ocupa el ancho que le deja quien la contiene (se mide) en lugar del de la pantalla.
 */
export function SieteDias({ semana, activo, compacto }: {
  semana: { fecha: string; min: number }[];
  activo: boolean;
  compacto?: boolean;
}) {
  const reducido = useReducedMotion();
  const { width } = useWindowDimensions();
  const [medido, setMedido] = useState(0);
  const ancho = compacto ? medido : width - 2 * MARGEN_PANTALLA;
  const minutos = semana.map(d => d.min);
  const alto = compacto || semanaEnCero(minutos) ? ALTO_COMPACTO : ALTO_MAPA;
  const maxPlacas = compacto ? PLACAS_COMPACTO : MAX_PLACAS_DIA;
  // Por valor, no por identidad: `semana` llega como arreglo nuevo en cada render de Hoy/Yo.
  const claveMinutos = minutos.join(',');
  const placas = useMemo(
    () => placasPorDia(claveMinutos === '' ? [] : claveMinutos.split(',').map(Number), maxPlacas),
    [claveMinutos, maxPlacas],
  );
  const geo = useMemo(() => geometriaMapa(semana.length, Math.max(ancho, 1)), [semana.length, ancho]);
  // Cada dia empieza cuando el anterior termino de soltar sus placas.
  const salidas = useMemo(
    () => acumuladosPrevios(placas).map((previas, d) => previas * ENTRE_PLACAS_MS + d * ENTRE_DIAS_MS),
    [placas],
  );
  const total = useMemo(
    () => Math.max(0, ...placas.map((n, d) => (n > 0 ? salidas[d] + (n - 1) * ENTRE_PLACAS_MS + CAIDA_MS : 0))),
    [placas, salidas],
  );
  const hoyStr = hoy();
  const indiceHoy = semana.findIndex(d => d.fecha === hoyStr);
  const tiempo = useSharedValue(reducido ? total : 0);
  const empezado = useRef(false);

  useEffect(() => {
    if (reducido || empezado.current) { tiempo.set(total); return; }
    if (!activo) return;
    empezado.current = true;
    if (total === 0) return;
    const golpe = indiceHoy >= 0 && placas[indiceHoy] > 0;
    tiempo.set(withTiming(total, { duration: total, easing: Easing.linear }, terminado => {
      if (terminado && golpe) runOnJS(haptico.placa)();
    }));
  }, [activo, reducido, total]);

  const pisos = useMemo(() => {
    const p = Skia.Path.Make();
    placas.forEach((n, d) => {
      if (n === 0) p.addRRect(Skia.RRectXY(Skia.XYWHRect(d * geo.paso, alto - PISO_PX, geo.colW, PISO_PX), 1, 1));
    });
    return p;
  }, [placas, geo, alto]);

  const trazo = useDerivedValue(() => {
    const p = Skia.Path.Make();
    for (let d = 0; d < placas.length; d++) {
      const x = d * geo.paso;
      for (let k = 0; k < placas[d]; k++) {
        const u = Math.min(1, Math.max(0, (tiempo.value - salidas[d] - k * ENTRE_PLACAS_MS) / CAIDA_MS));
        if (u <= 0) continue;
        const reposo = alto - k * PASO_PLACA - ALTO_PLACA;
        const suave = 1 - (1 - u) * (1 - u) * (1 - u);
        const arriba = reposo - (1 - suave) * (reposo + ALTO_PLACA + 4);
        p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, arriba, geo.colW, ALTO_PLACA), RADIO_PLACA, RADIO_PLACA));
      }
    }
    return p;
  }, [placas, salidas, geo, alto]);

  return (
    <View
      style={compacto ? s.raizCompacta : s.raiz} accessible accessibilityLabel={resumenDeSemana(semana)}
      onLayout={compacto ? e => setMedido(e.nativeEvent.layout.width) : undefined}
    >
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Canvas style={{ width: Math.max(ancho, 0), height: alto }}>
          <Path path={pisos} color={paleta.gomaBorde} />
          <Path path={trazo} color={paleta.magnesia} />
        </Canvas>
        <View style={s.letras}>
          {semana.map((d, i) => {
            const esHoy = i === indiceHoy;
            return (
              <View key={d.fecha} style={[s.letra, { left: i * geo.paso, width: geo.colW }]}>
                <Text style={[s.inicial, esHoy && s.inicialHoy]}>{INICIALES[fechaLocal(d.fecha).getDay()]}</Text>
                <View style={[s.punto, esHoy && s.puntoHoy]} />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  raizCompacta: { flex: 1 },
  letras: { height: ALTO_LETRAS, marginTop: 6 },
  letra: { position: 'absolute', top: 0, alignItems: 'center', gap: 2 },
  inicial: { fontFamily: familia.medio, fontSize: 12, lineHeight: 16, color: paleta.magnesia3Texto },
  inicialHoy: { color: paleta.magnesia },
  punto: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  puntoHoy: { backgroundColor: paleta.placaAzul },
});
