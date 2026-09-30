import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  LinearTransition, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';
import { paleta, conAlfa, familia, easing, resortePlaca } from '@/ui/theme';
import type { ItemPropio } from '@/state/store';
import type { Ejercicio } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { textoDeEquipo } from '@/lib/presentacion';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { TarjetaGoma } from '@/ui/components/TarjetaGoma';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { Stepper } from '@/ui/components/Stepper';
import { colorAnimadoDePlaca } from '@/ui/components/BarraRutina';
import { BotonesOrden } from './BotonesOrden';
import { InterruptorTiempo } from './InterruptorTiempo';

const LADO_MINIATURA = 56;
const ENTRADA_Y = 24;
const ENTRADA_MS = 200;
const SALIDA_MS = 240;
const SALIDA_ESCALA = 0.94;
const FUNDIDO_MS = 150;
const DESPLAZA_MS = 260;
const ESCALA_MOVIDA = 1.02;
const ELEVADA_MS = 300;
const BRILLO_SUBE_MS = 120;
const BRILLO_BAJA_MS = 480;
const MEDIO_GIRO_MS = 130;
const PERSPECTIVA = 700;
const AREA_TACTIL = 44;

const entradaTarjeta = (reducido: boolean): EntryExitAnimationFunction => () => {
  'worklet';
  if (reducido) return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, { duration: FUNDIDO_MS }) } };
  return {
    initialValues: { opacity: 0, transform: [{ translateY: ENTRADA_Y }] },
    animations: { opacity: withTiming(1, { duration: ENTRADA_MS }), transform: [{ translateY: withSpring(0, resortePlaca) }] },
  };
};

/** Al quitarla se encoge y se desvanece (240 ms) mientras las de abajo suben con la transicion de layout. */
const salidaTarjeta = (reducido: boolean): EntryExitAnimationFunction => () => {
  'worklet';
  if (reducido) return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: FUNDIDO_MS }) } };
  return {
    initialValues: { opacity: 1, transform: [{ scale: 1 }] },
    animations: {
      opacity: withTiming(0, { duration: SALIDA_MS }),
      transform: [{ scale: withTiming(SALIDA_ESCALA, { duration: SALIDA_MS }) }],
    },
  };
};

/**
 * Un ejercicio de la rutina: miniatura de 56, nombre, equipo y ↑ ↓; tres columnas de ajuste
 * (series, reps o segundos, descanso) con `Stepper` compacto; «Medir por tiempo» como
 * interruptor y «Quitar». Los limites y saltos son los de siempre. Una marca de 4×20 lleva
 * el color de la placa que este ejercicio tiene en la barra.
 *
 * Al llegar entra desde abajo (solo si `animarEntrada`); al quitarla se encoge y se desvanece;
 * al reordenar se desliza con la transicion de layout y la que se mueve pasa por encima con
 * escala 1.02 (`impulso` sube cada vez); `brillo` (un contador) enciende su borde una vez.
 */
export function TarjetaEjercicioRutina({
  item, ejercicio, indice, animarEntrada, impulso, brillo, onCambio, onMover, onQuitar, onAbrir, alMedir,
}: {
  item: ItemPropio;
  ejercicio: Ejercicio;
  indice: number;
  animarEntrada: boolean;
  impulso: number;
  brillo: number;
  onCambio: (cambio: Partial<ItemPropio>) => void;
  onMover: (dir: -1 | 1) => void;
  onQuitar: () => void;
  onAbrir: () => void;
  alMedir: (y: number, alto: number) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const escala = useSharedValue(1);
  const resplandor = useSharedValue(0);
  const [elevada, setElevada] = useState(false);
  const nombre = nombreVisible(ejercicio.name);
  const porTiempo = item.seg != null;
  const porLado = ejercicio.unilateral || ejercicio.measure === 'reps_por_lado';

  const entrada = useMemo(() => (animarEntrada ? entradaTarjeta(reducido) : undefined), [animarEntrada, reducido]);
  const salida = useMemo(() => salidaTarjeta(reducido), [reducido]);
  const desplazar = reducido ? undefined : LinearTransition.duration(DESPLAZA_MS);

  useEffect(() => {
    if (!impulso || reducido) return;
    setElevada(true);
    escala.value = withSequence(withTiming(ESCALA_MOVIDA, { duration: 120 }), withTiming(1, { duration: DESPLAZA_MS - 120 }));
    const id = setTimeout(() => setElevada(false), ELEVADA_MS);
    return () => clearTimeout(id);
  }, [impulso]);

  useEffect(() => {
    if (!brillo) return;
    resplandor.value = withSequence(withTiming(1, { duration: BRILLO_SUBE_MS }), withTiming(0, { duration: BRILLO_BAJA_MS }));
  }, [brillo]);

  const cuerpo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }), [tick]);
  const borde = useAnimatedStyle(() => ({ opacity: resplandor.value }), [tick]);

  return (
    <Animated.View
      entering={entrada} exiting={salida} layout={desplazar}
      onLayout={(e: LayoutChangeEvent) => alMedir(e.nativeEvent.layout.y, e.nativeEvent.layout.height)}
      style={[s.raiz, elevada && s.elevada, cuerpo]}
    >
      <TarjetaGoma relleno={16}>
        <View style={s.contenido}>
          <View style={s.arriba}>
            <MarcaPlaca indice={indice} />
            <FotoOscura tipo="ejercicio" id={ejercicio.id} ancho={LADO_MINIATURA} alto={LADO_MINIATURA} radioEsquina={14} velo={false} />
            <Pressable
              onPress={onAbrir} style={s.textos} accessibilityRole="button" accessibilityLabel={`Ver ${nombre}`}
            >
              <Text style={s.nombre} numberOfLines={2} maxFontSizeMultiplier={1.2}>{nombre}</Text>
              <Text style={s.equipo} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {textoDeEquipo(ejercicio.equipment)}{porLado ? ' · por lado' : ''}
              </Text>
            </Pressable>
            <BotonesOrden nombre={nombre} onSubir={() => onMover(-1)} onBajar={() => onMover(1)} />
          </View>

          <View style={s.ajustes}>
            <Columna etiqueta="Series">
              <Stepper compacto etiqueta="Series" valor={item.series} min={1} max={10} onCambio={v => onCambio({ series: v })} />
            </Columna>
            <ColumnaMedida porTiempo={porTiempo} item={item} onCambio={onCambio} />
            <Columna etiqueta="Descanso">
              <Stepper
                compacto etiqueta="Descanso" valor={item.descansoS} min={0} max={240} paso={5} sufijo="s"
                onCambio={v => onCambio({ descansoS: v })}
              />
            </Columna>
          </View>

          <View style={s.abajo}>
            <InterruptorTiempo
              activo={porTiempo}
              onCambio={() => onCambio(porTiempo
                ? { seg: undefined, reps: ejercicio.default.reps ?? 10 }
                : { reps: undefined, seg: ejercicio.default.seg ?? 30 })}
            />
            <Pressable onPress={onQuitar} style={s.quitar} accessibilityRole="button" accessibilityLabel={`Quitar ${nombre}`}>
              <Text style={s.quitarTexto} maxFontSizeMultiplier={1.2}>Quitar</Text>
            </Pressable>
          </View>
        </View>
      </TarjetaGoma>
      <Animated.View pointerEvents="none" style={[s.brillo, borde]} />
    </Animated.View>
  );
}

