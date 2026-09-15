/**
 * FORJA · ui / superficies
 *
 * `Vidrio3D` es la pieza base (filo de luz + cuerpo + luz interior +
 * barrido opcional) y `Tarjeta` la envuelve para el uso comun. `Pantalla`
 * es el contenedor de cada pantalla, con su resplandor fijo.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Animated, Easing, type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, degradado, sombra, sol, filoLuz, anim } from '../../theme';
import { Brillo, useMovimientoReducido } from './movimiento';
import { Toque } from './controles';

/**
 * Superficie de vidrio.
 *
 * Es la pieza que da el aspecto tridimensional a toda la app. Cinco
 * capas, de atras hacia adelante:
 *
 *   1. FILO DE LUZ  - envoltura de 1px pintada como degradado: brilla del
 *                     lado del sol y se apaga del opuesto. Es el canto.
 *   2. CUERPO       - degradado de superficie, orientado al mismo sol.
 *   3. DESENFOQUE   - opcional; solo donde hay algo detras que valga la
 *                     pena difuminar (una foto, el resplandor del fondo).
 *   4. LUZ INTERIOR - una linea clara pegada al canto de arriba y un
 *                     resplandor en la esquina del sol. Esto es lo que
 *                     convierte un rectangulo en una lamina con grosor.
 *   5. BARRIDO      - opcional, el reflejo que cruza.
 *
 * La sombra vive en la envoltura, no en el cuerpo: si va dentro, el
 * recorte de overflow se la come.
 */
