import { describe, expect, it } from '@jest/globals';
import { fechaLocal, fechaLarga, diaCorto, esSesionLarga } from '@/lib/fechas';
import { etiquetaDeTramo, estimarTramos, resumenDeTramos, PISO_TRAMO } from '@/utils/estimarTramos';
import {
  parsearRango, fasesDePrograma, faseDeSemana, minutosPorSemana, placasPorSemana, textoDeRango, palabrasDeRango, resumenDePlan,
} from '@/features/programas/utils/minutosPorSemana';
import {
  placasPorDia, semanaEnCero, fechaDeDia, celdasDelMes, diaDelCalendario, diasDelMes, etiquetasDeEstadisticas,
  totalFavoritos, mezclarFavoritos, progresoAcotado, vistaPreviaDeReto, agruparPorMes, filaDeHistorial,
} from '@/lib/perfil';
import { indiceDeEspacio, equipoElegible, contarMarcados } from '@/utils/ajustes';

describe('fechas', () => {
  it('fechaLocal crea medianoche local', () => {
    const d = fechaLocal('2026-09-25');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 8, 25, 0]);
  });
  it('fechaLarga omite el año actual y lo pone si es otro', () => {
    const ahora = new Date(2026, 0, 1);
    expect(fechaLarga('2026-09-25', ahora)).toBe('Viernes 25 de septiembre');
    expect(fechaLarga('2025-12-03', ahora)).toBe('Miércoles 3 de diciembre de 2025');
  });
  it('fechaLarga devuelve tal cual lo que no es fecha', () => {
    expect(fechaLarga('')).toBe('');
    expect(fechaLarga('ayer')).toBe('ayer');
  });
  it('diaCorto', () => {
    expect(diaCorto('2026-09-25')).toBe('Viernes 25');
    expect(diaCorto('2026-09-27')).toBe('Domingo 27');
    expect(diaCorto('2024-02-29')).toBe('Jueves 29');
  });
  it('esSesionLarga desde 25 minutos', () => {
    expect(esSesionLarga(0)).toBe(false);
    expect(esSesionLarga(24)).toBe(false);
    expect(esSesionLarga(25)).toBe(true);
  });
});

describe('estimarTramos', () => {
  it('etiquetas', () => {
    expect(etiquetaDeTramo('plano', 3)).toBe('Ejercicios');
    expect(etiquetaDeTramo('principal', 1)).toBe('Principal');
    expect(etiquetaDeTramo('principal', 3)).toBe('Principal ×3');
  });
  it('sin bloques no hay tramos', () => {
    expect(estimarTramos([])).toEqual([]);
    expect(resumenDeTramos([])).toBe('');
  });
  it('las fracciones suman 1 y respetan el piso', () => {
    const t = estimarTramos([
      { tipo: 'calentamiento', peso: 2, ejercicios: 2 },
      { tipo: 'circuito', peso: 11, ejercicios: 5, vueltas: 3 },
      { tipo: 'enfriamiento', peso: 2, ejercicios: 1 },
    ]);
    const suma = t.reduce((a, x) => a + x.fraccion, 0);
    expect(suma).toBeCloseTo(1, 9);
    expect(t[0].fraccion).toBeCloseTo(PISO_TRAMO, 9);
    expect(t[1].tipo).toBe('principal');
    expect(t[1].inicio).toBeCloseTo(t[0].fraccion, 9);
    expect(resumenDeTramos(t)).toBe(
      'Calentamiento de 2 ejercicios, bloque principal de 5 ejercicios repetido 3 veces, enfriamiento de 1 ejercicio',
    );
  });
  it('un bloque sin minutos pesa por sus ejercicios (mínimo 1)', () => {
    const t = estimarTramos([
      { tipo: 'plano', peso: 0, ejercicios: 0 },
    ]);
    expect(t[0].fraccion).toBe(1);
    expect(t[0].vueltas).toBe(1);
    expect(resumenDeTramos(t)).toBe('0 ejercicios');
  });
});

