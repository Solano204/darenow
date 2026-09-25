/**
 * FORJA · bienvenida
 *
 * Primera pantalla del dia. Fondo con imagen, saludo, mensaje del dia y un
 * resumen de una linea. El banner pequeño va abajo, lejos del boton, para
 * que nadie lo toque sin querer.
 *
 * Se muestra una vez al dia. Si el usuario vuelve a abrir la app en la
 * misma jornada, entra directo a Hoy.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { color, tipo, esp, radio, anim, degradado } from '../theme';
import { Boton } from '../components/ui';
import { BannerAnuncio, ANUNCIOS_ACTIVOS } from '../components/Anuncio';
import { useWelcomeData } from '../hooks/useWelcomeData';
import { fuente } from '../media/registry';
import Foto from '../components/Foto';

export default function Bienvenida({ navigation }: any) {
  const w = useWelcomeData(navigation);

  // Entrada escalonada: fondo, saludo, mensaje, boton.
  const v = useRef(new Animated.Value(0)).current;
  const v2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.stagger(140, [
      Animated.timing(v, { toValue: 1, duration: anim.lenta, useNativeDriver: true }),
      Animated.timing(v2, { toValue: 1, duration: anim.lenta, useNativeDriver: true }),
    ]).start();
  }, []);

  const bg = fuente('fondo', 'bienvenida');

  const contenido = (
    <SafeAreaView style={s.raiz}>
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: esp.md }}>
        <Animated.View style={{
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        }}>
          <Text style={[tipo.pie, { color: color.textoSuave }]}>
            {w.fecha}
          </Text>
          <Text style={[tipo.display, { color: color.texto, marginTop: esp.xs }]}>
            {w.saludo}
          </Text>
        </Animated.View>

        <Animated.View style={{
          opacity: v2,
          transform: [{ translateY: v2.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
          marginTop: esp.lg,
        }}>
          <LinearGradient colors={degradado.paso} style={s.tarjeta}>
            {/* Imagen de motivacion del dia. Como todo el resto, si no
                esta el archivo se dibuja su marcador y no se rompe nada. */}
            <Foto tipo="motivacion" id={w.msg.id} nombre={w.msg.titulo}
              alto={190} ancho="100%" forma="tarjeta" />
            <Text style={[tipo.h2, { color: color.texto, marginTop: esp.sm }]}>{w.msg.titulo}</Text>
            <Text style={[tipo.cuerpo, { color: color.textoSuave }]}>{w.msg.cuerpo}</Text>

            <View style={s.linea} />

            <View style={s.resumen}>
              <Dato n={String(w.racha)} t={w.racha === 1 ? 'día seguido' : 'días seguidos'} />
              <View style={s.sep} />
              <Dato n={String(w.sesiones)} t="sesiones" />
              <View style={s.sep} />
              <Dato n={String(w.diasEntrenados)} t="días entrenados" />
            </View>
          </LinearGradient>

          <Boton texto="Entrar" onPress={w.entrar} estilo={{ marginTop: esp.md }} />
        </Animated.View>

        {ANUNCIOS_ACTIVOS && (
          <View style={{ marginTop: esp.md }}>
            <BannerAnuncio />
          </View>
        )}
      </View>
    </SafeAreaView>
  );

  if (bg) {
    return (
      <ImageBackground source={bg} style={{ flex: 1 }} resizeMode="cover">
        <LinearGradient
          colors={degradado.velo}
          locations={[0, 0.45, 1]}
          style={{ flex: 1 }}
        >
          {contenido}
        </LinearGradient>
      </ImageBackground>
    );
  }

  // Sin imagen todavia: degradado calido que ocupa el mismo sitio.
  return (
    <LinearGradient colors={degradado.portada} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
      {contenido}
    </LinearGradient>
  );
}

function Dato({ n, t }: { n: string; t: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[tipo.h2, { color: color.texto }]}>{n}</Text>
      <Text style={[tipo.micro, { color: color.textoSuave, textAlign: 'center' }]}>{t}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
  tarjeta: { borderRadius: radio.tarjeta, padding: esp.lg, gap: esp.sm },
  linea: { height: 1, backgroundColor: color.borde, marginVertical: esp.sm },
  resumen: { flexDirection: 'row', alignItems: 'center' },
  sep: { width: 1, height: 26, backgroundColor: color.borde },
});
