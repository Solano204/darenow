import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
  type EntryExitAnimationFunction, type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, resortePlaca, haptico, MARGEN_PANTALLA } from '@/theme';
import { hoy } from '@/store/store';
import { MESES } from '@/utils/fechas';
import { celdasDelMes, diaDelCalendario, diasDelMes, type DiaDelCalendario } from '@/utils/perfil';
import { plural } from '@/utils/plural';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { Huella } from '@/components/fx/Huella';
import { PlacaDato } from '@/components/ui/PlacaDato';
import { MarcoHoy } from '@/components/hoy/FilaSemana';
import { transicionesDeSegmento } from '@/components/explore/listaBase';

const ALTO_CELDA = 48;
const ANCHO_CELDA = 44;
const LADO_HUELLA = 14;
const LADO_BOTON = 44;
const ALTO_NOMBRE = 32;
const ESCALONADO_HUELLA_MS = 40;
const ESCALA_SELLO = 1.4;
const MOVIMIENTO_NOMBRE_PX = 14;
const CAMBIO_MS = 220;
const INICIALES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Las huellas del mes ya se estamparon en esta sesion de la app: las siguientes veces aparecen puestas. */
let huellasEstampadas = false;

/**
 * El calendario de Yo, sin tarjeta, directamente sobre `goma`: el mes («Septiembre» en Big Shoulders 700 de 22
 * y el ano en `magnesia3`) con las flechas de 44 px (la de adelante se apaga en el mes de hoy, como siempre),
 * las iniciales y una rejilla de celdas de 44 x 48. Un dia con sesion lleva una huella de 14 px bajo su
 * numero: en contorno si fue una sesion corta y rellena (con el numero en `magnesia`) si llego a 25 minutos;
 * hoy lleva un anillo azul que se dibuja; los dias futuros van en `gomaBorde` y los pasados sin sesion en
 * `magnesia3`, sin marcas: aqui no se castiga. Debajo, la leyenda y los dias del mes y en total.
 *
 * Al cambiar de mes la rejilla sale hacia el lado contrario y entra la nueva (220 ms) y el nombre rueda en
 * vertical, con un toque de seleccion; con movimiento reducido, un fundido. La primera vez que el calendario
 * entra en pantalla (`activo`) las huellas se estampan escalonadas 40 ms en orden cronologico.
 */
