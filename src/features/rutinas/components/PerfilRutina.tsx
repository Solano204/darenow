import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import {
  cancelAnimation, useDerivedValue, useSharedValue, withDelay, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, conAlfa, familia, easing, MARGEN_PANTALLA } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import type { Tramo } from '@/features/rutinas/utils/estimarTramos';
import { muestrasPerfil } from './curvaPerfil';

const ALTO_PERFIL = 96;
export const ALTO_PERFIL_COMPACTO = 40;
const ALTO_ETIQUETAS = 28;
const PAD_ARRIBA = 6;
const PAD_ABAJO = 2;
const GROSOR_LINEA = 2;
const RADIO_PUNTO = 4;
const OPACIDAD_RELLENO = 0.18;
/** Lo que se suma a ese relleno en el tramo que esta en pantalla, para llegar al 30 %. */
const OPACIDAD_TRAMO_ACTIVO = 0.15;
const DIBUJA_MS = 900;
const RELLENO_RETRASO_MS = 150;
const PUNTO_RETRASO_MS = 1000;
const PUNTO_MS = 200;
const TRAMO_ACTIVO_MS = 220;
/** El punto de la pantalla, a esta fraccion desde arriba, que decide que bloque «esta en pantalla». */
const LECTURA = 0.5;
const MUESTRAS_POR_PX = 0.5;

function construir(tramos: Tramo[], ancho: number, alto: number) {
  const n = Math.max(2, Math.round(ancho * MUESTRAS_POR_PX) + 1);
  const valores = muestrasPerfil(tramos, n);
  const paso = ancho / (n - 1);
  const util = alto - PAD_ARRIBA - PAD_ABAJO;
  const ys = valores.map(v => alto - PAD_ABAJO - v * util);
  const linea = Skia.Path.Make();
  ys.forEach((py, i) => { if (i === 0) linea.moveTo(0, py); else linea.lineTo(i * paso, py); });
  const area = linea.copy();
  area.lineTo(ancho, alto);
  area.lineTo(0, alto);
  area.close();
  const inicios = tramos.map(t => t.inicio * ancho);
  const anchos = tramos.map(t => t.fraccion * ancho);
  const azules = tramos.flatMap((t, i) => (
    t.tipo === 'principal' || t.tipo === 'plano' ? [Skia.XYWHRect(inicios[i], 0, anchos[i], alto)] : []
  ));
  return { linea, area, ys, paso, inicios, anchos, azules };
}

/** Posicion (en px de la grafica) del punto para la lectura dada: recorre el tramo del bloque que esta en pantalla. */
function ubicar(zonas: number[], lectura: number, inicios: number[], anchos: number[], ancho: number): number {
  'worklet';
  const n = anchos.length;
  if (zonas.length < 2 * n) return 0;
  for (let i = 0; i < n; i++) {
    const arriba = zonas[2 * i];
    const abajo = zonas[2 * i + 1];
    if (lectura < arriba) return inicios[i];
    if (lectura <= abajo) return inicios[i] + ((lectura - arriba) / Math.max(1, abajo - arriba)) * anchos[i];
  }
  return ancho;
}

function tramoDe(zonas: number[], lectura: number, n: number): number {
  'worklet';
  if (zonas.length < 2 * n) return 0;
  for (let i = 0; i < n; i++) if (lectura <= zonas[2 * i + 1]) return i;
  return n - 1;
}

function altura(ys: number[], paso: number, px: number): number {
  'worklet';
  const k = Math.min(ys.length - 1, Math.max(0, px / paso));
  const i = Math.floor(k);
  const j = Math.min(ys.length - 1, i + 1);
  return ys[i] + (ys[j] - ys[i]) * (k - i);
}

/**
 * La forma de la sesion: sube, trabaja, baja. Una grafica de area dibujada con Skia,
 * a todo el ancho util, con un tramo por bloque (proporcional a su duracion). La
 * intensidad es visual y fija por tipo de bloque, con una joroba por vuelta en el
 * principal: no es una medicion y no muestra numeros. El tramo de trabajo lleva la
 * linea en `placaAzul`.
 *
 * Al entrar, la linea se dibuja de izquierda a derecha en 900 ms y el relleno aparece
 * detras con 150 ms de retraso (una vez por visita). Con el scroll, un punto `magnesia`
 * recorre la curva hasta el bloque que esta en pantalla y el relleno de ese tramo sube al
 * 30 %; `zonas` son los limites de cada bloque en la lista, `[arriba0, abajo0, arriba1, ...]`,
 * medidos en el contenido del scroll. La version `compacto` (40 de alto, sin etiquetas ni
 * dibujo de entrada) es la copia pegajosa que se ve cuando la grande sale de la pantalla.
 * Con movimiento reducido la curva esta completa desde el inicio, sin punto ni resalte.
 * El lector de pantalla oye `resumen` y no la grafica ni las etiquetas.
 */
