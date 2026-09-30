import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import {
  Easing, runOnJS, useDerivedValue, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, familia, haptico, MARGEN_PANTALLA } from '@/ui/theme';
import { nombreVisible } from '@/data/nombresVisibles';
import type { FasePrograma } from '@/features/programas/utils/minutosPorSemana';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import {
  ALTO_MAPA, ALTO_PLACA, PASO_PLACA, geometriaMapa, disponerEtiquetas, type GeoMapa,
} from '@/ui/components/disposicionMapa';

const CAIDA_MS = 380;
const ENTRE_PLACAS_MS = 25;
const ENTRE_COLUMNAS_MS = 110;
/** La entrada entera de todas las columnas no pasa de este tiempo aunque el programa tenga 16 semanas. */
const TOPE_ENTRE_COLUMNAS_TOTAL_MS = 1000;
const RADIO_PLACA = 2;
const OPACIDAD_APAGADA = 0.5;
const APAGA_MS = 220;
/** El punto de la pantalla, a esta fraccion desde arriba, que decide que fase «esta en pantalla». */
const LECTURA = 0.5;
const ALTO_NUMEROS = 18;
const SEPARACION_NUMEROS = 4;
const ALTO_LLAVE = 6;
const ALTO_FILA_ETIQUETA = 18;
const AIRE_ETIQUETAS = 4;

/** La fase de la linea de tiempo que esta en pantalla, o -1 si el usuario aun no llego a ellas o ya las paso. */
function faseEnPantalla(zonas: number[], lectura: number, n: number): number {
  'worklet';
  if (zonas.length < 2 * n || lectura < zonas[0] || lectura > zonas[2 * n - 1]) return -1;
  for (let i = 0; i < n; i++) if (lectura <= zonas[2 * i + 1]) return i;
  return n - 1;
}

/**
 * El plan como una carga en el tiempo: una columna por semana, dibujada con Skia como una
 * pila de placas (discos de 8 px con 2 px entre cada una): mas minutos, mas placas. Las
 * alturas salen de los minutos por semana del dato (`placas`). La fase en que va el usuario
 * (si sigue el programa) va en `placaAzul` y las demas en `magnesia2`; debajo, el numero de
 * cada semana y, bajo llaves finas, el nombre de cada fase (si no caben en una fila, bajan a la
 * siguiente). Tocar una fase, sus columnas o su nombre la lleva a su lugar en la linea de tiempo.
 *
 * Al entrar en pantalla (`activo`, una vez) las columnas se cargan semana por semana y las placas
 * caen una sobre otra (25 ms entre cada una), con un solo golpe cuando se asienta la ultima. Con el
 * scroll por la linea de tiempo, las columnas de la fase que esta en pantalla suben a opacidad 1
 * y las demas bajan a 0.5. Con movimiento reducido esta completo desde el inicio y no cambia con
 * el scroll. El lector de pantalla oye `resumen` y no la grafica.
 */
