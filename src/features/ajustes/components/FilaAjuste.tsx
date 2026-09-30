import React, { useEffect } from 'react';
import {
  Pressable, StyleSheet, Text, View, type AccessibilityRole, type AccessibilityState,
} from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, familia, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { PistaSwitch } from '@/ui/components/SwitchDarenow';

export type IconoAjuste = React.ComponentProps<typeof Ionicons>['name'];

const MARGEN_FILA = 16;
const ALTO_MIN_FILA = 56;
const HUECO = 12;
const LADO_ICONO = 22;
const LADO_CHEVRON = 18;
const GIRO_CHEVRON_MS = 200;
const PULSO_MS = 520;
const OPACIDAD_PULSO = 0.4;
const OPACIDAD_OCUPADA_REDUCIDO = 0.6;
/** Donde empieza el texto de una fila con icono: la linea que separa las filas arranca ahi. */
export const SANGRIA_CON_ICONO = MARGEN_FILA + LADO_ICONO + HUECO;

interface Props {
  icono?: IconoAjuste;
  /** Sustituye al icono (el logo de Google). */
  izquierda?: React.ReactNode;
  titulo: string;
  descripcion?: React.ReactNode;
  /** A la derecha, o debajo del titulo (que pasa a ser una etiqueta pequena) si `valorApilado`. */
  valor?: string;
  valorApilado?: boolean;
  interruptor?: { activo: boolean; onCambio: (activo: boolean) => void };
  derecha?: React.ReactNode;
  chevron?: 'derecha' | 'enlace';
  peligro?: boolean;
  /** «Exportando...»: el icono pulsa, el texto reemplaza a la descripcion y la fila no responde. */
  ocupada?: string;
  onPress?: () => void;
  haptica?: 'toque' | 'seleccion' | 'ninguna';
  rol?: AccessibilityRole;
  estado?: AccessibilityState;
  etiqueta?: string;
}

/**
 * Fila estandar de Ajustes: 56 de alto como minimo, padding 16, un icono de linea de 22 (o `izquierda`), el titulo en
 * Figtree 500 de 16, la descripcion en Figtree 14/20 `magnesia2` (completa, no se recorta) y el control a la derecha
 * (un interruptor, un valor, un chevron o lo que pase `derecha`). Sin `onPress` ni `interruptor` no es tocable.
 */
export function FilaAjuste({
  icono, izquierda, titulo, descripcion, valor, valorApilado, interruptor, derecha, chevron, peligro, ocupada,
  onPress, haptica = 'toque', rol, estado, etiqueta,
}: Props) {
  const interactiva = onPress !== undefined || interruptor !== undefined;
  const colorIcono = peligro ? paleta.placaRojaTexto : paleta.magnesia2;
  const lado = izquierda ?? (icono ? <IconoFila nombre={icono} color={colorIcono} ocupado={ocupada !== undefined} /> : null);

  const contenido = (
    <>
      {lado}
      <View style={s.textos}>
        <Text style={[valorApilado ? s.etiquetaApilada : s.titulo, peligro && s.peligro]} maxFontSizeMultiplier={1.3}>
          {titulo}
        </Text>
        {valorApilado && valor !== undefined ? (
          <Text style={s.valorApilado} numberOfLines={1} ellipsizeMode="middle" maxFontSizeMultiplier={1.3}>{valor}</Text>
        ) : null}
        {ocupada !== undefined ? (
          <Text style={s.descripcion} maxFontSizeMultiplier={1.3}>{ocupada}</Text>
        ) : typeof descripcion === 'string' ? (
          <Text style={s.descripcion} maxFontSizeMultiplier={1.3}>{descripcion}</Text>
        ) : descripcion}
      </View>
      {!valorApilado && valor !== undefined ? (
        <Text style={s.valor} numberOfLines={1} maxFontSizeMultiplier={1.3}>{valor}</Text>
      ) : null}
      {interruptor && <PistaSwitch activo={interruptor.activo} />}
      {derecha}
      {chevron && (
        <Ionicons name={chevron === 'enlace' ? 'open-outline' : 'chevron-forward'} size={LADO_CHEVRON} color={paleta.magnesia2} />
      )}
    </>
  );

  if (!interactiva) {
    return (
      <View style={s.fila} accessible accessibilityLabel={etiqueta ?? (valor !== undefined ? `${titulo}, ${valor}` : titulo)}>
        {contenido}
      </View>
    );
  }

  const alTocar = () => {
    if (ocupada !== undefined) return;
    if (haptica === 'toque') haptico.toque();
    else if (haptica === 'seleccion') haptico.seleccion();
    if (interruptor) interruptor.onCambio(!interruptor.activo);
    else onPress?.();
  };

  return (
    <Pressable
      onPress={alTocar}
      accessibilityRole={interruptor ? 'switch' : rol ?? 'button'}
      accessibilityLabel={etiqueta ?? titulo}
      accessibilityHint={typeof descripcion === 'string' ? descripcion : undefined}
      accessibilityState={interruptor ? { checked: interruptor.activo } : { ...estado, busy: ocupada !== undefined }}
      style={({ pressed }) => [s.fila, pressed && s.presionada]}
    >
      {contenido}
    </Pressable>
  );
}

