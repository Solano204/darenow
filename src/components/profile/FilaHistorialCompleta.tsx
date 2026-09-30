import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { porId } from '@/data/catalog';
import type { SesionGuardada } from '@/state/store';
import { textoVisible } from '@/lib/presentacion';
import { diaCorto } from '@/lib/fechas';
import { filaDeHistorial, type MesDeHistorial } from '@/lib/perfil';
import { plural } from '@/lib/plural';
import { textoDeMotivo } from '@/lib/textosVisibles';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Entrada } from '@/ui/fx/Entrada';
import { Huella } from '@/ui/fx/Huella';
import { EncabezadoMes } from './EncabezadoMes';
import { EtiquetaEstadoSesion } from './EtiquetaEstadoSesion';

const LADO_NODO = 28;
const CENTRO_NODO = LADO_NODO / 2;
const SANGRIA = 44;
const GROSOR_RIEL = 2;
/** El punto de la pantalla, a esta fraccion desde arriba, hasta donde se llena el riel. */
const LECTURA = 0.6;
const ESCALONADO_MS = 40;
const FILAS_CON_ENTRADA = 8;
const MAX_EJERCICIOS = 6;

/**
 * Un mes del historial: su encabezado y sus sesiones sobre el riel de la Parte 8 (un riel de 2 px a la izquierda con
 * un nodo por sesion). Con el scroll el riel pasa de `gomaBorde` a `magnesia2` y cada nodo se llena al ser
 * alcanzado; con movimiento reducido ya esta lleno. Las primeras filas entran escalonadas 40 ms (`animar`, solo la
 * primera vez en la sesion). Es hijo directo del scroll: mide su posicion para el encabezado pegajoso (`onMedir`).
 */
export function MesHistorial({ mes, y, indiceInicial, animar, onMedir, onEjercicio }: {
  mes: MesDeHistorial<SesionGuardada>;
  y: SharedValue<number>;
  /** Cuantas sesiones hay en los meses de arriba (solo las primeras filas de la lista llevan entrada). */
  indiceInicial: number;
  animar: boolean;
  onMedir: (arriba: number) => void;
  onEjercicio: (id: string) => void;
}) {
  const origen = useSharedValue(Number.POSITIVE_INFINITY);
  const mesArriba = useRef(0);
  const filasArriba = useRef(0);
  const situar = () => { origen.value = mesArriba.current + filasArriba.current; };

  return (
    <View onLayout={e => { mesArriba.current = e.nativeEvent.layout.y; situar(); onMedir(e.nativeEvent.layout.y); }}>
      <View style={s.encabezado}><EncabezadoMes nombre={mes.nombre} /></View>
      <View onLayout={e => { filasArriba.current = e.nativeEvent.layout.y; situar(); }}>
        {mes.items.map((x, i) => (
          <FilaSesion
            key={x.id} sesion={x} ultima={i === mes.items.length - 1} origen={origen} y={y}
            indice={indiceInicial + i} animar={animar} onEjercicio={onEjercicio}
          />
        ))}
      </View>
    </View>
  );
}

