/**
 * Presentacion: las cuatro laminas que ve quien abre la app por primera vez.
 * Foto a sangre arriba con parallax, texto anclado abajo y la zona de control
 * fija. La logica (indice, avanzar, saltar) vive en `usePresentacion`; aqui
 * solo hay presentacion. Cada lamina anima su entrada una sola vez.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTick } from '@/ui/hooks/useTick';
import { View, Text, ScrollView, StyleSheet, Pressable, AccessibilityInfo, useWindowDimensions } from 'react-native';
import Animated, {
  LinearTransition, useAnimatedStyle, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  paleta, color, tipo, esp, MARGEN_PANTALLA, AREA_TACTIL_MIN, peso, dur, easing, resortePlaca,
} from '@/ui/theme';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { NotaEntrenador, estiloNota } from '@/ui/components/NotaEntrenador';
import { InsigniaEvidencia } from '@/ui/components/InsigniaEvidencia';
import { BarraPlacas } from '@/features/onboarding/components/BarraPlacas';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { FotoParallax } from '@/features/onboarding/components/FotoParallax';
import { TituloEstampado } from '@/features/onboarding/components/TituloEstampado';
import { TituloMascara } from '@/ui/fx/TituloMascara';
import { DialTiempo } from '@/ui/fx/DialTiempo';
import { TachadoMito } from '@/ui/fx/TachadoMito';
import { Entrada } from '@/ui/fx/Entrada';
import { fuente } from '@/media/registry';
import { usePresentacion, type Lamina } from '@/features/onboarding/hooks/usePresentacion';
import { useFirstView } from '@/features/onboarding/hooks/useFirstView';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { TextoConCifra } from '@/features/onboarding/components/TextoConCifra';

const FRACCION_FOTO = 0.62;
const FACTOR_CUERPO = 1.15;
const DIAL_MIN = 110;
const DIAL_MAX = 200;
const DESPLAZAMIENTO_ENTRADA = 8;
const FUNDIDO_REDUCIDO_MS = 150;

/** Segundos en ms desde que la lamina se vuelve activa: cuerpo, elementos extra y nota de cada paso. */
const TIEMPOS = [
  { cuerpo: 650, extra: 0, nota: 850 },
  { cuerpo: 300, extra: 450, nota: 800 },
  { cuerpo: 300, extra: 200, nota: 700 },
  { cuerpo: 300, extra: 350, nota: 1500 },
] as const;
const INTERVALO_INSIGNIAS_MS = 150;
const INTERVALO_ETIQUETAS_MS = 40;
const RETRASO_NOTA_CIFRA_MS = 200;

/** «Gratis. Todo. Sin trucos» se lee en tres golpes; el resto de titulos va en un solo bloque. */
function lineasDeTitulo(titulo: string): string[] {
  return titulo.includes('. ') ? titulo.split('. ').map((t, n, todas) => (n < todas.length - 1 ? `${t}.` : t)) : [titulo];
}

