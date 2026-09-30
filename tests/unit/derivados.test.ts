/**
 * R4 · las estadisticas del historial se calculan una vez por cambio de datos y se comparten entre
 * pantallas. El resultado es el mismo que calcularlo cada vez; una sesion nueva (arreglo nuevo)
 * lo recalcula.
 */
import { describe, expect, it } from '@jest/globals';
import { estadisticas, ultimos7, minutosPorDia, diasEntrenados } from '@/state/derivados';
import type { SesionGuardada } from '@/state/tipos';

const sesion = (id: string, fecha: string, min: number): SesionGuardada => ({
  id, fecha, iniciada: `${fecha}T10:00:00Z`, duracionS: min * 60, rutinaId: 'rt_001', programaId: null,
  estado: 'completada', kcal: 50, rpe: null, motivoAbandono: null,
  series: [{ ejercicioId: 'ex_1001', serieNum: 1, lado: null, reps: 10, segundos: null, pesoKg: null, omitida: false }],
} as SesionGuardada);

describe('estadisticas una vez por cambio de datos', () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const antes = [sesion('1', '2026-01-02', 20), sesion('2', hoy, 30)];

  it('mismo arreglo: mismo resultado (la misma referencia)', () => {
    expect(estadisticas(antes)).toBe(estadisticas(antes));
    expect(ultimos7(antes)).toBe(ultimos7(antes));
    expect(minutosPorDia(antes)).toBe(minutosPorDia(antes));
    expect(diasEntrenados(antes)).toBe(diasEntrenados(antes));
  });

  it('los valores son los de siempre', () => {
    expect(estadisticas(antes)).toEqual({ total: 2, completadas: 2, minutos: 50, series: 2, kcal: 100, dias: 2 });
    expect(ultimos7(antes).at(-1)).toEqual({ fecha: hoy, min: 30 });
    expect(minutosPorDia(antes)).toEqual({ '2026-01-02': 20, [hoy]: 30 });
    expect(diasEntrenados(antes)).toEqual(['2026-01-02', hoy]);
  });

  it('una sesion nueva (arreglo nuevo) recalcula', () => {
    const despues = [...antes, sesion('3', hoy, 10)];
    expect(estadisticas(despues).total).toBe(3);
    expect(ultimos7(despues).at(-1)).toEqual({ fecha: hoy, min: 40 });
    expect(estadisticas(antes).total).toBe(2);
  });
});