export function CalendarioHuellas({ entrenados, minutosPor, activo }: {
  /** Fechas `AAAA-MM-DD` con sesion. */
  entrenados: string[];
  /** Minutos por fecha, para distinguir la sesion larga de la corta. */
  minutosPor: Record<string, number>;
  activo: boolean;
}) {
  const reducido = useReducedMotion();
  const ahora = new Date();
  const hoyStr = hoy();
  const [ver, setVer] = useState({ a: ahora.getFullYear(), m: ahora.getMonth() });
  const [cambio, setCambio] = useState(false);
  const sentido = useSharedValue(1);
  const primera = useRef(!huellasEstampadas).current;
  useEffect(() => { if (activo) huellasEstampadas = true; }, [activo]);

  const conjunto = useMemo(() => new Set(entrenados), [entrenados]);
  const celdas = useMemo(() => celdasDelMes(ver.a, ver.m), [ver]);
  const dias = useMemo(
    () => celdas.map(d => (d === null ? null : diaDelCalendario(ver.a, ver.m, d, hoyStr, minutosPor, conjunto))),
    [celdas, ver, hoyStr, minutosPor, conjunto],
  );
  const delMes = diasDelMes(conjunto, ver.a, ver.m);
  const enElMesDeHoy = ver.a > ahora.getFullYear() || (ver.a === ahora.getFullYear() && ver.m >= ahora.getMonth());
  const { entrada, salida } = useMemo(() => transicionesDeSegmento(reducido, sentido), [reducido, sentido]);
  // Solo el primer mes que se ve se estampa; los que se abren al navegar aparecen puestos.
  const animar = primera && !cambio;
  const finHuellas = dias.filter(d => d?.entreno).length * ESCALONADO_HUELLA_MS;

  const mover = (n: number) => {
    if (n > 0 && enElMesDeHoy) return;
    haptico.seleccion();
    sentido.value = n;
    setCambio(true);
    const d = new Date(ver.a, ver.m + n, 1);
    setVer({ a: d.getFullYear(), m: d.getMonth() });
  };

  let rango = 0;
  return (
    <View style={s.raiz}>
      <View style={s.cabecera}>
        <NombreMes anio={ver.a} mes={ver.m} sentido={sentido} animar={cambio} />
        <View style={s.flechas}>
          <BotonMes icono="chevron-back" etiqueta="Mes anterior" onPress={() => mover(-1)} />
          <BotonMes icono="chevron-forward" etiqueta="Mes siguiente" deshabilitado={enElMesDeHoy} onPress={() => mover(1)} />
        </View>
      </View>

      <View style={s.semana} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {INICIALES.map((d, i) => <Text key={i} style={s.inicial}>{d}</Text>)}
      </View>

      <View style={{ height: (celdas.length / 7) * ALTO_CELDA }}>
        <Animated.View
          key={`${ver.a}-${ver.m}`} style={s.rejilla}
          entering={cambio ? entrada : undefined} exiting={salida}
        >
          {dias.map((d, i) => (d === null
            ? <View key={i} style={s.celda} />
            : (
              <DiaCelda
                key={i} d={d} animar={animar} activo={activo}
                retraso={d.entreno ? rango++ * ESCALONADO_HUELLA_MS : 0} retrasoAnillo={finHuellas + 100}
              />
            )))}
        </Animated.View>
      </View>

      <LeyendaHuellas />

      <View style={s.resumen}>
        <View style={s.mitad}>
          <PlacaDato
            numero={delMes} etiqueta={`${plural(delMes, 'día', 'días')} este mes`} filo={paleta.magnesia3} retraso={0}
            activo={activo} animar={primera} haptica={false} tamano={32} continuo
          />
        </View>
        <View style={s.mitad}>
          <PlacaDato
            numero={conjunto.size} etiqueta={`${plural(conjunto.size, 'día', 'días')} en total`} filo={paleta.magnesia3}
            retraso={80} activo={activo} animar={primera} haptica={false} tamano={32} continuo
          />
        </View>
      </View>
    </View>
  );
}

/** El nombre del mes y el ano; al cambiar de mes el texto viejo sale y el nuevo entra en vertical. */
function NombreMes({ anio, mes, sentido, animar }: { anio: number; mes: number; sentido: SharedValue<number>; animar: boolean }) {
  const reducido = useReducedMotion();
  const entra = useMemo<EntryExitAnimationFunction>(() => () => {
    'worklet';
    if (reducido) return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, { duration: 150 }) } };
    return {
      initialValues: { opacity: 0, transform: [{ translateY: sentido.value * MOVIMIENTO_NOMBRE_PX }] },
      animations: {
        opacity: withTiming(1, { duration: CAMBIO_MS }),
        transform: [{ translateY: withTiming(0, { duration: CAMBIO_MS }) }],
      },
    };
  }, [reducido, sentido]);
  const sale = useMemo<EntryExitAnimationFunction>(() => () => {
    'worklet';
    if (reducido) return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: 150 }) } };
    return {
      initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
      animations: {
        opacity: withTiming(0, { duration: CAMBIO_MS }),
        transform: [{ translateY: withTiming(-sentido.value * MOVIMIENTO_NOMBRE_PX, { duration: CAMBIO_MS }) }],
      },
    };
  }, [reducido, sentido]);

  return (
    <View style={s.nombreCaja} accessible accessibilityRole="header" accessibilityLabel={`${MESES[mes]} ${anio}`}>
      <Animated.View
        key={`${anio}-${mes}`} style={s.nombreFila} entering={animar ? entra : undefined} exiting={sale}
        importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      >
        <Text style={s.mes}>{MESES[mes]}</Text>
        <Text style={s.anio}>{anio}</Text>
      </Animated.View>
    </View>
  );
}

