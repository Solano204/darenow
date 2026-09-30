/**
 * R4 · monta una pantalla real con los mismos providers que App.tsx, dentro de un Stack de
 * React Navigation, con un estado guardado de ejemplo (onboarding hecho, sesiones, favoritos).
 */
import React from 'react';
import { jest } from '@jest/globals';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProveedorEstado, useCargandoEstado } from '@/state/store';
import { useTienda } from '@/state/tienda';
import { ProveedorCuenta } from '@/state/cuenta';
import { ProveedorAnuncios } from '@/ui/components/RelojAnuncios';
import { ProveedorMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { CLAVE_CUENTA, CLAVE_ESTADO } from '@/storage/claves';
import { ESTADO_INICIAL, PERFIL_INICIAL } from '@/state/estadoInicial';
import { EJERCICIOS } from '@/data/catalog';
import type { Estado } from '@/state/tipos';

const METRICAS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

/** Estado guardado de un usuario con algunas semanas de uso. */
export function estadoDeEjemplo(): Estado {
  const sesiones = Array.from({ length: 40 }, (_, i) => {
    const d = new Date(Date.now() - i * 2 * 86400000).toISOString().slice(0, 10);
    return {
      id: `s${i}`, fecha: d, iniciada: d, duracionS: 1500, rutinaId: 'rt_001', programaId: null,
      estado: 'completada' as const, kcal: 120, rpe: 6, motivoAbandono: null,
      series: EJERCICIOS.slice(i % 20, (i % 20) + 4).map((e, n) => ({
        ejercicioId: e.id, serieNum: n + 1, lado: null, reps: 10, segundos: null, pesoKg: null, omitida: false,
      })),
    };
  }).reverse();
  return {
    ...ESTADO_INICIAL,
    presentacionVista: true, onboardingHecho: true, bienvenidaVista: new Date().toISOString().slice(0, 10),
    perfil: { ...PERFIL_INICIAL, nombre: 'Ana' },
    favoritos: { ...ESTADO_INICIAL.favoritos, ejercicios: EJERCICIOS.slice(0, 3).map(e => e.id) },
    sesiones,
    racha: { dias: 4, mejor: 9, ultimoDia: sesiones[sesiones.length - 1].fecha, graciaUsada: 0, mesGracia: null, enPausa: false },
  };
}

const Stack = createNativeStackNavigator();

/** Como `Raiz` en App.tsx: nada se dibuja hasta leer lo guardado. */
function Compuerta({ children }: { children: React.ReactNode }) {
  return useCargandoEstado() ? null : <>{children}</>;
}

export async function montar(
  Pantalla: React.ComponentType<never>, params: object = {}, estado: Estado = estadoDeEjemplo(),
): Promise<ReactTestRenderer> {
  await AsyncStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado));
  await AsyncStorage.setItem(CLAVE_CUENTA, JSON.stringify({ id: 'inv_1', proveedor: 'invitado', nombre: 'Ana' }));
  // La tienda es un modulo: cada montaje empieza como al abrir la app.
  useTienda.setState({ estado: ESTADO_INICIAL, cargando: true });
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(
      <SafeAreaProvider initialMetrics={METRICAS}>
        <ProveedorEstado>
          <ProveedorCuenta>
            <ProveedorAnuncios>
              <ProveedorMagnesia>
                <Compuerta>
                <NavigationContainer>
                  <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Prueba" component={Pantalla as React.ComponentType} initialParams={params} />
                  </Stack.Navigator>
                </NavigationContainer>
                </Compuerta>
              </ProveedorMagnesia>
            </ProveedorAnuncios>
          </ProveedorCuenta>
        </ProveedorEstado>
      </SafeAreaProvider>,
    );
  });
  // Deja correr las lecturas de AsyncStorage y los efectos del montaje.
  for (let i = 0; i < 5; i++) await esperar(10);
  return r;
}

/** Toca el primer elemento que cumpla `cond` (un Pressable/Tocable con onPress). */
export async function tocar(r: ReactTestRenderer, cond: (p: Record<string, unknown>) => boolean) {
  const n = r.root.find(x => typeof x.props.onPress === 'function' && cond(x.props));
  await act(async () => { n.props.onPress(); });
}

let relojFalso = false;
/** Reloj falso de Jest (el reproductor): `esperar` avanza el reloj en vez de esperar de verdad. */
export function usarRelojFalso(si: boolean) {
  relojFalso = si;
  if (si) jest.useFakeTimers(); else jest.useRealTimers();
}

/** Deja que corran timers y efectos pendientes. */
export async function esperar(ms = 50) {
  if (relojFalso) {
    await act(async () => { await jest.advanceTimersByTimeAsync(ms); });
    return;
  }
  await act(async () => { await new Promise(res => setTimeout(res, ms)); });
}
