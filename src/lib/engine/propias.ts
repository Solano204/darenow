import { porId, type Ejercicio } from '@/data/catalog';
import { EQUIPO_BASE, type ItemSesion, type Perfil, type Sesion } from './base';

/* ------------------------------------------------------------------ */
/* Rutinas creadas por el usuario                                      */
/* ------------------------------------------------------------------ */

export interface ItemPropio {
  ejercicioId: string;
  series: number;
  reps?: number;
  seg?: number;
  descansoS: number;
}

export interface RutinaPropia {
  id: string;
  nombre: string;
  objetivo: string;
  items: ItemPropio[];
  creada: string;
  editada: string;
  origen?: string;
}

/** Valores de arranque al meter un ejercicio en una rutina propia. */
export function itemPropioPorDefecto(e: Ejercicio): ItemPropio {
  return {
    ejercicioId: e.id,
    series: e.default.series ?? 3,
    reps: e.default.seg ? undefined : (e.default.reps ?? 10),
    seg: e.default.seg ?? undefined,
    descansoS: e.default.rest_s ?? 45,
  };
}

/** Minutos que dura una rutina propia, con la formula del reproductor. */
export function minutosPropios(items: ItemPropio[]): number {
  let total = 0;
  for (const it of items) {
    const e = porId.get(it.ejercicioId);
    if (!e) continue;
    const trabajo = it.seg ?? (it.reps ?? 10) * 3;
    const lados = e.unilateral || e.measure === 'reps_por_lado' ? 2 : 1;
    total += (trabajo * lados + it.descansoS) * it.series;
  }
  return Math.max(1, Math.round(total / 60));
}

/**
 * Avisos sobre una rutina propia.
 *
 * No bloquea nada: la rutina es del usuario y decide el. Pero si metio un
 * ejercicio que carga una lesion que el mismo declaro, tiene que enterarse
 * antes de empezar, no a mitad de la serie.
 */
export function revisarPropia(items: ItemPropio[], p: Perfil): string[] {
  const avisos: string[] = [];
  const equipo = new Set([...EQUIPO_BASE, ...p.equipo]);

  const conLesion = items
    .map(it => porId.get(it.ejercicioId))
    .filter((e): e is Ejercicio => !!e && e.contra.some(c => p.contra.includes(c)));
  if (conLesion.length) {
    avisos.push(
      `${conLesion.length === 1 ? 'Un ejercicio carga' : `${conLesion.length} ejercicios cargan`} una zona que marcaste como lesionada: ${conLesion.map(e => e.name).join(', ')}.`,
    );
  }

  const sinEquipo = items
    .map(it => porId.get(it.ejercicioId))
    .filter((e): e is Ejercicio => !!e && !e.equipment.every(q => equipo.has(q)));
  if (sinEquipo.length) {
    avisos.push(`Necesitas equipo que no declaraste tener: ${sinEquipo.map(e => e.name).join(', ')}.`);
  }

  if (p.modoSinSaltos) {
    const ruidosos = items
      .map(it => porId.get(it.ejercicioId))
      .filter((e): e is Ejercicio => !!e && (e.impact >= 2 || e.noise >= 2));
    if (ruidosos.length) {
      avisos.push(`Tienes activado el modo sin saltos y ${ruidosos.length === 1 ? 'hay un ejercicio con impacto' : `hay ${ruidosos.length} ejercicios con impacto`}.`);
    }
  }

  const sinCalentamiento = !items.some(it => {
    const e = porId.get(it.ejercicioId);
    return e?.category === 'movilidad' || e?.category === 'estiramiento';
  });
  if (items.length >= 4 && sinCalentamiento) {
    avisos.push('No hay movilidad ni estiramiento. Sugerencia, no obligación.');
  }

  return avisos;
}

/** Convierte una rutina propia en una sesion lista para el reproductor. */
export function sesionDePropia(
  r: RutinaPropia,
  p: Perfil,
  ultimaVezDe?: (id: string) => ItemSesion['ultimaVez'],
): Sesion {
  const items: ItemSesion[] = [];

  for (const it of r.items) {
    const e = porId.get(it.ejercicioId);
    if (!e) continue;   // el ejercicio ya no existe en el catalogo
    // Bloque segun la categoria, para que el reproductor lo ordene igual.
    const bloque: ItemSesion['bloque'] =
      e.category === 'movilidad' ? 'calentamiento'
      : e.category === 'estiramiento' ? 'enfriamiento'
      : 'principal';
    items.push({
      ...e,
      bloque,
      seriesPlan: it.series,
      repsPlan: it.reps ?? null,
      segPlan: it.seg ?? null,
      descansoPlan: it.descansoS,
    });
  }

  if (ultimaVezDe) for (const it of items) it.ultimaVez = ultimaVezDe(it.id);

  const total = items.reduce((s, it) => {
    const trabajo = it.segPlan ?? (it.repsPlan ?? 10) * 3;
    const lados = it.unilateral || it.measure === 'reps_por_lado' ? 2 : 1;
    return s + (trabajo * lados + it.descansoPlan) * it.seriesPlan;
  }, 0);

  const kcal = p.pesoKg
    ? Math.round(items.reduce((s, it) => {
        const trabajo = it.segPlan ?? (it.repsPlan ?? 10) * 3;
        const lados = it.unilateral || it.measure === 'reps_por_lado' ? 2 : 1;
        const seg = (trabajo * lados + it.descansoPlan) * it.seriesPlan;
        return s + (it.met * 3.5 * p.pesoKg! / 200) * (seg / 60);
      }, 0))
    : null;

  return {
    rutinaId: r.id,
    nombre: r.nombre || 'Mi rutina',
    items,
    minutosEstimados: Math.max(1, Math.round(total / 60)),
    kcalEstimadas: kcal,
    avisos: revisarPropia(r.items, p),
    origenPropia: true,
  };
}
