/**
 * FORJA · catalogo
 *
 * Los JSON se importan directamente y Metro los mete en el bundle. Al
 * arrancar se construyen indices en memoria una sola vez.
 *
 * Por que no SQLite aqui: para una build de prueba, una base precompilada
 * exige copiar el archivo desde assets y no corre en Expo Go sin pasos
 * extra. El catalogo entero son 420 KB y cabe en memoria sin problema.
 * El esquema SQL sigue en db/ para cuando quieras hacer el cambio; las
 * consultas de este archivo son las mismas que las de aquel esquema.
 */

import muscles from '../../assets/data/01_muscles.json';
import equipment from '../../assets/data/02_equipment.json';
import families from '../../assets/data/03_families.json';
import exLower from '../../assets/data/10_exercises_lower.json';
import exPush from '../../assets/data/11_exercises_push.json';
import exPull from '../../assets/data/12_exercises_pull.json';
import exCore from '../../assets/data/13_exercises_core.json';
import exCali from '../../assets/data/14_exercises_calisthenics.json';
import exCardio from '../../assets/data/15_exercises_cardio_hiit.json';
import exFacial from '../../assets/data/16_exercises_facial.json';
import exPost from '../../assets/data/17_exercises_posture_mobility.json';
import exStretch from '../../assets/data/18_exercises_stretch_warmup.json';
import exRun from '../../assets/data/19_exercises_running.json';
import routines from '../../assets/data/20_routines.json';
import programs from '../../assets/data/21_programs.json';
import tips from '../../assets/data/30_tips.json';
import myths from '../../assets/data/31_myths_errors.json';
import nutrition from '../../assets/data/32_nutrition.json';
import glossary from '../../assets/data/33_glossary_faq.json';
import challenges from '../../assets/data/40_challenges_achievements.json';
import measurements from '../../assets/data/41_measurements.json';
import { mark as perfMark } from '../dev/perfMarks'; // perf:R1

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Evidencia = 'ok' | 'parcial' | 'mito' | 'cuidado';

export interface Musculo {
  id: string; name: string; name_en?: string; group: string; region: string;
  cara: string; funcion: string; trabaja_con?: string[]; antagonista?: string[];
  dolor_comun?: string;
}

export interface Equipo {
  id: string; name: string; categoria: string; onboarding: boolean;
  orden: number; desc: string; sustituto_casero: string | null;
}

export interface Familia {
  id: string; name: string; patron: string; desc: string;
  evidence: Record<string, Evidencia>; evidence_note?: string;
  musculos_clave?: string[];
}

export interface Ejercicio {
  id: string; slug: string; name: string; name_en?: string; aliases?: string[];
  family: string; category: string; goals: string[]; level: 1 | 2 | 3;
  equipment: string[]; impact: number; noise: number;
  space: 'minimo' | 'colchoneta' | 'amplio'; unilateral: boolean;
  measure: 'reps' | 'tiempo' | 'distancia' | 'reps_por_lado';
  default: { series: number; reps?: number; seg?: number; rest_s: number };
  met: number; primary: string[]; secondary: string[];
  risk_zones: string[]; contra: string[];
  evidence?: Record<string, Evidencia>; evidence_note?: string;
  desc: string; steps: string[]; cues: string[]; errors: string[];
  breathing: string; progressions: string[]; regressions: string[];
  substitutes: string[];
  /** el clip del ejercicio y su imagen; recorrido dice si se mueve o se sostiene */
  asset: { clip: string; imagen: string; recorrido: 'ciclico' | 'sostenido' };
  patron?: string;
}

export interface BloqueRutina { tipo: string; min: number; vueltas?: number; items: string[] }
export interface Rutina {
  id: string; name: string; goal: string; min: number; level: number;
  modo_sin_saltos: boolean; estructura: string | null;
  bloques: BloqueRutina[]; kcal_aprox_70kg: number; nota?: string; equipment: string[];
}

interface FaseProg { semanas: string; foco: string; rutinas: string[]; nota?: string }
export interface Programa {
  id: string; name: string; goal: string; semanas: number; dias_semana: number;
  min_sesion: number; level: number; equipment: string[]; desc: string;
  honestidad?: string; fases: FaseProg[]; resultado_esperado: string; medicion?: string;
}

export interface Tip { id: string; sala: string; titulo: string; cuerpo: string; tags: string[]; relacionado: string[] }
export interface Sala { id: string; name: string; desc: string; orden: number }
export interface Mito {
  id: string; titulo: string; veredicto: Evidencia; categoria: string;
  afirmacion_popular: string; explicacion: string; que_hacer: string; relacionado: string[];
}
export interface ErrorEjecucion { id: string; error: string; por_que_importa: string; correccion: string; ejercicios: string[] }

/* ------------------------------------------------------------------ */
/* Carga                                                               */
/* ------------------------------------------------------------------ */

const bloquesEjercicios = [
  exLower, exPush, exPull, exCore, exCali,
  exCardio, exFacial, exPost, exStretch, exRun,
] as unknown as { items: Ejercicio[] }[];

