import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, cancelAnimation, interpolateColor, runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue,
  useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Canvas } from '@shopify/react-native-skia';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  paleta, familia, esp, ALTO_BOTON, MARGEN_PANTALLA, radio, easing, resortePlaca, resorteTap, haptico,
  COLOR_FASE, ORDEN_FASE, PALABRA_FASE, faseVisual, type FaseId,
} from '@/ui/theme';
import type { ItemSesion } from '@/engine/session';
import { PREPARACION_S, esUnilateral, type EstadoPlayer } from '@/session/playerMachine';
import { nombreVisible } from '@/data/nombresVisibles';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import Clip from '@/ui/components/Clip';
import Foto from '@/ui/components/Foto';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { BotonSecundario } from '@/ui/components/BotonSecundario';
import { AnilloTemporizador } from './AnilloTemporizador';
import { NumeroTemporizador } from './NumeroTemporizador';
import { PalabraFase } from './PalabraFase';
import { TarjetaSigue } from './TarjetaSigue';
import { OverlayPausa } from './OverlayPausa';
import { BarraProgresoSesion, type EstadoPlaca } from './BarraProgresoSesion';

const CAMBIO_LADO_S = 5;
const LIENZO_MARGEN = 40;
const ALTO_MIN_MODELO = 96;
const RESPIRO_MS = 8000;
const RESPIRO_ESCALA = 0.08;
const BARRIDO_SUBE_MS = 380;
const BARRIDO_BAJA_MS = 300;
const BARRIDO_OPACIDAD = 0.22;
const BARRIDO_BASE = 200;
const GOLPE_ESCALA = 1.15;
const OMITIR_MS = 240;
const ANUNCIO_CADA_S = 10;

/** "1 minuto 5 segundos", para que un lector de pantalla no deletree "1:05". */
const segundosHablados = (s: number) => {
  const m = Math.floor(s / 60), r = s % 60;
  const min = m > 0 ? `${m} minuto${m === 1 ? '' : 's'}` : '';
  const seg = r > 0 || m === 0 ? `${r} segundo${r === 1 ? '' : 's'}` : '';
  return [min, seg].filter(Boolean).join(' ');
};

/** Nombre del ejercicio que viene tras la serie actual: el mismo si quedan series, si no el siguiente. */
function nombreSiguiente(items: ItemSesion[], i: number, serie: number): string {
  const it = items[i];
  if (serie < it.seriesPlan) return it.name;
  return items[i + 1]?.name ?? 'Último esfuerzo';
}

function totalDeFase(fase: FaseId, it: ItemSesion): number | null {
  switch (fase) {
    case 'preparado': return PREPARACION_S;
    case 'cambio_lado': return CAMBIO_LADO_S;
    case 'trabajo': return it.segPlan;
    case 'descanso': return it.descansoPlan;
    default: return null;
  }
}

export interface ReproductorLayoutProps {
  items: ItemSesion[];
  estado: EstadoPlayer;
  ejercicio: ItemSesion;
  esPorTiempo: boolean;
  puedeDeshacer: boolean;
  hablando: boolean;
  /** Cuenta 3-2-1 de preparado, cambio de lado y trabajo por tiempo: deshabilita Listo y Terminar antes. */
  cuentaFinal: boolean;
  /** Lo anterior mas el descanso: deshabilita Ya estoy. */
  cuentaHablada: boolean;
  verClip: boolean;
  clipActivo: boolean;
  /** La hoja de salida esta abierta: la pausa que la acompana no muestra su velo. */
  salidaAbierta: boolean;
  onSalir: () => void;
  onPausa: () => void;
  onReanudar: () => void;
  onAvanzar: () => void;
  onListo: () => void;
  onOmitir: () => void;
  onDeshacer: () => void;
}

/**
 * La pantalla de la sesion. Siempre `goma` con su textura: la fase se lee por
 * el color de su placa (anillo, palabra, resplandor y placa actual de la barra;
 * ver DESIGN.md). Un unico `Canvas` de Skia dibuja el anillo y el resplandor.
 * Todo reacciona al estado de la maquina: nada aqui provoca ni retrasa un
 * cambio de fase, y el anillo lee `restanteS`, no lleva reloj propio.
 */
