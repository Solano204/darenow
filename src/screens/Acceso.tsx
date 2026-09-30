/**
 * Tu cuenta: la puerta que aparece una sola vez, entre la presentacion y el
 * cuestionario. Dos caminos, a proposito:
 *
 *  - Google: un toque, nombre y correo ya puestos, y un id estable para
 *    recuperar la cuenta si reinstala en el mismo telefono.
 *  - Sin cuenta: entra igual. Obligar a vincular Google para ver una
 *    rutina es la razon numero uno de desinstalacion el primer dia.
 *
 * El boton de Google solo se dibuja si hay Client ID configurado. Sin .env,
 * esta pantalla es simplemente "Empezar" y ya.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { paleta, tipo, familia, esp, MARGEN_PANTALLA, AREA_TACTIL_MIN, resorteMagnesia, haptico } from '@/theme';
import { BotonPlaca } from '@/components/ui/BotonPlaca';
import { BotonGoogle } from '@/components/ui/BotonGoogle';
import { BotonSecundario } from '@/components/ui/BotonSecundario';
import { TarjetaGoma } from '@/components/ui/TarjetaGoma';
import { GomaTexture } from '@/components/fx/GomaTexture';
import { TituloMascara } from '@/components/fx/TituloMascara';
import { Entrada } from '@/components/fx/Entrada';
import { IconoTrazo, type NombreIcono } from '@/components/fx/IconoTrazo';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useGoogleSignIn, mensajeError } from '@/store/googleAuth';
import { useCuenta } from '@/store/cuenta';
import { URL_PRIVACIDAD, URL_TERMINOS } from '@/legal';

const T_SUBTITULO = 200;
const T_TARJETA = 350;
const T_PUNTOS = 550;
const ESCALONADO_PUNTOS_MS = 70;
const T_ICONO_EXTRA = 50;
const T_BOTONES = 750;
const DESPLAZAMIENTO_TARJETA = 24;
const AMPLITUD_SACUDIDA = 6;

export default function Acceso({ onListo }: { onListo: () => void }) {
  const google = useGoogleSignIn();
  const { entrarConGoogle, entrarComoInvitado } = useCuenta();

  useEffect(() => {
    if (!google.perfil) return;
    (async () => {
      await entrarConGoogle(google.perfil!);
      google.limpiar();
      onListo();
    })();
  }, [google.perfil]);

  const seguirSinCuenta = async () => {
    await entrarComoInvitado();
    onListo();
  };

  const aviso = mensajeError(google.error);

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <SafeAreaView style={s.contenido}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
          <TituloMascara texto="Tu cuenta" estilo={s.titulo} activo />
          <Entrada activo retraso={T_SUBTITULO} y={8}>
            <Text style={s.subtitulo}>
              Con Google no escribes tu nombre ni tu correo: quedan listos solos. Es lo único que hace hoy.
            </Text>
          </Entrada>

          <Entrada activo retraso={T_TARJETA} y={DESPLAZAMIENTO_TARJETA} resorte={resorteMagnesia} estilo={s.tarjeta}>
            <TarjetaGoma relleno={esp.md + 4}>
              <Text style={s.encabezado}>Qué guardamos</Text>
              <Punto icono="telefono" n={0}>
                <Text style={s.punto}>Tu nombre y tu correo, solo en este teléfono.</Text>
              </Punto>
              <Punto icono="lista" n={1}>
                <Text style={s.punto}>Tu rutina, tu historial y tus medidas.</Text>
              </Punto>
              <Punto icono="exportar" n={2}>
                <Text style={s.punto}>
                  Todo vive en este teléfono. Para pasarlo a otro, usa "
                  <Text style={s.puntoEnfasis}>Exportar mi progreso</Text>" en Ajustes.
                </Text>
              </Punto>
            </TarjetaGoma>
          </Entrada>

          {aviso && <TextoError texto={aviso} />}

          <Entrada activo retraso={T_BOTONES} y={8} estilo={s.botones}>
            {google.disponible && (
              <BotonGoogle
                texto="Continuar con Google"
                textoOcupado="Abriendo Google..."
                ocupado={google.cargando}
                onPress={google.iniciar}
              />
            )}
            {google.disponible ? (
              <BotonSecundario texto="Entrar sin cuenta" onPress={seguirSinCuenta} deshabilitado={google.cargando} />
            ) : (
              <BotonPlaca texto="Empezar" onPress={seguirSinCuenta} deshabilitado={google.cargando} />
            )}
            <Text style={s.nota}>Puedes vincular o borrar tu cuenta cuando quieras, desde Ajustes.</Text>
          </Entrada>

          <Entrada activo retraso={T_BOTONES + 100} y={8} estilo={s.legal}>
            <View style={s.legalFila}>
              <Text style={s.legalTexto}>Al continuar aceptas los</Text>
              <Enlace texto="Términos" url={URL_TERMINOS} />
              <Text style={s.legalTexto}>y el</Text>
              <Enlace texto="Aviso de privacidad" url={URL_PRIVACIDAD} />
              <Text style={s.legalTexto}>.</Text>
            </View>
            <Text style={s.legalTexto}>DARENOW no sustituye consejo médico. Para mayores de 18 años.</Text>
          </Entrada>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Punto({ icono, n, children }: { icono: NombreIcono; n: number; children: React.ReactNode }) {
  const retraso = T_PUNTOS + n * ESCALONADO_PUNTOS_MS;
  return (
    <Entrada activo retraso={retraso} y={8}>
      <View style={s.filaPunto}>
        <IconoTrazo nombre={icono} activo retraso={retraso + T_ICONO_EXTRA} />
        <View style={s.textoPunto}>{children}</View>
      </View>
    </Entrada>
  );
}

/** Error de Google: rojo legible, una sacudida de 6 px (2 ciclos, 240 ms) y haptica de error. */
function TextoError({ texto }: { texto: string }) {
  const reducido = useReducedMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    haptico.error();
    if (reducido) return;
    x.value = withSequence(
      withTiming(AMPLITUD_SACUDIDA, { duration: 40 }), withTiming(-AMPLITUD_SACUDIDA, { duration: 80 }),
      withTiming(AMPLITUD_SACUDIDA, { duration: 80 }), withTiming(0, { duration: 40 }),
    );
  }, [texto]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.Text style={[s.error, estilo]} accessibilityRole="alert" accessibilityLiveRegion="polite">{texto}</Animated.Text>
  );
}

