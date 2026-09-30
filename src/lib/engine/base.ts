/**
 * DARENOW · motor de sesion: tipos y piezas comunes
 *
 * Los tipos del motor, el filtro de ejercicios validos para un perfil, la duracion y el gasto
 * de un ejercicio y el paso de ejercicio del catalogo a item de sesion. Lo usan `session.ts`
 * (sesiones de la app) y `propias.ts` (rutinas del usuario).
 */

import { EJERCICIOS, getEjercicio, type Ejercicio, type EjercicioIndice } from '@/data/catalog';

export interface Perfil {
  objetivo: string;
  nivel: 1 | 2 | 3;
  minPorSesion: number;
  modoSinSaltos: boolean;
  espacio: 'minimo' | 'colchoneta' | 'amplio';
  equipo: string[];
  contra: string[];
  vetos: string[];
  pesoKg?: number;
}

export interface ItemSesion extends Ejercicio {
  bloque: 'calentamiento' | 'principal' | 'enfriamiento';
  seriesPlan: number;
  repsPlan: number | null;
  segPlan: number | null;
  descansoPlan: number;
  ultimaVez?: { reps?: number; segundos?: number; pesoKg?: number; fecha: string };
}

export interface Sesion {
  rutinaId: string | null;
  nombre: string;
  items: ItemSesion[];
  minutosEstimados: number;
  kcalEstimadas: number | null;
  avisos: string[];
  /** From a user-built routine: series/reps/rest were already fixed when
   *  it was created, so the player must not ask for them again. */
  origenPropia?: boolean;
}

export const EQUIPO_BASE = ['ninguno', 'pared', 'silla'];

/* ------------------------------------------------------------------ */

export interface Filtro {
  patron?: string;
  categorias?: string[];
  relajarEspacio?: boolean;
  relajarNivel?: boolean;
  objetivo?: string;
}

export function ejerciciosValidos(p: Perfil, f: Filtro = {}): EjercicioIndice[] {
  const equipoDisp = new Set([...EQUIPO_BASE, ...p.equipo]);
  const contra = new Set(p.contra);
  const vetos = new Set(p.vetos);
  const objetivo = f.objetivo ?? p.objetivo;

  return EJERCICIOS.filter(e => {
    // 1. Contraindicaciones. Sin excepciones.
    if (e.contra.some(c => contra.has(c))) return false;
    // 2. Equipo: todo lo que pide tiene que estar.
    if (!e.equipment.every(q => equipoDisp.has(q))) return false;
    // 3. Ruido e impacto.
    if (p.modoSinSaltos && (e.impact >= 2 || e.noise >= 2)) return false;
    // 4. Espacio.
    if (!f.relajarEspacio) {
      if (p.espacio === 'minimo' && e.space !== 'minimo') return false;
      if (p.espacio === 'colchoneta' && e.space === 'amplio') return false;
    }
    // 5. Vetos.
    if (vetos.has(e.id)) return false;

    if (!f.relajarNivel && e.level > p.nivel) return false;
    if (f.patron && e.patron !== f.patron) return false;
    if (f.categorias && !f.categorias.includes(e.category)) return false;
    if (objetivo && !e.goals.includes(objetivo)) return false;
    return true;
  });
}

/* ------------------------------------------------------------------ */

export function duracion(it: ItemSesion): number {
  const trabajo = it.segPlan ?? (it.repsPlan ?? 10) * 3;
  const lados = it.unilateral || it.measure === 'reps_por_lado' ? 2 : 1;
  return (trabajo * lados + it.descansoPlan) * it.seriesPlan;
}

export function kcal(it: ItemSesion, pesoKg: number): number {
  return (it.met * 3.5 * pesoKg / 200) * (duracion(it) / 60);
}

/** El ejercicio con sus textos: el mismo objeto que habia en el catalogo antes de R3. */
export const completo = (e: EjercicioIndice): Ejercicio => getEjercicio(e.id) ?? (e as Ejercicio);

const TOPE_SEG = { calentamiento: 45, principal: 90, enfriamiento: 45 } as const;

/** Un item de sesion lleva el ejercicio completo, con sus textos (el reproductor muestra las claves). */
export function aItem(e: EjercicioIndice, bloque: ItemSesion['bloque']): ItemSesion {
  const seg = e.default.seg ?? null;
  return {
    ...completo(e),
    bloque,
    seriesPlan: e.default.series ?? 3,
    repsPlan: e.default.reps ?? null,
    // Ejercicios como la caminata o el trote traen su duracion de sesion
    // completa (1800 s). Dentro de un circuito hay que topearlos o se comen
    // el presupuesto entero.
    segPlan: seg == null ? null : Math.min(seg, TOPE_SEG[bloque]),
    descansoPlan: Math.min(e.default.rest_s ?? 45, bloque === 'principal' ? 90 : 15),
  };
}
