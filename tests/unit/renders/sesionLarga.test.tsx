/**
 * R6 · sesion larga. Diez minutos de reproductor con la pantalla encendida (reloj falso): lo que
 * vive mientras corre (temporizadores, escuchas de AppState, players de video, callbacks por cuadro)
 * no crece con el tiempo, y los renders por minuto se mantienen. FPS, memoria, bateria y
 * temperatura se miden en el telefono (docs/perf/R6_REPORTE.md, §5).
 */
import { framesActivos, playersVideo } from './mocks';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { AppState } from 'react-native';
import { montar, esperar, usarRelojFalso } from './montar';
import { grabar, detener } from './contador';
import Reproductor from '@/features/sesion/screens/Reproductor';
import Resumen from '@/features/sesion/screens/Resumen';
import { RUTINAS } from '@/data/catalog';
import { sesionDeRutina } from '@/lib/engine/session';
import { PERFIL_INICIAL } from '@/state/estadoInicial';

let vivo: ReactTestRenderer | null = null;
afterEach(async () => {
  if (vivo) { const r = vivo; await act(async () => { r.unmount(); }); vivo = null; }
  usarRelojFalso(false);
  jest.restoreAllMocks();
});

describe('sesion de 10 minutos', () => {
  it('nada se acumula: minuto 1, 5 y 10', async () => {
    let escuchas = 0;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((() => {
      escuchas++;
      let viva = true;
      return { remove: () => { if (viva) { viva = false; escuchas--; } } };
    }) as never);

    usarRelojFalso(true);
    jest.setSystemTime(new Date('2026-09-30T10:00:00Z'));
    // La rutina mas larga del catalogo (55 min): no termina en 10.
    const rutina = RUTINAS.find(r => r.id === 'rt_010')!;
    const sesion = { ...sesionDeRutina(rutina.id, { ...PERFIL_INICIAL } as never, rutina), origenPropia: true };
    vivo = await montar(Reproductor as never, { sesion }, undefined, { Resumen: Resumen as never });

    const layout = () => vivo!.root.findAll(n => typeof n.props.onPausa === 'function' && Array.isArray(n.props.items))[0];
    for (let k = 0; k < 10 && !layout(); k++) await esperar(500);
    expect(layout()).toBeTruthy();
    const estado = () => layout().props.tienda.getState().estado;

    const muestras: Record<number, { timers: number; escuchas: number; players: number; frames: number; renders: number }> = {};
    grabar();
    for (let s = 1; s <= 600; s++) {
      await esperar(1000);
      // El usuario marca «Listo» en las series por repeticiones (no tienen reloj).
      const e = estado();
      if (s % 30 === 0 && e.fase === 'trabajo' && !layout().props.esPorTiempo) {
        await act(async () => { layout().props.onListo(); });
      }
      if (s % 60 === 0) {
        const g = detener();
        muestras[s] = {
          timers: jest.getTimerCount(), escuchas, players: playersVideo().length, frames: framesActivos(), renders: g.total,
        };
        grabar();
      }
    }
    detener();

    expect(estado().fase).not.toBe('fin');
    expect(estado().transcurridoS).toBeGreaterThanOrEqual(590);
    const minutos = Object.values(muestras);
    process.stdout.write(`sesion larga (por minuto): ${JSON.stringify(minutos)}\n`);
    // Nada crece con el tiempo: lo vivo de la segunda mitad no pasa del maximo de la primera (los
    // temporizadores sueltos van y vienen: una transicion, un sello).
    const max = (xs: typeof minutos, k: keyof (typeof minutos)[number]) => Math.max(...xs.map(x => x[k]));
    const primera = minutos.slice(0, 5);
    const segunda = minutos.slice(5);
    for (const k of ['timers', 'escuchas', 'players', 'frames'] as const) {
      expect(max(segunda, k)).toBeLessThanOrEqual(max(primera, k));
    }
    expect(max(minutos, 'players')).toBeLessThanOrEqual(2);
    // Renders por minuto: la segunda mitad no pasa de 1.5 veces la primera.
    const media = (xs: typeof minutos) => xs.reduce((a, x) => a + x.renders, 0) / xs.length;
    expect(media(segunda)).toBeLessThanOrEqual(media(primera) * 1.5);
  }, 300000);
});
