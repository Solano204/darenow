/**
 * FORJA · ui / movimiento
 *
 * `useMovimientoReducido` y las animaciones reutilizables que lo consumen:
 * entrada escalonada, barrido de luz, pulso de estado y numeros que cuentan.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, AccessibilityInfo, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { color, anim, degradado } from '../../theme';

/**
 * Si el sistema pide movimiento reducido, toda animacion de este archivo
 * aplica el valor final de inmediato: sin transicion y sin loops. `Brillo`
 * se apaga por completo porque no tiene un "valor final" que mostrar.
 */
export function useMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => { if (vivo) setReducido(v); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducido);
    return () => { vivo = false; sub.remove(); };
  }, []);
  return reducido;
}

/** Entrada suave: aparece y sube unos pixeles. */
export function Aparece({ children, retraso = 0, estilo }: {
  children: React.ReactNode; retraso?: number; estilo?: ViewStyle;
}) {
  const reducido = useMovimientoReducido();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducido) { v.setValue(1); return; }
    Animated.timing(v, {
      toValue: 1, duration: anim.normal, delay: retraso,
      easing: Easing.bezier(0.2, 0.7, 0.3, 1), useNativeDriver: true,
    }).start();
  }, [reducido]);
  return (
    <Animated.View style={[
      estilo,
      {
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      },
    ]}>
      {children}
    </Animated.View>
  );
}

/**
 * Barrido de luz.
 *
 * Una banda clara que cruza la superficie al entrar y luego cada tantos
 * segundos. Es el reflejo que hace que una tarjeta parezca cristal y no
 * plastico.
 *
 * OJO con las medidas: la primera version usaba height:'260%' y
 * marginTop:'-80%'. Yoga no resuelve un margen negativo en porcentaje
 * contra un padre absoluto, y en Android el fallo se propagaba hacia
 * arriba: la tarjeta perdia su altura de contenido y se estiraba a
 * pantalla completa, vacia. Por eso ahora TODO va en pixeles, medidos
 * con onLayout. Dentro de una vista absoluta, nunca porcentajes.
 *
 * Se usa con moderacion: solo en la tarjeta que manda en la pantalla. Si
 * brillan todas, no brilla ninguna.
 */
export function Brillo({ repetirCada = 7000, retraso = 500 }: {
  repetirCada?: number; retraso?: number;
}) {
  const reducido = useMovimientoReducido();
  // Pantalla en segundo plano (otra pestana, o una de encima en el stack):
  // el loop de 7 s no tiene sentido corriendo donde nadie lo ve.
  const enFoco = useIsFocused();
  const v = useRef(new Animated.Value(0)).current;
  const [caja, setCaja] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (reducido || !enFoco || caja.w === 0) return;
    let vivo = true;
    let temporizador: ReturnType<typeof setTimeout>;
    const pasada = () => {
      v.setValue(0);
      Animated.timing(v, {
        toValue: 1, duration: 1100,
        easing: Easing.inOut(Easing.quad), useNativeDriver: true,
      }).start(() => {
        if (!vivo) return;
        temporizador = setTimeout(pasada, repetirCada);
      });
    };
    temporizador = setTimeout(pasada, retraso);
    return () => { vivo = false; clearTimeout(temporizador); };
  }, [reducido, enFoco, caja.w, repetirCada, retraso]);

  // Es un loop puro sin valor final: con movimiento reducido, o sin foco,
  // no hay nada que mostrar de inmediato, se apaga por completo.
  if (reducido || !enFoco) return null;

  const banda = 110;
  // La banda va inclinada, asi que necesita mas alto que la caja para
  // cubrirla de esquina a esquina.
  const alto = caja.h + banda * 2;

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setCaja(c => (c.w === width && c.h === height ? c : { w: width, h: height }));
      }}
    >
      {caja.w > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: -banda,
            left: 0,
            width: banda,
            height: alto,
            transform: [
              {
                translateX: v.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-banda * 1.6, caja.w + banda * 0.6],
                }),
              },
              { rotate: '18deg' },
            ],
          }}
        >
          <LinearGradient
            colors={degradado.brillo}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

/** Pulso lento. Para lo que esta vivo ahora mismo: un punto de "en curso". */
export function Pulso({ tamano = 8, tono = color.carbon }: { tamano?: number; tono?: string }) {
  const reducido = useMovimientoReducido();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducido) return;
    Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ])).start();
  }, [reducido]);
  return (
    <View style={{ width: tamano * 2.4, height: tamano * 2.4, alignItems: 'center', justifyContent: 'center' }}>
      {/* El halo es el loop; con movimiento reducido se queda solo el
          punto solido, que ya comunica "en curso" sin moverse. */}
      {!reducido && (
        <Animated.View style={{
          position: 'absolute', width: tamano * 2.4, height: tamano * 2.4,
          borderRadius: tamano * 1.2, backgroundColor: tono,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.30, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        }} />
      )}
      <View style={{ width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: tono }} />
    </View>
  );
}

/**
 * Numero que cuenta hasta su valor. Para cifras que merecen notarse:
 * racha, logros. Nunca durante la sesion, el reproductor no se puede
 * permitir renders extra.
 *
 * El listener de `Animated.Value` dispara por fotograma (60/s): sin
 * limite, cada cifra en pantalla es 60 `setState` por segundo. Se
 * limita a 20 fps (una actualizacion cada 50 ms), suficiente para que
 * se vea contar.
 */
export function NumeroAnimado({ valor, estilo, duracion = anim.lenta, retraso = 0, maxFontSizeMultiplier }: {
  valor: number; estilo?: object; duracion?: number; retraso?: number; maxFontSizeMultiplier?: number;
}) {
  const reducido = useMovimientoReducido();
  const [n, setN] = useState(reducido ? valor : 0);
  const v = useRef(new Animated.Value(0)).current;
  const ultimoUpdate = useRef(0);
  useEffect(() => {
    if (reducido) { setN(valor); return; }
    const sub = v.addListener(({ value }) => {
      const ahora = Date.now();
      if (ahora - ultimoUpdate.current < 50) return;
      ultimoUpdate.current = ahora;
      setN(Math.round(value));
    });
    Animated.timing(v, {
      toValue: valor, duration: duracion, delay: retraso,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start(() => setN(Math.round(valor)));   // el limite de 20 fps puede saltarse el ultimo frame
    return () => v.removeListener(sub);
  }, [valor, reducido]);
  return <Text style={estilo} maxFontSizeMultiplier={maxFontSizeMultiplier}>{n}</Text>;
}
