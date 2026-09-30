import './mocks';
import { describe, it, expect } from '@jest/globals';
import { grabar, detener } from './contador';
import { montar, esperar, tocar } from './montar';
import Explorar from '@/features/explorar/screens/Explorar';

describe('Explorar', () => {
  it('chip', async () => {
    const r = await montar(Explorar as never);
    grabar();
    await tocar(r, p => p.texto === 'Fuerza');
    await esperar();
    const g = detener();
    console.log(JSON.stringify(g, null, 1));
    expect(g.total).toBeGreaterThan(0);
  });
});