function IconoFila({ nombre, color, ocupado }: { nombre: IconoAjuste; color: string; ocupado: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const opacidad = useSharedValue(1);

  useEffect(() => {
    if (!ocupado) { cancelAnimation(opacidad); opacidad.set(1); return; }
    if (reducido) { opacidad.set(OPACIDAD_OCUPADA_REDUCIDO); return; }
    opacidad.set(withRepeat(
      withSequence(withTiming(OPACIDAD_PULSO, { duration: PULSO_MS }), withTiming(1, { duration: PULSO_MS })), -1,
    ));
    return () => cancelAnimation(opacidad);
  }, [ocupado, reducido]);

  const estilo = useAnimatedStyle(() => ({ opacity: opacidad.value }), [tick]);
  return (
    <Animated.View style={[s.icono, estilo]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ionicons name={nombre} size={LADO_ICONO} color={color} />
    </Animated.View>
  );
}

/** El chevron de una fila que despliega algo: gira 90 grados al abrirse (sin girar con movimiento reducido). */
export function ChevronGiratorio({ abierto }: { abierto: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const giro = useSharedValue(abierto ? 1 : 0);

  useEffect(() => {
    giro.set(withTiming(abierto ? 1 : 0, { duration: reducido ? 0 : GIRO_CHEVRON_MS }));
  }, [abierto, reducido]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ rotate: `${90 * giro.value}deg` }] }), [tick]);
  return (
    <Animated.View style={estilo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ionicons name="chevron-forward" size={LADO_CHEVRON} color={paleta.magnesia2} />
    </Animated.View>
  );
}

/** Un ajuste que no cabe en una fila (un contador, un selector): titulo y descripcion arriba y el control debajo. */
export function BloqueControl({ titulo, descripcion, centrado, children }: {
  titulo?: string;
  descripcion?: string;
  /** El control se centra (un contador) en lugar de ocupar todo el ancho. */
  centrado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={s.bloque}>
      {titulo !== undefined && (
        <Text style={s.titulo} maxFontSizeMultiplier={1.3}>{titulo}</Text>
      )}
      {descripcion !== undefined && (
        <Text style={s.descripcion} maxFontSizeMultiplier={1.3}>{descripcion}</Text>
      )}
      <View style={centrado ? s.centrado : undefined}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  fila: {
    minHeight: ALTO_MIN_FILA, paddingHorizontal: MARGEN_FILA, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: HUECO,
  },
  presionada: { backgroundColor: paleta.gomaAltaAzul },
  icono: { width: LADO_ICONO, height: LADO_ICONO, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1 },
  titulo: { fontFamily: familia.medio, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
  peligro: { fontFamily: familia.enfasis, color: paleta.placaRojaTexto },
  etiquetaApilada: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  valorApilado: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
  valor: { flexShrink: 1, fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
  descripcion: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2, marginTop: 2 },
  bloque: { paddingHorizontal: MARGEN_FILA, paddingVertical: 16, gap: 12 },
  centrado: { alignItems: 'center' },
});