describe('minutosPorSemana', () => {
  it('parsearRango', () => {
    expect(parsearRango('1-2')).toEqual({ desde: 1, hasta: 2 });
    expect(parsearRango('7')).toEqual({ desde: 7, hasta: 7 });
    expect(parsearRango('3–5')).toEqual({ desde: 3, hasta: 5 });
    expect(parsearRango('0')).toBeNull();
    expect(parsearRango('5-2')).toBeNull();
    expect(parsearRango('')).toBeNull();
  });
  it('fasesDePrograma y faseDeSemana', () => {
    const f = fasesDePrograma([
      { semanas: '1-2', foco: 'a', rutinas: ['r1'] },
      { semanas: '3', foco: 'b', rutinas: ['r2', 'r3'] },
    ])!;
    expect(f.map(x => [x.desde, x.hasta])).toEqual([[1, 2], [3, 3]]);
    expect(faseDeSemana(f, 2)).toBe(0);
    expect(faseDeSemana(f, 3)).toBe(1);
    expect(faseDeSemana(f, 9)).toBe(-1);
    expect(fasesDePrograma([{ semanas: 'x', foco: 'a', rutinas: [] }])).toBeNull();
    expect(fasesDePrograma([])).toEqual([]);
  });
  it('minutosPorSemana: promedio de rutinas por días', () => {
    const f = fasesDePrograma([{ semanas: '1-2', foco: 'a', rutinas: ['r1', 'r2'] }])!;
    const mins = (id: string) => ({ r1: 10, r2: 20 } as Record<string, number>)[id];
    expect(minutosPorSemana(2, 3, f, mins)).toEqual([45, 45]);
    expect(minutosPorSemana(3, 3, f, mins)).toBeNull();
    expect(minutosPorSemana(2, 3, f, () => undefined)).toBeNull();
    expect(minutosPorSemana(0, 3, f, mins)).toEqual([]);
  });
  it('placasPorSemana', () => {
    expect(placasPorSemana([10, 20], 2, 10)).toEqual([5, 10]);
    expect(placasPorSemana(null, 3, 10)).toEqual([8, 8, 8]);
    expect(placasPorSemana([1, 100], 2, 10)).toEqual([1, 10]);
  });
  it('rangos en texto', () => {
    expect(textoDeRango(1, 2)).toBe('Semanas 1–2');
    expect(textoDeRango(7, 7)).toBe('Semana 7');
    expect(palabrasDeRango(7, 7)).toBe('semana 7');
    expect(palabrasDeRango(1, 2)).toBe('semanas 1 y 2');
    expect(palabrasDeRango(3, 5)).toBe('semanas 3 a 5');
  });
  it('resumenDePlan', () => {
    const f = fasesDePrograma([{ semanas: '1-2', foco: 'aparecer', rutinas: ['r'] }])!;
    expect(resumenDePlan(f, [28, 28])).toBe('Semanas 1 y 2, aparecer, 28 minutos por semana');
    expect(resumenDePlan(f, null, 2)).toBe('Semanas 1 y 2, aparecer. Vas en la semana 2.');
    expect(resumenDePlan([], null)).toBe('');
  });
});

