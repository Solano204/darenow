/**
 * FORJA · ui / superficies
 *
 * `Vidrio3D` es la pieza base (superficie plana: color o degradado de dos
 * tonos, sombra suave, barrido opcional) y `Tarjeta` la envuelve para el
 * uso comun. `Pantalla` es el contenedor de cada pantalla.
 */

import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, degradado, sombra, sol } from '../../theme';
import { Brillo } from './movimiento';
import { Toque } from './controles';

/**
 * Superficie plana.
 *
 * Color solido o degradado de dos tonos (`degradado[tono]`), sombra suave
 * y tenida, y un barrido de luz opcional para la tarjeta que manda en la
 * pantalla. `desenfoque` se conserva en la firma por compatibilidad (una
 * tarjeta de Hoy.tsx todavia lo pasa) pero ya no hace nada: una superficie
 * plana no tiene nada detras que valga la pena difuminar.
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
  /** @deprecated sin efecto en la superficie plana; se deja por compatibilidad */
  desenfoque?: boolean;
  elevacion?: 'plana' | 'suave' | 'alta';
}) {
  const sombraNivel =
    elevacion === 'alta' ? sombra.alta : elevacion === 'plana' ? undefined : sombra.suave;

  return (
    <View style={[{ borderRadius: radioExterior, overflow: 'hidden' }, sombraNivel, estilo]}>
      <LinearGradient
        colors={degradado[tono]}
        start={sol.start}
        end={sol.end}
        style={StyleSheet.absoluteFill}
      />
      {brillo && <Brillo />}
      <View style={{ padding: esp.md, gap: esp.sm }}>{children}</View>
    </View>
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

/** Halo muy sutil arriba a la izquierda. Casi imperceptible a proposito:
 *  una superficie plana no necesita el "sol" que justificaba el vidrio. */
export function Resplandor({ opacidad = 0.15 }: { opacidad?: number }) {
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
