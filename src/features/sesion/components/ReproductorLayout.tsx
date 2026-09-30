import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Canvas } from '@shopify/react-native-skia';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  paleta, familia, esp, ALTO_BOTON, MARGEN_PANTALLA, radio, easing, haptico, PALABRA_FASE, faseVisual, type FaseId,
} from '@/ui/theme';
import type { ItemSesion } from '@/lib/engine/session';
import { esUnilateral, type EstadoPlayer } from '@/features/sesion/utils/playerMachine';
import { nombreVisible } from '@/data/nombresVisibles';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { BotonSecundario } from '@/ui/components/BotonSecundario';
import { AnilloTemporizador } from './AnilloTemporizador';
import { NumeroTemporizador } from './NumeroTemporizador';
import { PalabraFase } from './PalabraFase';
import { TarjetaSigue } from './TarjetaSigue';
import { OverlayPausa } from './OverlayPausa';
import { BarraProgresoSesion, type EstadoPlaca } from './BarraProgresoSesion';
import { ModeloEjercicio } from './ModeloEjercicio';
import { GuiaRespiracion } from './GuiaRespiracion';
import { BotonMagnesia } from './BotonMagnesia';
import { useAtmosferaFase } from '@/features/sesion/hooks/useAtmosferaFase';
import { segundosHablados, nombreSiguiente, totalDeFase } from '@/features/sesion/utils/reproductor';

const LIENZO_MARGEN = 40;
const ALTO_MIN_MODELO = 96;
const BARRIDO_OPACIDAD = 0.22;
const BARRIDO_BASE = 200;
const OMITIR_MS = 240;


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

  const {
    colorFase, progreso, escalaAnillo, brillo, destello, golpe, expande, desvanece, inhala, conMarca,
  } = useAtmosferaFase({
    estado, esPorTiempo: p.esPorTiempo, reducido, visual, faseEf, corriendo, enTrabajo, enDescanso, conTiempo, total, claveFase,
  });
  const salidaOmitir = useSharedValue(0);

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
});