export function PerfilRutina({ tramos, resumen, y, zonas, compacto, onTramo }: {
  tramos: Tramo[];
  resumen: string;
  y: SharedValue<number>;
  zonas: SharedValue<number[]>;
  compacto?: boolean;
  onTramo?: (indice: number) => void;
}) {
  const reducido = useReducedMotion();
  const { width, height: ventana } = useWindowDimensions();
  const ancho = width - 2 * MARGEN_PANTALLA;
  const alto = compacto ? ALTO_PERFIL_COMPACTO : ALTO_PERFIL;
  const g = useMemo(() => construir(tramos, ancho, alto), [tramos, ancho, alto]);
  const n = tramos.length;
  const estatico = reducido || !!compacto;
  const conPunto = !reducido;

  const fin = useSharedValue(estatico ? 1 : 0);
  const relleno = useSharedValue(estatico ? 1 : 0);
  const punto = useSharedValue(compacto && conPunto ? 1 : 0);

  useEffect(() => {
    if (estatico) {
      fin.set(1);
      relleno.set(1);
      punto.set(compacto && conPunto ? 1 : 0);
      return;
    }
    fin.set(0);
    relleno.set(0);
    punto.set(0);
    fin.set(withTiming(1, { duration: DIBUJA_MS, easing: easing.salida }));
    relleno.set(withDelay(RELLENO_RETRASO_MS, withTiming(1, { duration: DIBUJA_MS, easing: easing.salida })));
    punto.set(withDelay(PUNTO_RETRASO_MS, withTiming(1, { duration: PUNTO_MS })));
    return () => { cancelAnimation(fin); cancelAnimation(relleno); cancelAnimation(punto); };
  }, [estatico, compacto, conPunto, fin, relleno, punto]);

  // Los worklets capturan solo estos arreglos de numeros, no `g` (que lleva las rutas de Skia).
  const { inicios, anchos, ys, paso } = g;
  const px = useDerivedValue(
    () => ubicar(zonas.value, y.value + ventana * LECTURA, inicios, anchos, ancho), [inicios, anchos, ventana, ancho],
  );
  const py = useDerivedValue(() => altura(ys, paso, px.value), [ys, paso]);
  const activo = useDerivedValue(() => tramoDe(zonas.value, y.value + ventana * LECTURA, n), [n, ventana]);
  const activoX = useDerivedValue(() => withTiming(inicios[activo.value] ?? 0, { duration: TRAMO_ACTIVO_MS }), [inicios]);
  const activoAncho = useDerivedValue(() => withTiming(anchos[activo.value] ?? 0, { duration: TRAMO_ACTIVO_MS }), [anchos]);
  const rectActivo = useDerivedValue(() => Skia.XYWHRect(activoX.value, 0, activoAncho.value, alto), [alto]);
  const opacidadActivo = useDerivedValue(() => (zonas.value.length === 0 ? 0 : relleno.value));

  if (n === 0) return null;

  const gradiente = (alfa: number) => [conAlfa(paleta.magnesia, alfa), conAlfa(paleta.magnesia, 0)];

  return (
    <View accessible accessibilityLabel={resumen}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {!compacto && <Text style={s.titulo}>PERFIL DE LA RUTINA</Text>}
        <Canvas style={{ width: ancho, height: alto }}>
          <Group opacity={relleno}>
            <Path path={g.area}>
              <LinearGradient start={vec(0, 0)} end={vec(0, alto)} colors={gradiente(OPACIDAD_RELLENO)} />
            </Path>
          </Group>
          {conPunto && (
            <Group clip={rectActivo} opacity={opacidadActivo}>
              <Path path={g.area}>
                <LinearGradient start={vec(0, 0)} end={vec(0, alto)} colors={gradiente(OPACIDAD_TRAMO_ACTIVO)} />
              </Path>
            </Group>
          )}
          <Path
            path={g.linea} style="stroke" strokeWidth={GROSOR_LINEA} strokeJoin="round" strokeCap="round"
            color={paleta.magnesia} start={0} end={fin}
          />
          {g.azules.map((r, i) => (
            <Group key={i} clip={r}>
              <Path
                path={g.linea} style="stroke" strokeWidth={GROSOR_LINEA} strokeJoin="round" strokeCap="round"
                color={paleta.placaAzul} start={0} end={fin}
              />
            </Group>
          ))}
          {conPunto && <Circle cx={px} cy={py} r={RADIO_PUNTO} color={paleta.magnesia} opacity={punto} />}
        </Canvas>
        {!compacto && (
          <View style={[s.etiquetas, { width: ancho }]}>
            {tramos.map((t, i) => (
              <Pressable
                key={i} onPress={onTramo ? () => onTramo(i) : undefined} hitSlop={{ top: 8, bottom: 8 }}
                style={[s.etiqueta, { left: g.inicios[i], width: g.anchos[i] }]}
              >
                <Text style={s.etiquetaTexto} numberOfLines={1}>{t.etiqueta}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: {
    fontFamily: familia.enfasis, fontSize: 12, lineHeight: 16, letterSpacing: 1, color: paleta.magnesia3Texto, marginBottom: 12,
  },
  etiquetas: { height: ALTO_ETIQUETAS },
  etiqueta: { position: 'absolute', top: 6 },
  etiquetaTexto: { fontFamily: familia.medio, fontSize: 12, lineHeight: 16, color: paleta.magnesia3Texto, textAlign: 'center' },
});
