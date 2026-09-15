/**
 * FORJA · ui / controles
 *
 * Todo lo pulsable: `Toque` es la base (se hunde al tocarlo, lleva rol y
 * label), y el resto lo envuelve.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, Animated, Easing,
  type ViewStyle, type AccessibilityRole, type AccessibilityState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, tipo, esp, radio, TOQUE, degradado, sombra, anim, peso } from '../../theme';
import { useMovimientoReducido } from './movimiento';

/** Pulsable que se hunde un poco al tocarlo. */
export function Toque({ children, onPress, estilo, escala = 0.97, etiqueta, rol = 'button', estado }: {
  children: React.ReactNode; onPress?: () => void; estilo?: ViewStyle; escala?: number;
  etiqueta?: string; rol?: AccessibilityRole; estado?: AccessibilityState;
}) {
  const reducido = useMovimientoReducido();
  const v = useRef(new Animated.Value(1)).current;
  const a = (to: number) => {
    if (reducido) { v.setValue(to); return; }
    Animated.spring(v, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };
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
      <Animated.View style={[estilo, { marginBottom: 0, marginRight: 0 }, { transform: [{ scale: v }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════════ botones */

export function Boton({
  texto, onPress, variante = 'principal', deshabilitado, estilo, ancho, ocupado, textoOcupado,
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
}) {
  const reducido = useMovimientoReducido();
  const relleno = variante === 'principal' || variante === 'acento';
  const inactivo = deshabilitado || ocupado;
  const txt =
    relleno ? color.sobreOscuro :
    variante === 'peligro' ? color.peligro : color.texto;

  const textoVisible = ocupado && reducido ? (textoOcupado ?? texto) : texto;
  const etiqueta = (
    <Text style={[tipo.cuerpo, { color: txt, fontFamily: peso.bold }]}>{textoVisible}</Text>
  );

  // La accion principal es una pastilla de brasa con halo propio y un
  // filo claro arriba, para que se lea como un objeto con volumen.
  if (relleno) {
    return (
      <Toque onPress={inactivo ? undefined : onPress} estilo={[
        s.boton, s.botonBrasa,
        deshabilitado && { opacity: 0.35 },
        ancho && { alignSelf: 'stretch' },
        estilo,
      ] as unknown as ViewStyle}
        etiqueta={textoVisible} estado={{ disabled: !!deshabilitado, busy: !!ocupado }}
      >
        <LinearGradient
          colors={degradado.brasa} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.filoBoton} />
        {ocupado && !reducido && <BandaOcupado />}
        {etiqueta}
      </Toque>
    );
  }

  return (
    <Toque onPress={inactivo ? undefined : onPress} estilo={[
      s.boton,
      variante === 'contorno' && { borderWidth: 1, borderColor: color.bordeFuerte, backgroundColor: color.velo },
      variante === 'peligro' && { borderWidth: 1, borderColor: color.peligroBorde },
      variante === 'texto' && { minHeight: 44 },
      deshabilitado && { opacity: 0.35 },
      ancho && { alignSelf: 'stretch' },
      estilo,
    ] as unknown as ViewStyle}
      etiqueta={textoVisible} estado={{ disabled: !!deshabilitado, busy: !!ocupado }}
    >
      {variante === 'contorno' && ocupado && !reducido && <PuntoOcupado />}
      {etiqueta}
    </Toque>
  );
}

/**
 * Banda de brasa translucida que recorre el boton relleno cada 900 ms,
 * mientras espera. Reusa `degradado.brillo` (el mismo barrido de luz que
 * `Brillo`): es el mismo lenguaje visual, un contexto distinto.
 */
function BandaOcupado() {
  const v = useRef(new Animated.Value(0)).current;
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (ancho === 0) return;
    const bucle = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    bucle.start();
    return () => bucle.stop();
  }, [ancho]);
  const bandaAncho = 60;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}
      onLayout={e => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 && (
        <Animated.View style={{
          position: 'absolute', top: 0, bottom: 0, width: bandaAncho,
          transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-bandaAncho, ancho] }) }],
        }}>
          <LinearGradient
            colors={degradado.brillo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * Punto de luz para el boton `contorno` ocupado.
 * ponytail: recorre solo el canto de arriba, no el perimetro completo
 * (eso pide animar sobre un path SVG). Sube el tratamiento si algun boton
 * contorno-ocupado real lo necesita mas elaborado.
 */
function PuntoOcupado() {
  const v = useRef(new Animated.Value(0)).current;
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (ancho === 0) return;
    const bucle = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    bucle.start();
    return () => bucle.stop();
  }, [ancho]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}
      onLayout={e => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 && (
        <Animated.View style={{
          position: 'absolute', top: -2, width: 5, height: 5, borderRadius: 2.5,
          backgroundColor: color.acento,
          transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-2, ancho - 3] }) }],
        }} />
      )}
    </View>
  );
}