export function ReproductorLayout(p: ReproductorLayoutProps) {
  const { estado, ejercicio, items } = p;
  const reducido = useReducedMotion();
  const tick = useTick();
  const inset = useSafeAreaInsets();
  const { height: alto } = useWindowDimensions();

  const diametro = Math.min(260, Math.max(227, Math.round(alto * 0.29)));
  const lienzo = diametro + 2 * LIENZO_MARGEN;
  const tamanoNumero = Math.round((diametro * 160) / 260);

  const faseEf: FaseId = estado.fase === 'pausa' ? (estado.faseAnterior ?? 'preparado') : estado.fase;
  const visual = faseVisual(estado.fase, estado.faseAnterior);
  const pausaManual = estado.fase === 'pausa' && !p.hablando && !p.salidaAbierta;
  const corriendo = estado.fase !== 'pausa' && estado.fase !== 'fin';
  const enTrabajo = visual === 'trabajo';
  const enDescanso = visual === 'descanso';
  const conTiempo = faseEf === 'trabajo' ? p.esPorTiempo : faseEf !== 'fin';
  const totalBase = totalDeFase(faseEf, ejercicio);
  const total = totalBase == null ? null : Math.max(totalBase, estado.restanteS);
  const claveFase = `${faseEf}:${estado.indice}:${estado.serieNum}:${estado.lado}`;

  /* --- Color de la fase, compartido por el anillo, el resplandor, el barrido y la barra --- */

  const idxFase = useSharedValue(ORDEN_FASE.indexOf(visual));
  const colorFase = useDerivedValue(() => interpolateColor(
    idxFase.value, [0, 1, 2], [COLOR_FASE.preparado, COLOR_FASE.trabajo, COLOR_FASE.descanso],
  ));

  const progreso = useSharedValue(1);
  const respiro = useSharedValue(0);
  const latido = useSharedValue(0);
  const destello = useSharedValue(0);
  const golpe = useSharedValue(1);
  const expande = useSharedValue(0);
  const desvanece = useSharedValue(0);
  const salidaOmitir = useSharedValue(0);
  const [inhala, setInhala] = useState(true);

  const escalaAnillo = useDerivedValue(() => {
    const r = respiro.value;
    const tri = r < 0.5 ? r * 2 : 2 - r * 2;
    return 1 + RESPIRO_ESCALA * (tri * tri * (3 - 2 * tri));
  });
  const brillo = useDerivedValue(() => (enTrabajo ? 0.12 + 0.04 * latido.value : 0.14), [enTrabajo]);

  useAnimatedReaction(() => respiro.value < 0.5, (v, previo) => {
    if (v !== previo) runOnJS(setInhala)(v);
  });

  /* --- Cambio de atmosfera: color, barrido, haptica --- */

  const visualPrevio = useRef(visual);
  useEffect(() => {
    const cambio = visualPrevio.current !== visual;
    visualPrevio.current = visual;
    idxFase.value = withTiming(ORDEN_FASE.indexOf(visual), { duration: reducido ? 150 : BARRIDO_SUBE_MS });
    if (!cambio) return;
    if (visual === 'trabajo') haptico.golpe();
    else if (visual === 'descanso') haptico.suave();
    else haptico.placa();
    if (reducido) return;
    expande.value = 0;
    desvanece.value = 0;
    expande.value = withTiming(1, { duration: BARRIDO_SUBE_MS, easing: easing.salida });
    desvanece.value = withDelay(BARRIDO_SUBE_MS, withTiming(1, { duration: BARRIDO_BAJA_MS }));
  }, [visual, reducido]);

  /* --- Anillo: se vacia de forma continua a partir de `restanteS` --- */

  const clavePrevia = useRef(claveFase);
  useEffect(() => {
    const nueva = clavePrevia.current !== claveFase;
    clavePrevia.current = claveFase;
    if (total == null || total <= 0 || !conTiempo) { progreso.value = 1; return; }
    const ahora = Math.min(1, estado.restanteS / total);
    const siguiente = Math.max(0, (estado.restanteS - 1) / total);
    cancelAnimation(progreso);
    if (!corriendo) { progreso.value = ahora; return; }
    if (nueva && !reducido) {
      progreso.value = withSequence(
        withTiming(ahora, { duration: 240 }),
        withTiming(siguiente, { duration: 760, easing: Easing.linear }),
      );
    } else {
      progreso.value = ahora;
      progreso.value = withTiming(siguiente, { duration: 1000, easing: Easing.linear });
    }
  }, [estado.restanteS, total, corriendo, claveFase, conTiempo, reducido]);

  /* --- Respiracion del descanso y pulso del resplandor de trabajo --- */

  useEffect(() => {
    if (reducido || !enDescanso) {
      cancelAnimation(respiro);
      respiro.value = withTiming(0, { duration: 200 });
      return;
    }
    if (!corriendo) { cancelAnimation(respiro); return; }
    respiro.value = withRepeat(
      withTiming(1, { duration: RESPIRO_MS, easing: Easing.linear }), -1, false,
    );
  }, [enDescanso, corriendo, reducido]);

  useEffect(() => {
    if (reducido || !enTrabajo || !corriendo) { cancelAnimation(latido); return; }
    latido.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [enTrabajo, corriendo, reducido]);

  /* --- Los ultimos 3 segundos: golpe y haptica Rigid --- */

  const cuentaVisual = corriendo && conTiempo && faseEf !== 'fin' && estado.restanteS >= 1 && estado.restanteS <= 3
    && (faseEf !== 'trabajo' || p.esPorTiempo);
  const ultimaCuenta = useRef('');
  useEffect(() => {
    if (!cuentaVisual) return;
    const clave = `${claveFase}:${estado.restanteS}`;
    if (ultimaCuenta.current === clave) return;
    ultimaCuenta.current = clave;
    haptico.sello();
    if (reducido) return;
    golpe.value = withSequence(withTiming(GOLPE_ESCALA, { duration: 80 }), withSpring(1, resortePlaca));
  }, [estado.restanteS, cuentaVisual, claveFase, reducido]);

  /* --- La mitad del trabajo: la marca del anillo destella, sin haptica --- */

  const conMarca = faseEf === 'trabajo' && p.esPorTiempo && (total ?? 0) >= 6;
  const ultimaMitad = useRef('');
  useEffect(() => {
    if (!conMarca || reducido || total == null || estado.restanteS !== Math.floor(total / 2)) return;
    if (ultimaMitad.current === claveFase) return;
    ultimaMitad.current = claveFase;
    destello.value = withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 300 }));
  }, [estado.restanteS, conMarca, claveFase, reducido]);

  /* --- Un lector de pantalla oye la fase al cambiar y el tiempo cada 10 s, no cada segundo --- */

  const faseAnunciada = useRef<string | null>(null);
  useEffect(() => {
    if (estado.fase === 'pausa' || estado.fase === 'fin') return;
    const fraseTiempo = conTiempo ? `, ${segundosHablados(estado.restanteS)}` : '';
    if (faseAnunciada.current !== claveFase) {
      faseAnunciada.current = claveFase;
      AccessibilityInfo.announceForAccessibility(`${PALABRA_FASE[faseEf]}${fraseTiempo}`);
    } else if (conTiempo && estado.restanteS > 0 && estado.restanteS % ANUNCIO_CADA_S === 0) {
      AccessibilityInfo.announceForAccessibility(segundosHablados(estado.restanteS));
    }
  }, [estado.restanteS, claveFase]);

  /* --- Datos derivados --- */

  const nombre = nombreVisible(faseEf === 'descanso' ? nombreSiguiente(items, estado.indice, estado.serieNum) : ejercicio.name);
  const siguiente = items[estado.indice + 1];
  const etiquetaNumero = conTiempo
    ? `${PALABRA_FASE[faseEf]}, ${segundosHablados(estado.restanteS)} restantes`
    : `${PALABRA_FASE[faseEf]}, ${ejercicio.repsPlan ?? 'sin definir'} repeticiones`;

  const estados: EstadoPlaca[] = items.map((_, i) => {
    if (i > estado.indice) return 'pendiente';
    if (i === estado.indice) return 'actual';
    const propias = estado.hechas.filter(h => h.orden === i);
    return propias.length > 0 && propias.every(h => h.omitida) ? 'omitido' : 'hecho';
  });
  const huecos = ejercicio.seriesPlan * (esUnilateral(ejercicio) ? 2 : 1);
  const hechasAqui = estado.hechas.filter(h => h.orden === estado.indice).length;
  const enCurso = faseEf === 'trabajo' && p.esPorTiempo && total ? 1 - estado.restanteS / total : 0;
  const fraccion = Math.min(1, (hechasAqui + enCurso) / huecos);

  const barrido = useAnimatedStyle(() => ({
    backgroundColor: colorFase.value,
    opacity: BARRIDO_OPACIDAD * (1 - desvanece.value) * (expande.value > 0 ? 1 : 0),
    transform: [{ scale: 0.05 + 15 * expande.value }],
  }), [tick]);
  const modelo = useAnimatedStyle(() => ({
    opacity: 1 - salidaOmitir.value,
    transform: [{ translateY: -60 * salidaOmitir.value }],
  }), [tick]);

  const omitir = () => {
    if (!reducido) {
      salidaOmitir.value = withSequence(
        withTiming(1, { duration: OMITIR_MS, easing: easing.salida }), withTiming(0, { duration: 1 }),
      );
    }
    p.onOmitir();
  };

  const [altoModelo, setAltoModelo] = useState(0);
  const mostrarSigue = faseEf !== 'descanso' && faseEf !== 'fin' && !!siguiente;

  return (
    <View style={s.raiz}>
      <StatusBar style="light" />
      <GomaTexture />
      <View style={[s.columna, { paddingTop: inset.top, paddingBottom: Math.max(inset.bottom, esp.md) }]}>
        <View style={s.barra}>
          <BarraProgresoSesion estados={estados} fraccion={fraccion} color={colorFase} />
        </View>

        <View style={s.cabecera}>
          <Pressable onPress={p.onSalir} hitSlop={8} style={s.boton} accessibilityRole="button" accessibilityLabel="Salir">
            <Text style={s.botonTexto}>Salir</Text>
          </Pressable>
          <Text style={s.indice}>
            <Text style={s.indiceNumero}>{estado.indice + 1}</Text> de {items.length}
          </Text>
          <Pressable
            onPress={p.onPausa} hitSlop={8} style={[s.boton, s.botonDerecha]}
            disabled={estado.fase === 'pausa' && p.hablando}
            accessibilityRole="button" accessibilityLabel={estado.fase === 'pausa' ? 'Seguir' : 'Pausa'}
            accessibilityState={{ disabled: estado.fase === 'pausa' && p.hablando }}
          >
            <Text style={[s.botonTexto, estado.fase === 'pausa' && p.hablando && s.apagado]}>
              {estado.fase === 'pausa' ? 'Seguir' : 'Pausa'}
            </Text>
          </Pressable>
        </View>

        {enDescanso && <View style={s.espacio} />}
        <View style={s.centro}>
          <PalabraFase texto={PALABRA_FASE[faseEf]} visual={visual} />

          <View style={{ width: diametro, height: diametro, marginTop: 4 }}>
            <Animated.View
              pointerEvents="none"
              style={[s.barrido, { left: (diametro - BARRIDO_BASE) / 2, top: (diametro - BARRIDO_BASE) / 2 }, barrido]}
            />
            <Canvas
              pointerEvents="none"
              style={{ position: 'absolute', left: -LIENZO_MARGEN, top: -LIENZO_MARGEN, width: lienzo, height: lienzo }}
            >
              <AnilloTemporizador
                lienzo={lienzo} diametro={diametro} progreso={progreso} color={colorFase} escala={escalaAnillo}
                brillo={brillo} destello={destello} conMarca={conMarca}
              />
            </Canvas>
            <View style={s.numero} accessible accessibilityLabel={etiquetaNumero}>
              <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                <NumeroTemporizador
                  key={claveFase} segundos={estado.restanteS} tamano={tamanoNumero} golpe={golpe}
                  apagado={estado.fase === 'pausa'}
                  fijo={conTiempo ? undefined : String(ejercicio.repsPlan ?? '—')}
                />
              </View>
            </View>
          </View>

          <Text style={s.nombre} numberOfLines={2} maxFontSizeMultiplier={1.2}>{nombre}</Text>
          <Text style={s.serie}>
            Serie {estado.serieNum} de {ejercicio.seriesPlan}
            {estado.lado ? ` · lado ${estado.lado === 'izq' ? 'izquierdo' : 'derecho'}` : ''}
          </Text>
          {enDescanso && <GuiaRespiracion inhala={inhala} activo={corriendo && !reducido} />}
        </View>

        {enDescanso ? <View style={s.espacio} /> : (
        <View style={s.zonaModelo}>
          {p.verClip && (
            <Animated.View
              style={[s.ficha, modelo]}
              onLayout={e => setAltoModelo(e.nativeEvent.layout.height)}
            >
              {altoModelo >= ALTO_MIN_MODELO && (
                <ModeloEjercicio id={ejercicio.id} nombre={ejercicio.name} alto={altoModelo} activo={p.clipActivo} />
              )}
            </Animated.View>
          )}
        </View>
        )}

        {mostrarSigue && <View style={s.sigue}><TarjetaSigue item={siguiente} /></View>}

        <View style={s.acciones}>
          {faseEf === 'descanso' && estado.fase !== 'pausa' && (
            <BotonMagnesia texto="Ya estoy" onPress={p.onAvanzar} deshabilitado={p.hablando || p.cuentaHablada} />
          )}
          {estado.fase === 'trabajo' && !p.esPorTiempo && (
            <BotonPlaca texto="Listo" onPress={p.onListo} deshabilitado={p.hablando || p.cuentaFinal} />
          )}
          {estado.fase === 'trabajo' && p.esPorTiempo && (
            <BotonSecundario texto="Terminar antes" onPress={p.onAvanzar} deshabilitado={p.hablando || p.cuentaFinal} />
          )}
        </View>

        <View style={s.secundarias}>
          {p.puedeDeshacer && (
            <Pressable
              onPress={p.onDeshacer} hitSlop={8} style={s.enlace}
              accessibilityRole="button" accessibilityLabel="Deshacer la última serie marcada"
            >
              <Text style={s.enlaceDeshacer}>Deshacer última serie</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => { if (p.hablando) return; haptico.toque(); omitir(); }}
            disabled={p.hablando} style={[s.enlace, p.hablando && s.apagado]}
            accessibilityRole="button" accessibilityLabel="Omitir este ejercicio"
            accessibilityState={{ disabled: p.hablando }}
          >
            <Text style={s.enlaceOmitir}>Omitir este ejercicio</Text>
          </Pressable>
        </View>
      </View>

      <OverlayPausa visible={pausaManual} hablando={p.hablando} onSeguir={p.onReanudar} onSalir={p.onSalir} />
    </View>
  );
}