function FilaSesion({ sesion, ultima, origen, y, indice, animar, onEjercicio }: {
  sesion: SesionGuardada; ultima: boolean; origen: SharedValue<number>; y: SharedValue<number>;
  indice: number; animar: boolean; onEjercicio: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { height: ventana } = useWindowDimensions();
  const arriba = useSharedValue(0);
  const alto = useSharedValue(0);
  const f = filaDeHistorial(sesion);
  const series = plural(f.series, 'serie', 'series');
  const ejercicios = [...new Set(sesion.series.map(x => x.ejercicioId))].slice(0, MAX_EJERCICIOS);

  const pista = useAnimatedStyle(() => ({ height: alto.value }), [tick]);
  const relleno = useAnimatedStyle(() => ({
    height: reducido
      ? alto.value
      : Math.min(alto.value, Math.max(0, y.value + ventana * LECTURA - (origen.value + arriba.value + CENTRO_NODO))),
  }), [reducido, ventana, tick]);
  const nodo = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      reducido || y.value + ventana * LECTURA >= origen.value + arriba.value + CENTRO_NODO ? 1 : 0,
      [0, 1], [paleta.gomaBorde, paleta.magnesia2],
    ),
  }), [reducido, ventana, tick]);

  return (
    <View
      style={s.fila}
      onLayout={e => { arriba.value = e.nativeEvent.layout.y; alto.value = e.nativeEvent.layout.height; }}
    >
      {!ultima && (
        <>
          <Animated.View style={[s.pista, pista]} pointerEvents="none" />
          <Animated.View style={[s.relleno, relleno]} pointerEvents="none" />
        </>
      )}
      <Entrada activo animar={animar && indice < FILAS_CON_ENTRADA} retraso={indice * ESCALONADO_MS} y={8} escala={1}>
        <Animated.View style={[s.nodo, nodo]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Huella lado={14} contorno={!f.largo} color={f.largo ? paleta.magnesia : paleta.magnesia2} opacidad={1} />
        </Animated.View>
        <View style={s.cuerpo}>
          <View
            accessible
            accessibilityLabel={
              `${diaCorto(sesion.fecha)}. ${sesion.estado === 'completada' ? 'Sesión completa' : 'Sesión parcial'}. ${f.minutos} min. ${f.series} ${series}.`
              + (sesion.motivoAbandono ? ` Salió por: ${textoDeMotivo(sesion.motivoAbandono)}.` : '')
            }
          >
            <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <View style={s.linea}>
                <Text style={s.fecha} maxFontSizeMultiplier={1.3}>{diaCorto(sesion.fecha)}</Text>
                <EtiquetaEstadoSesion estado={sesion.estado} />
              </View>
              <View style={s.datos}>
                <View style={s.dato}>
                  <Text style={s.numero} maxFontSizeMultiplier={1.3}>{f.minutos}</Text>
                  <Text style={s.unidad} maxFontSizeMultiplier={1.3}>min</Text>
                </View>
                <View style={s.dato}>
                  <Text style={s.numero} maxFontSizeMultiplier={1.3}>{f.series}</Text>
                  <Text style={s.unidad} maxFontSizeMultiplier={1.3}>{series}</Text>
                </View>
              </View>
              {sesion.motivoAbandono ? (
                <Text style={s.motivo} maxFontSizeMultiplier={1.3}>
                  Salió por: <Text style={s.motivoValor}>{textoDeMotivo(sesion.motivoAbandono)}</Text>
                </Text>
              ) : null}
            </View>
          </View>
          {ejercicios.length > 0 ? (
            <View style={s.ejercicios}>
              {ejercicios.map(id => {
                const nombre = textoVisible(porId.get(id)?.name ?? id);
                return (
                  <Pressable
                    key={id} onPress={() => onEjercicio(id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    accessibilityRole="link" accessibilityLabel={nombre}
                  >
                    <Text style={s.enlace} maxFontSizeMultiplier={1.3}>{nombre}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </Entrada>
    </View>
  );
}

const s = StyleSheet.create({
  encabezado: { marginHorizontal: MARGEN_PANTALLA },
  fila: { marginHorizontal: MARGEN_PANTALLA, paddingBottom: 24 },
  pista: { position: 'absolute', top: CENTRO_NODO, left: CENTRO_NODO - GROSOR_RIEL / 2, width: GROSOR_RIEL, backgroundColor: paleta.gomaBorde },
  relleno: { position: 'absolute', top: CENTRO_NODO, left: CENTRO_NODO - GROSOR_RIEL / 2, width: GROSOR_RIEL, backgroundColor: paleta.magnesia2 },
  nodo: {
    position: 'absolute', top: 0, left: 0, width: LADO_NODO, height: LADO_NODO, borderRadius: LADO_NODO / 2, borderWidth: 2,
    borderColor: paleta.gomaBorde, backgroundColor: paleta.goma, alignItems: 'center', justifyContent: 'center',
  },
  cuerpo: { marginLeft: SANGRIA, gap: 10 },
  linea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  fecha: { flexShrink: 1, fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
  datos: { flexDirection: 'row', alignItems: 'baseline', gap: 16, marginTop: 6 },
  dato: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  numero: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, color: paleta.magnesia },
  unidad: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  motivo: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto, marginTop: 6 },
  motivoValor: { fontFamily: familia.enfasis, color: paleta.magnesia2 },
  ejercicios: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 8 },
  enlace: {
    fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2,
    textDecorationLine: 'underline', textDecorationColor: paleta.gomaBorde,
  },
});
