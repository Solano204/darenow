/**
 * FORJA · pantalla de acceso
 *
 * Puerta que aparece una sola vez, entre la presentacion y el onboarding.
 * Dos caminos, a proposito:
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
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { color, tipo, esp, MARGEN_PANTALLA } from '../theme';
import { Boton, Aparece, Nota } from '../components/ui';
import { TarjetaGoma } from '../components/ui/TarjetaGoma';
import { GomaTexture } from '../components/fx/GomaTexture';
import { useGoogleSignIn, mensajeError } from '../store/googleAuth';
import { useCuenta } from '../store/cuenta';
import { URL_PRIVACIDAD, URL_TERMINOS } from '../legal';

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
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
    <GomaTexture />
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: MARGEN_PANTALLA, paddingVertical: esp.md, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Aparece>
          <Text style={[tipo.display, { color: color.texto }]}>Tu cuenta</Text>
          <Text style={[tipo.cuerpo, { color: color.textoSuave, marginTop: esp.sm }]}>
            Con Google no escribes tu nombre ni tu correo: quedan listos solos. Es lo único que hace hoy.
          </Text>
        </Aparece>

        <Aparece retraso={120}>
          <TarjetaGoma estilo={s.tarjeta} relleno={esp.md}>
            <View style={{ gap: esp.sm }}>
            <Text style={[tipo.micro, { color: color.textoTenue }]}>Qué guardamos</Text>
            <Punto texto="Tu nombre y tu correo, solo en este teléfono." />
            <Punto texto="Tu rutina, tu historial y tus medidas." />
            <Punto texto='Todo vive en este teléfono. Para pasarlo a otro, usa "Exportar mi progreso" en Ajustes.' />
            </View>
          </TarjetaGoma>
        </Aparece>

        {aviso && (
          <Aparece retraso={160}>
            <Nota texto={aviso} tono="cuidado" />
          </Aparece>
        )}

        <Aparece retraso={220}>
          <Text style={[tipo.pie, { color: color.textoTenue, textAlign: 'center', marginTop: esp.lg }]}>
            Al continuar aceptas los{' '}
            <Text style={s.enlace} onPress={() => Linking.openURL(URL_TERMINOS)}>Términos</Text>
            {' '}y el{' '}
            <Text style={s.enlace} onPress={() => Linking.openURL(URL_PRIVACIDAD)}>Aviso de privacidad</Text>
            . DARENOW no sustituye consejo médico. Para mayores de 18 años.
          </Text>

          {google.disponible && (
            <Boton
              texto="Continuar con Google"
              onPress={google.iniciar}
              ocupado={google.cargando}
              textoOcupado="Abriendo Google..."
              ancho
              estilo={{ marginTop: esp.md }}
            />
          )}

          <Boton
            texto={google.disponible ? 'Entrar sin cuenta' : 'Empezar'}
            variante={google.disponible ? 'contorno' : 'principal'}
            onPress={seguirSinCuenta}
            deshabilitado={google.cargando}
            ancho
            estilo={{ marginTop: esp.sm }}
          />

          <Text style={[tipo.pie, { color: color.textoTenue, marginTop: esp.md, textAlign: 'center' }]}>
            Puedes vincular o borrar tu cuenta cuando quieras, desde Ajustes.
          </Text>
        </Aparece>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

function Punto({ texto }: { texto: string }) {
  return (
    <View style={s.punto}>
      <View style={s.vineta} />
      <Text style={[tipo.cuerpo, { color: color.texto, flex: 1 }]}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tarjeta: { marginTop: esp.lg },
  punto: { flexDirection: 'row', alignItems: 'flex-start', gap: esp.sm, marginTop: esp.xs },
  vineta: {
    width: 6, height: 6, borderRadius: 3, marginTop: 8,
    backgroundColor: color.carbon,
  },
  enlace: { color: color.texto, textDecorationLine: 'underline' },
});