/** El modelo: el clip del ejercicio en bucle. Al cambiar de ejercicio el saliente se desliza a la izquierda y el nuevo entra por la derecha. */
function ModeloEjercicio({ id, nombre, alto, activo }: { id: string; nombre: string; alto: number; activo: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [saliente, setSaliente] = useState<string | null>(null);
  const previo = useRef(id);
  const entra = useSharedValue(1);
  const sale = useSharedValue(0);

  useEffect(() => {
    if (previo.current === id) return;
    const anterior = previo.current;
    previo.current = id;
    if (reducido) return;
    setSaliente(anterior);
    entra.value = 0;
    sale.value = 0;
    entra.value = withTiming(1, { duration: 300, easing: easing.salida });
    sale.value = withTiming(1, { duration: 300, easing: easing.salida }, fin => { if (fin) runOnJS(setSaliente)(null); });
  }, [id, reducido]);

  const entrante = useAnimatedStyle(() => ({
    opacity: entra.value, transform: [{ translateX: (1 - entra.value) * 60 }],
  }), [tick]);
  const saliendo = useAnimatedStyle(() => ({
    opacity: 1 - sale.value, transform: [{ translateX: -60 * sale.value }],
  }), [tick]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, entrante]}>
        <Clip id={id} nombre={nombre} alto={alto} ancho="100%" forma="tarjeta" activo={activo} />
      </Animated.View>
      {saliente && (
        <Animated.View style={[StyleSheet.absoluteFill, saliendo]} pointerEvents="none">
          <Foto tipo="ejercicio" id={saliente} alto={alto} ancho="100%" forma="tarjeta" />
        </Animated.View>
      )}
    </View>
  );
}

