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
import { ProveedorEstado, useEstado, hoy } from '@/state/store';
import { ProveedorCuenta, useCuenta } from '@/state/cuenta';
import { ProveedorAnuncios } from '@/ui/components/RelojAnuncios';
import { ProveedorMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { Entrada } from '@/ui/fx/Entrada';
import { TabBarGoma } from '@/ui/components/TabBarGoma';
import { mark as perfMark } from '@/dev/perfMarks'; // perf:R1

// El splash nativo se queda hasta que la primera pantalla con datos hace su
// layout (ver useSplash): ni texto esperando fuente, ni spinner, ni fondo vacio.
mantenerSplash();

import Presentacion from '@/features/onboarding/screens/Presentacion';
import Acceso from '@/features/cuenta/screens/Acceso';
import Bienvenida from '@/features/hoy/screens/Bienvenida';
import Onboarding from '@/features/onboarding/screens/Onboarding';
import Hoy from '@/features/hoy/screens/Hoy';
import Explorar from '@/features/explorar/screens/Explorar';
import Aprender from '@/features/aprender/screens/Aprender';
import DetalleTip from '@/features/aprender/screens/DetalleTip';
import DetalleMito from '@/features/aprender/screens/DetalleMito';
import Yo, { Logros } from '@/features/perfil/screens/Yo';
import Ajustes from '@/features/ajustes/screens/Ajustes';
import Retos from '@/features/perfil/screens/Retos';
import Mediciones from '@/features/perfil/screens/Mediciones';
import Historial from '@/features/perfil/screens/Historial';
import Favoritos from '@/features/perfil/screens/Favoritos';
import EditorRutina from '@/features/rutinas/screens/EditorRutina';
import RutinaPropia from '@/features/rutinas/screens/RutinaPropia';
import Reproductor from '@/features/sesion/screens/Reproductor';
import Resumen from '@/features/sesion/screens/Resumen';
import DetalleEjercicio from '@/features/ejercicio/screens/DetalleEjercicio';
import DetalleRutina from '@/features/rutinas/screens/DetalleRutina';
import DetallePrograma from '@/features/programas/screens/DetallePrograma';
import DetalleMusculo from '@/features/musculos/screens/DetalleMusculo';

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
        }}
      >
        <Tab.Screen name="Hoy" component={Hoy} />
        <Tab.Screen name="Explorar" component={Explorar} />
        <Tab.Screen name="Aprender" component={Aprender} />
        <Tab.Screen name="Yo" component={Yo} />
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
  const { cargando } = useEstado();
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
  const { estado, terminarOnboarding, marcarPresentacion } = useEstado();
  const { cuenta } = useCuenta();

  // La primera vez de todas: intro animada, y despues el onboarding.
  if (!estado.presentacionVista) {
    return <Presentacion onTerminar={marcarPresentacion} />;
  }

  // Puerta de cuenta: Google o invitado. Se ve una sola vez.
  if (!cuenta) {
    return <Acceso onListo={() => {}} />;
  }

  if (!estado.onboardingHecho) {
    return <Onboarding onTerminar={terminarOnboarding} />;
  }

  // La bienvenida se muestra una vez al dia. Si ya se vio hoy, se entra
  // directo a las pestanas.
  const inicial = estado.bienvenidaVista === hoy() ? 'Tabs' : 'Bienvenida';

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
      }}
    >
      <Stack.Screen name="Bienvenida" component={Bienvenida}
        options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="Tabs" component={Pestanas}
        options={{ headerShown: false, animation: 'fade' }} />

      <Stack.Screen name="Reproductor" component={Reproductor}
        options={{
          headerShown: false, gestureEnabled: false, animation: 'slide_from_bottom',
          // Unica pantalla que sigue oscura: sin esto, el fondo claro de
          // contentStyle asoma un instante durante la transicion de entrada.
          contentStyle: { backgroundColor: colorSesion.fondo },
        }} />
      <Stack.Screen name="Resumen" component={Resumen}
        options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />

      <Stack.Screen name="Ejercicio" component={DetalleEjercicio} options={{ headerShown: false }} />
      <Stack.Screen name="Musculo" component={DetalleMusculo} options={{ headerShown: false }} />
      <Stack.Screen name="Rutina" component={DetalleRutina} options={{ headerShown: false }} />
      <Stack.Screen name="RutinaPropia" component={RutinaPropia} options={{ headerShown: false }} />
      <Stack.Screen name="EditorRutina" component={EditorRutina}
        options={{ title: '', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Programa" component={DetallePrograma} options={{ headerShown: false }} />
      <Stack.Screen name="Tip" component={DetalleTip} options={{ headerShown: false }} />
      <Stack.Screen name="Mito" component={DetalleMito} options={{ headerShown: false }} />

      <Stack.Screen name="Favoritos" component={Favoritos} options={{ title: 'Favoritos' }} />
      <Stack.Screen name="Logros" component={Logros} options={{ title: 'Logros' }} />
      <Stack.Screen name="Retos" component={Retos} options={{ headerShown: false }} />
      <Stack.Screen name="Mediciones" component={Mediciones} options={{ headerShown: false }} />
      <Stack.Screen name="Historial" component={Historial} options={{ headerShown: false }} />
      <Stack.Screen name="Ajustes" component={Ajustes} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

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
      {/* Estado (progreso) por fuera de Cuenta: borrarTodosLosDatos() vive en
          cuenta.ts y necesita poder resetear el progreso ademas de la
          cuenta, asi que ProveedorCuenta tiene que quedar DENTRO de
          ProveedorEstado para poder usar useEstado(). */}
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
