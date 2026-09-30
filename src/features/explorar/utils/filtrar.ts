/**
 * DARENOW · filtros de Explorar (R4)
 *
 * Las mismas reglas de siempre (busqueda, categoria, objetivo y «lo que puedo hacer»), como
 * funciones puras. El texto de cada elemento ya viene en minusculas de
 * `src/data/indice/busqueda.json` (scripts/build-catalogo.ts): cada tecla solo compara, no
 * convierte 190 nombres. tests/unit/busqueda.test.ts compara el resultado contra el de antes.
 */
import busqueda from '@/data/indice/busqueda.json';
import type { EjercicioIndice, MusculoIndice, Programa, Rutina } from '@/data/catalog';

const TEXTO = busqueda as {
  ejercicios: Record<string, string[]>;
  rutinas: Record<string, string>;
  programas: Record<string, string>;
  musculos: Record<string, string[]>;
};

export interface FiltrosExplorar {
  /** Lo que se escribio en el buscador, tal cual. */
  q: string;
  cat: string | null;
  goal: string | null;
  /** «Lo que puedo hacer»: sin contraindicaciones, con el equipo que hay y sin saltos si aplica. */
  soloMios: boolean;
}

/** Lo del perfil que decide «lo que puedo hacer». */
export interface PerfilFiltro { equipo: string[]; contra: string[]; modoSinSaltos: boolean }

const EQUIPO_BASE = ['ninguno', 'pared', 'silla'];
const termino = (q: string) => q.trim().toLowerCase();

export function filtrarEjercicios(
  lista: readonly EjercicioIndice[], f: FiltrosExplorar, p: PerfilFiltro,
): EjercicioIndice[] {
  const t = termino(f.q);
  const equipoDisp = new Set([...p.equipo, ...EQUIPO_BASE]);
  const contra = new Set(p.contra);
  return lista.filter(e => {
    if (t && !(TEXTO.ejercicios[e.id] ?? []).some(x => x.includes(t))) return false;
    if (f.cat && e.category !== f.cat) return false;
    if (f.goal && !e.goals.includes(f.goal)) return false;
    if (f.soloMios) {
      if (e.contra.some(c => contra.has(c))) return false;
      if (!e.equipment.every(x => equipoDisp.has(x))) return false;
      if (p.modoSinSaltos && (e.impact >= 2 || e.noise >= 2)) return false;
    }
    return true;
  });
}

export function filtrarRutinas(lista: readonly Rutina[], f: Pick<FiltrosExplorar, 'q' | 'goal'>): Rutina[] {
  const t = termino(f.q);
  return lista.filter(r => (!t || (TEXTO.rutinas[r.id] ?? '').includes(t)) && (!f.goal || r.goal === f.goal));
}

export function filtrarProgramas(lista: readonly Programa[], f: Pick<FiltrosExplorar, 'q' | 'goal'>): Programa[] {
  const t = termino(f.q);
  return lista.filter(p => (!t || (TEXTO.programas[p.id] ?? '').includes(t)) && (!f.goal || p.goal === f.goal));
}

export function filtrarMusculos(lista: readonly MusculoIndice[], f: Pick<FiltrosExplorar, 'q'>): MusculoIndice[] {
  const t = termino(f.q);
  return lista.filter(m => !t || (TEXTO.musculos[m.id] ?? []).some(x => x.includes(t)));
}
