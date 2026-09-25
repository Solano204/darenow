import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { BigShouldersDisplay_700Bold, BigShouldersDisplay_800ExtraBold } from '@expo-google-fonts/big-shoulders-display';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';

import { color, colorSesion, tipo, anim, peso } from './src/theme';
import { ProveedorEstado, useEstado, hoy } from './src/store/store';
import { ProveedorCuenta, useCuenta } from './src/store/cuenta';
import { ProveedorAnuncios } from './src/components/RelojAnuncios';
import { ProveedorMagnesia } from './src/components/fx/MagnesiaOverlay';
import { Entrada } from './src/components/fx/Entrada';
import { resorteTap } from './src/theme';

// Se queda visible hasta que las fuentes resuelvan (cargadas o no): nada
// de texto invisible esperando fuente, ni un flash de la fuente del
// sistema antes de que llegue la propia.
SplashScreen.preventAutoHideAsync().catch(() => {});

import Presentacion from './src/screens/Presentacion';
import Acceso from './src/screens/Acceso';
import Bienvenida from './src/screens/Bienvenida';
import Onboarding from './src/screens/Onboarding';
import Hoy from './src/screens/Hoy';
import Explorar from './src/screens/Explorar';
import Aprender, { DetalleTip, DetalleMito } from './src/screens/Aprender';
import Yo, { Logros, Retos, Mediciones, Historial, Ajustes } from './src/screens/Yo';
import Favoritos from './src/screens/Favoritos';
import EditorRutina from './src/screens/EditorRutina';
import RutinaPropia from './src/screens/RutinaPropia';
import Reproductor from './src/screens/Reproductor';
import Resumen from './src/screens/Resumen';
import {
  DetalleEjercicio, DetalleMusculo, DetalleRutina, DetallePrograma,
} from './src/screens/Detalles';

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

/**
 * Icono de pestana.
 *
 * Iconos reales de `@expo/vector-icons` (Ionicons): casa, brujula, libro y
 * persona no se leen bien como glifo de texto plano en todos los telefonos.
 * Relleno cuando esta activo, contorno cuando no; la pastilla de brasa
 * prende detras. El icono mismo no salta ni escala: un salto en la barra
 * de pestanas es el tic mas comun de app generica.
 */
function Icono({ nombre, activo }: { nombre: keyof typeof Ionicons.glyphMap; activo: boolean }) {
  const v = useRef(new Animated.Value(activo ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: activo ? 1 : 0, duration: anim.rapida,
      easing: Easing.bezier(0.2, 0.7, 0.3, 1), useNativeDriver: true,
    }).start();
  }, [activo]);

  return (
    <View style={s.icono}>
      <Animated.View style={[
        s.pastillaActiva,
        {
          opacity: v,
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        },
      ]} />
      <Ionicons name={nombre} size={20} color={activo ? color.texto : color.textoTenue} />
    </View>
  );
}

/**
 * Fondo de la barra de pestanas.
 *
 * Solida, no transparente y ya no flotante (pedido explicito): toca el
 * borde de abajo, ocupa todo el ancho. `cremaHonda` es la superficie mas
 * elevada del tema, la misma de hojas y modales.
 */
function FondoPestanas() {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: color.cremaHonda }]} />;
}

