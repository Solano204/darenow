/* eslint-disable import/first -- preventAutoHideAsync va antes de importar las pantallas a proposito (ver abajo) */
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';

import { color, colorSesion, peso, resorteTap } from '@/ui/theme';
import { mantenerSplash, ocultarSplash, useSplashOculto } from '@/ui/hooks/useSplash';
import { useFuentes } from '@/ui/theme/fuentes';
import { ProveedorEstado, useCargandoEstado, useEstadoSel, hoy } from '@/state/store';
import { terminarOnboarding, marcarPresentacion } from '@/state/acciones';
import { ProveedorCuenta, useCuenta } from '@/state/cuenta';
import { ProveedorAnuncios } from '@/ui/components/RelojAnuncios';
import { ProveedorMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { Entrada } from '@/ui/fx/Entrada';
import { TabBarGoma } from '@/ui/components/TabBarGoma';
import { mark as perfMark } from '@/dev/perfMarks'; // perf:R1

// El splash nativo se queda hasta que la primera pantalla con datos hace su
// layout (ver useSplash): ni texto esperando fuente, ni spinner, ni fondo vacio.
mantenerSplash();

import Bienvenida from '@/features/hoy/screens/Bienvenida';
import Hoy from '@/features/hoy/screens/Hoy';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Tema de navegacion. React Navigation pinta el fondo de la pantalla que
 * entra con este tema mientras corre la transicion: tiene que coincidir con
 * `color.fondo` o se ve un destello.
 */
const tema = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: color.fondo,
    card: color.fondo,
    text: color.texto,
    border: color.borde,
    primary: color.texto,
  },
};

/*
 * Pantallas perezosas (R3): `getComponent` con `require` adentro. Metro solo evalua el modulo de
 * una pantalla la primera vez que se abre; al arrancar se evaluan Hoy, Bienvenida y lo que usan.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

function Pestanas() {
  // La entrada de Hoy empieza cuando el splash ya se fue, no debajo de el.
  const splashOculto = useSplashOculto();
  return (
    <Entrada activo={splashOculto} escala={1.02} resorte={resorteTap} estilo={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={props => <TabBarGoma {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          sceneStyle: { backgroundColor: color.fondo },
          // Una pestaña que no se ve no se vuelve a dibujar hasta que regresas (R3).
          freezeOnBlur: true,
        }}
      >
        <Tab.Screen name="Hoy" component={Hoy} />
        <Tab.Screen name="Explorar" getComponent={() => require('@/features/explorar/screens/Explorar').default} />
        <Tab.Screen name="Aprender" getComponent={() => require('@/features/aprender/screens/Aprender').default} />
        <Tab.Screen name="Yo" getComponent={() => require('@/features/perfil/screens/Yo').default} />
      </Tab.Navigator>
    </Entrada>
  );
}

/** Pantallas que ya traen su propia entrada o su propia transicion: no llevan la de escala. */
const SIN_ENTRADA = new Set(['Bienvenida', 'Tabs', 'Reproductor', 'Resumen', 'EditorRutina', 'Ejercicio', 'Rutina', 'RutinaPropia', 'Programa', 'Musculo', 'Tip', 'Mito', 'Retos', 'Mediciones', 'Historial', 'Ajustes']);

/**
 * Mientras se lee el estado guardado el splash sigue arriba (el spinner solo se ve si esa lectura
 * pasa del respaldo de useSplash). La primera pantalla con datos, al hacer su layout, oculta el
 * splash.
 */
function Raiz() {
  const cargando = useCargandoEstado();
  const { cargando: cargandoCuenta } = useCuenta();

  if (cargando || cargandoCuenta) {
    return (
      <View style={s.cargando}>
        <ActivityIndicator color={color.texto} />
      </View>
    );
  }

  return (
    <View style={s.llena} onLayout={ocultarSplash}>
      <Pantallas />
    </View>
  );
}

