import { porId, rutinaPorId, programaPorId, salaPorId } from '../data/catalog';
import { nombreVisible } from '../data/nombresVisibles';
import type { IconoOpcion } from '../components/ui/OpcionCuestionario';
import { comillasLatinas, textoVisible } from './presentacion';

/**
 * Ayudas de la pestana Aprender (solo vista). No cambian ningun dato ni su orden.
 */

/** Palabras por minuto con las que se estima el tiempo de lectura de un articulo. */
export const PALABRAS_POR_MINUTO = 200;

/** Minutos de lectura: las palabras del cuerpo entre 200, hacia arriba, minimo 1. */
export function tiempoDeLectura(cuerpo: string): number {
  const palabras = cuerpo.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palabras / PALABRAS_POR_MINUTO));
}

/** Un texto del catalogo listo para leer: con sus tildes, la primera letra en mayuscula y comillas latinas. */
export const textoDeLectura = (texto: string): string => comillasLatinas(textoVisible(texto));

/** Icono de linea de cada categoria de los tips. */
const ICONOS_SALA: Record<string, IconoOpcion> = {
  sala_empezar: 'flag-outline',
  sala_tecnica: 'construct-outline',
  sala_constancia: 'calendar-outline',
  sala_dolor: 'bandage-outline',
  sala_mandibula: 'happy-outline',
  sala_postura: 'body-outline',
  sala_running: 'footsteps-outline',
  sala_alimentacion: 'nutrition-outline',
  sala_descanso: 'moon-outline',
};
export const iconoDeSala = (id: string): IconoOpcion => ICONOS_SALA[id] ?? 'book-outline';

/** El nombre de una categoria en tipo oracion y con tildes («Tecnica» → «Técnica»). */
export const nombreDeSala = (id: string): string => {
  const sala = salaPorId.get(id);
  return sala ? textoVisible(sala.name) : '';
};

export type TipoRelacionado = 'programa' | 'rutina' | 'ejercicio';

/** Algo relacionado con un articulo o un mito, con el nombre real y a donde lleva. */
export interface RelacionadoVista { id: string; tipo: TipoRelacionado; nombre: string }

/** La ruta a la que lleva cada tipo de relacionado (con `{ id }`), las mismas de siempre. */
export const RUTA_DE_RELACIONADO: Record<TipoRelacionado, 'Ejercicio' | 'Rutina' | 'Programa'> = {
  ejercicio: 'Ejercicio', rutina: 'Rutina', programa: 'Programa',
};

/**
 * Los relacionados que se pueden abrir, en el orden del dato: ejercicios, rutinas (`rt_`) y
 * programas (`pg_`) que existen en el catalogo, con su nombre real. Los ids de familia, de
 * estructura o de otro articulo no tienen a donde llevar y se omiten, como siempre.
 */
export function relacionadosVista(ids: readonly string[]): RelacionadoVista[] {
  return ids.flatMap((id): RelacionadoVista[] => {
    const e = porId.get(id);
    if (e) return [{ id, tipo: 'ejercicio', nombre: textoVisible(e.name) }];
    const r = id.startsWith('rt_') ? rutinaPorId.get(id) : undefined;
    if (r) return [{ id, tipo: 'rutina', nombre: nombreVisible(r.name) }];
    const p = id.startsWith('pg_') ? programaPorId.get(id) : undefined;
    if (p) return [{ id, tipo: 'programa', nombre: nombreVisible(p.name) }];
    return [];
  });
}

export interface Termino { termino: string; def: string }
export interface TramoLetra { letra: string; terminos: Termino[] }

/** La letra con la que se ordena un termino: la primera, en mayuscula y sin tilde. */
export const letraDe = (termino: string): string =>
  termino.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase();

/**
 * Tramos seguidos de terminos con la misma letra, **en el orden que traen** (no se ordena nada). El
 * glosario del dato son dos bloques alfabeticos, asi que una letra puede volver a salir mas abajo.
 */
export function agruparPorLetra(terminos: readonly Termino[]): TramoLetra[] {
  const tramos: TramoLetra[] = [];
  for (const t of terminos) {
    const letra = letraDe(t.termino);
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.letra === letra) ultimo.terminos.push(t);
    else tramos.push({ letra, terminos: [t] });
  }
  return tramos;
}

export type PedazoTexto = string | { tipo: 'ok' | 'parcial' | 'mito'; texto: string };

const INSIGNIAS: Record<string, 'ok' | 'parcial' | 'mito'> = { Comprobado: 'ok', Parcial: 'parcial', Mito: 'mito' };

/**
 * Parte un texto en trozos: lo que es texto y las palabras «Comprobado», «Parcial» y «Mito», que
 * se muestran como insignias en linea. Solo cambia como se ve; el texto completo es el mismo.
 */
export function partirInsignias(texto: string): PedazoTexto[] {
  return texto
    .split(/\b(Comprobado|Parcial|Mito)\b/)
    .map((trozo, i): PedazoTexto => (i % 2 === 1 ? { tipo: INSIGNIAS[trozo], texto: trozo } : trozo))
    .filter(t => t !== '');
}
