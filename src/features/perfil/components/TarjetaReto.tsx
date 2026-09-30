import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, familia, easing, MARGEN_PANTALLA } from '@/ui/theme';
import type { Reto } from '@/data/catalog';
import { textoVisible } from '@/lib/presentacion';
import { metaDeReto, progresoAcotado, type MetaReto } from '@/lib/perfil';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Entrada } from '@/ui/fx/Entrada';
import { Huella } from '@/ui/fx/Huella';
import { Presionable } from '@/ui/components/Presionable';
import { TarjetaGoma } from '@/ui/components/TarjetaGoma';

const ESCALONADO_MS = 60;
const LLENADO_MS = 500;
const ESPERA_LLENADO_MS = 400;
const CELDAS_POR_FILA = 15;
const SEPARACION_CELDAS = 4;
const PADDING = 16;

/**
 * Un reto de la lista de Yo: titulo en Big Shoulders 700 de 20, la descripcion en Figtree 15/22 y, solo si el
 * reto ya empezo (hay dato de progreso), un indicador segun su meta: siete placas para «Siete dias», treinta
 * celdas con una huella en cada dia hecho para «Treinta dias de movimiento» y una barra continua de cien con el
 * numero actual en Big Shoulders 700 para «Cien sesiones». Sin el dato la tarjeta queda sin indicador. Entra
 * escalonada 60 ms y los indicadores se llenan despues; con movimiento reducido aparece todo puesto. Toda la
 * tarjeta lleva a la pantalla de Retos, como antes.
 */
export function TarjetaReto({ reto, progreso, indice, activo, onPress }: {
  reto: Reto;
  /** El progreso guardado del reto, o `undefined` si aun no lo empezo. */
  progreso: number | undefined;
  indice: number;
  activo: boolean;
  onPress: () => void;
}) {
  const reducido = useReducedMotion();
  const meta = metaDeReto(reto.id);
  const hechos = meta && progreso !== undefined ? progresoAcotado(progreso, meta.total) : 0;
  const llenado = useSharedValue(reducido ? 1 : 0);
  const nombre = textoVisible(reto.name);
  const objetivo = textoVisible(reto.objetivo);

  useEffect(() => {
    if (reducido) { llenado.value = 1; return; }
    if (!activo) return;
    llenado.value = withDelay(indice * ESCALONADO_MS + ESPERA_LLENADO_MS, withTiming(1, { duration: LLENADO_MS, easing: easing.salida }));
    return () => cancelAnimation(llenado);
  }, [activo, reducido]);

  return (
    <Entrada activo={activo} retraso={indice * ESCALONADO_MS} y={16} escala={1} estilo={s.caja}>
      <Presionable
        onPress={onPress}
        etiqueta={`${nombre}. ${objetivo}${meta && progreso !== undefined ? `. Llevas ${hechos} de ${meta.total}` : ''}`}
      >
        <TarjetaGoma estilo={s.tarjeta} relleno={PADDING}>
          <Text style={s.titulo} maxFontSizeMultiplier={1.3}>{nombre}</Text>
          <Text style={s.descripcion} maxFontSizeMultiplier={1.3}>{objetivo}</Text>
          {meta && progreso !== undefined ? (
            <View style={s.indicador}><Indicador meta={meta} hechos={hechos} llenado={llenado} /></View>
          ) : null}
        </TarjetaGoma>
      </Presionable>
    </Entrada>
  );
}

function Indicador({ meta, hechos, llenado }: { meta: MetaReto; hechos: number; llenado: SharedValue<number> }) {
  if (meta.tipo === 'placas') return <Placas total={meta.total} hechos={hechos} llenado={llenado} />;
  if (meta.tipo === 'celdas') return <Celdas total={meta.total} hechos={hechos} llenado={llenado} />;
  return <Barra total={meta.total} hechos={hechos} llenado={llenado} />;
}

