import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';
import { useFonts } from 'expo-font';
import { BigShouldersDisplay_700Bold, BigShouldersDisplay_800ExtraBold } from '@expo-google-fonts/big-shoulders-display';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';

import { color, colorSesion, peso } from '@/ui/theme';
import { ProveedorEstado, useEstado, hoy } from '@/state/store';
import { ProveedorCuenta, useCuenta } from '@/state/cuenta';
import { ProveedorAnuncios } from '@/ui/components/RelojAnuncios';
import { ProveedorMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { Entrada } from '@/ui/fx/Entrada';
import { TabBarGoma } from '@/ui/components/TabBarGoma';
import { resorteTap } from '@/ui/theme';
import { mark as perfMark } from '@/dev/perfMarks'; // perf:R1

// Se queda visible hasta que las fuentes resuelvan (cargadas o no): nada
// de texto invisible esperando fuente, ni un flash de la fuente del
// sistema antes de que llegue la propia.
SplashScreen.preventAutoHideAsync().catch(() => {});

import Presentacion from '@/screens/Presentacion';
import Acceso from '@/features/cuenta/screens/Acceso';
import Bienvenida from '@/features/hoy/screens/Bienvenida';
import Onboarding from '@/screens/Onboarding';
import Hoy from '@/features/hoy/screens/Hoy';
import Explorar from '@/features/explorar/screens/Explorar';
import Aprender from '@/screens/Aprender';
import DetalleTip from '@/screens/DetalleTip';
import DetalleMito from '@/screens/DetalleMito';
import Yo, { Logros } from '@/screens/Yo';
import Ajustes from '@/screens/Ajustes';
import Retos from '@/screens/Retos';
import Mediciones from '@/screens/Mediciones';
import Historial from '@/screens/Historial';
import Favoritos from '@/screens/Favoritos';
import EditorRutina from '@/screens/EditorRutina';
import RutinaPropia from '@/screens/RutinaPropia';
import Reproductor from '@/screens/Reproductor';
import Resumen from '@/screens/Resumen';
import DetalleEjercicio from '@/features/ejercicio/screens/DetalleEjercicio';
import DetalleRutina from '@/screens/DetalleRutina';
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
  return (
    <Entrada activo escala={1.02} resorte={resorteTap} estilo={{ flex: 1 }}>
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

function Raiz() {
  const { estado, cargando, terminarOnboarding, marcarPresentacion } = useEstado();
  const { cuenta, cargando: cargandoCuenta } = useCuenta();

  if (cargando || cargandoCuenta) {
    return (
      <View style={s.cargando}>
        <ActivityIndicator color={color.texto} />
      </View>
    );
  }

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
  const [fontsLoaded, fontError] = useFonts({
    BigShouldersDisplay_700Bold, BigShouldersDisplay_800ExtraBold,
    Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold,
  });

  useEffect(() => {
    // Se oculta con exito O con error: si la carga falla, `tipo` sigue
    // renderizando (fontFamily desconocida cae a la fuente del sistema
    // sola, RN no revienta), pero la app no se queda en el splash para
    // siempre esperando algo que no va a llegar.
    if (fontsLoaded || fontError) perfMark('fonts-ready'); // perf:R1
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
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
});
