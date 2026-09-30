/**
 * FORJA · ui / controles
 *
 * Todo lo pulsable: `Toque` es la base (se hunde al tocarlo, lleva rol y
 * label), y el resto lo envuelve.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  type ViewStyle, type AccessibilityRole, type AccessibilityState,
} from 'react-native';
import Animated, {
  Easing, Extrapolation, cancelAnimation, interpolate, interpolateColor, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { color, colorSesion, tipo, esp, radio, ALTO_BOTON, anim, peso } from '@/ui/theme';
import { useMovimientoReducido } from './movimiento';
import { BotonPlaca } from './BotonPlaca';

/**
 * Los resortes de siempre (los del `Animated.spring` del core con `speed`/`bounciness`), pasados a
 * rigidez y amortiguacion con la misma formula de React Native: se ven igual y corren en el hilo
 * de UI (R6).
 */
const RESORTE_TOQUE = { stiffness: 936.85, damping: 47, mass: 1 };
const RESORTE_FAVORITO = { stiffness: 724.44, damping: 27.28, mass: 1 };
/** La curva por defecto de `Animated.timing` del core. */
const CURVA_CORE = Easing.inOut(Easing.ease);

/** Pulsable que se hunde un poco al tocarlo. */
export function Toque({ children, onPress, estilo, escala = 0.97, etiqueta, rol = 'button', estado, oscurecer }: {
  children: React.ReactNode; onPress?: () => void; estilo?: ViewStyle; escala?: number;
  etiqueta?: string; rol?: AccessibilityRole; estado?: AccessibilityState;
  /** Radio de esquina: oscurece un 5 % el contenido mientras esta presionado (tarjetas). */
  oscurecer?: number;
}) {
  const reducido = useMovimientoReducido();
  const v = useSharedValue(1);
  const a = (to: number) => {
    if (reducido) { v.set(to); return; }
    v.set(withSpring(to, RESORTE_TOQUE));
  };
  const hundido = useAnimatedStyle(() => ({ transform: [{ scale: v.value }] }));
  const sombra = useAnimatedStyle(() => ({
    opacity: interpolate(v.value, [escala, 1], [1, 0], Extrapolation.CLAMP),
  }), [escala]);
  if (!onPress) return <View style={estilo}>{children}</View>;

  // El Pressable tiene que llevar el tamaño; si no, un hijo con flex:1
  // dentro de el mide cero y su contenido no se ve.
  const e = (Array.isArray(estilo) ? Object.assign({}, ...estilo) : estilo) as Record<string, unknown>;
  const tamano = {
    flex: e?.flex, width: e?.width, height: e?.height,
    alignSelf: e?.alignSelf, marginBottom: e?.marginBottom, marginRight: e?.marginRight,
  } as ViewStyle;

  return (
    <Pressable
      onPressIn={() => a(escala)} onPressOut={() => a(1)} onPress={onPress}
      accessibilityRole={rol} accessibilityLabel={etiqueta} accessibilityState={estado}
      style={tamano}
    >
      <Animated.View style={[estilo, { marginBottom: 0, marginRight: 0 }, hundido]}>
        {children}
        {oscurecer !== undefined && (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
            backgroundColor: color.presionado, borderRadius: oscurecer,
          }, sombra]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════════ botones */

export function Boton({
  texto, onPress, variante = 'principal', deshabilitado, estilo, ancho, ocupado, textoOcupado, oscuro, aplauso,
}: {
  texto: string;
  onPress: () => void;
  variante?: 'principal' | 'contorno' | 'texto' | 'acento' | 'peligro';
  deshabilitado?: boolean;
  estilo?: ViewStyle;
  ancho?: boolean;
  /** Espera real (guardar, sincronizar, terminar): banda de luz en relleno,
   *  punto de luz en el borde en contorno. Ignora los toques. */
  ocupado?: boolean;
  /** Gerundio ("Guardando...") para cuando el movimiento reducido apaga la
   *  animacion y el label es lo unico que puede decir "espera". */
  textoOcupado?: string;
  /** Solo para el reproductor (pantalla que se queda oscura): usa texto y
   *  borde de colorSesion en vez del tema claro, para que "contorno"/"texto"
   *  sigan siendo legibles sobre su fondo oscuro. No afecta "principal"/
   *  "acento": esas ya llevan su propio relleno y quedan legibles igual. */
  oscuro?: boolean;
  /** Aplauso de magnesia al soltar (solo en el boton principal). */
  aplauso?: boolean;
}) {
  const reducido = useMovimientoReducido();
  const inactivo = deshabilitado || ocupado;

  if (variante === 'principal' || variante === 'acento') {
    return (
      <BotonPlaca
        texto={texto} onPress={onPress} deshabilitado={deshabilitado}
        ocupado={ocupado} textoOcupado={textoOcupado} aplauso={aplauso}
        estilo={[ancho && { alignSelf: 'stretch' as const }, estilo]}
      />
    );
  }

  const c = oscuro ? colorSesion : color;
  const textoVisible = ocupado && reducido ? (textoOcupado ?? texto) : texto;

  return (
    <Toque onPress={inactivo ? undefined : onPress} estilo={[
      s.boton,
      variante === 'contorno' && { borderWidth: 1, borderColor: c.bordeFuerte, backgroundColor: c.velo },
      variante === 'peligro' && { borderWidth: 1, borderColor: c.bordeFuerte },
      variante === 'texto' && { minHeight: 44 },
      deshabilitado && { opacity: 0.35 },
      ancho && { alignSelf: 'stretch' },
      estilo,
    ] as unknown as ViewStyle}
      etiqueta={textoVisible} estado={{ disabled: !!deshabilitado, busy: !!ocupado }}
    >
      {variante === 'contorno' && ocupado && !reducido && <PuntoOcupado />}
      <Text style={[tipo.cuerpoEnfasis, { color: c.texto }]}>{textoVisible}</Text>
    </Toque>
  );
}

/**
 * Punto de luz para el boton `contorno` ocupado.
 * ponytail: recorre solo el canto de arriba, no el perimetro completo
 * (eso pide animar sobre un path SVG). Sube el tratamiento si algun boton
 * contorno-ocupado real lo necesita mas elaborado.
 */
function PuntoOcupado() {
  const v = useSharedValue(0);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (ancho === 0) return;
    v.set(0);
    v.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(v);
  }, [ancho, v]);
  const recorrido = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(v.value, [0, 1], [-2, ancho - 3]) }],
  }), [ancho]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}
      onLayout={e => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 && (
        <Animated.View style={[{
          position: 'absolute', top: -2, width: 5, height: 5, borderRadius: 2.5,
          backgroundColor: color.acento,
        }, recorrido]} />
      )}
    </View>
  );
}

