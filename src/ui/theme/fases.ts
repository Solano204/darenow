import { paleta } from './colors';

/** Fases del reproductor, tal como las emite `playerMachine` (se repite el tipo para que el tema no dependa de la sesion). */
export type FaseId = 'preparado' | 'trabajo' | 'cambio_lado' | 'descanso' | 'pausa' | 'fin';

/** Las tres «atmosferas» de la sesion: el cambio de lado se ve como preparacion y la pausa conserva la de la fase que interrumpe. */
export type FaseVisual = 'preparado' | 'trabajo' | 'descanso';

/**
 * Excepcion documentada a la regla del azul unico (ver DESIGN.md): dentro del
 * reproductor la fase se lee de lejos por el color de su placa. El fondo siempre
 * es `goma`; el color vive en el anillo, la palabra, el resplandor y la placa
 * actual de la barra de progreso.
 */
export const COLOR_FASE: Record<FaseVisual, string> = {
  preparado: paleta.placaAmarilla,
  trabajo: paleta.placaRoja,
  descanso: paleta.placaAzul,
};

/** Variante medida para texto pequeno (la roja y la azul puras no llegan a AA sobre goma). */
export const COLOR_TEXTO_FASE: Record<FaseVisual, string> = {
  preparado: paleta.placaAmarilla,
  trabajo: paleta.placaRojaTexto,
  descanso: paleta.placaAzulTexto,
};

export const ORDEN_FASE: FaseVisual[] = ['preparado', 'trabajo', 'descanso'];

/** Textos de cada fase. Son los mismos que lee la voz. */
export const PALABRA_FASE: Record<FaseId, string> = {
  preparado: 'Prepárate',
  trabajo: 'Trabaja',
  cambio_lado: 'Cambia de lado',
  descanso: 'Descansa',
  pausa: 'En pausa',
  fin: 'Terminaste',
};

export function faseVisual(fase: FaseId, anterior: FaseId | null): FaseVisual {
  switch (fase) {
    case 'trabajo': return 'trabajo';
    case 'descanso': return 'descanso';
    case 'pausa': return anterior && anterior !== 'pausa' ? faseVisual(anterior, null) : 'preparado';
    case 'fin': return 'trabajo';
    default: return 'preparado';
  }
}

/** `#RRGGBB` con transparencia `a` (0 a 1). Para bordes y degradados de un color de placa sin escribir rgba a mano. */
export function conAlfa(hex: string, a: number): string {
  const canal = Math.round(Math.min(1, Math.max(0, a)) * 255).toString(16).padStart(2, '0');
  return `${hex}${canal}`;
}