export function MapaCarga({ fases, placas, faseActual, resumen, y, zonas, activo, onFase }: {
  fases: FasePrograma[];
  /** Placas de cada semana (una columna por semana). */
  placas: number[];
  /** Posicion de la fase en que va el usuario, o -1. */
  faseActual: number;
  resumen: string;
  y: SharedValue<number>;
  zonas: SharedValue<number[]>;
  activo: boolean;
  onFase: (indice: number) => void;
}) {
  const reducido = useReducedMotion();
  const { width, height: ventana } = useWindowDimensions();
  const ancho = width - 2 * MARGEN_PANTALLA;
  const n = placas.length;
  const geo = useMemo(() => geometriaMapa(n, ancho), [n, ancho]);
  const nombres = useMemo(() => fases.map(f => nombreVisible(f.foco)), [fases]);
  const etiquetas = useMemo(
    () => disponerEtiquetas(fases.map((f, i) => ({ desde: f.desde, hasta: f.hasta, nombre: nombres[i] })), geo, ancho),
    [fases, nombres, geo, ancho],
  );
  const filas = etiquetas.reduce((m, e) => Math.max(m, e.fila + 1), 1);
  const columnaMs = Math.min(ENTRE_COLUMNAS_MS, TOPE_ENTRE_COLUMNAS_TOTAL_MS / n);
  const total = (n - 1) * columnaMs + (Math.max(...placas) - 1) * ENTRE_PLACAS_MS + CAIDA_MS;
  const tiempo = useSharedValue(reducido ? total : 0);
  const empezado = useRef(false);
  const activa = useDerivedValue(
    () => faseEnPantalla(zonas.value, y.value + ventana * LECTURA, fases.length), [fases.length, ventana],
  );

  useEffect(() => {
    if (reducido) { tiempo.value = total; return; }
    if (!activo || empezado.current) return;
    empezado.current = true;
    tiempo.value = withTiming(total, { duration: total, easing: Easing.linear }, terminado => {
      if (terminado) runOnJS(haptico.placa)();
    });
  }, [activo, reducido, total]);

  const inicioDe = (i: number) => (fases[i].desde - 1) * geo.paso;
  const finDe = (i: number) => (fases[i].hasta - 1) * geo.paso + geo.colW;

  return (
    <View accessible accessibilityLabel={resumen}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={{ width: ancho, height: ALTO_MAPA }}>
          <Canvas style={{ width: ancho, height: ALTO_MAPA }}>
            {fases.map((f, i) => (
              <PlacasDeFase
                key={i} indice={i} desde={f.desde - 1} hasta={f.hasta - 1} placas={placas} geo={geo} tiempo={tiempo}
                columnaMs={columnaMs} color={i === faseActual ? paleta.placaAzul : paleta.magnesia2} activa={activa}
              />
            ))}
          </Canvas>
          {fases.map((_, i) => (
            <Pressable
              key={i} onPress={() => { haptico.toque(); onFase(i); }}
              style={[s.zona, { left: inicioDe(i), width: finDe(i) - inicioDe(i) }]}
            />
          ))}
        </View>

        <View style={s.numeros}>
          {placas.map((_, semana) => (
            <Text key={semana} style={[s.numero, { left: semana * geo.paso, width: geo.colW }]} numberOfLines={1}>{semana + 1}</Text>
          ))}
        </View>

        <View style={{ width: ancho, height: ALTO_LLAVE + AIRE_ETIQUETAS + filas * ALTO_FILA_ETIQUETA }}>
          {fases.map((_, i) => (
            <View key={i} style={[s.llave, { left: inicioDe(i), width: finDe(i) - inicioDe(i) }]} />
          ))}
          {etiquetas.map((e, i) => (
            <Pressable
              key={i} onPress={() => { haptico.toque(); onFase(i); }} hitSlop={{ top: 6, bottom: 6 }}
              style={[s.etiqueta, { left: e.izquierda, width: e.ancho, top: ALTO_LLAVE + AIRE_ETIQUETAS + e.fila * ALTO_FILA_ETIQUETA }]}
            >
              <Text style={s.etiquetaTexto} numberOfLines={1}>{nombres[i]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Las columnas de una fase: todas sus placas en un solo trazo, que se recalcula mientras dura la entrada. */
function PlacasDeFase({ indice, desde, hasta, placas, geo, tiempo, columnaMs, color, activa }: {
  indice: number;
  desde: number;
  hasta: number;
  placas: number[];
  geo: GeoMapa;
  tiempo: SharedValue<number>;
  columnaMs: number;
  color: string;
  activa: SharedValue<number>;
}) {
  const reducido = useReducedMotion();
  const trazo = useDerivedValue(() => {
    const p = Skia.Path.Make();
    for (let semana = desde; semana <= hasta; semana++) {
      const salida = semana * columnaMs;
      const x = semana * geo.paso;
      for (let k = 0; k < placas[semana]; k++) {
        const u = Math.min(1, Math.max(0, (tiempo.value - salida - k * ENTRE_PLACAS_MS) / CAIDA_MS));
        if (u <= 0) continue;
        const reposo = ALTO_MAPA - k * PASO_PLACA - ALTO_PLACA;
        const suave = 1 - (1 - u) * (1 - u) * (1 - u);
        const altura = reposo - (1 - suave) * (reposo + ALTO_PLACA + 4);
        p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, altura, geo.colW, ALTO_PLACA), RADIO_PLACA, RADIO_PLACA));
      }
    }
    return p;
  }, [desde, hasta, placas, geo, columnaMs]);

  const opacidad = useDerivedValue(() => (
    withTiming(reducido || activa.value < 0 || activa.value === indice ? 1 : OPACIDAD_APAGADA, { duration: APAGA_MS })
  ), [reducido, indice]);

  return (
    <Group opacity={opacidad}>
      <Path path={trazo} color={color} />
    </Group>
  );
}

const s = StyleSheet.create({
  zona: { position: 'absolute', top: 0, height: ALTO_MAPA },
  numeros: { height: ALTO_NUMEROS, marginTop: SEPARACION_NUMEROS },
  numero: {
    position: 'absolute', top: 0, textAlign: 'center', fontFamily: familia.titulo, fontSize: 14, lineHeight: ALTO_NUMEROS,
    color: paleta.magnesia3Texto,
  },
  llave: {
    position: 'absolute', top: 0, height: ALTO_LLAVE, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: paleta.gomaBorde, borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
  },
  etiqueta: { position: 'absolute', height: ALTO_FILA_ETIQUETA },
  etiquetaTexto: { fontFamily: familia.medio, fontSize: 12, lineHeight: ALTO_FILA_ETIQUETA, color: paleta.magnesia2, textAlign: 'center' },
});
