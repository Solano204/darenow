import React, { useEffect, useEffectEvent, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  paleta, tipo, familia, esp, MARGEN_PANTALLA, COLOR_FASE, easing, haptico, type FaseVisual,
} from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { TarjetaGoma } from '@/ui/components/TarjetaGoma';
import { NotaEntrenador } from '@/ui/components/NotaEntrenador';
import { PlacaDato } from '@/ui/components/PlacaDato';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { TituloMascara } from '@/ui/fx/TituloMascara';
import { Entrada } from '@/ui/fx/Entrada';
import { Odometro } from '@/ui/fx/Odometro';
import { useMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { PlacaMedalla } from '@/ui/components/PlacaMedalla';
import { EscalaEsfuerzo } from './EscalaEsfuerzo';

const CONTRACCION_MS = 400;
const BASE_CIRCULO = 200;
const RETRASO_RACHA_MS = 300;
const RETRASO_PLACAS_MS = 600;
const ESCALONADO_PLACAS_MS = 120;
const RETRASO_LOGRO_MS = 1100;
const RETRASO_ESCALA_SIN_LOGRO_MS = 1100;
const RETRASO_ESCALA_CON_LOGRO_MS = 1600;
const ESTILO_RACHA = { ...tipo.reloj, fontSize: 120, lineHeight: 120, color: paleta.magnesia };

export interface LogroResumen { id: string; nombre: string; desc?: string; icono: string }

/**
 * «Guardamos lo que hiciste». Los numeros son los de siempre; cambia como
 * llegan: el ultimo color de fase se contrae al centro y se vuelve polvo, la
 * racha rueda (en 0 da una vuelta entera y cae en 0: sin celebracion falsa),
 * tres placas de datos caen escalonadas, la medalla del logro cae girando solo
 * si hay logro, y «Como se sintio» es una escala de esfuerzo.
 */
export function ResumenSesion(p: {
  completada: boolean;
  dias: number;
  graciaUsada: boolean;
  minutos: number;
  series: number;
  ejercicios: number;
  omitidas: number;
  /** Ya filtrado por el ajuste de calorias: null si no se muestra. */
  kcal: number | null;
  records: string[];
  logros: LogroResumen[];
  faseFinal: FaseVisual;
  onCerrar: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const magnesia = useMagnesia();
  const { width, height } = useWindowDimensions();
  const [rpe, setRpe] = useState<number | null>(null);
  const contraccion = useSharedValue(reducido ? 0 : 1);
  const hayLogro = p.logros.length > 0;

  const polvo = () => magnesia.mini(width / 2, height / 2);

  const alCambiarReducido = useEffectEvent(() => {
    if (reducido) return;
    contraccion.set(withTiming(0, { duration: CONTRACCION_MS, easing: easing.salida }, fin => {
      if (fin) runOnJS(polvo)();
    }));
  });
  useEffect(() => alCambiarReducido(), [reducido]);

  const circulo = useAnimatedStyle(() => ({
    opacity: contraccion.value > 0 ? 0.9 : 0,
    transform: [{ scale: 0.05 + 15 * contraccion.value }],
  }), [tick]);

  // La medalla suelta una nube mediana: el motor de magnesia solo tiene la chica, asi que van tres juntas (30 particulas).
  const asentar = () => {
    haptico.golpe();
    const x = MARGEN_PANTALLA + 28;
    const y = height * 0.62;
    magnesia.mini(x - 8, y);
    magnesia.mini(x + 8, y - 6);
    magnesia.mini(x, y + 6);
  };

  const escalaRetraso = hayLogro ? RETRASO_ESCALA_CON_LOGRO_MS : RETRASO_ESCALA_SIN_LOGRO_MS;

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <SafeAreaView style={s.raiz}>
        <ScrollView contentContainerStyle={s.contenido} showsVerticalScrollIndicator={false}>
          <TituloMascara
            texto={p.completada ? 'Sesión completa' : 'Guardamos lo que hiciste'} estilo={s.titulo} activo
          />
          {!p.completada && (
            <Entrada activo retraso={200} y={8}>
              <Text style={s.subtitulo}>Cuenta igual para tu racha. Lo que hiciste, hecho está.</Text>
            </Entrada>
          )}

          <View style={s.racha} accessible accessibilityLabel={`${p.dias} ${p.dias === 1 ? 'día seguido' : 'días seguidos'}`}>
            <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Odometro valor={p.dias} retraso={RETRASO_RACHA_MS} estilo={ESTILO_RACHA} />
            </View>
            <Text style={s.etiquetaRacha}>{p.dias === 1 ? 'día seguido' : 'días seguidos'}</Text>
            {p.graciaUsada && (
              <NotaEntrenador estilo={s.gracia}>Usaste un día de gracia. Te queda uno este mes.</NotaEntrenador>
            )}
          </View>

          <View style={s.placas}>
            <PlacaDato numero={p.minutos} etiqueta="minutos" filo={paleta.magnesia3} retraso={RETRASO_PLACAS_MS} haptica={false} />
            <PlacaDato numero={p.series} etiqueta="series" filo={paleta.magnesia3} retraso={RETRASO_PLACAS_MS + ESCALONADO_PLACAS_MS} haptica={false} />
            <PlacaDato numero={p.ejercicios} etiqueta="ejercicios" filo={paleta.magnesia3} retraso={RETRASO_PLACAS_MS + 2 * ESCALONADO_PLACAS_MS} />
          </View>

          {(p.omitidas > 0 || p.kcal !== null) && (
            <View style={s.extras}>
              {p.omitidas > 0 && <Text style={s.extra}>Omitidas: {p.omitidas}</Text>}
              {p.kcal !== null && <Text style={s.extra}>Gasto aproximado: ~{p.kcal} kcal</Text>}
            </View>
          )}

          {p.records.length > 0 && (
            <View style={s.bloque}>
              <TarjetaGoma relleno={16}>
                <Text style={s.tarjetaTitulo}>Mejor que la vez pasada</Text>
                {p.records.map((r, i) => <Text key={i} style={s.tarjetaTexto}>{r}</Text>)}
              </TarjetaGoma>
            </View>
          )}

          {p.logros.map((l, i) => (
            <View key={l.id} style={s.bloque}>
              <TarjetaGoma relleno={16}>
                <View style={s.logro}>
                  <PlacaMedalla icono={l.icono} retraso={RETRASO_LOGRO_MS + i * ESCALONADO_PLACAS_MS} alAsentar={i === 0 ? asentar : undefined} />
                  <View style={s.logroTextos}>
                    <Text style={s.logroEtiqueta}>Nuevo logro</Text>
                    <Text style={s.logroNombre}>{l.nombre}</Text>
                    {l.desc ? <Text style={s.tarjetaTexto}>{l.desc}</Text> : null}
                  </View>
                </View>
              </TarjetaGoma>
            </View>
          ))}

          <Text style={s.pregunta} accessibilityRole="header">Cómo se sintió</Text>
          <EscalaEsfuerzo valor={rpe} onElegir={setRpe} retraso={escalaRetraso} />
          <Text style={s.nota}>Con esto ajustamos la carga de la próxima.</Text>

          <BotonPlaca texto="Cerrar" onPress={p.onCerrar} aplauso estilo={s.cerrar} />
        </ScrollView>
      </SafeAreaView>

      <Animated.View
        pointerEvents="none"
        style={[
          s.circulo, { backgroundColor: COLOR_FASE[p.faseFinal], left: (width - BASE_CIRCULO) / 2, top: (height - BASE_CIRCULO) / 2 },
          circulo,
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  contenido: { paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.lg, paddingBottom: esp.xl },
  titulo: { ...tipo.display, fontSize: 40, lineHeight: 40, color: paleta.magnesia },
  subtitulo: { ...tipo.cuerpo, color: paleta.magnesia2, marginTop: esp.sm },
  racha: { alignItems: 'center', marginTop: esp.lg },
  etiquetaRacha: { ...tipo.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
  gracia: { alignSelf: 'center', marginTop: esp.sm },
  placas: { flexDirection: 'row', gap: 12, marginTop: esp.lg },
  extras: { marginTop: esp.md, gap: 2 },
  extra: { ...tipo.pie, color: paleta.magnesia2 },
  bloque: { marginTop: esp.md },
  tarjetaTitulo: { ...tipo.dato, color: paleta.magnesia, marginBottom: 4 },
  tarjetaTexto: { ...tipo.pie, color: paleta.magnesia2 },
  logro: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logroTextos: { flex: 1 },
  logroEtiqueta: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  logroNombre: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 26, color: paleta.magnesia },
  pregunta: { ...tipo.h2, color: paleta.magnesia, marginTop: esp.lg, marginBottom: esp.md },
  nota: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto, marginTop: esp.md },
  cerrar: { marginTop: esp.xl },
  circulo: { position: 'absolute', width: BASE_CIRCULO, height: BASE_CIRCULO, borderRadius: BASE_CIRCULO / 2 },
});
