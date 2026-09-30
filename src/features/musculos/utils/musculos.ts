import type { EjercicioIndice, MusculoIndice } from '@/data/catalog';
import { textoDeEtiqueta, textoVisible } from '@/lib/presentacion';

/**
 * Ayudas de la ficha de musculo (solo vista). No cambian ningun dato ni su orden.
 */

/** Un musculo citado por otro (sinergico o antagonista). `musculo` falta si el dato cita un id que no existe (BUG-13). */
export interface Relacionado {
  id: string;
  nombre: string;
  musculo?: MusculoIndice;
}

/**
 * Los musculos relacionados en el orden del dato. Un id que no esta en el catalogo se conserva
 * con un nombre legible («supraespinoso» → «Supraespinoso») y sin `musculo`: se muestra, pero no
 * hay nada que abrir.
 */
export function relacionados(ids: readonly string[] | undefined, porId: ReadonlyMap<string, MusculoIndice>): Relacionado[] {
  return (ids ?? []).map(id => {
    const musculo = porId.get(id);
    return { id, nombre: musculo ? textoVisible(musculo.name) : textoDeEtiqueta(id), musculo };
  });
}

/** Los ejercicios donde el musculo es principal y donde es secundario, en el orden del catalogo. */
export function ejerciciosDeMusculo(id: string, ejercicios: readonly EjercicioIndice[]): { principales: EjercicioIndice[]; secundarios: EjercicioIndice[] } {
  return {
    principales: ejercicios.filter(e => e.primary.includes(id)),
    secundarios: ejercicios.filter(e => e.secondary.includes(id)),
  };
}
