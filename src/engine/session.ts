/**
 * FORJA · motor de sesion
 *
 * Mismo comportamiento que la version SQL, sobre arrays en memoria.
 *
 * Orden de filtrado, que no se altera:
 *   contraindicaciones -> equipo -> modo sin saltos -> espacio -> vetos
 *
 * Las contraindicaciones NUNCA se relajan. Si falta material, primero se
 * amplia el espacio y despues el nivel, y el usuario se entera.
 */

import { EJERCICIOS, porId, type Ejercicio } from '../data/catalog';

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

const EQUIPO_BASE = ['ninguno', 'pared', 'silla'];
const MINIMO_POR_PATRON = 6;

const ROTACION: Record<string, string[]> = {
  bajar_peso: ['rodilla_bilateral', 'empuje_horizontal', 'cadera_bisagra', 'locomocion',
               'rodilla_unilateral', 'antiextension', 'traccion_horizontal', 'pliometrico'],
  musculo:    ['rodilla_bilateral', 'empuje_horizontal', 'cadera_bisagra', 'traccion_horizontal',
               'rodilla_unilateral', 'empuje_vertical', 'traccion_vertical', 'antiextension'],
  gym:        ['rodilla_bilateral', 'empuje_horizontal', 'cadera_bisagra', 'traccion_vertical',
               'empuje_vertical', 'traccion_horizontal', 'rodilla_unilateral', 'antiextension'],
  calistenia: ['traccion_vertical', 'empuje_horizontal', 'rodilla_unilateral', 'antiextension',
               'empuje_vertical', 'traccion_horizontal', 'locomocion'],
  cardio:     ['locomocion', 'pliometrico', 'rodilla_bilateral', 'antiextension', 'empuje_horizontal'],
  running:    ['tecnica_carrera', 'cadera_bisagra', 'rodilla_unilateral', 'antiflexion_lateral',
               'locomocion', 'antiextension'],
  postura:    ['movilidad_toracica', 'traccion_horizontal', 'descompresion_axial',
               'movilidad_cadera', 'antiextension', 'isometrico_facial'],
  mandibula:  ['isometrico_facial', 'isometrico_facial', 'isometrico_facial'],
};

/* ------------------------------------------------------------------ */

interface Filtro {
  patron?: string;
  categorias?: string[];
  relajarEspacio?: boolean;
  relajarNivel?: boolean;
  objetivo?: string;
}

