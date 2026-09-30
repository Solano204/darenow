/**
 * R6 · prueba de fugas (la parte que se puede medir sin telefono). Cada pantalla animada principal
 * se abre y se cierra 20 veces; al final no debe quedar vivo nada de lo que dejaron: temporizadores
 * ni intervalos, escuchas de AppState o del teclado, players de video. La memoria en si se mide en
 * el telefono (docs/perf/R6_REPORTE.md, §4).
 */
import { framesActivos, playersVideo } from './mocks';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act } from 'react-test-renderer';
import { AppState, Keyboard } from 'react-native';
import { montar, esperar, usarRelojFalso } from './montar';
import Hoy from '@/features/hoy/screens/Hoy';
import Bienvenida from '@/features/hoy/screens/Bienvenida';
import Explorar from '@/features/explorar/screens/Explorar';
import Aprender from '@/features/aprender/screens/Aprender';
import Yo from '@/features/perfil/screens/Yo';
import Ajustes from '@/features/ajustes/screens/Ajustes';
import DetalleEjercicio from '@/features/ejercicio/screens/DetalleEjercicio';
import DetalleRutina from '@/features/rutinas/screens/DetalleRutina';
import DetallePrograma from '@/features/programas/screens/DetallePrograma';
import { EJERCICIOS, PROGRAMAS, RUTINAS } from '@/data/catalog';

const CICLOS = 20;
/** Lo que habia vivo con la pantalla abierta: la prueba tiene que ver algo para que el cero valga. */
const vivos = { appState: 0, timers: 0 };

let escuchasAppState = 0;
let escuchasTeclado = 0;
beforeEach(() => {
  escuchasAppState = 0;
  escuchasTeclado = 0;
  // Suscripciones contadas (en Jest estas APIs ya son simuladas: no hay a quien pasarlas).
  jest.spyOn(AppState, 'addEventListener').mockImplementation((() => {
    escuchasAppState++;
    let viva = true;
    return { remove: () => { if (viva) { viva = false; escuchasAppState--; } } };
  }) as never);
  jest.spyOn(Keyboard, 'addListener').mockImplementation((() => {
    escuchasTeclado++;
    let viva = true;
    return { remove: () => { if (viva) { viva = false; escuchasTeclado--; } } };
  }) as never);
  usarRelojFalso(true);
});
afterEach(() => {
  usarRelojFalso(false);
  jest.restoreAllMocks();
});

const PANTALLAS: [string, React.ComponentType<never>, object][] = [
  ['Bienvenida', Bienvenida as never, {}],
  ['Hoy', Hoy as never, {}],
  ['Explorar', Explorar as never, {}],
  ['Aprender', Aprender as never, {}],
  ['Yo', Yo as never, {}],
  ['Ajustes', Ajustes as never, {}],
  ['Ficha de ejercicio', DetalleEjercicio as never, { id: EJERCICIOS[10].id }],
  ['Detalle de rutina', DetalleRutina as never, { id: RUTINAS[0].id }],
  ['Programa', DetallePrograma as never, { id: PROGRAMAS[0].id }],
];

describe('abrir y cerrar 20 veces no deja nada vivo', () => {
  for (const [nombre, Pantalla, params] of PANTALLAS) {
    it(nombre, async () => {
      for (let i = 0; i < CICLOS; i++) {
        const r = await montar(Pantalla, params);
        if (i === 0) vivos.timers = Math.max(vivos.timers, jest.getTimerCount());
        await esperar(1500);   // entradas, placas que caen, primer segundo de loops
        if (i === 0) vivos.appState = Math.max(vivos.appState, escuchasAppState);
        await act(async () => { r.unmount(); });
      }
      // Lo que quede programado para despues del desmontaje (el guardado agrupado de la tienda)
      // se deja correr; lo que siga pendiente es una fuga.
      await esperar(5000);
      expect(jest.getTimerCount()).toBe(0);
      expect(escuchasAppState).toBe(0);
      expect(escuchasTeclado).toBe(0);
      expect(playersVideo()).toHaveLength(0);
      expect(framesActivos()).toBe(0);
    }, 120000);
  }
});

describe('la prueba de fugas ve lo que mide', () => {
  it('con las pantallas abiertas habia escuchas y temporizadores', () => {
    expect(vivos.appState).toBeGreaterThan(0);
    expect(vivos.timers).toBeGreaterThan(0);
  });
});
