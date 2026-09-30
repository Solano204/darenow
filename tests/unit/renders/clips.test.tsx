/**
 * R5 · politica de clips: un solo player reproduciendo. La ficha de un ejercicio reproduce su
 * clip; al abrir otra ficha encima, la de abajo se pausa y suelta su video; al volver, sigue.
 */
import { playersVideo } from './mocks';
import { afterEach, describe, expect, it } from '@jest/globals';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { montar, esperar } from './montar';
import DetalleEjercicio from '@/features/ejercicio/screens/DetalleEjercicio';
import { EJERCICIOS } from '@/data/catalog';

let vivo: ReactTestRenderer | null = null;
afterEach(async () => {
  if (vivo) { const r = vivo; await act(async () => { r.unmount(); }); vivo = null; }
});

const reproduciendo = () => playersVideo().filter(p => p.playing);

describe('clips', () => {
  it('ficha sobre ficha: solo reproduce la de arriba; al volver, la de abajo', async () => {
    const [a, b] = [EJERCICIOS[10].id, EJERCICIOS[11].id];
    vivo = await montar(DetalleEjercicio as never, { id: a }, undefined, { Ejercicio: DetalleEjercicio as never });
    await esperar(200);
    expect(playersVideo()).toHaveLength(1);
    expect(reproduciendo()).toHaveLength(1);
    const abajo = playersVideo()[0];

    const nav = vivo.root.findAll(n => n.props.navigation && n.props.route?.name === 'Prueba')[0].props.navigation;
    await act(async () => { nav.push('Ejercicio', { id: b }); });
    await esperar(400);
    expect(reproduciendo()).toHaveLength(1);
    expect(abajo.playing).toBe(false);
    expect(abajo.src).toBeNull();            // su video se solto
    expect(playersVideo()).toHaveLength(2);     // el de arriba (reproduciendo) y el de abajo (pausado)

    await act(async () => { nav.goBack(); });
    await esperar(400);
    expect(playersVideo()).toEqual([abajo]); // el de la ficha que se cerro se libero
    expect(abajo.playing).toBe(true);
    expect(abajo.src).not.toBeNull();
  });
});
