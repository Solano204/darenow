import { describe, expect, it } from '@jest/globals';
import {
  calcularRacha, revisarPausa, estadisticas, ultimos7, minutosPorDia, diasEntrenados, imagenRutina, hoy,
  type Racha, type SesionGuardada,
} from '@/store/store';
import { duracion, minutosPropios, itemPropioPorDefecto, aItem } from '@/engine/session';
import { EJERCICIOS, porId } from '@/data/catalog';

const RACHA_VACIA: Racha = { dias: 0, mejor: 0, ultimoDia: null, graciaUsada: 0, mesGracia: null, enPausa: false };

const sesion = (fecha: string, duracionS: number, extra: Partial<SesionGuardada> = {}): SesionGuardada => ({
  id: fecha, fecha, iniciada: fecha, duracionS, rutinaId: null, programaId: null, estado: 'completada',
  kcal: null, rpe: null, motivoAbandono: null, series: [], ...extra,
});

describe('calcularRacha', () => {
  it('la primera sesión empieza la racha en 1', () => {
    expect(calcularRacha(RACHA_VACIA, '2026-09-01')).toMatchObject({ dias: 1, mejor: 1, ultimoDia: '2026-09-01', enPausa: false });
  });
  it('el mismo día no suma', () => {
    const r = calcularRacha(RACHA_VACIA, '2026-09-01');
    expect(calcularRacha(r, '2026-09-01')).toBe(r);
  });
  it('días seguidos suman y actualizan el mejor', () => {
    let r = calcularRacha(RACHA_VACIA, '2026-09-01');
    r = calcularRacha(r, '2026-09-02');
    expect(r).toMatchObject({ dias: 2, mejor: 2, graciaUsada: 0 });
  });
  it('un hueco usa días de gracia hasta 2 por mes', () => {
    let r = calcularRacha(RACHA_VACIA, '2026-09-01');
    r = calcularRacha(r, '2026-09-03'); // falta 1 día
    expect(r).toMatchObject({ dias: 2, graciaUsada: 1 });
    r = calcularRacha(r, '2026-09-06'); // faltan 2 días: supera la gracia, no la consume
    expect(r).toMatchObject({ dias: 3, graciaUsada: 1, enPausa: false });
  });
  it('la gracia se reinicia al cambiar de mes', () => {
    const r: Racha = { dias: 5, mejor: 5, ultimoDia: '2026-09-30', graciaUsada: 2, mesGracia: '2026-09', enPausa: false };
    expect(calcularRacha(r, '2026-10-02')).toMatchObject({ dias: 6, graciaUsada: 1, mesGracia: '2026-10' });
  });
});

describe('revisarPausa', () => {
  it('sin último día no cambia', () => {
    expect(revisarPausa(RACHA_VACIA)).toBe(RACHA_VACIA);
  });
  it('entrenó hoy: no está en pausa', () => {
    const r: Racha = { ...RACHA_VACIA, dias: 3, ultimoDia: hoy() };
    expect(revisarPausa(r).enPausa).toBe(false);
  });
  it('hace mucho: queda en pausa pero conserva los días', () => {
    const r: Racha = { ...RACHA_VACIA, dias: 9, mejor: 9, ultimoDia: '2000-01-01' };
    expect(revisarPausa(r)).toMatchObject({ enPausa: true, dias: 9 });
  });
});

describe('estadísticas derivadas', () => {
  const s = [
    sesion('2026-09-01', 600, { series: [
      { ejercicioId: 'a', serieNum: 1, lado: null, reps: 10, segundos: null, pesoKg: null, omitida: false },
      { ejercicioId: 'a', serieNum: 2, lado: null, reps: null, segundos: null, pesoKg: null, omitida: true },
    ], kcal: 50 }),
    sesion('2026-09-01', 1200, { estado: 'abandonada' }),
    sesion('2026-09-03', 90),
  ];
  it('estadisticas', () => {
    expect(estadisticas(s)).toEqual({ total: 3, completadas: 2, minutos: 32, series: 1, kcal: 50, dias: 2 });
    expect(estadisticas([])).toEqual({ total: 0, completadas: 0, minutos: 0, series: 0, kcal: 0, dias: 0 });
  });
  it('minutosPorDia suma minutos redondeados por sesión', () => {
    expect(minutosPorDia(s)).toEqual({ '2026-09-01': 30, '2026-09-03': 2 });
    expect(minutosPorDia([])).toEqual({});
  });
  it('diasEntrenados sin repetir', () => {
    expect(diasEntrenados(s)).toEqual(['2026-09-01', '2026-09-03']);
    expect(diasEntrenados([])).toEqual([]);
  });
  it('ultimos7 da siete días terminando hoy', () => {
    const u = ultimos7([]);
    expect(u).toHaveLength(7);
    expect(u.every(d => d.min === 0)).toBe(true);
    expect(u[6].fecha).toBe(new Date().toISOString().slice(0, 10));
  });
});

describe('imagenRutina', () => {
  it('usa la imagen asignada si existe', () => {
    expect(imagenRutina('mi_x', 'rt_007')).toBe('rt_007');
  });
  it('sin imagen elige una estable entre rt_001 y rt_030', () => {
    const a = imagenRutina('mi_abc');
    expect(a).toBe(imagenRutina('mi_abc'));
    expect(a).toMatch(/^rt_0(0[1-9]|[12]\d|30)$/);
  });
  it('id vacío da rt_001', () => {
    expect(imagenRutina('')).toBe('rt_001');
  });
});

describe('duración de rutina', () => {
  const e = EJERCICIOS.find(x => !x.unilateral && x.measure === 'reps')!;
  const uni = EJERCICIOS.find(x => x.unilateral || x.measure === 'reps_por_lado')!;

  it('duracion: reps × 3 s + descanso, por serie', () => {
    const it = { ...aItem(e, 'principal'), repsPlan: 10, segPlan: null, descansoPlan: 30, seriesPlan: 3 };
    expect(duracion(it)).toBe((30 + 30) * 3);
  });
  it('duracion: unilateral cuenta dos lados', () => {
    const it = { ...aItem(uni, 'principal'), repsPlan: 10, segPlan: null, descansoPlan: 0, seriesPlan: 1 };
    expect(duracion(it)).toBe(60);
  });
  it('duracion: por tiempo usa los segundos', () => {
    const it = { ...aItem(e, 'principal'), repsPlan: null, segPlan: 40, descansoPlan: 20, seriesPlan: 2, unilateral: false, measure: 'tiempo' as const };
    expect(duracion(it)).toBe(120);
  });
  it('minutosPropios: mínimo 1 e ignora ids desconocidos', () => {
    expect(minutosPropios([])).toBe(1);
    expect(minutosPropios([{ ejercicioId: 'no_existe', series: 3, reps: 10, descansoS: 60 }])).toBe(1);
    expect(minutosPropios([{ ejercicioId: e.id, series: 4, reps: 10, descansoS: 60 }])).toBe(Math.round((30 + 60) * 4 / 60));
  });
  it('itemPropioPorDefecto copia los valores del catálogo', () => {
    const d = itemPropioPorDefecto(porId.get(e.id)!);
    expect(d.ejercicioId).toBe(e.id);
    expect(d.series).toBe(e.default.series ?? 3);
    expect(d.descansoS).toBe(e.default.rest_s ?? 45);
  });
});