/**
 * Boton circular pequeño. Con halo cuando va en oscuro.
 * `etiqueta` es obligatoria porque `glifo` es un simbolo, no texto legible
 * para un lector de pantalla.
 */
export function BotonRedondo({ glifo, etiqueta, onPress, oscuro }: {
  glifo: string; etiqueta: string; onPress: () => void; oscuro?: boolean;
}) {
  return (
    <Toque onPress={onPress} estilo={[
      s.redondo,
      oscuro
        ? { backgroundColor: color.carbon, borderColor: color.carbon, ...sombra.brasa }
        : { backgroundColor: color.crema, borderColor: color.borde },
    ] as unknown as ViewStyle}
      etiqueta={etiqueta}
    >
      <Text style={{ fontSize: 16, color: oscuro ? color.sobreOscuro : color.texto }}>{glifo}</Text>
    </Toque>
  );
}

/* ═════════════════════════════════════════ chips */

export function Chip({ texto, activo, onPress, pequeno, oscuro }: {
  texto: string; activo?: boolean; onPress?: () => void; pequeno?: boolean; oscuro?: boolean;
}) {
  const reducido = useMovimientoReducido();
  const v = useRef(new Animated.Value(activo ? 1 : 0)).current;
  const fondoApagado = oscuro ? color.chipVidrioFondo : color.velo;
  const bordeApagado = oscuro ? color.chipVidrioBorde : color.borde;
  useEffect(() => {
    if (reducido) { v.setValue(activo ? 1 : 0); return; }
    // Prender es rapido; apagar cuesta mas, como el metal.
    Animated.timing(v, {
      toValue: activo ? 1 : 0,
      duration: activo ? anim.rapida : anim.normal,
      useNativeDriver: false,   // color no admite native driver
    }).start();
  }, [activo, reducido]);

  const cuerpo = (
    <Animated.View style={[
      s.chip,
      pequeno && { paddingVertical: 4, paddingHorizontal: 10 },
      {
        backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: [fondoApagado, color.carbon] }),
        borderColor: v.interpolate({ inputRange: [0, 1], outputRange: [bordeApagado, color.carbon] }),
      },
      activo && sombra.brasa,
    ]}>
      <Text style={[pequeno ? tipo.micro : tipo.pie, {
        color: activo ? color.sobreOscuro : color.textoSuave,
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
  const v = useRef(new Animated.Value(1)).current;
  const pulsa = () => {
    Animated.sequence([
      Animated.timing(v, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 12 }),
    ]).start();
    onPress();
  };
  return (
    <Pressable onPress={pulsa} hitSlop={10} accessibilityRole="button"
      accessibilityLabel={activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
      <Animated.View style={[
        { width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' },
        { transform: [{ scale: v }] },
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

export function Opcion({ texto, detalle, activa, multiple, onPress }: {
  texto: string; detalle?: string; activa: boolean; multiple?: boolean; onPress: () => void;
}) {
  return (
    <Toque onPress={onPress} escala={0.985} estilo={[
      s.opcion,
      activa && { borderColor: color.acentoBorde, backgroundColor: color.acentoTinte },
    ] as unknown as ViewStyle}
      rol={multiple ? 'checkbox' : 'radio'}
      etiqueta={detalle ? `${texto}, ${detalle}` : texto}
      estado={multiple ? { checked: activa } : { selected: activa }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: activa ? peso.semibold : peso.regular }]}>{texto}</Text>
        {detalle && <Text style={[tipo.pie, { color: color.textoSuave, marginTop: 2 }]}>{detalle}</Text>}
      </View>
      <View style={[s.marca, activa && { backgroundColor: color.carbon, borderColor: color.carbon }]}>
        {activa && <Text style={{ color: color.sobreOscuro, fontSize: 12, fontFamily: peso.bold }}>✓</Text>}
      </View>
    </Toque>
  );
}

export function Contador({ valor, min, max, sufijo, onCambio }: {
  valor: number; min: number; max: number; sufijo?: string; onCambio: (n: number) => void;
}) {
  const resto = sufijo ? ` ${sufijo}` : '';
  const [texto, setTexto] = useState(String(valor));

  useEffect(() => { setTexto(String(valor)); }, [valor]);

  // Escribir un numero grande a mano gana a apretar +/- decenas de veces.
  const confirmar = () => {
    const n = parseInt(texto, 10);
    const limpio = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : valor;
    setTexto(String(limpio));
    if (limpio !== valor) onCambio(limpio);
  };

  return (
    <View style={s.contador}>
      <View style={s.contadorFila}>
        <Toque onPress={() => onCambio(Math.max(min, valor - 1))} estilo={s.contadorBoton as ViewStyle}
          etiqueta={`Restar${resto}`} estado={{ disabled: valor <= min }}>
          <Text style={{ fontSize: 24, color: color.texto }}>−</Text>
        </Toque>
        <View style={{ alignItems: 'center', minWidth: 96 }}>
          <TextInput
            value={texto} onChangeText={t => setTexto(t.replace(/[^0-9]/g, ''))}
            onEndEditing={confirmar} onSubmitEditing={confirmar}
            keyboardType="number-pad" returnKeyType="done"
            style={[tipo.relojSm, { color: color.texto, textAlign: 'center', padding: 0, minWidth: 60 }]}
            maxFontSizeMultiplier={1.2} accessibilityLabel={`Escribir número${resto}`}
          />
          {sufijo && <Text style={[tipo.pie, { color: color.textoSuave }]}>{sufijo}</Text>}
        </View>
        <Toque onPress={() => onCambio(Math.min(max, valor + 1))} estilo={s.contadorBoton as ViewStyle}
          etiqueta={`Sumar${resto}`} estado={{ disabled: valor >= max }}>
          <Text style={{ fontSize: 24, color: color.texto }}>+</Text>
        </Toque>
      </View>
    </View>
  );
}

export function Interruptor({ etiqueta, ayuda, valor, onCambio }: {
  etiqueta: string; ayuda?: string; valor: boolean; onCambio: (v: boolean) => void;
}) {
  const v = useRef(new Animated.Value(valor ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(v, { toValue: valor ? 1 : 0, duration: anim.rapida, useNativeDriver: false }).start();
  }, [valor]);
  return (
    <Pressable onPress={() => onCambio(!valor)} style={s.interruptor} accessibilityRole="switch"
      accessibilityState={{ checked: valor }}>
      <View style={{ flex: 1, paddingRight: esp.md }}>
        <Text style={[tipo.cuerpo, { color: color.texto }]}>{etiqueta}</Text>
        {ayuda && <Text style={[tipo.pie, { color: color.textoSuave, marginTop: 2 }]}>{ayuda}</Text>}
      </View>
      <Animated.View style={[s.pista, {
        backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: [color.bordeFuerte, color.carbon] as never }),
      }]}>
        <Animated.View style={[s.perilla, {
          transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }],
        }]} />
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  boton: {
    minHeight: TOQUE, borderRadius: radio.pastilla, paddingHorizontal: esp.lg,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  botonBrasa: { ...sombra.brasa },
  // Filo claro en el canto de arriba del boton: le da volumen.
  filoBoton: {
    position: 'absolute', top: 0, left: 16, right: 16, height: 1,
    backgroundColor: color.filoBoton,
  },
  redondo: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  chip: {
    borderWidth: 1, borderColor: color.borde, backgroundColor: color.velo,
    borderRadius: radio.pastilla, paddingVertical: 7, paddingHorizontal: 14,
  },
  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm, minHeight: TOQUE,
    paddingHorizontal: esp.md, paddingVertical: esp.sm,
    borderWidth: 1, borderColor: color.borde, borderRadius: radio.tarjeta,
    backgroundColor: color.lienzo,
  },
  marca: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    borderColor: color.bordeFuerte, alignItems: 'center', justifyContent: 'center',
  },
  contador: {
    alignItems: 'center', gap: esp.sm, paddingVertical: esp.md,
  },
  contadorFila: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: esp.lg,
  },
  contadorBoton: {
    width: TOQUE, height: TOQUE, borderRadius: TOQUE / 2,
    borderWidth: 1, borderColor: color.borde, backgroundColor: color.crema,
    alignItems: 'center', justifyContent: 'center',
  },
  interruptor: { flexDirection: 'row', alignItems: 'center', minHeight: TOQUE, paddingVertical: esp.sm },
  pista: { width: 46, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  perilla: { width: 20, height: 20, borderRadius: 10, backgroundColor: color.perilla },
});
