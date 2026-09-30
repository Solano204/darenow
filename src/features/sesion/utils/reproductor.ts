import { PREPARACION_S } from '@/features/sesion/utils/playerMachine';
import type { ItemSesion } from '@/lib/engine/session';
import type { FaseId } from '@/ui/theme';

/** Segundos del cambio de lado (el total del anillo en esa fase). */
const CAMBIO_LADO_S = 5;

/** "1 minuto 5 segundos", para que un lector de pantalla no deletree "1:05". */
export const segundosHablados = (s: number) => {
  const m = Math.floor(s / 60), r = s % 60;
  const min = m > 0 ? `${m} minuto${m === 1 ? '' : 's'}` : '';
  const seg = r > 0 || m === 0 ? `${r} segundo${r === 1 ? '' : 's'}` : '';
  return [min, seg].filter(Boolean).join(' ');
};

/** Nombre del ejercicio que viene tras la serie actual: el mismo si quedan series, si no el siguiente. */
export function nombreSiguiente(items: ItemSesion[], i: number, serie: number): string {
  const it = items[i];
  if (serie < it.seriesPlan) return it.name;
  return items[i + 1]?.name ?? 'Último esfuerzo';
}

export function totalDeFase(fase: FaseId, it: ItemSesion): number | null {
  switch (fase) {
    case 'preparado': return PREPARACION_S;
    case 'cambio_lado': return CAMBIO_LADO_S;
    case 'trabajo': return it.segPlan;
    case 'descanso': return it.descansoPlan;
    default: return null;
  }
}
