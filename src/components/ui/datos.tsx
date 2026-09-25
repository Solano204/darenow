/**
 * FORJA · ui / datos
 *
 * Piezas para mostrar informacion: filas etiqueta/valor, insignias,
 * barras, notas destacadas, el buscador y los titulos de pantalla.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Easing } from 'react-native';
import { color, tipo, esp, radio, insignia, anim, peso } from '../../theme';
import type { Evidencia } from '../../data/catalog';
import { useMovimientoReducido } from './movimiento';

export function Fila({ etiqueta, valor, tenue, oscuro, apilado }: {
  etiqueta: string; valor: string; tenue?: boolean; oscuro?: boolean;
  /** Etiqueta arriba y valor abajo, en vez de lado a lado (para valores largos). */
  apilado?: boolean;
}) {
  return (
    <View style={apilado ? s.filaApilada : s.fila}>
      <Text style={[tipo.cuerpo, { color: color.textoSuave, flex: apilado ? undefined : 1 }]}>
        {etiqueta}
      </Text>
      <Text style={[tipo.cuerpo, {
        color: tenue ? color.textoSuave : color.texto,
        fontFamily: tenue ? peso.regular : peso.semibold,
        textAlign: apilado ? 'left' : 'right', flexShrink: 1,
      }]}>{valor}</Text>
    </View>
  );
}

/* ═════════════════════════════════════════ insignias */

export function Insignia({ tipo: t, pequena }: { tipo: Evidencia; pequena?: boolean }) {
  const i = insignia[t];
  return (
    <View style={[
      s.insignia,
      { backgroundColor: i.bg, borderColor: i.fg + '44' },
      pequena && { paddingVertical: 3, paddingHorizontal: 8 },
    ]}>
      <Text style={[pequena ? tipo.micro : tipo.dato, { color: i.fg }]}>{i.texto}</Text>
    </View>
  );
}

/**
 * Barra de progreso que crece al entrar.
 *
 * Anima `transform` (scaleX + translateX de compensacion), no `width`:
 * asi corre con native driver y no toca el hilo de JS. RN escala desde el
 * centro, asi que sin la compensacion la barra creceria pareja hacia los
 * dos lados en vez de desde la izquierda. Se mide el ancho real con
 * `onLayout` porque la compensacion necesita pixeles, no porcentaje (ver
 * el error ya cometido con `Brillo` en DISEÑO.md): hasta que se mide, no
 * se pinta nada, igual que `Brillo`.
 */
export function Progreso({ valor, alto = 6, tono = color.carbon, fondo = color.borde, retraso = 0 }: {
  valor: number; alto?: number; tono?: string; fondo?: string; retraso?: number;
}) {
  const reducido = useMovimientoReducido();
  const v = useRef(new Animated.Value(0)).current;
  const meta = Math.max(0, Math.min(1, valor));
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (reducido) { v.setValue(meta); return; }
    Animated.timing(v, {
      toValue: meta, duration: anim.lenta, delay: retraso,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [meta, reducido]);
  return (
    <View
      onLayout={e => setAncho(e.nativeEvent.layout.width)}
      style={{ height: alto, borderRadius: alto / 2, backgroundColor: fondo, overflow: 'hidden' }}
    >
      {ancho > 0 && (
        <Animated.View style={{
          height: alto, width: ancho, borderRadius: alto / 2, backgroundColor: tono,
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-ancho / 2, 0] }) },
            { scaleX: v },
          ],
        }} />
      )}
    </View>
  );
}