export function ejerciciosValidos(p: Perfil, f: Filtro = {}): Ejercicio[] {
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

/** Igual que arriba, pero relaja filtros si el patron se queda corto. */
function conRelajacion(p: Perfil, f: Filtro): { items: Ejercicio[]; relajado: string[] } {
  const relajado: string[] = [];
  let items = ejerciciosValidos(p, f);

  // Primero el nivel: un ejercicio de nivel 3 se puede hacer mas facil.
  if (items.length < MINIMO_POR_PATRON) {
    const ampliado = ejerciciosValidos(p, { ...f, relajarNivel: true });
    if (ampliado.length > items.length) { items = ampliado; relajado.push('nivel'); }
  }

  // El espacio solo se amplia si declaro colchoneta. A quien dijo que solo
  // tiene sitio para estar de pie no se le propone una zancada caminando:
  // no es una preferencia, es que no cabe.
  if (items.length < MINIMO_POR_PATRON && p.espacio !== 'minimo') {
    const ampliado = ejerciciosValidos(p, { ...f, relajarNivel: true, relajarEspacio: true });
    if (ampliado.length > items.length) { items = ampliado; relajado.push('espacio'); }
  }
  return { items, relajado };
}

/* ------------------------------------------------------------------ */

export function duracion(it: ItemSesion): number {
  const trabajo = it.segPlan ?? (it.repsPlan ?? 10) * 3;
  const lados = it.unilateral || it.measure === 'reps_por_lado' ? 2 : 1;
  return (trabajo * lados + it.descansoPlan) * it.seriesPlan;
}

function kcal(it: ItemSesion, pesoKg: number): number {
  return (it.met * 3.5 * pesoKg / 200) * (duracion(it) / 60);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Mezcla id y semilla de verdad. Concatenar el numero al texto no servia:
 * "ex_1001"+2024 y "ex_1001"+2025 desplazan el hash de todos los ids por la
 * misma cantidad, asi que el orden relativo salia identico y dos dias
 * distintos daban la misma sesion.
 */
function mezcla(id: string, semilla: number): number {
  let h = hash(id) ^ Math.imul(semilla >>> 0, 2654435761);
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13;
  return h >>> 0;
}

function elegirVariado(pool: Ejercicio[], n: number, semilla: number): Ejercicio[] {
  const barajado = [...pool].sort((a, b) => mezcla(a.id, semilla) - mezcla(b.id, semilla));
  const salida: Ejercicio[] = [];
  const familias = new Set<string>();
  for (const e of barajado) {
    if (salida.length >= n) break;
    if (familias.has(e.family)) continue;
    salida.push(e); familias.add(e.family);
  }
  for (const e of barajado) {
    if (salida.length >= n) break;
    if (!salida.includes(e)) salida.push(e);
  }
  return salida;
}

/** Tope de segundos por serie segun el bloque. */
const TOPE_SEG = { calentamiento: 45, principal: 90, enfriamiento: 45 } as const;

export function aItem(e: Ejercicio, bloque: ItemSesion['bloque']): ItemSesion {
  const seg = e.default.seg ?? null;
  return {
    ...e,
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

/* ------------------------------------------------------------------ */

export function armarSesion(
  p: Perfil,
  semilla = Date.now(),
  ultimaVezDe?: (id: string) => ItemSesion['ultimaVez'],
): Sesion {
  const avisos: string[] = [];
  const objetivoS = p.minPorSesion * 60;
  const items: ItemSesion[] = [];

  // Calentamiento.
  const usados = new Set<string>();   // global a la sesion: nada se repite

  const nCal = p.minPorSesion <= 10 ? 1 : p.minPorSesion <= 25 ? 2 : 3;
  const cal = ejerciciosValidos(p, { categorias: ['movilidad'], objetivo: '' });
  for (const e of elegirVariado(cal, nCal, semilla)) {
    usados.add(e.id);
    const it = aItem(e, 'calentamiento');
    it.seriesPlan = 1; it.descansoPlan = 10;
    if (it.segPlan == null && it.repsPlan == null) it.segPlan = 30;
    items.push(it);
  }

  // Principal.
  const patrones = ROTACION[p.objetivo] ?? ROTACION.bajar_peso;
  const nPrincipal = Math.max(3, Math.min(8, Math.round(p.minPorSesion / 4)));

  for (let i = 0; i < patrones.length * 3; i++) {
    if (items.filter(x => x.bloque === 'principal').length >= nPrincipal) break;
    const patron = patrones[i % patrones.length];
    const { items: pool, relajado } = conRelajacion(p, { patron });
    if (relajado.length && !avisos.length) {
      avisos.push(relajado.includes('espacio')
        ? 'Ampliamos el filtro de espacio para completar la sesión.'
        : 'Incluimos algún ejercicio de otro nivel para completar la sesión.');
    }
    const libre = pool.filter(e => !usados.has(e.id));
    if (!libre.length) continue;
    const [elegido] = elegirVariado(libre, 1, semilla + i);
    usados.add(elegido.id);
    items.push(aItem(elegido, 'principal'));
  }

  // Si el objetivo no dio material, se completa sin filtrar por objetivo.
  if (items.filter(x => x.bloque === 'principal').length < 3) {
    const extra = ejerciciosValidos(p, { objetivo: '', categorias: ['fuerza', 'cardio'] })
      .filter(e => !usados.has(e.id));
    for (const e of elegirVariado(extra, 3, semilla)) {
      if (items.filter(x => x.bloque === 'principal').length >= 3) break;
      usados.add(e.id);
      items.push(aItem(e, 'principal'));
    }
  }

  // Enfriamiento.
  const nEnf = p.minPorSesion <= 10 ? 1 : 2;
  const enf = ejerciciosValidos(p, { categorias: ['estiramiento'], objetivo: '' })
    .filter(e => !usados.has(e.id));
  for (const e of elegirVariado(enf, nEnf, semilla + 99)) {
    usados.add(e.id);
    const it = aItem(e, 'enfriamiento');
    it.seriesPlan = 1; it.descansoPlan = 5;
    if (it.segPlan == null && it.repsPlan == null) it.segPlan = 30;
    items.push(it);
  }

  // Ajuste al tiempo declarado: recorta series antes que bloques.
  // Ajuste al tiempo declarado, en cuatro escalones y en este orden:
  // bajar series -> quitar ejercicios -> acortar descansos -> ultima serie.
  // Nunca se toca el calentamiento ni el enfriamiento antes que el bloque
  // principal: llegar tarde al estiramiento es peor que hacer una serie menos.
  const total = () => items.reduce((s, it) => s + duracion(it), 0);
  let guardia = 0;

  while (total() > objetivoS && guardia++ < 80) {
    const conMargen = items.filter(x => x.bloque === 'principal' && x.seriesPlan > 2);
    if (!conMargen.length) break;
    conMargen.sort((a, b) => b.seriesPlan - a.seriesPlan)[0].seriesPlan -= 1;
  }
  while (total() > objetivoS && items.filter(x => x.bloque === 'principal').length > 3) {
    items.splice(items.map(x => x.bloque).lastIndexOf('principal'), 1);
  }
  while (total() > objetivoS && guardia++ < 160) {
    const conDescanso = items.filter(x => x.bloque === 'principal' && x.descansoPlan > 20);
    if (!conDescanso.length) break;
    conDescanso.sort((a, b) => b.descansoPlan - a.descansoPlan)[0].descansoPlan -= 5;
  }
  while (total() > objetivoS && guardia++ < 240) {
    const conSeries = items.filter(x => x.bloque === 'principal' && x.seriesPlan > 1);
    if (!conSeries.length) break;
    conSeries.sort((a, b) => b.seriesPlan - a.seriesPlan)[0].seriesPlan -= 1;
  }

  if (ultimaVezDe) for (const it of items) it.ultimaVez = ultimaVezDe(it.id);
  const totalFinal = total();

  return {
    rutinaId: null,
    nombre: 'Tu sesión de hoy',
    items,
    minutosEstimados: Math.max(1, Math.round(totalFinal / 60)),
    kcalEstimadas: p.pesoKg ? Math.round(items.reduce((s, it) => s + kcal(it, p.pesoKg!), 0)) : null,
    avisos,
  };
}

/** Arma una sesion a partir de una rutina del catalogo. */
export function sesionDeRutina(
  rutinaId: string,
  p: Perfil,
  rutina: { name: string; bloques: { tipo: string; items: string[] }[]; kcal_aprox_70kg: number },
  ultimaVezDe?: (id: string) => ItemSesion['ultimaVez'],
): Sesion {
  const contra = new Set(p.contra);
  const items: ItemSesion[] = [];
  const avisos: string[] = [];
  let quitados = 0;

  for (const b of rutina.bloques) {
    for (const id of b.items) {
      const e = porId.get(id);
      if (!e) continue;
      // Aunque venga de una rutina fija, las lesiones mandan.
      if (e.contra.some(c => contra.has(c))) {
        const sust = e.substitutes.map(s => porId.get(s))
          .find(s => s && !s.contra.some(c => contra.has(c)));
        if (sust) { items.push(aItem(sust, b.tipo as ItemSesion['bloque'])); }
        quitados++;
        continue;
      }
      items.push(aItem(e, b.tipo as ItemSesion['bloque']));
    }
  }
  if (quitados) {
    avisos.push(`Cambiamos ${quitados} ejercicio${quitados > 1 ? 's' : ''} por tus lesiones declaradas.`);
  }

  if (ultimaVezDe) for (const it of items) it.ultimaVez = ultimaVezDe(it.id);
  const total = items.reduce((s, it) => s + duracion(it), 0);

  return {
    rutinaId,
    nombre: rutina.name,
    items,
    minutosEstimados: Math.max(1, Math.round(total / 60)),
    kcalEstimadas: p.pesoKg
      ? Math.round(rutina.kcal_aprox_70kg * (p.pesoKg / 70))
      : null,
    avisos,
  };
}

/** Sustituto valido para el boton de cambiar en caliente. */
export function sustituir(p: Perfil, ejercicioId: string, yaEnSesion: string[]): Ejercicio | null {
  const e = porId.get(ejercicioId);
  if (!e) return null;
  const validos = new Set(ejerciciosValidos(p, { objetivo: '' }).map(x => x.id));

  const declarado = e.substitutes
    .map(s => porId.get(s))
    .find(s => s && validos.has(s.id) && !yaEnSesion.includes(s.id));
  if (declarado) return declarado;

  const mismoPatron = ejerciciosValidos(p, { patron: e.patron, objetivo: '' })
    .find(x => x.id !== ejercicioId && !yaEnSesion.includes(x.id));
  return mismoPatron ?? null;
}

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