/** La primera pantalla que toca, segun el estado guardado (docs/FUNCIONALIDAD.md §2). */
function Pantallas() {
  // Solo lo que decide la primera pantalla: un favorito o una sesion no re-renderizan la raiz.
  const presentacionVista = useEstadoSel(e => e.presentacionVista);
  const onboardingHecho = useEstadoSel(e => e.onboardingHecho);
  const bienvenidaVista = useEstadoSel(e => e.bienvenidaVista);
  const { cuenta } = useCuenta();

  // La primera vez de todas: intro animada, y despues el onboarding.
  if (!presentacionVista) {
    const Presentacion = require('@/features/onboarding/screens/Presentacion').default;
    return <Presentacion onTerminar={marcarPresentacion} />;
  }

  // Puerta de cuenta: Google o invitado. Se ve una sola vez.
  if (!cuenta) {
    const Acceso = require('@/features/cuenta/screens/Acceso').default;
    return <Acceso onListo={() => {}} />;
  }

  if (!onboardingHecho) {
    const Onboarding = require('@/features/onboarding/screens/Onboarding').default;
    return <Onboarding onTerminar={terminarOnboarding} />;
  }

  // La bienvenida se muestra una vez al dia. Si ya se vio hoy, se entra
  // directo a las pestanas.
  const inicial = bienvenidaVista === hoy() ? 'Tabs' : 'Bienvenida';

  return (
    <Stack.Navigator
      initialRouteName={inicial}
      screenLayout={({ route, children }) => (
        SIN_ENTRADA.has(route.name)
          ? <>{children}</>
          : <Entrada activo escala={0.98} resorte={resorteTap} estilo={{ flex: 1 }}>{children}</Entrada>
      )}
      screenOptions={{
        headerStyle: { backgroundColor: color.fondo },
        headerTitleStyle: { color: color.texto, fontSize: 16, fontFamily: peso.semibold },
        headerTintColor: color.texto,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: color.fondo },
        animation: 'fade',
        // La pantalla de abajo no se redibuja mientras hay otra encima (R3). Excepcion: Reproductor.
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen name="Bienvenida" component={Bienvenida}
        options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="Tabs" component={Pestanas}
        options={{ headerShown: false, animation: 'fade' }} />

      <Stack.Screen name="Reproductor" getComponent={() => require('@/features/sesion/screens/Reproductor').default}
        options={{
          headerShown: false, gestureEnabled: false, animation: 'slide_from_bottom',
          // Sin congelar: su voz, vibracion y cronometro van por efectos que no deben detenerse.
          freezeOnBlur: false,
          // Unica pantalla que sigue oscura: sin esto, el fondo claro de
          // contentStyle asoma un instante durante la transicion de entrada.
          contentStyle: { backgroundColor: colorSesion.fondo },
        }} />
      <Stack.Screen name="Resumen" getComponent={() => require('@/features/sesion/screens/Resumen').default}
        options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />

      <Stack.Screen name="Ejercicio" getComponent={() => require('@/features/ejercicio/screens/DetalleEjercicio').default} options={{ headerShown: false }} />
      <Stack.Screen name="Musculo" getComponent={() => require('@/features/musculos/screens/DetalleMusculo').default} options={{ headerShown: false }} />
      <Stack.Screen name="Rutina" getComponent={() => require('@/features/rutinas/screens/DetalleRutina').default} options={{ headerShown: false }} />
      <Stack.Screen name="RutinaPropia" getComponent={() => require('@/features/rutinas/screens/RutinaPropia').default} options={{ headerShown: false }} />
      <Stack.Screen name="EditorRutina" getComponent={() => require('@/features/rutinas/screens/EditorRutina').default}
        options={{ title: '', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Programa" getComponent={() => require('@/features/programas/screens/DetallePrograma').default} options={{ headerShown: false }} />
      <Stack.Screen name="Tip" getComponent={() => require('@/features/aprender/screens/DetalleTip').default} options={{ headerShown: false }} />
      <Stack.Screen name="Mito" getComponent={() => require('@/features/aprender/screens/DetalleMito').default} options={{ headerShown: false }} />

      <Stack.Screen name="Favoritos" getComponent={() => require('@/features/perfil/screens/Favoritos').default} options={{ title: 'Favoritos' }} />
      <Stack.Screen name="Logros" getComponent={() => require('@/features/perfil/screens/Yo').Logros} options={{ title: 'Logros' }} />
      <Stack.Screen name="Retos" getComponent={() => require('@/features/perfil/screens/Retos').default} options={{ headerShown: false }} />
      <Stack.Screen name="Mediciones" getComponent={() => require('@/features/perfil/screens/Mediciones').default} options={{ headerShown: false }} />
      <Stack.Screen name="Historial" getComponent={() => require('@/features/perfil/screens/Historial').default} options={{ headerShown: false }} />
      <Stack.Screen name="Ajustes" getComponent={() => require('@/features/ajustes/screens/Ajustes').default} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

/* eslint-enable @typescript-eslint/no-require-imports */

export default function App() {
  perfMark('app-render'); // perf:R1
  // Android: fuentes incrustadas en el APK, ya estan (fuentes.android.ts). iOS: se cargan aqui.
  const [fontsLoaded, fontError] = useFuentes();

  useEffect(() => {
    // Con exito O con error se sigue: si la carga falla, `tipo` cae a la
    // fuente del sistema (RN no revienta) y la app no se queda esperando.
    if (fontsLoaded || fontError) perfMark('fonts-ready'); // perf:R1
  }, [fontsLoaded, fontError]);

  // Barra de gestos de Android oculta: la app ocupa la pantalla completa.
  // El sistema la deja volver con un swipe desde el borde (comportamiento
  // por defecto de Android al ocultarla), no desaparece para siempre.
  // Solo Android: iOS no expone esto a una app normal.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setHidden(true);
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider style={{ backgroundColor: color.fondo }}>
      {/* ProveedorEstado lee el progreso guardado; ProveedorCuenta, la cuenta. Las dos lecturas
          van en un solo multiGet (storage/lecturaInicial.ts). */}
      <ProveedorEstado>
      <ProveedorCuenta>
        <NavigationContainer theme={tema}>
          <StatusBar style="light" />
          {/* El reloj de anuncios envuelve toda la app: un intersticial cada
              10 minutos, en cualquier pantalla salvo mientras se entrena. */}
          <ProveedorAnuncios>
            <ProveedorMagnesia>
              <Raiz />
            </ProveedorMagnesia>
          </ProveedorAnuncios>
        </NavigationContainer>
      </ProveedorCuenta>
      </ProveedorEstado>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.fondo },
  llena: { flex: 1 },
});
