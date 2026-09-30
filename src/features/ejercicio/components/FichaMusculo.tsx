import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { paleta, familia, easing } from '@/ui/theme';
import { fuente } from '@/media/registry';
import type { MusculoIndice } from '@/data/catalog';
import { textoVisible } from '@/lib/presentacion';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Tocable } from '@/ui/components/Tocable';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { Entrada } from '@/ui/fx/Entrada';

const ALTO_FICHA = 104;
const RADIO = 24;
const ESCALONADO_MS = 50;
const CRUCE_MS = 400;
const ESCALA_PRESIONADA = 0.05;

export interface MedidasFicha { ancho: number; letra: number; lineas: 1 | 2 }

/**
 * Tamano comun de las fichas de una fila, segun el nombre mas largo: el nombre
 * cabe en una linea completa (la ficha se ensancha a 120 o el texto baja a 13 px)
 * y solo si aun asi no cabe se parte en dos lineas por palabras, nunca a medias.
 */
export function medidasFichas(nombres: string[]): MedidasFicha {
  const largo = Math.max(0, ...nombres.map(n => n.length));
  if (largo <= 14) return { ancho: 104, letra: 14, lineas: 1 };
  if (largo <= 16) return { ancho: 120, letra: 14, lineas: 1 };
  if (largo <= 18) return { ancho: 120, letra: 13, lineas: 1 };
  return { ancho: 120, letra: 13, lineas: 2 };
}

/**
 * Ficha de un musculo (cuadrada, radio 24, ya no un circulo). Los principales
 * llevan un borde de 2 px `magnesia` y la marca «Principal». Si existe
 * `<id>_neutra` (la version sin el musculo resaltado, ver `docs/IMAGENES.md`),
 * al entrar en pantalla se cruza de la neutra a la resaltada en 400 ms; si no,
 * se omite. Al presionar se hunde un 5 %.
 */
export function FichaMusculo({ m, principal, medidas, indice, activo, animar = true, detalle, onPress }: {
  m: MusculoIndice;
  principal: boolean;
  medidas: MedidasFicha;
  indice: number;
  activo: boolean;
  /** Con `false` la ficha aparece ya puesta (sin entrada escalonada). */
  animar?: boolean;
  /** Linea bajo el nombre («12 ejercicios»). */
  detalle?: string;
  onPress: () => void;
}) {
  const nombre = textoVisible(m.name);
  return (
    <Entrada activo={activo} animar={animar} retraso={indice * ESCALONADO_MS} y={12}>
      <Tocable
        onPress={onPress} escala={ESCALA_PRESIONADA} estilo={{ width: medidas.ancho }}
        etiqueta={[nombre, principal ? 'músculo principal' : '', detalle ?? ''].filter(Boolean).join(', ')}
      >
        <View style={[s.ficha, { width: medidas.ancho }]}>
          <FotoResalte id={m.id} ancho={medidas.ancho} activo={activo} />
          {principal && (
            <>
              <View style={s.borde} pointerEvents="none" />
              <View style={s.marca}><Text style={s.marcaTexto}>Principal</Text></View>
            </>
          )}
        </View>
        <Text
          style={[s.nombre, { fontSize: medidas.letra, lineHeight: medidas.letra + 5 }]}
          numberOfLines={medidas.lineas} maxFontSizeMultiplier={1.2}
          adjustsFontSizeToFit minimumFontScale={0.85}
        >
          {nombre}
        </Text>
        {detalle ? <Text style={s.detalle}>{detalle}</Text> : null}
      </Tocable>
    </Entrada>
  );
}

function FotoResalte({ id, ancho, activo }: { id: string; ancho: number; activo: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const neutra = fuente('musculo', `${id}_neutra`);
  const t = useSharedValue(neutra && !reducido ? 0 : 1);

  useEffect(() => {
    if (!neutra || reducido || !activo) return;
    t.set(withTiming(1, { duration: CRUCE_MS, easing: easing.salida }));
  }, [activo, reducido, neutra]);

  const estiloNeutra = useAnimatedStyle(() => ({ opacity: 1 - t.value }), [tick]);
  return (
    <View style={{ width: ancho, height: ALTO_FICHA }}>
      <FotoOscura tipo="musculo" id={id} ancho={ancho} alto={ALTO_FICHA} radioEsquina={RADIO} velo={false} />
      {neutra ? (
        <Animated.View style={[s.encima, estiloNeutra]} pointerEvents="none">
          <FotoOscura tipo="musculo" id={`${id}_neutra`} ancho={ancho} alto={ALTO_FICHA} radioEsquina={RADIO} velo={false} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  ficha: { height: ALTO_FICHA, borderRadius: RADIO, overflow: 'hidden', backgroundColor: paleta.gomaAlta },
  encima: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  borde: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: RADIO, borderWidth: 2, borderColor: paleta.magnesia,
  },
  marca: {
    position: 'absolute', top: 8, left: 8, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6, backgroundColor: paleta.magnesia,
  },
  marcaTexto: { fontFamily: familia.enfasis, fontSize: 11, lineHeight: 14, color: paleta.goma },
  nombre: { marginTop: 8, fontFamily: familia.enfasis, color: paleta.magnesia },
  detalle: { marginTop: 2, fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
});
