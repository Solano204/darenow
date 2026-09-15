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
 *
 * Ubicacion: src/screens/Acceso.tsx
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { color, tipo, esp, radio, peso, degradado } from '../theme';
import { Boton, Aparece, Nota } from '../components/ui';
import { useGoogleSignIn, mensajeError } from '../store/googleAuth';
import { useCuenta } from '../store/cuenta';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: esp.md, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Aparece>
          <Text style={[tipo.display, { color: color.texto }]}>Tu cuenta</Text>
          <Text style={[tipo.cuerpo, { color: color.textoSuave, marginTop: esp.sm }]}>
            Sirve para guardar tu progreso y recuperarlo si reinstalas la app.
          </Text>
        </Aparece>

        <Aparece retraso={120}>
          <LinearGradient colors={degradado.paso} style={s.tarjeta}>
            <Text style={[tipo.micro, { color: color.textoTenue }]}>QUÉ GUARDAMOS</Text>
            <Punto texto="Tu nombre y tu correo, solo en este teléfono." />
            <Punto texto="Tu rutina, tu historial y tus medidas." />
            <Punto texto="Nada se envía a ningún servidor nuestro." />
          </LinearGradient>
        </Aparece>

        {aviso && (
          <Aparece retraso={160}>
            <Nota texto={aviso} tono="cuidado" />
          </Aparece>
        )}

        <Aparece retraso={220}>
          {google.disponible && (
            <Boton
              texto="Continuar con Google"
              onPress={google.iniciar}
              ocupado={google.cargando}
              textoOcupado="Abriendo Google..."
              ancho
              estilo={{ marginTop: esp.lg }}
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
  tarjeta: {
    marginTop: esp.lg,
    padding: esp.md,
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderColor: color.borde,
    gap: esp.sm,
  },
  punto: { flexDirection: 'row', alignItems: 'flex-start', gap: esp.sm, marginTop: esp.xs },
  vineta: {
    width: 6, height: 6, borderRadius: 3, marginTop: 8,
    backgroundColor: color.carbon,
  },
});