export function Vidrio3D({
  children, tono = 'crema', estilo, radioExterior = radio.tarjeta,
  brillo, desenfoque, elevacion = 'suave',
}: {
  children: React.ReactNode;
  tono?: keyof typeof degradado;
  estilo?: ViewStyle;
  radioExterior?: number;
  /** barrido de luz; solo para la tarjeta que manda en la pantalla */
  brillo?: boolean;
  /** desenfoque real; cuesta GPU, uselo solo sobre fotos o el resplandor */
  desenfoque?: boolean;
  elevacion?: 'plana' | 'suave' | 'alta';
}) {
  const sombraNivel =
    elevacion === 'alta' ? sombra.alta : elevacion === 'plana' ? undefined : sombra.suave;

  // El vidrio real se materializa al entrar: nace transparente y algo mas
  // chico, y se asienta. Una superficie opaca no lo necesita (no hay nada
  // que "empañar"); el filo de luz de fuera queda fijo, solo el cristal
  // de adentro se forma.
  const reducido = useMovimientoReducido();
  const v = useRef(new Animated.Value(desenfoque && !reducido ? 0 : 1)).current;
  useEffect(() => {
    if (!desenfoque || reducido) return;
    Animated.timing(v, {
      toValue: 1, duration: anim.lenta, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [desenfoque, reducido]);

  return (
    <LinearGradient
      colors={filoLuz}
      start={sol.start}
      end={sol.end}
      style={[{ borderRadius: radioExterior, padding: 1 }, sombraNivel, estilo]}
    >
      <Animated.View style={{
        borderRadius: radioExterior - 1, overflow: 'hidden',
        opacity: v,
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
      }}>
        {/*
          * El orden de estas capas no es casual. BlurView difumina lo que
          * se pinto ANTES que el, asi que va primero: lo que difumina es
          * el fondo de la pantalla y el resplandor, que es lo que hay
          * detras de verdad. Si fuera despues del degradado, difuminaria
          * el propio degradado y la tarjeta quedaria turbia.
          *
          * Cuando hay desenfoque el cuerpo va a media opacidad, para que
          * el resplandor se vea a traves. Sin desenfoque va opaco.
          */}
        {desenfoque && (
          <BlurView intensity={26} tint="dark" style={StyleSheet.absoluteFill} />
        )}

        <LinearGradient
          colors={degradado[tono]}
          start={sol.start}
          end={sol.end}
          style={[StyleSheet.absoluteFill, desenfoque ? { opacity: 0.72 } : null]}
        />

        {/* Resplandor de la esquina del sol: arriba a la izquierda. */}
        <LinearGradient
          pointerEvents="none"
          colors={degradado.vidrioLuz}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.75, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Canto iluminado de arriba. Un pixel, y es lo que da grosor. */}
        <View pointerEvents="none" style={s.cantoAlto} />

        {brillo && <Brillo />}

        <View style={{ padding: esp.md, gap: esp.sm }}>{children}</View>
      </Animated.View>
    </LinearGradient>
  );
}

/**
 * Tarjeta con filo de luz.
 *
 * Son dos degradados anidados: el de fuera pinta un borde de 1px que
 * brilla del lado del sol, y el de dentro es el cuerpo de la superficie.
 * React Native no tiene mask-composite, asi que el borde degradado se
 * consigue con este anidamiento, que es la tecnica estandar y no cuesta
 * practicamente nada.
 */
export function Tarjeta({ children, estilo, onPress, tono = 'crema', plana, brillo, desenfoque, etiqueta }: {
  children: React.ReactNode;
  estilo?: ViewStyle;
  onPress?: () => void;
  tono?: keyof typeof degradado;
  plana?: boolean;
  /** barrido de luz; reservado para la tarjeta que manda en la pantalla */
  brillo?: boolean;
  /** desenfoque real; solo sobre fotos o sobre el resplandor del fondo */
  desenfoque?: boolean;
  /** solo si el texto visible de la tarjeta no basta para describirla */
  etiqueta?: string;
}) {
  const cuerpo = (
    <Vidrio3D
      tono={tono}
      brillo={brillo}
      desenfoque={desenfoque}
      elevacion={plana ? 'plana' : 'suave'}
    >
      {children}
    </Vidrio3D>
  );
  return onPress
    ? <Toque onPress={onPress} estilo={[{ marginBottom: esp.sm }, estilo] as unknown as ViewStyle} etiqueta={etiqueta}>{cuerpo}</Toque>
    : <View style={[{ marginBottom: esp.sm }, estilo]}>{cuerpo}</View>;
}

export function Seccion({ titulo, accion, onAccion, children, estilo }: {
  titulo: string; accion?: string; onAccion?: () => void;
  children: React.ReactNode; estilo?: ViewStyle;
}) {
  return (
    <View style={[{ marginTop: esp.lg }, estilo]}>
      <View style={s.cabeceraSeccion}>
        <Text style={[tipo.h2, { color: color.texto }]}>{titulo}</Text>
        {accion && (
          <Pressable onPress={onAccion} hitSlop={10} style={s.verMas}>
            <Text style={[tipo.dato, { color: color.acento }]}>{accion}</Text>
            <Text style={{ color: color.acento, fontSize: 13 }}>›</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

/**
 * Hueco inferior: la barra de pestanas (pegada al fondo, no flotante) mas
 * un respiro. Su alto real crece con el inset del telefono (ver
 * `Pestanas` en App.tsx: mismo calculo, `Math.max(inset.bottom - 10, 0)`
 * mantiene el icono a la misma altura y solo agranda el padding de abajo).
 */
export function useHuecoAbajo(extra = 0) {
  const inset = useSafeAreaInsets();
  return 68 + Math.max(inset.bottom - 10, 0) + esp.md + extra;
}

/**
 * Contenedor de pantalla.
 *
 * Lleva un resplandor calido fijo en la esquina superior izquierda: es la
 * fuente de luz del sistema, hecha visible. Da profundidad al fondo y
 * justifica que todos los filos brillen hacia ese lado.
 */
export function Pantalla({ children, sinPadding, lienzo, extraAbajo = 0 }: {
  children: React.ReactNode; sinPadding?: boolean; lienzo?: boolean; extraAbajo?: number;
}) {
  const abajo = useHuecoAbajo(extraAbajo);
  return (
    <View style={{ flex: 1, backgroundColor: lienzo ? color.lienzo : color.fondo }}>
      <Resplandor />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: sinPadding ? 0 : esp.md, paddingBottom: abajo }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** El sol del sistema: un resplandor calido arriba a la izquierda. */
export function Resplandor({ opacidad = 0.5 }: { opacidad?: number }) {
  return (
    <View pointerEvents="none" style={s.resplandor}>
      <LinearGradient
        colors={degradado.resplandor}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.85, y: 1 }}
        style={{ flex: 1, opacity: opacidad }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  // Envoltura de 1px que pinta el filo de luz de la tarjeta.
  filo: { borderRadius: radio.tarjeta, padding: 1 },
  // Un pixel claro pegado al canto de arriba. Es la diferencia entre un
  // rectangulo pintado y una lamina que tiene grosor.
  cantoAlto: {
    position: 'absolute', top: 0, left: 14, right: 14, height: 1,
    backgroundColor: color.cantoAlto,
  },
  tarjeta: {
    borderRadius: radio.tarjeta - 1, padding: esp.md, gap: esp.sm, overflow: 'hidden',
  },
  cabeceraSeccion: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: esp.sm,
  },
  verMas: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: color.acentoTinte, paddingVertical: 7, paddingHorizontal: 13,
    borderRadius: radio.pastilla, borderWidth: 1, borderColor: color.acentoBorde,
  },
  resplandor: {
    position: 'absolute', top: -60, left: -80, width: 380, height: 380,
    borderRadius: 190, overflow: 'hidden',
  },
});
