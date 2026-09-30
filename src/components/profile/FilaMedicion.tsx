import React, { useEffect, useRef } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, resortePlaca, haptico, MARGEN_PANTALLA } from '@/theme';
import type { Protocolo } from '@/data/catalog';
import type { MedicionGuardada } from '@/store/store';
import { textoVisible } from '@/utils/presentacion';
import { plural } from '@/utils/plural';
import { PROTOCOLOS_SIN_VALOR, textoDeFrecuencia } from '@/utils/textosVisibles';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { BotonCompacto } from '@/components/ui/BotonCompacto';
import { CampoValor } from './CampoValor';
import { ProtocoloMedicion } from './ProtocoloMedicion';

type Icono = React.ComponentProps<typeof Ionicons>['name'];

/** Un icono de linea por tipo de medicion: regla, pared, camara, cinta, bascula, cronometro, pasos y corazon. */
const ICONOS: Record<string, Icono> = {
  med_001: 'swap-vertical-outline',
  med_002: 'square-outline',
  med_003: 'camera-outline',
  med_004: 'resize-outline',
  med_005: 'scale-outline',
  med_006: 'stopwatch-outline',
  med_007: 'footsteps-outline',
  med_008: 'heart-outline',
};

const MIN_ALTO = 72;
const EXPANDE_MS = 280;
const AIRE_AL_MOSTRAR_PX = 12;
const ESPERA_ASENTAR_MS = EXPANDE_MS + 40;
/** Solo se corre la lista si el encabezado de la tarjeta queda por debajo de esta fraccion de la pantalla. */
const FRACCION_PARA_CORRER = 0.45;
const TECLADO_SUPUESTO_PX = 300;

/**
 * Un protocolo de medicion. Cerrado: una fila de 72 como minimo con su icono de linea (22 px), el nombre en Figtree
 * 600 de 16 hasta dos lineas, debajo la frecuencia con un icono de calendario (Figtree 500 de 13, «Cada 4 semanas»,
 * «Opcional») y, si hay registros, «N registros · último: X»; a la derecha, un chevron que gira 90 grados al
 * abrir. La frecuencia ya no va a la derecha: asi nunca se pisa con un nombre largo. Al abrir, la tarjeta crece con
 * animacion de altura (280 ms), el contenido entra con un fundido, suena la haptica de seleccion y la lista se
 * corre para mostrar el encabezado de la tarjeta. El campo de captura sale salvo en los protocolos que no piden un
 * valor. Con el teclado abierto, el campo se mantiene visible sobre el.
 */