function Enlace({ texto, url }: { texto: string; url: string }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)} hitSlop={4} style={s.enlace}
      accessibilityRole="link" accessibilityLabel={texto}
    >
      <Text style={s.enlaceTexto}>{texto}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  contenido: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.lg, paddingBottom: esp.md },
  titulo: { ...tipo.display, color: paleta.magnesia },
  subtitulo: { ...tipo.cuerpo, color: paleta.magnesia2, marginTop: esp.sm },
  tarjeta: { marginTop: esp.lg },
  encabezado: { ...tipo.h2, color: paleta.magnesia, marginBottom: esp.sm },
  filaPunto: { flexDirection: 'row', alignItems: 'flex-start', gap: esp.sm + 4, marginTop: esp.sm },
  textoPunto: { flex: 1 },
  punto: { ...tipo.cuerpo, color: paleta.magnesia },
  puntoEnfasis: { fontFamily: familia.enfasis, color: paleta.magnesia },
  error: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.placaRojaTexto, marginTop: esp.md },
  botones: { gap: esp.sm + 4, marginTop: esp.lg },
  nota: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  legal: { marginTop: esp.md },
  legalFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  legalTexto: { fontFamily: familia.cuerpo, fontSize: 12, lineHeight: 18, color: paleta.magnesia3Texto },
  enlace: { minHeight: AREA_TACTIL_MIN, justifyContent: 'center', paddingHorizontal: 4 },
  enlaceTexto: { fontFamily: familia.cuerpo, fontSize: 12, lineHeight: 18, color: paleta.magnesia2, textDecorationLine: 'underline' },
});
