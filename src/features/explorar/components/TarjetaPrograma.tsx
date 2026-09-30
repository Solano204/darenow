import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { paleta, familia, resortePlaca } from '@/ui/theme';
import type { Programa } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { textoVisible } from '@/lib/presentacion';
import { plural } from '@/lib/plural';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Tocable } from '@/ui/components/Tocable';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { DatoNumerico } from '@/ui/components/DatoNumerico';
import { EstrellaDe } from '@/ui/components/EstrellaFavorito';

const ALTO_FOTO = 180;
const ESCALA_PRESIONADA = 0.02;
/** Dos tarjetas detras: asoman 6 y 12 px bajo la principal y se recogen 6 y 12 px por cada lado (el 0.96 y el 0.92 del brief). */
const CAPAS = [{ asoma: 6, recoge: 6 }, { asoma: 12, recoge: 12 }] as const;
const APERTURA_PX = 4;
const ALTO_CAPA = 40;
const HUECO_DE_LA_PILA = 12;

/**
 * Tarjeta de programa como una pila: detras de la principal asoman dos tarjetas
 * `gomaBorde`, mas estrechas y desplazadas hacia abajo, porque un programa son varias
 * semanas. Al presionar se «abren» 4 px con `resortePlaca`. La foto lleva la estrella
 * de favorito; debajo, titulo, descripcion (2 lineas) y los numeros del programa
 * (semanas, dias por semana y minutos por sesion) con plural correcto.
 */
export const TarjetaPrograma = React.memo(function TarjetaPrograma({ p, onPress }: {
  p: Programa;
  /** Recibe el id: la misma funcion sirve para todas las tarjetas de la lista. */
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const apertura = useDerivedValue(() => withSpring(presion.value, resortePlaca));
  const nombre = nombreVisible(p.name);
  const etiqueta = `${nombre}, ${p.semanas} ${plural(p.semanas, 'semana')}, ${p.dias_semana} ${plural(p.dias_semana, 'día')} por semana, ${p.min_sesion} minutos por sesión`;

  const capaCerca = useAnimatedStyle(() => ({
    transform: [{ translateY: reducido ? 0 : APERTURA_PX * apertura.value }],
  }), [reducido, tick]);
  const capaLejos = useAnimatedStyle(() => ({
    transform: [{ translateY: reducido ? 0 : 2 * APERTURA_PX * apertura.value }],
  }), [reducido, tick]);
  const estilosCapa = [capaCerca, capaLejos];

  return (
    <View style={s.caja}>
      {CAPAS.map((c, i) => (
        <Animated.View
          key={c.asoma} pointerEvents="none"
          style={[s.capa, { left: c.recoge, right: c.recoge, bottom: HUECO_DE_LA_PILA - c.asoma }, estilosCapa[i]]}
        />
      ))}
      <Tocable onPress={() => onPress(p.id)} etiqueta={etiqueta} presion={presion} escala={ESCALA_PRESIONADA} estilo={s.tarjeta}>
        <FotoOscura
          tipo="programa" id={p.id} ancho="100%" alto={ALTO_FOTO} radioEsquina={0}
          alturaVelo="25%" fondoVelo={paleta.gomaAlta}
        />
        <View style={s.cuerpo}>
          <Text style={s.titulo} numberOfLines={2}>{nombre}</Text>
          <Text style={s.descripcion} numberOfLines={2}>{textoVisible(p.desc)}</Text>
          <View style={s.datos}>
            <DatoNumerico numero={p.semanas} unidad={plural(p.semanas, 'semana')} />
            <DatoNumerico numero={p.dias_semana} unidad={`${plural(p.dias_semana, 'día')}/sem`} />
            <DatoNumerico numero={p.min_sesion} unidad="min" />
          </View>
        </View>
      </Tocable>
      <View style={s.estrella}>
        <EstrellaDe tipo="programas" id={p.id} nombre={nombre} />
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  caja: { marginBottom: 16, paddingBottom: HUECO_DE_LA_PILA },
  capa: { position: 'absolute', height: ALTO_CAPA, borderRadius: 24, backgroundColor: paleta.gomaBorde },
  tarjeta: {
    borderRadius: 24, overflow: 'hidden', backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  estrella: { position: 'absolute', top: 8, right: 8 },
  cuerpo: { padding: 16, paddingTop: 12, gap: 6 },
  titulo: { fontFamily: familia.enfasis, fontSize: 17, lineHeight: 22, color: paleta.magnesia },
  descripcion: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  datos: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 2, marginTop: 2 },
});