describe('perfil (Yo)', () => {
  it('placasPorDia', () => {
    expect(placasPorDia([0, 30, 15])).toEqual([0, 12, 6]);
    expect(placasPorDia([1])).toEqual([1]);
    expect(placasPorDia([60, 30])).toEqual([12, 6]);
    expect(placasPorDia([])).toEqual([]);
  });
  it('semanaEnCero', () => {
    expect(semanaEnCero([0, 0])).toBe(true);
    expect(semanaEnCero([])).toBe(true);
    expect(semanaEnCero([0, 1])).toBe(false);
  });
  it('celdasDelMes empieza en lunes y cierra la fila', () => {
    const sep2026 = celdasDelMes(2026, 8); // 1 de septiembre de 2026 es martes
    expect(sep2026.slice(0, 2)).toEqual([null, 1]);
    expect(sep2026.length % 7).toBe(0);
    expect(sep2026.filter(x => x !== null)).toHaveLength(30);
    const feb2021 = celdasDelMes(2021, 1); // empieza en lunes, 28 días
    expect(feb2021).toHaveLength(28);
  });
  it('fechaDeDia y diaDelCalendario', () => {
    expect(fechaDeDia(2026, 8, 5)).toBe('2026-09-05');
    const d = diaDelCalendario(2026, 8, 25, '2026-09-25', { '2026-09-25': 30 }, new Set(['2026-09-25']));
    expect(d).toMatchObject({ entreno: true, largo: true, esHoy: true, futuro: false });
    expect(d.etiqueta).toBe('Viernes 25, hoy, sesión de 25 minutos o más');
    const f = diaDelCalendario(2026, 8, 26, '2026-09-25', {}, new Set());
    expect(f).toMatchObject({ entreno: false, futuro: true, etiqueta: 'Sábado 26' });
  });
  it('diasDelMes cuenta fechas del mes', () => {
    const s = new Set(['2026-09-01', '2026-09-30', '2026-10-01']);
    expect(diasDelMes(s, 2026, 8)).toBe(2);
    expect(diasDelMes(new Set(), 2026, 8)).toBe(0);
    expect(diasDelMes(s, 2026, 11)).toBe(0);
  });
  it('etiquetasDeEstadisticas', () => {
    expect(etiquetasDeEstadisticas(1, 1, 1)).toEqual(['racha', 'sesión', 'minuto', 'serie']);
    expect(etiquetasDeEstadisticas(0, 2, 3)).toEqual(['racha', 'sesiones', 'minutos', 'series']);
  });
  it('favoritos: total y mezcla por turnos del más reciente', () => {
    const f = { ejercicios: ['e1', 'e2'], musculos: ['m1'], rutinas: ['r1'], programas: [], tips: [] };
    expect(totalFavoritos(f)).toBe(4);
    expect(mezclarFavoritos(f).map(x => x.id)).toEqual(['e2', 'r1', 'm1', 'e1']);
    expect(mezclarFavoritos(f, 2).map(x => x.id)).toEqual(['e2', 'r1']);
    const vacio = { ejercicios: [], musculos: [], rutinas: [], programas: [], tips: [] };
    expect(mezclarFavoritos(vacio)).toEqual([]);
    expect(totalFavoritos(vacio)).toBe(0);
  });
  it('progresoAcotado', () => {
    expect(progresoAcotado(-3, 7)).toBe(0);
    expect(progresoAcotado(3.6, 7)).toBe(4);
    expect(progresoAcotado(99, 7)).toBe(7);
  });
  it('vistaPreviaDeReto', () => {
    expect(vistaPreviaDeReto({ objetivo: 'Entrena siete dias seguidos', duracion_dias: 7 })).toEqual({ tipo: 'circulos', total: 7 });
    expect(vistaPreviaDeReto({ objetivo: '20 sesiones en 30 dias', duracion_dias: 30 })).toEqual({ tipo: 'rejilla', total: 30, meta: 20 });
    expect(vistaPreviaDeReto({ objetivo: '100 sesiones en total', duracion_dias: null })).toEqual({ tipo: 'tramos', total: 100 });
    expect(vistaPreviaDeReto({ objetivo: '14 dias seguidos', duracion_dias: 14 })).toEqual({ tipo: 'rejilla', total: 14 });
    expect(vistaPreviaDeReto({ objetivo: 'algo raro', duracion_dias: 5 })).toBeUndefined();
  });
  it('agruparPorMes respeta el orden', () => {
    const g = agruparPorMes([{ fecha: '2026-09-02' }, { fecha: '2026-09-01' }, { fecha: '2026-08-30' }, { fecha: '2026-09-03' }]);
    expect(g.map(x => [x.nombre, x.items.length])).toEqual([['Septiembre 2026', 2], ['Agosto 2026', 1], ['Septiembre 2026', 1]]);
    expect(agruparPorMes([])).toEqual([]);
  });
  it('filaDeHistorial', () => {
    const fila = filaDeHistorial(
      { fecha: '2026-09-25', duracionS: 1500, series: [{ omitida: false }, { omitida: true }, {}] }, new Date(2026, 0, 1),
    );
    expect(fila).toEqual({ fecha: 'Viernes 25 de septiembre', minutos: 25, series: 2, largo: true });
    expect(filaDeHistorial({ fecha: '2026-09-25', duracionS: 0, series: [] }, new Date(2026, 0, 1)).largo).toBe(false);
  });
});

describe('ajustes', () => {
  it('indiceDeEspacio', () => {
    expect(indiceDeEspacio('minimo')).toBe(0);
    expect(indiceDeEspacio('amplio')).toBe(2);
    expect(indiceDeEspacio('desconocido')).toBe(0);
  });
  it('equipoElegible quita «ninguno» y lo que no es de onboarding', () => {
    const e = [{ id: 'ninguno', onboarding: true }, { id: 'banda', onboarding: true }, { id: 'barra', onboarding: false }, { id: 'x' }];
    expect(equipoElegible(e).map(x => x.id)).toEqual(['banda']);
    expect(equipoElegible([])).toEqual([]);
  });
  it('contarMarcados ignora ids que ya no se listan', () => {
    expect(contarMarcados(['a', 'b', 'z'], ['a', 'b', 'c'])).toBe(2);
    expect(contarMarcados([], ['a'])).toBe(0);
    expect(contarMarcados(['a'], [])).toBe(0);
  });
});