/* ═════════════════════════════════════════ chips */

export function Chip({ texto, activo, onPress, pequeno, oscuro }: {
  texto: string; activo?: boolean; onPress?: () => void; pequeno?: boolean; oscuro?: boolean;
}) {
  const reducido = useMovimientoReducido();
  const v = useSharedValue(activo ? 1 : 0);
  const fondoApagado = oscuro ? color.chipVidrioFondo : color.velo;
  const bordeApagado = oscuro ? color.chipVidrioBorde : color.borde;
  useEffect(() => {
    if (reducido) { v.set(activo ? 1 : 0); return; }
    // Prender es rapido; apagar cuesta mas, como el metal. El color se interpola en el hilo de UI
    // (antes, `useNativeDriver: false`: el hilo JS pintaba cada cuadro, H-21).
    v.set(withTiming(activo ? 1 : 0, { duration: activo ? anim.rapida : anim.normal, easing: CURVA_CORE }));
  }, [activo, reducido, v]);
  const relleno = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(v.value, [0, 1], [fondoApagado, color.carbon]),
    borderColor: interpolateColor(v.value, [0, 1], [bordeApagado, color.carbon]),
  }), [fondoApagado, bordeApagado]);

  const cuerpo = (
    <Animated.View style={[
      s.chip,
      pequeno && { paddingVertical: 4, paddingHorizontal: 7 },
      relleno,
    ]}>
      <Text style={[pequeno ? tipo.micro : tipo.pie, {
        // "oscuro" es para chips sobre foto o degradado de acento: el
        // texto cafe (textoSuave) esta pensado para el fondo claro de la
        // pantalla, no para ahi. Medido con scripts/contraste.js: textoSuave
        // sobre el degradado azul da ~1.4:1 (ilegible); blanco da >=4.9:1.
        color: (activo || oscuro) ? color.sobreOscuro : color.textoSuave,
        fontFamily: activo ? peso.bold : peso.semibold,
      }]}>{texto}</Text>
    </Animated.View>
  );
  return onPress
    ? (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={texto}
        accessibilityState={{ selected: !!activo }}>
        {cuerpo}
      </Pressable>
    )
    : cuerpo;
}

/** Estrella de favoritos. Se usa en ejercicios, musculos, rutinas, programas y tips. */
export function Favorito({ activo, onPress, tamano = 38, sobreFoto }: {
  activo: boolean; onPress: () => void; tamano?: number; sobreFoto?: boolean;
}) {
  const v = useSharedValue(1);
  const pulsa = () => {
    v.set(withSequence(
      withTiming(1.35, { duration: 120, easing: CURVA_CORE }),
      withSpring(1, RESORTE_FAVORITO),
    ));
    onPress();
  };
  const latido = useAnimatedStyle(() => ({ transform: [{ scale: v.value }] }));
  return (
    <Pressable onPress={pulsa} hitSlop={10} accessibilityRole="button"
      accessibilityLabel={activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
      <Animated.View style={[
        { width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' },
        latido,
      ]}>
        <Text style={{
          fontSize: tamano * 0.62,
          color: activo ? color.acento : (sobreFoto ? color.sobreFoto : color.textoTenue),
          textShadowColor: activo ? color.favoritoBrillo : (sobreFoto ? color.sombraSobreFoto : 'transparent'),
          textShadowRadius: activo || sobreFoto ? 8 : 0,
        }}>
          {activo ? '★' : '☆'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════════ opciones */

const s = StyleSheet.create({
  boton: {
    minHeight: ALTO_BOTON, borderRadius: radio.pastilla, paddingHorizontal: esp.lg,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  chip: {
    borderWidth: 1, borderColor: color.borde, backgroundColor: color.velo,
    borderRadius: radio.chip, paddingVertical: 7, paddingHorizontal: 14,
  },
});