export const MUSCULOS = (muscles as unknown as { items: Musculo[] }).items;
export const EQUIPO = (equipment as unknown as { items: Equipo[] }).items;
const FAMILIAS = (families as unknown as { items: Familia[] }).items;
export const EJERCICIOS: Ejercicio[] = bloquesEjercicios.flatMap(b => b.items);
export const RUTINAS = (routines as unknown as { items: Rutina[] }).items;
export const PROGRAMAS = (programs as unknown as { items: Programa[] }).items;
export const SALAS = (tips as unknown as { salas: Sala[] }).salas;
export const TIPS = (tips as unknown as { items: Tip[] }).items;
export const MITOS = (myths as unknown as { mitos: Mito[] }).mitos;
export const ERRORES = (myths as unknown as { errores_de_ejecucion_mas_frecuentes: ErrorEjecucion[] })
  .errores_de_ejecucion_mas_frecuentes;
export const NUTRICION = (nutrition as unknown as {
  conceptos: { id: string; titulo: string; nivel: string; cuerpo: string; implicacion: string }[];
  lo_que_la_app_no_hace: string[];
  principio_de_diseno: string;
  aviso: string;
}) ;
export const GLOSARIO = (glossary as unknown as { glosario: { termino: string; def: string }[] }).glosario;
export const FAQ = (glossary as unknown as { faq: { p: string; r: string }[] }).faq;
export const RETOS = (challenges as unknown as { retos: Reto[] }).retos;
export const LOGROS = (challenges as unknown as { logros: Logro[] }).logros;
export const MEDICIONES = (measurements as unknown as { protocolos: Protocolo[] }).protocolos;

export interface Reto {
  id: string; name: string; tipo: string; duracion_dias: number | null;
  objetivo: string; dificultad: number; desc: string; recompensa: string;
  programa?: string; rutina?: string;
}
export interface Logro { id: string; name: string; icono: string; desc: string; categoria: string }
export interface Protocolo {
  id: string; name: string; frecuencia: string; instrumento: string;
  condiciones_fijas: string[]; pasos?: string[]; advertencia?: string;
  interpretacion?: string; puntos?: { zona: string; referencia: string }[];
  pruebas?: { nombre: string; ejercicio: string; unidad: string }[];
  desactivable?: boolean; nota_de_diseno?: string;
  puntuacion?: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/* Indices                                                             */
/* ------------------------------------------------------------------ */

export const porId = new Map(EJERCICIOS.map(e => [e.id, e]));
export const familiaPorId = new Map(FAMILIAS.map(f => [f.id, f]));
export const musculoPorId = new Map(MUSCULOS.map(m => [m.id, m]));
export const equipoPorId = new Map(EQUIPO.map(e => [e.id, e]));
export const rutinaPorId = new Map(RUTINAS.map(r => [r.id, r]));
export const programaPorId = new Map(PROGRAMAS.map(p => [p.id, p]));
export const logroPorId = new Map(LOGROS.map(l => [l.id, l]));
export const salaPorId = new Map(SALAS.map(s => [s.id, s]));

// Cada ejercicio hereda el patron de su familia.
for (const e of EJERCICIOS) {
  e.patron = familiaPorId.get(e.family)?.patron;
}

/** Evidencia efectiva: la propia del ejercicio, o la de su familia. */
export function evidenciaDe(e: Ejercicio): { mapa: Record<string, Evidencia>; nota?: string } {
  if (e.evidence) return { mapa: e.evidence, nota: e.evidence_note };
  const f = familiaPorId.get(e.family);
  return { mapa: f?.evidence ?? {}, nota: f?.evidence_note };
}

export function nombreEquipo(ids: string[]): string {
  const filtrados = ids.filter(i => i !== 'ninguno');
  if (!filtrados.length) return 'Sin equipo';
  return filtrados.map(i => equipoPorId.get(i)?.name ?? i).join(', ');
}

export const GOALS: { id: string; nombre: string; sub: string }[] = [
  { id: 'bajar_peso', nombre: 'Bajar peso',        sub: 'Circuitos y cardio' },
  { id: 'musculo',    nombre: 'Ganar músculo',     sub: 'Fuerza y volumen' },
  { id: 'mandibula',  nombre: 'Mandíbula y rostro',sub: 'Tono facial y postura' },
  { id: 'postura',    nombre: 'Postura y altura',  sub: 'Movilidad y descompresión' },
  { id: 'cardio',     nombre: 'Condición física',  sub: 'Resistencia general' },
  { id: 'running',    nombre: 'Correr',            sub: 'De cero a 5K, o más' },
  { id: 'gym',        nombre: 'Fuerza en gym',     sub: 'Barra y máquinas' },
  { id: 'calistenia', nombre: 'Calistenia',        sub: 'Peso corporal' },
];

export const nombreGoal = (id: string) => GOALS.find(g => g.id === id)?.nombre ?? id;

export const CATEGORIAS = [
  { id: 'fuerza', nombre: 'Fuerza' },
  { id: 'cardio', nombre: 'Cardio' },
  { id: 'movilidad', nombre: 'Movilidad' },
  { id: 'facial', nombre: 'Facial' },
  { id: 'estiramiento', nombre: 'Estiramiento' },
  { id: 'tecnica_carrera', nombre: 'Técnica de carrera' },
];

export const ESTADISTICAS = {
  ejercicios: EJERCICIOS.length,
  musculos: MUSCULOS.length,
  rutinas: RUTINAS.length,
  programas: PROGRAMAS.length,
  tips: TIPS.length,
  mitos: MITOS.length,
  sinEquipo: EJERCICIOS.filter(e => e.equipment.includes('ninguno')).length,
  silenciosos: EJERCICIOS.filter(e => e.impact < 2 && e.noise < 2).length,
};
perfMark('catalog-ready'); // perf:R1
