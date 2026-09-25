/**
 * FORJA · presentacion
 *
 * Lo primero que ve alguien que abre la app por primera vez. Tres pantallas
 * que se deslizan, con una animacion continua de fondo.
 *
 * Dura lo que el usuario quiera: hay un boton para saltar desde el primer
 * segundo. Una intro que no se puede saltar es una intro que se odia a la
 * segunda vez que se ve.
 *
 * Aqui no hay anuncios. El primer minuto de alguien en la app decide si
 * vuelve; no se gasta en publicidad.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Dimensions, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { color, tipo, esp, radio, degradado, anim, peso } from '../theme';
import { Boton } from '../components/ui';
import Foto from '../components/Foto';
import { usePresentacion } from '../hooks/usePresentacion';

const { width, height } = Dimensions.get('window');

export default function Presentacion({ onTerminar }: { onTerminar: () => void }) {
  const { i, laminas, esUltima, avanzar, saltar } = usePresentacion(onTerminar);

  const desliz = useRef(new Animated.Value(0)).current;
  const opacidad = useRef(new Animated.Value(0)).current;

  // Entrada de la primera lamina.
  useEffect(() => {
    Animated.timing(opacidad, {
      toValue: 1, duration: anim.lenta, useNativeDriver: true,
    }).start();
  }, []);

  const siguiente = () => {
    if (esUltima) return avanzar();
    Animated.parallel([
      Animated.timing(desliz, { toValue: -width * 0.3, duration: anim.rapida, useNativeDriver: true }),
      Animated.timing(opacidad, { toValue: 0, duration: anim.rapida, useNativeDriver: true }),
    ]).start(() => {
      avanzar();
      desliz.setValue(width * 0.3);
      Animated.parallel([
        Animated.timing(desliz, { toValue: 0, duration: anim.normal, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(opacidad, { toValue: 1, duration: anim.normal, useNativeDriver: true }),
      ]).start();
    });
  };

  const l = laminas[i];

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      {/* La foto de cada lamina es el fondo completo, no una tarjeta
          adentro. Cambia de golpe con `l.id`; si hace falta un cruce
          suave entre laminas, es el siguiente paso. */}
      <Foto tipo="fondo" id={l.id} nombre={l.titulo} alto={height} ancho={width}
        estilo={{ position: 'absolute', top: 0, left: 0, borderRadius: 0 }} />

      {/* Vela hacia `fondo`: mismo degradado que usa Bienvenida para leer
          texto encima de una foto cualquiera. */}
      <LinearGradient colors={degradado.velo} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={s.barraSuperior}>
            <Text style={[tipo.h3, { color: color.texto, letterSpacing: 2 }]}>DARENOW</Text>
            <Pressable onPress={saltar} hitSlop={12} accessibilityRole="button" accessibilityLabel="Saltar">
              <Text style={[tipo.dato, { color: color.textoSuave }]}>Saltar</Text>
            </Pressable>
          </View>

          <Animated.View style={[
            s.centro,
            { opacity: opacidad, transform: [{ translateX: desliz }] },
          ]}>
            <Text style={[tipo.display, { color: color.texto }]}>{l.titulo}</Text>
            <Text style={[tipo.cuerpo, { color: color.textoSuave, marginTop: esp.sm }]}>{l.cuerpo}</Text>
            {l.pie && (
              <View style={s.pastilla}>
                <Text style={[tipo.pie, { color: color.acento, fontFamily: peso.semibold }]}>{l.pie}</Text>
              </View>
            )}
          </Animated.View>

          <View style={s.pie}>
            <View style={s.puntos}>
              {laminas.map((_, n) => (
                <View key={n} style={[s.punto, n === i && s.puntoActivo]} />
              ))}
            </View>
            <Boton
              texto={esUltima ? 'Empezar' : 'Seguir'}
              onPress={siguiente}
              estilo={{ flex: 1 }}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  barraSuperior: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: esp.md, paddingTop: esp.sm,
  },
  centro: { flex: 1, justifyContent: 'center', paddingHorizontal: esp.md },
  pastilla: {
    alignSelf: 'flex-start', marginTop: esp.md,
    backgroundColor: color.acentoTinte, borderRadius: radio.pastilla,
    paddingVertical: 7, paddingHorizontal: 14,
  },
  pie: {
    flexDirection: 'row', alignItems: 'center', gap: esp.md,
    padding: esp.md,
  },
  puntos: { flexDirection: 'row', gap: 6 },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: color.bordeFuerte },
  puntoActivo: { width: 22, backgroundColor: color.carbon },
});