/** Barras de minutos por dia. Crecen al entrar. Sin libreria de graficas. */
export function BarrasSemana({ datos, oscuro }: {
  datos: { fecha: string; min: number }[]; oscuro?: boolean;
}) {
  const max = Math.max(30, ...datos.map(d => d.min));
  const dias = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1, duration: anim.lenta, delay: 120,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={s.grafica}>
      {datos.map((d, i) => {
        const alto = Math.max(4, (d.min / max) * 80);
        const dow = new Date(d.fecha + 'T00:00:00').getDay();
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: esp.xs }}>
            <Text style={[tipo.micro, { color: color.textoTenue }]}>{d.min || ''}</Text>
            <Animated.View style={[s.barra, {
              height: v.interpolate({ inputRange: [0, 1], outputRange: [4, alto] }),
              backgroundColor: d.min ? color.carbon : color.borde,
            }]} />
            <Text style={[tipo.micro, { color: color.textoTenue }]}>{dias[dow]}</Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Bloque destacado. Fondo tenido y forma redondeada; nada de barras
 * gruesas de color pegadas al margen izquierdo.
 *
 * El titulo va en mayusculas por herencia de la version anterior, pero se
 * pinta en tamaño micro y color tenue para que sea una etiqueta de dato y
 * no un encabezado que compita con los de seccion.
 */
export function Nota({ texto, titulo, tono = 'neutro' }: {
  texto: string; titulo?: string; tono?: 'neutro' | 'cuidado' | 'bueno';
}) {
  const bg = tono === 'cuidado' ? color.parcialFondo : tono === 'bueno' ? color.okFondo : color.lienzo;
  const bd = tono === 'cuidado' ? color.parcialBorde : tono === 'bueno' ? color.okBorde : color.borde;
  const fg = tono === 'cuidado' ? color.parcial : tono === 'bueno' ? color.ok : color.textoSuave;
  return (
    <View style={[s.nota, { backgroundColor: bg, borderColor: bd }]}>
      {titulo && <Text style={[tipo.micro, { color: fg, marginBottom: 4 }]}>{titulo}</Text>}
      <Text style={[tipo.pie, { color: color.texto }]}>{texto}</Text>
    </View>
  );
}

export function Buscador({ valor, onCambio, placeholder }: {
  valor: string; onCambio: (t: string) => void; placeholder: string;
}) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={[s.buscadorCaja, foco && { borderColor: color.acentoBorde }]}>
      <Text style={{ color: foco ? color.acento : color.textoTenue, fontSize: 15 }}>⌕</Text>
      <TextInput
        value={valor} onChangeText={onCambio} placeholder={placeholder}
        placeholderTextColor={color.textoTenue} style={s.buscador}
        onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
        clearButtonMode="while-editing"
        keyboardAppearance="light"
      />
    </View>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return (
    <View style={{ paddingVertical: esp.xl, alignItems: 'center' }}>
      <Text style={[tipo.cuerpo, { color: color.textoTenue, textAlign: 'center' }]}>{texto}</Text>
    </View>
  );
}

/**
 * Bloque de carga. Pulso de brasa al 6% sobre `cremaHonda`, nunca un
 * spinner centrado a pantalla completa (esa excepcion es solo el arranque
 * en frio de la app). Sin usos todavia: hoy no hay ninguna espera
 * asincrona real en la app (todo es local), asi que queda listo para la
 * primera que exista en vez de forzarlo en una pantalla que no espera nada.
 */
export function Esqueleto({ alto = 16, ancho = '100%' as number | `${number}%`, radio: radioProp = radio.chip }: {
  alto?: number; ancho?: number | `${number}%`; radio?: number;
}) {
  const reducido = useMovimientoReducido();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducido) return;
    const bucle = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: anim.muyLenta / 2, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: anim.muyLenta / 2, useNativeDriver: true }),
    ]));
    bucle.start();
    return () => bucle.stop();
  }, [reducido]);
  return (
    <View style={{ height: alto, width: ancho, borderRadius: radioProp, backgroundColor: color.cremaHonda, overflow: 'hidden' }}>
      {!reducido && (
        <Animated.View style={[StyleSheet.absoluteFill, {
          backgroundColor: color.carbon,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] }),
        }]} />
      )}
    </View>
  );
}

export function Titulo({ children, sub }: { children: string; sub?: string }) {
  return (
    <View style={{ marginBottom: esp.md }}>
      <Text style={[tipo.h1, { color: color.texto }]}>{children}</Text>
      {sub && <Text style={[tipo.cuerpo, { color: color.textoSuave, marginTop: esp.xs }]}>{sub}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: esp.sm },
  filaApilada: { gap: 2 },
  insignia: {
    alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 11,
    borderRadius: radio.chip, borderWidth: 1,
  },
  nota: {
    borderRadius: radio.tarjeta, padding: esp.md, marginBottom: esp.sm, borderWidth: 1,
  },
  buscadorCaja: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm,
    backgroundColor: color.lienzo, borderRadius: radio.pastilla, paddingHorizontal: esp.md,
    borderWidth: 1, borderColor: color.borde,
  },
  buscador: { flex: 1, minHeight: 46, color: color.texto, fontSize: 15 },
  grafica: { flexDirection: 'row', alignItems: 'flex-end', gap: esp.xs, height: 120, paddingTop: esp.sm },
  barra: { width: '62%', borderRadius: 4 },
});