/** Una placa por dia de la meta: las hechas se llenan de `magnesia` de izquierda a derecha. */
function Placas({ total, hechos, llenado }: { total: number; hechos: number; llenado: SharedValue<number> }) {
  return (
    <View style={s.placas}>
      {Array.from({ length: total }, (_, k) => <Placa key={k} k={k} total={total} hecha={k < hechos} llenado={llenado} />)}
    </View>
  );
}

function Placa({ k, total, hecha, llenado }: { k: number; total: number; hecha: boolean; llenado: SharedValue<number> }) {
  const tick = useTick();
  const estilo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      Math.min(1, Math.max(0, llenado.value * total - k)), [0, 1], [paleta.gomaBorde, hecha ? paleta.magnesia : paleta.gomaBorde],
    ),
  }), [tick, hecha]);
  return <Animated.View style={[s.placa, estilo]} />;
}

/** Una celda por dia de la meta, en filas de 15; cada dia hecho lleva una huella de magnesia. */
function Celdas({ total, hechos, llenado }: { total: number; hechos: number; llenado: SharedValue<number> }) {
  const { width } = useWindowDimensions();
  const interior = width - 2 * MARGEN_PANTALLA - 2 * PADDING - 2;
  const lado = Math.floor((interior - (CELDAS_POR_FILA - 1) * SEPARACION_CELDAS) / CELDAS_POR_FILA);
  return (
    <View style={s.celdas}>
      {Array.from({ length: total }, (_, k) => (
        <Celda key={k} k={k} total={total} lado={lado} hecha={k < hechos} llenado={llenado} />
      ))}
    </View>
  );
}

function Celda({ k, total, lado, hecha, llenado }: {
  k: number; total: number; lado: number; hecha: boolean; llenado: SharedValue<number>;
}) {
  const tick = useTick();
  const huella = useAnimatedStyle(() => ({ opacity: llenado.value * total > k ? 1 : 0 }), [tick]);
  return (
    <View style={[s.celda, { width: lado, height: lado + 4 }]}>
      {hecha ? <Animated.View style={huella}><Huella lado={Math.max(8, lado - 8)} opacidad={1} /></Animated.View> : null}
    </View>
  );
}

/** Una barra continua hasta la meta, con el numero actual en Big Shoulders 700. */
function Barra({ total, hechos, llenado }: { total: number; hechos: number; llenado: SharedValue<number> }) {
  const tick = useTick();
  const relleno = useAnimatedStyle(() => ({ transform: [{ scaleX: (hechos / total) * llenado.value }] }), [tick, hechos]);
  return (
    <View style={s.barraCaja}>
      <View style={s.pista}><Animated.View style={[s.relleno, relleno]} /></View>
      <View style={s.cuenta}>
        <Text style={s.cuentaNumero} maxFontSizeMultiplier={1.3}>{hechos}</Text>
        <Text style={s.cuentaTotal} maxFontSizeMultiplier={1.3}>de {total}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: { marginHorizontal: MARGEN_PANTALLA, marginBottom: 12 },
  tarjeta: { borderRadius: 20 },
  titulo: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 23, color: paleta.magnesia },
  descripcion: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2, marginTop: 4 },
  indicador: { marginTop: 14 },
  placas: { flexDirection: 'row', gap: 6 },
  placa: { flex: 1, height: 12, borderRadius: 3 },
  celdas: { flexDirection: 'row', flexWrap: 'wrap', gap: SEPARACION_CELDAS },
  celda: { alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 1, borderColor: paleta.gomaBorde },
  barraCaja: { gap: 8 },
  pista: { height: 6, borderRadius: 3, backgroundColor: paleta.gomaBorde, overflow: 'hidden' },
  relleno: { height: 6, borderRadius: 3, backgroundColor: paleta.magnesia, transformOrigin: 'left' },
  cuenta: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  cuentaNumero: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, color: paleta.magnesia },
  cuentaTotal: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto },
});