export function FilaMedicion({ p, abierta, onAlternar, y, altoBarra, scroll, valor, onValor, unidad, exito, error, onGuardar, previas }: {
  p: Protocolo;
  abierta: boolean;
  onAlternar: () => void;
  /** El scroll de la pantalla y su marco, para correr la lista al abrir y con el teclado. */
  y: SharedValue<number>;
  altoBarra: number;
  scroll: React.RefObject<Animated.ScrollView | null>;
  valor: string;
  onValor: (texto: string) => void;
  unidad?: string;
  exito: number;
  error: number;
  onGuardar: () => void;
  previas: MedicionGuardada[];
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { height: ventana } = useWindowDimensions();
  const cardTop = useSharedValue(0);
  const contenidoTop = useSharedValue(0);
  const yFila = useDerivedValue(() => y.value - cardTop.value - contenidoTop.value) as unknown as SharedValue<number>;
  const giro = useSharedValue(abierta ? 1 : 0);
  const campoRef = useRef<View>(null);
  const sinValor = PROTOCOLOS_SIN_VALOR.includes(p.id);
  const frecuencia = textoDeFrecuencia(p.frecuencia);
  const ultimo = previas[previas.length - 1];
  const registros = previas.length > 0
    ? `${previas.length} ${plural(previas.length, 'registro', 'registros')} · último: ${ultimo.valor}${unidad ? ` ${unidad}` : ''}`
    : '';

  useEffect(() => {
    giro.value = reducido ? (abierta ? 1 : 0) : withSpring(abierta ? 1 : 0, resortePlaca);
  }, [abierta, reducido]);

  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${90 * giro.value}deg` }] }), [tick]);

  const alternar = () => {
    haptico.seleccion();
    const abre = !abierta;
    onAlternar();
    if (!abre) return;
    setTimeout(() => {
      if (cardTop.value - y.value < ventana * FRACCION_PARA_CORRER) return;
      scroll.current?.scrollTo({ y: Math.max(0, cardTop.value - altoBarra - AIRE_AL_MOSTRAR_PX), animated: !reducido });
    }, reducido ? 0 : ESPERA_ASENTAR_MS);
  };

  // Con el teclado abierto el campo tiene que quedar por encima de el: se mide cuando el teclado ya subio.
  const mostrarCampo = () => {
    const medir = (teclado: number) => campoRef.current?.measureInWindow((_x, arriba, _ancho, alto) => {
      const exceso = arriba + alto - (ventana - teclado - AIRE_AL_MOSTRAR_PX);
      if (exceso > 0) scroll.current?.scrollTo({ y: y.value + exceso, animated: !reducido });
    });
    if (Keyboard.isVisible()) { medir(Keyboard.metrics()?.height ?? TECLADO_SUPUESTO_PX); return; }
    const suscripcion = Keyboard.addListener('keyboardDidShow', e => { suscripcion.remove(); medir(e.endCoordinates.height); });
  };

  const campo = sinValor ? undefined : (
    <View ref={campoRef} collapsable={false} style={s.captura}>
      <CampoValor valor={valor} onCambio={onValor} unidad={unidad} exito={exito} error={error} onEnfocar={mostrarCampo} />
      <BotonCompacto texto="Guardar" alto={56} etiqueta={`Guardar ${textoVisible(p.name)}`} onPress={onGuardar} />
    </View>
  );

  return (
    <Animated.View
      layout={reducido ? undefined : LinearTransition.duration(EXPANDE_MS)} style={s.tarjeta}
      onLayout={e => { cardTop.value = e.nativeEvent.layout.y; }}
    >
      <Pressable
        onPress={alternar} style={s.cabeza}
        accessibilityRole="button" accessibilityState={{ expanded: abierta }}
        accessibilityLabel={`${textoVisible(p.name)}. ${frecuencia}.${registros ? ` ${registros}.` : ''}`}
      >
        <Ionicons name={ICONOS[p.id] ?? 'clipboard-outline'} size={22} color={paleta.magnesia2} />
        <View style={s.centro} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={s.nombre} numberOfLines={2} maxFontSizeMultiplier={1.3}>{textoVisible(p.name)}</Text>
          <View style={s.frecuencia}>
            <Ionicons name="calendar-outline" size={12} color={paleta.magnesia3Texto} />
            <Text style={s.frecuenciaTexto} maxFontSizeMultiplier={1.3}>{frecuencia}</Text>
          </View>
          {registros ? <Text style={s.registros} maxFontSizeMultiplier={1.3}>{registros}</Text> : null}
        </View>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {reducido ? (
            <Ionicons name={abierta ? 'chevron-down' : 'chevron-forward'} size={20} color={paleta.magnesia2} />
          ) : (
            <Animated.View style={chevron}><Ionicons name="chevron-forward" size={20} color={paleta.magnesia2} /></Animated.View>
          )}
        </View>
      </Pressable>

      {abierta ? (
        <Animated.View
          entering={FadeIn.duration(reducido ? 150 : 220)} exiting={FadeOut.duration(120)} style={s.contenido}
          onLayout={e => { contenidoTop.value = e.nativeEvent.layout.y; }}
        >
          <ProtocoloMedicion p={p} y={yFila} campo={campo} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  tarjeta: {
    marginHorizontal: MARGEN_PANTALLA, marginBottom: 8, borderRadius: 20, borderWidth: 1, borderColor: paleta.gomaBorde,
    backgroundColor: paleta.gomaAlta, overflow: 'hidden',
  },
  cabeza: { minHeight: MIN_ALTO, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  centro: { flex: 1, gap: 4 },
  nombre: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
  frecuencia: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  frecuenciaTexto: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  registros: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  contenido: { paddingHorizontal: 16, paddingBottom: 16 },
  captura: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
});