function BotonMes({ icono, etiqueta, deshabilitado, onPress }: {
  icono: 'chevron-back' | 'chevron-forward'; etiqueta: string; deshabilitado?: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress} disabled={deshabilitado} style={s.boton}
      accessibilityRole="button" accessibilityLabel={etiqueta} accessibilityState={{ disabled: !!deshabilitado }}
    >
      <Ionicons name={icono} size={20} color={deshabilitado ? paleta.gomaBorde : paleta.magnesia2} />
    </Pressable>
  );
}

function DiaCelda({ d, animar, activo, retraso, retrasoAnillo }: {
  d: DiaDelCalendario; animar: boolean; activo: boolean; retraso: number; retrasoAnillo: number;
}) {
  const numero = d.futuro ? paleta.gomaBorde : d.esHoy || d.largo ? paleta.magnesia : d.entreno ? paleta.magnesia2 : paleta.magnesia3Texto;
  return (
    <View style={s.celda} accessible accessibilityLabel={d.etiqueta}>
      <View style={s.interior} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {d.esHoy && (activo || !animar) ? <MarcoHoy animar={animar} retraso={retrasoAnillo} alto={ALTO_CELDA} /> : null}
        <Text style={[s.numero, { color: numero }]}>{d.dia}</Text>
        {d.entreno ? <HuellaDia largo={d.largo} animar={animar} activo={activo} retraso={retraso} /> : null}
      </View>
    </View>
  );
}

/** Huella de un dia entrenado: en contorno si fue corta, rellena si llego a 25 minutos. Se estampa (1.4 a 1) al entrar. */
function HuellaDia({ largo, animar, activo, retraso }: { largo: boolean; animar: boolean; activo: boolean; retraso: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const estatico = reducido || !animar;
  const t = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { t.value = 1; return; }
    if (!activo) return;
    t.value = withDelay(retraso, withSpring(1, resortePlaca));
    return () => cancelAnimation(t);
  }, [estatico, activo]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ scale: ESCALA_SELLO - (ESCALA_SELLO - 1) * t.value }],
  }), [tick]);

  return (
    <Animated.View style={estilo}>
      <Huella lado={LADO_HUELLA} contorno={!largo} color={largo ? paleta.magnesia : paleta.magnesia2} opacidad={1} />
    </Animated.View>
  );
}

/** Las dos huellas del calendario con su texto: en contorno, «sesión corta»; rellena, «25 min o más». */
function LeyendaHuellas() {
  return (
    <View
      style={s.leyenda} accessible
      accessibilityLabel="Huella en contorno: sesión corta. Huella rellena: 25 minutos o más."
    >
      <View style={s.leyendaItem} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Huella lado={LADO_HUELLA} contorno color={paleta.magnesia2} opacidad={1} />
        <Text style={s.leyendaTexto}>sesión corta</Text>
      </View>
      <View style={s.leyendaItem} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Huella lado={LADO_HUELLA} color={paleta.magnesia} opacidad={1} />
        <Text style={s.leyendaTexto}>25 min o más</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nombreCaja: { height: ALTO_NOMBRE, overflow: 'hidden', justifyContent: 'center', flex: 1 },
  nombreFila: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  mes: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 28, color: paleta.magnesia },
  anio: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto },
  flechas: { flexDirection: 'row', marginRight: -12 },
  boton: { width: LADO_BOTON, height: LADO_BOTON, alignItems: 'center', justifyContent: 'center' },
  semana: { flexDirection: 'row', marginTop: 8, marginBottom: 4 },
  inicial: { flex: 1, textAlign: 'center', fontFamily: familia.medio, fontSize: 12, lineHeight: 16, color: paleta.magnesia3Texto },
  rejilla: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', flexWrap: 'wrap' },
  celda: { width: `${100 / 7}%`, height: ALTO_CELDA, alignItems: 'center' },
  interior: { width: ANCHO_CELDA, height: ALTO_CELDA, alignItems: 'center', justifyContent: 'center', gap: 2 },
  numero: { fontFamily: familia.medio, fontSize: 15, lineHeight: 20 },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaTexto: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  resumen: { flexDirection: 'row', gap: 8, marginTop: 20 },
  mitad: { flex: 1, flexDirection: 'row' },
});