/** 4×20 con el color de la placa de este ejercicio; cambia de color con la posicion, como la placa. */
function MarcaPlaca({ indice }: { indice: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const t = useSharedValue(indice);

  useEffect(() => {
    t.value = reducido ? indice : withTiming(indice, { duration: DESPLAZA_MS - 20, easing: easing.salida });
  }, [indice, reducido]);

  const estilo = useAnimatedStyle(() => ({ backgroundColor: colorAnimadoDePlaca(t.value) }), [tick]);
  return <Animated.View style={[s.marca, estilo]} />;
}

function Columna({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <View style={s.columna}>
      <Text style={s.etiqueta} numberOfLines={1} maxFontSizeMultiplier={1.2}>{etiqueta}</Text>
      {children}
    </View>
  );
}

/**
 * La columna del medio: «Reps» o «Segundos». Al cambiar de unidad da la vuelta como un
 * tablero de salidas (2 × 130 ms): sale girando con la cara vieja y su ultimo valor y vuelve
 * con la nueva. Con movimiento reducido cambia sin girar.
 */
function ColumnaMedida({ porTiempo, item, onCambio }: {
  porTiempo: boolean; item: ItemPropio; onCambio: (cambio: Partial<ItemPropio>) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const giro = useSharedValue(0);
  const [mostrada, setMostrada] = useState(porTiempo);
  const valorActual = porTiempo ? (item.seg ?? 30) : (item.reps ?? 10);
  const congelado = useRef(valorActual);
  const cambiando = mostrada !== porTiempo;
  if (!cambiando) congelado.current = valorActual;

  useEffect(() => {
    if (mostrada === porTiempo) return;
    const entrar = () => { setMostrada(porTiempo); giro.value = -90; giro.value = withTiming(0, { duration: MEDIO_GIRO_MS }); };
    if (reducido) { setMostrada(porTiempo); return; }
    giro.value = withTiming(90, { duration: MEDIO_GIRO_MS }, fin => { if (fin) runOnJS(entrar)(); });
  }, [porTiempo]);

  const vuelta = useAnimatedStyle(() => ({
    transform: [{ perspective: PERSPECTIVA }, { rotateX: `${giro.value}deg` }],
  }), [tick]);

  const tiempo = cambiando ? mostrada : porTiempo;
  const valor = cambiando ? congelado.current : valorActual;
  return (
    <Animated.View style={[s.columna, vuelta]} pointerEvents={cambiando ? 'none' : 'auto'}>
      <Text style={s.etiqueta} numberOfLines={1} maxFontSizeMultiplier={1.2}>{tiempo ? 'Segundos' : 'Reps'}</Text>
      {tiempo ? (
        <Stepper
          key="seg" compacto etiqueta="Segundos" valor={valor} min={5} max={300} paso={5} sufijo="s"
          onCambio={v => onCambio({ seg: v })}
        />
      ) : (
        <Stepper key="reps" compacto etiqueta="Repeticiones" valor={valor} min={1} max={50} onCambio={v => onCambio({ reps: v })} />
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  raiz: { position: 'relative' },
  elevada: { zIndex: 2 },
  contenido: { gap: 12 },
  arriba: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  marca: { width: 4, height: 20, borderRadius: 2, marginRight: -2 },
  textos: { flex: 1, gap: 2, minHeight: LADO_MINIATURA, justifyContent: 'center' },
  nombre: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 21, color: paleta.magnesia },
  equipo: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  ajustes: { flexDirection: 'row', gap: 8 },
  columna: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14,
    backgroundColor: paleta.goma,
  },
  etiqueta: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  abajo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quitar: { minHeight: AREA_TACTIL, minWidth: AREA_TACTIL, alignItems: 'flex-end', justifyContent: 'center' },
  quitarTexto: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20, color: paleta.placaRojaTexto },
  brillo: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, borderWidth: 1,
    borderColor: conAlfa(paleta.magnesia, 0.4),
  },
});
