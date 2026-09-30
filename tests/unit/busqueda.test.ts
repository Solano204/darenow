/**
 * R4 · la búsqueda y los filtros de Explorar dan exactamente lo mismo que antes. La referencia es
 * el filtrado que vivía en useExplorar (copiado tal cual); lo nuevo usa los textos en minúsculas
 * precalculados (src/data/indice/busqueda.json).
 */
import { describe, expect, it } from '@jest/globals';
import { EJERCICIOS, RUTINAS, PROGRAMAS, MUSCULOS, CATEGORIAS, GOALS, type EjercicioIndice } from '@/data/catalog';
import {
  filtrarEjercicios, filtrarRutinas, filtrarProgramas, filtrarMusculos, type FiltrosExplorar, type PerfilFiltro,
} from '@/features/explorar/utils/filtrar';

/* ---- Referencia: el código de useExplorar antes de R4 ---- */
function antesEjercicios(q: string, cat: string | null, goal: string | null, soloMios: boolean, perfil: PerfilFiltro) {
  const equipoDisp = new Set([...perfil.equipo, 'ninguno', 'pared', 'silla']);
  const contra = new Set(perfil.contra);
  const t = q.trim().toLowerCase();
  return EJERCICIOS.filter((e: EjercicioIndice) => {
    if (t && !(
      e.name.toLowerCase().includes(t) ||
      (e.name_en ?? '').toLowerCase().includes(t) ||
      (e.aliases ?? []).some(a => a.toLowerCase().includes(t))
    )) return false;
    if (cat && e.category !== cat) return false;
    if (goal && !e.goals.includes(goal)) return false;
    if (soloMios) {
      if (e.contra.some(c => contra.has(c))) return false;
      if (!e.equipment.every(x => equipoDisp.has(x))) return false;
      if (perfil.modoSinSaltos && (e.impact >= 2 || e.noise >= 2)) return false;
    }
    return true;
  });
}
const antesRutinas = (q: string, goal: string | null) => {
  const t = q.trim().toLowerCase();
  return RUTINAS.filter(r => (!t || r.name.toLowerCase().includes(t)) && (!goal || r.goal === goal));
};
const antesProgramas = (q: string, goal: string | null) => {
  const t = q.trim().toLowerCase();
  return PROGRAMAS.filter(p => (!t || p.name.toLowerCase().includes(t)) && (!goal || p.goal === goal));
};
const antesMusculos = (q: string) => {
  const t = q.trim().toLowerCase();
  return MUSCULOS.filter(m => !t || m.name.toLowerCase().includes(t) || m.group.toLowerCase().includes(t));
};

const ids = (xs: { id: string }[]) => xs.map(x => x.id);
const SIN_NADA: PerfilFiltro = { equipo: [], contra: [], modoSinSaltos: false };
const PERFILES: PerfilFiltro[] = [
  SIN_NADA,
  { equipo: ['mancuernas', 'banda'], contra: ['rodilla'], modoSinSaltos: true },
  { equipo: ['barra_dominadas', 'mancuernas', 'banco'], contra: ['hombro', 'lumbar'], modoSinSaltos: false },
];

const BUSQUEDAS = ['sentadilla', 'SENTADILLA  ', 'squat', 'plancha', 'flexión', 'pec', 'glúteo', 'a', 'xyz no existe', ''];

const COMBINACIONES: Omit<FiltrosExplorar, 'q'>[] = [
  { cat: null, goal: null, soloMios: true },
  { cat: null, goal: null, soloMios: false },
  { cat: CATEGORIAS[0].id, goal: null, soloMios: true },
  { cat: CATEGORIAS[1].id, goal: GOALS[0].id, soloMios: false },
  { cat: CATEGORIAS[2].id, goal: null, soloMios: false },
  { cat: null, goal: GOALS[1].id, soloMios: true },
  { cat: null, goal: GOALS[4].id, soloMios: false },
  { cat: CATEGORIAS[3].id, goal: GOALS[3].id, soloMios: true },
  { cat: CATEGORIAS[5].id, goal: GOALS[5].id, soloMios: false },
  { cat: CATEGORIAS[0].id, goal: GOALS[6].id, soloMios: true },
];

describe('búsqueda y filtros de Explorar = los de antes', () => {
  it.each(BUSQUEDAS)('búsqueda «%s» en los cuatro segmentos', q => {
    for (const p of PERFILES) {
      expect(ids(filtrarEjercicios(EJERCICIOS, { q, cat: null, goal: null, soloMios: true }, p)))
        .toEqual(ids(antesEjercicios(q, null, null, true, p)));
      expect(ids(filtrarEjercicios(EJERCICIOS, { q, cat: null, goal: null, soloMios: false }, p)))
        .toEqual(ids(antesEjercicios(q, null, null, false, p)));
    }
    expect(ids(filtrarRutinas(RUTINAS, { q, goal: null }))).toEqual(ids(antesRutinas(q, null)));
    expect(ids(filtrarProgramas(PROGRAMAS, { q, goal: null }))).toEqual(ids(antesProgramas(q, null)));
    expect(ids(filtrarMusculos(MUSCULOS, { q }))).toEqual(ids(antesMusculos(q)));
  });

  it.each(COMBINACIONES.map((c, i) => [i, c] as const))('combinación de filtros %i', (_, c) => {
    for (const q of ['', 'sentadilla', 'a']) {
      for (const p of PERFILES) {
        expect(ids(filtrarEjercicios(EJERCICIOS, { q, ...c }, p)))
          .toEqual(ids(antesEjercicios(q, c.cat, c.goal, c.soloMios, p)));
      }
      expect(ids(filtrarRutinas(RUTINAS, { q, goal: c.goal }))).toEqual(ids(antesRutinas(q, c.goal)));
      expect(ids(filtrarProgramas(PROGRAMAS, { q, goal: c.goal }))).toEqual(ids(antesProgramas(q, c.goal)));
    }
  });

  it('las búsquedas y combinaciones no son triviales (encuentran algo y filtran algo)', () => {
    expect(antesEjercicios('sentadilla', null, null, false, SIN_NADA).length).toBeGreaterThan(3);
    expect(antesEjercicios('', CATEGORIAS[0].id, GOALS[1].id, true, PERFILES[1]).length).toBeLessThan(EJERCICIOS.length);
  });
});