/** «Inhala» y «Exhala» cruzandose al ritmo del anillo. Es solo visual: no cambia la duracion del descanso. */
function GuiaRespiracion({ inhala, activo }: { inhala: boolean; activo: boolean }) {
  const t = useSharedValue(inhala ? 1 : 0);
  const tick = useTick();
  useEffect(() => { t.value = withTiming(inhala ? 1 : 0, { duration: 500 }); }, [inhala]);
  const uno = useAnimatedStyle(() => ({ opacity: activo ? t.value : 0 }), [activo, tick]);
  const otro = useAnimatedStyle(() => ({ opacity: activo ? 1 - t.value : 0 }), [activo, tick]);
  return (
    <View style={s.guia} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.Text style={[s.guiaTexto, uno]}>Inhala</Animated.Text>
      <Animated.Text style={[s.guiaTexto, s.guiaSuperpuesta, otro]}>Exhala</Animated.Text>
    </View>
  );
}

/** «Ya estoy» del descanso: solido `magnesia` con texto `goma`, para no competir con el azul del ambiente. */
function BotonMagnesia({ texto, onPress, deshabilitado }: { texto: string; onPress: () => void; deshabilitado: boolean }) {
  const presion = useSharedValue(0);
  const cuerpo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.03 * presion.value }] }));
  return (
    <Pressable
      onPressIn={() => { if (deshabilitado) return; presion.value = withSpring(1, resorteTap); haptico.toque(); }}
      onPressOut={() => { presion.value = withSpring(0, resorteTap); }}
      onPress={deshabilitado ? undefined : onPress}
      accessibilityRole="button" accessibilityLabel={texto} accessibilityState={{ disabled: deshabilitado }}
    >
      <Animated.View style={[s.magnesia, deshabilitado && s.apagado, cuerpo]}>
        <Text style={s.magnesiaTexto}>{texto}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  columna: { flex: 1 },
  barra: { marginTop: 8 },
  cabecera: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: MARGEN_PANTALLA - 8, minHeight: 48,
  },
  boton: { minWidth: 48, minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 },
  botonDerecha: { alignItems: 'flex-end' },
  botonTexto: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia2 },
  apagado: { opacity: 0.4 },
  indice: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto },
  indiceNumero: { fontFamily: familia.titulo, fontSize: 18, color: paleta.magnesia },
  centro: { alignItems: 'center', paddingHorizontal: MARGEN_PANTALLA },
  barrido: { position: 'absolute', width: BARRIDO_BASE, height: BARRIDO_BASE, borderRadius: BARRIDO_BASE / 2 },
  numero: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  nombre: {
    fontFamily: familia.display, fontSize: 30, lineHeight: 32, color: paleta.magnesia, textAlign: 'center', marginTop: 8,
  },
  serie: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia2, marginTop: 2 },
  guia: { height: 20, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  guiaTexto: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  guiaSuperpuesta: { position: 'absolute' },
  espacio: { flex: 1 },
  zonaModelo: { flex: 1, paddingHorizontal: MARGEN_PANTALLA, paddingVertical: 8 },
  ficha: { flex: 1, borderRadius: radio.tarjeta, overflow: 'hidden', backgroundColor: paleta.magnesia },
  sigue: { paddingHorizontal: MARGEN_PANTALLA, paddingBottom: 8 },
  acciones: { paddingHorizontal: MARGEN_PANTALLA, minHeight: ALTO_BOTON, justifyContent: 'center' },
  secundarias: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24,
    paddingHorizontal: MARGEN_PANTALLA, minHeight: 48,
  },
  enlace: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 },
  enlaceDeshacer: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 18, color: paleta.magnesia2 },
  enlaceOmitir: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia3Texto },
  magnesia: {
    minHeight: ALTO_BOTON, borderRadius: radio.pastilla, alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.magnesia,
  },
  magnesiaTexto: { fontFamily: familia.negrita, fontSize: 17, lineHeight: 22, color: paleta.goma },
});