export default function Presentacion({ onTerminar }: { onTerminar: () => void }) {
  const { width, height } = useWindowDimensions();
  const reducido = useReducedMotion();
  const { i, laminas, esUltima, avanzar, saltar } = usePresentacion(onTerminar);
  const { debeAnimar, marcarVisto, soltar } = useFirstView();
  const progreso = useSharedValue(0);
  const alturaFoto = Math.round(height * FRACCION_FOTO);

  const fotos = useMemo(() => laminas.map(l => fuente('fondo', l.id)), [laminas]);
  const recortes = useMemo(() => {
    const r = laminas.map(l => fuente('fondo', `${l.id}_recorte`));
    return r.some(x => x !== null) ? r : undefined;
  }, [laminas]);

  useEffect(() => {
    if (i > 0) AccessibilityInfo.announceForAccessibility(`Paso ${i + 1} de ${laminas.length}. ${laminas[i].titulo}`);
  }, [i]);

  useEffect(() => {
    progreso.set(withTiming(i, { duration: reducido ? FUNDIDO_REDUCIDO_MS : dur.lento, easing: easing.salida }));
    marcarVisto(i);
    return () => soltar(i);
  }, [i, reducido]);

  const ensancha = useMemo(() => LinearTransition.springify().damping(resortePlaca.damping)
    .stiffness(resortePlaca.stiffness).mass(resortePlaca.mass), []);

  return (
    <View style={s.raiz}>
      <View style={[s.foto, { width, height: alturaFoto }]} pointerEvents="none">
        <FotoParallax
          fotos={fotos} recortes={recortes} progreso={progreso} indice={i}
          ancho={width} alto={alturaFoto} sinParallax={reducido}
        />
      </View>
      <GomaTexture />

      <SafeAreaView style={s.contenido}>
        <View style={s.barraSuperior}>
          <Text style={[tipo.wordmark, { color: paleta.magnesia }]} maxFontSizeMultiplier={1.1}>DARENOW</Text>
          <Pressable
            onPress={saltar} hitSlop={12} style={s.saltar}
            accessibilityRole="button" accessibilityLabel="Saltar"
          >
            <Text style={s.saltarTexto}>Saltar</Text>
          </Pressable>
        </View>

        <View style={s.zonaTexto}>
          {laminas.map((l, k) => (
            <LaminaTexto
              key={l.id} lamina={l} k={k} activo={i === k} progreso={progreso}
              ancho={width} animar={debeAnimar(k)} reducido={reducido}
            />
          ))}
        </View>

        <View style={s.control}>
          <BarraPlacas paso={i} total={laminas.length} />
          <Animated.View
            layout={reducido ? undefined : ensancha}
            style={esUltima ? s.botonAncho : s.botonCompacto}
          >
            <BotonPlaca texto={esUltima ? 'Empezar' : 'Seguir'} onPress={avanzar} aplauso={esUltima} estilo={s.boton} />
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function LaminaTexto({ lamina: l, k, activo, progreso, ancho, animar, reducido }: {
  lamina: Lamina; k: number; activo: boolean; progreso: SharedValue<number>;
  ancho: number; animar: boolean; reducido: boolean;
}) {
  const t = TIEMPOS[k];
  const [altoZona, setAltoZona] = useState(0);
  const [altoTexto, setAltoTexto] = useState(0);
  const movimiento = reducido ? 0 : 1;

  // El titulo viaja a 1.0x; cuerpo y nota, a 1.15x: llegan un poco despues.
  const estiloTitulo = useCapa(k, progreso, ancho, 1, movimiento);
  const estiloCuerpo = useCapa(k, progreso, ancho, FACTOR_CUERPO, movimiento);
  const estiloDial = useCapa(k, progreso, ancho, 1, movimiento);

  const libre = altoZona - altoTexto - esp.md;
  const dial = Math.min(DIAL_MAX, libre);
  const arribaDial = Math.max(0, (altoZona - altoTexto - dial) / 2);

  return (
    <View
      style={s.lamina}
      pointerEvents={activo ? 'auto' : 'none'}
      accessibilityElementsHidden={!activo}
      importantForAccessibility={activo ? 'auto' : 'no-hide-descendants'}
      onLayout={e => setAltoZona(e.nativeEvent.layout.height)}
    >
      {k === 2 && altoZona > 0 && altoTexto > 0 && libre >= DIAL_MIN && (
        <Animated.View style={[s.dial, { top: arribaDial }, estiloDial]}>
          <DialTiempo tamano={dial} activo={activo} animar={animar} retraso={t.extra} />
        </Animated.View>
      )}

      <ScrollView
        style={s.scrollLamina} contentContainerStyle={s.contenidoLamina}
        showsVerticalScrollIndicator={false} scrollEnabled={activo}
      >
      <View onLayout={e => setAltoTexto(e.nativeEvent.layout.height)}>
        <Animated.View style={estiloTitulo}>
          {k === 0 ? (
            <TituloEstampado lineas={lineasDeTitulo(l.titulo)} estilo={[tipo.display, { color: color.texto }]} activo={activo} animar={animar} />
          ) : (
            <TituloMascara texto={l.titulo} estilo={[tipo.display, { color: color.texto }]} activo={activo} animar={animar} />
          )}
        </Animated.View>

        <Animated.View style={estiloCuerpo}>
          <Entrada activo={activo} animar={animar} retraso={t.cuerpo} y={DESPLAZAMIENTO_ENTRADA} estilo={s.cuerpo}>
            <TextoConCifra
              texto={l.cuerpo} cifra={l.cifraCuerpo} estilo={[tipo.cuerpo, { color: paleta.magnesia2 }]}
              activo={activo} animar={animar} retraso={t.cuerpo}
            />
          </Entrada>

          {l.objetivos && (
            <View style={s.etiquetas}>
              {l.objetivos.map((o, n) => (
                <Entrada key={o} activo={activo} animar={animar} retraso={t.extra + n * INTERVALO_ETIQUETAS_MS} y={DESPLAZAMIENTO_ENTRADA}>
                  <View style={s.etiqueta}><Text style={s.etiquetaTexto}>{o}</Text></View>
                </Entrada>
              ))}
            </View>
          )}

          {l.mito && (
            <View style={s.mito}>
              <View style={s.insignias}>
                {(['ok', 'parcial', 'mito'] as const).map((tipoInsignia, n) => (
                  <InsigniaEvidencia
                    key={tipoInsignia} tipo={tipoInsignia}
                    estampar={{ activo, animar, retraso: t.extra + n * INTERVALO_INSIGNIAS_MS }}
                  />
                ))}
              </View>
              <TachadoMito
                texto={l.mito} activo={activo} animar={animar}
                retraso={t.extra + 3 * INTERVALO_INSIGNIAS_MS}
              />
            </View>
          )}

          {l.pie && (
            <Entrada activo={activo} animar={animar} retraso={t.nota} x={-12} estilo={s.nota}>
              <NotaEntrenador>
                <TextoConCifra
                  texto={l.pie} cifra={l.cifraPie} estilo={estiloNota}
                  activo={activo} animar={animar} retraso={t.nota + RETRASO_NOTA_CIFRA_MS}
                />
              </NotaEntrenador>
            </Entrada>
          )}
        </Animated.View>
      </View>
      </ScrollView>
    </View>
  );
}

/**
 * Estilo animado de una capa de texto: se desplaza a `factor` veces la
 * velocidad del avance y se desvanece al alejarse. El worklet es inline y
 * depende solo de valores primitivos, asi un re-render del padre no recrea
 * el estilo ni lo reinicia a un valor viejo.
 */
function useCapa(k: number, progreso: SharedValue<number>, ancho: number, factor: number, movimiento: number) {
  // Reanimated congela el estilo inicial al montar y un commit de React puede reaplicarlo. Contar
  // los renders fuerza a reevaluar el mapper despues de cada commit y devuelve la capa a su sitio.
  const tick = useTick();
  return useAnimatedStyle(() => {
    const d = k - progreso.value;
    return {
      opacity: Math.max(0, Math.min(1, 1 - Math.abs(d) * 1.3)),
      transform: [{ translateX: d * ancho * factor * movimiento }],
    };
  }, [k, ancho, factor, movimiento, tick]);
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  foto: { position: 'absolute', top: 0, left: 0 },
  contenido: { flex: 1 },
  barraSuperior: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.sm,
  },
  saltar: { minWidth: AREA_TACTIL_MIN, minHeight: AREA_TACTIL_MIN, alignItems: 'flex-end', justifyContent: 'center' },
  saltarTexto: { fontFamily: peso.semibold, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
  zonaTexto: { flex: 1 },
  lamina: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrollLamina: { flex: 1 },
  contenidoLamina: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: MARGEN_PANTALLA },
  dial: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  cuerpo: { marginTop: esp.md - 4 },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm, marginTop: esp.md - 4 },
  etiqueta: {
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
  },
  etiquetaTexto: { fontFamily: peso.regular, fontSize: 14, lineHeight: 20, color: paleta.magnesia },
  mito: { marginTop: esp.md - 4, gap: esp.md - 4 },
  insignias: { flexDirection: 'row', gap: esp.sm },
  nota: { marginTop: esp.md, alignSelf: 'flex-start' },
  control: {
    flexDirection: 'row', alignItems: 'center', gap: esp.md,
    paddingHorizontal: MARGEN_PANTALLA, paddingTop: MARGEN_PANTALLA, paddingBottom: MARGEN_PANTALLA,
  },
  botonCompacto: { marginLeft: 'auto', minWidth: 120, flexShrink: 1 },
  botonAncho: { flex: 1 },
  boton: { alignSelf: 'stretch' },
});
