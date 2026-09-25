/**
 * Bienvenida del dia: foto a sangre arriba fundida a goma, saludo, tarjeta con
 * el mensaje y tres numeros, y el boton Entrar fijo abajo. Se muestra una vez
 * al dia. Los datos y la accion de entrar viven en `useWelcomeData`.
 *
 * Entrada (una sola vez, ~1.1 s): la foto llega escalada 1.08 a 1.0 mientras
 * flota el polvo de magnesia; despues la fecha, el saludo letra por letra, la
 * tarjeta, los numeros en odometro y el boton. Ninguna espera bloquea Entrar.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, tipo, esp, degradado, easing, MARGEN_PANTALLA } from '../theme';
import { BotonPlaca } from '../components/ui/BotonPlaca';
import { TarjetaGoma } from '../components/ui/TarjetaGoma';
import { GomaTexture } from '../components/fx/GomaTexture';
import { FotoTratada, ANCLAS_VELO } from '../components/fx/FotoTratada';
import { MagnesiaParticles } from '../components/fx/MagnesiaParticles';
import { TituloLetras } from '../components/fx/TituloMascara';
import { Odometro } from '../components/fx/Odometro';
import { Entrada } from '../components/fx/Entrada';
import { BannerAnuncio, ANUNCIOS_ACTIVOS } from '../components/Anuncio';
import { useWelcomeData } from '../hooks/useWelcomeData';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { fuente } from '../media/registry';
import Foto from '../components/Foto';

const FRACCION_FOTO = 0.55;
const FOCO_BIENVENIDA = { x: 0.55, y: 0.3 };
const ESCALA_INICIAL_FOTO = 1.08;
const FOTO_ESCALA_MS = 1200;
const FOTO_FUNDIDO_MS = 400;
const FUNDIDO_REDUCIDO_MS = 150;
const ALTO_IMAGEN = 180;
const ALTO_IMAGEN_COMPACTO = 132;
const PANTALLA_COMPACTA = 700;
const SALUDO_LARGO = 14;

const T_FECHA = 150;
const T_SALUDO = 250;
const T_TARJETA = 500;
const T_NUMEROS = 700;
const T_BOTON = 900;

/** «Arriba, Carlos Josue» se parte en dos lineas cuando es largo. */
export function partirSaludo(saludo: string): string[] {
  const corte = saludo.indexOf(', ');
  return corte > 0 && saludo.length > SALUDO_LARGO ? [saludo.slice(0, corte + 1), saludo.slice(corte + 2)] : [saludo];
}

export default function Bienvenida({ navigation }: { navigation: { replace: (ruta: string) => void } }) {
  const w = useWelcomeData(navigation);
  const enFoco = useIsFocused();
  const reducido = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const bg = fuente('fondo', 'bienvenida');
  const alturaFoto = height * FRACCION_FOTO;
  const altoImagen = height < PANTALLA_COMPACTA ? ALTO_IMAGEN_COMPACTO : ALTO_IMAGEN;

  const escala = useSharedValue(reducido ? 1 : ESCALA_INICIAL_FOTO);
  const opacidad = useSharedValue(0);

  useEffect(() => {
    if (reducido) {
      escala.value = 1;
      opacidad.value = withTiming(1, { duration: FUNDIDO_REDUCIDO_MS });
      return;
    }
    escala.value = withTiming(1, { duration: FOTO_ESCALA_MS, easing: easing.salida });
    opacidad.value = withTiming(1, { duration: FOTO_FUNDIDO_MS });
  }, [reducido]);

  const estiloFoto = useAnimatedStyle(() => ({ opacity: opacidad.value }));

  return (
    <View style={s.raiz}>
      <Animated.View style={[s.foto, { width, height: alturaFoto }, estiloFoto]} pointerEvents="none">
        {bg !== null && <FotoTratada fuente={bg} ancho={width} alto={alturaFoto} foco={FOCO_BIENVENIDA} escala={escala} />}
        <LinearGradient colors={degradado.velo} locations={ANCLAS_VELO} style={StyleSheet.absoluteFill} />
        <MagnesiaParticles ancho={width} alto={alturaFoto} pausado={!enFoco} />
      </Animated.View>
      <GomaTexture />

      <SafeAreaView style={s.contenido}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} bounces={false}>
          <Entrada activo retraso={T_FECHA} y={8}>
            <Text style={[tipo.etiqueta, s.fecha]}>{w.fecha}</Text>
          </Entrada>
          <TituloLetras lineas={partirSaludo(w.saludo)} estilo={[tipo.display, s.saludo]} activo retraso={T_SALUDO} />

          <Entrada activo retraso={T_TARJETA} y={24} estilo={s.tarjeta}>
            <TarjetaGoma>
              <Foto tipo="motivacion" id={w.msg.id} nombre={w.msg.titulo} alto={altoImagen} ancho="100%" />
              <Text style={[tipo.h1, s.tituloTarjeta]}>{w.msg.titulo}</Text>
              <Text style={[tipo.cuerpo, s.mensaje]}>{w.msg.cuerpo}</Text>

              <View style={s.estadisticas}>
                <Dato n={w.racha} t={w.racha === 1 ? 'día seguido' : 'días seguidos'} />
                <View style={s.separador} />
                <Dato n={w.sesiones} t="sesiones" />
                <View style={s.separador} />
                <Dato n={w.diasEntrenados} t="días entrenados" />
              </View>
            </TarjetaGoma>
          </Entrada>
        </ScrollView>

        <View style={s.pie}>
          <Entrada activo retraso={T_BOTON} escala={0.96} estilo={s.boton}>
            <BotonPlaca texto="Entrar" onPress={w.entrar} aplauso estilo={s.boton} />
          </Entrada>
          {ANUNCIOS_ACTIVOS && (
            <View style={{ marginTop: esp.md }}>
              <BannerAnuncio />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Dato({ n, t }: { n: number; t: string }) {
  return (
    <View style={s.dato} accessible accessibilityLabel={`${n} ${t}`}>
      <Odometro valor={n} retraso={T_NUMEROS} estilo={[tipo.numero, s.numero]} />
      <Text style={[tipo.etiqueta, s.etiquetaDato]}>{t}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  foto: { position: 'absolute', top: 0, left: 0 },
  contenido: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.lg },
  fecha: { fontSize: 14, color: paleta.magnesia2 },
  saludo: { fontSize: 48, lineHeight: 46, color: paleta.magnesia },
  tarjeta: { marginTop: esp.md },
  tituloTarjeta: { color: paleta.magnesia, marginTop: esp.md - 4 },
  mensaje: { color: paleta.magnesia2, marginTop: esp.sm - 4 },
  estadisticas: { flexDirection: 'row', alignItems: 'flex-start', marginTop: esp.md },
  separador: { width: 1, alignSelf: 'stretch', backgroundColor: paleta.gomaBorde },
  dato: { flex: 1, alignItems: 'center' },
  numero: { color: paleta.magnesia },
  etiquetaDato: { color: paleta.magnesia2, textAlign: 'center' },
  pie: { paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.md, paddingBottom: MARGEN_PANTALLA },
  boton: { alignSelf: 'stretch' },
});
