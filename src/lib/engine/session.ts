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

import { porId, type EjercicioIndice } from '@/data/catalog';
import {
  aItem, duracion, ejerciciosValidos, kcal, type Filtro, type ItemSesion, type Perfil, type Sesion,
} from './base';

export * from './base';
export * from './propias';

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

/** Igual que arriba, pero relaja filtros si el patron se queda corto. */
function conRelajacion(p: Perfil, f: Filtro): { items: EjercicioIndice[]; relajado: string[] } {
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

function elegirVariado(pool: EjercicioIndice[], n: number, semilla: number): EjercicioIndice[] {
  const barajado = [...pool].sort((a, b) => mezcla(a.id, semilla) - mezcla(b.id, semilla));
  const salida: EjercicioIndice[] = [];
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
export function sustituir(p: Perfil, ejercicioId: string, yaEnSesion: string[]): EjercicioIndice | null {
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