function Pestanas() {
  // Pegada al fondo, no flotante. La barra de gestos de Android tapaba
  // los iconos cuando la altura era fija, asi que el inset del telefono
  // se suma como padding de ABAJO (dentro de la barra), no como hueco
  // flotante: `Math.max(inset.bottom - 10, 0)` deja el icono a la misma
  // altura de siempre y solo agranda la barra hacia abajo lo que haga
  // falta. `useHuecoAbajo` (ui/superficies.tsx) usa este mismo calculo.
  const inset = useSafeAreaInsets();

  return (
    <Entrada activo escala={1.02} resorte={resorteTap} estilo={{ flex: 1 }}>
    <Tab.Navigator
      // sceneStyle: el contenedor de cada pestana. Sin esto queda blanco
      // por debajo y asoma un instante al cambiar de pestana.
      // sceneContainerStyle={{ backgroundColor: color.fondo }}
      screenOptions={{
        headerShown: false,
        // Sin esto el cambio de pestana es un corte seco. 'fade' es sutil
        // a proposito: la pestana no es una pantalla nueva, es la misma
        // app mirando otro lado.
        animation: 'fade',
        sceneStyle: { backgroundColor: color.fondo },
        tabBarActiveTintColor: color.texto,
        tabBarInactiveTintColor: color.textoTenue,
        tabBarStyle: {
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: 68 + Math.max(inset.bottom - 10, 0),
          borderTopWidth: 1, borderTopColor: color.borde, borderRadius: 0,
          backgroundColor: 'transparent', elevation: 0,
          paddingTop: 10, paddingBottom: Math.max(inset.bottom, 10),
        },
        tabBarBackground: () => <FondoPestanas />,
        tabBarLabelStyle: { fontSize: 11, fontFamily: peso.bold, marginTop: 2 },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tab.Screen name="Hoy" component={Hoy}
        options={{ tabBarIcon: ({ focused }) => <Icono nombre={focused ? 'home' : 'home-outline'} activo={focused} /> }} />
      <Tab.Screen name="Explorar" component={Explorar}
        options={{ tabBarIcon: ({ focused }) => <Icono nombre={focused ? 'compass' : 'compass-outline'} activo={focused} /> }} />
      <Tab.Screen name="Aprender" component={Aprender}
        options={{ tabBarIcon: ({ focused }) => <Icono nombre={focused ? 'book' : 'book-outline'} activo={focused} /> }} />
      <Tab.Screen name="Yo" component={Yo}
        options={{ tabBarIcon: ({ focused }) => <Icono nombre={focused ? 'person' : 'person-outline'} activo={focused} /> }} />
    </Tab.Navigator>
    </Entrada>
  );
}

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
      screenOptions={{
        headerStyle: { backgroundColor: color.fondo },
        headerTitleStyle: { color: color.texto, fontSize: 16, fontFamily: peso.semibold },
        headerTintColor: color.texto,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: color.fondo },
        animation: 'slide_from_right',
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

      <Stack.Screen name="Ejercicio" component={DetalleEjercicio} options={{ title: '' }} />
      <Stack.Screen name="Musculo" component={DetalleMusculo} options={{ title: '' }} />
      <Stack.Screen name="Rutina" component={DetalleRutina} options={{ title: '' }} />
      <Stack.Screen name="RutinaPropia" component={RutinaPropia} options={{ title: '' }} />
      <Stack.Screen name="EditorRutina" component={EditorRutina}
        options={{ title: '', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Programa" component={DetallePrograma} options={{ title: '' }} />
      <Stack.Screen name="Tip" component={DetalleTip} options={{ title: '' }} />
      <Stack.Screen name="Mito" component={DetalleMito} options={{ title: '' }} />

      <Stack.Screen name="Favoritos" component={Favoritos} options={{ title: 'Favoritos' }} />
      <Stack.Screen name="Logros" component={Logros} options={{ title: 'Logros' }} />
      <Stack.Screen name="Retos" component={Retos} options={{ title: 'Retos' }} />
      <Stack.Screen name="Mediciones" component={Mediciones} options={{ title: 'Mediciones' }} />
      <Stack.Screen name="Historial" component={Historial} options={{ title: 'Historial' }} />
      <Stack.Screen name="Ajustes" component={Ajustes} options={{ title: 'Ajustes' }} />
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
  icono: { width: 54, height: 30, alignItems: 'center', justifyContent: 'center' },
  pastillaActiva: {
    position: 'absolute', width: 54, height: 30, borderRadius: 15,
    backgroundColor: color.acentoTinte,
    borderWidth: 1, borderColor: color.acentoBorde,
  },
});
