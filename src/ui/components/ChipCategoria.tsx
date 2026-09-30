import React from 'react';
import { ChipFiltro } from './ChipFiltro';

/**
 * Categoria del segmento Ejercicios (Todo, Fuerza, Cardio...): un chip compacto de
 * 32 px, solo texto y sin icono, para que se distinga de la fila de objetivos (36 px,
 * con icono). Mismo relleno desde el punto de toque.
 */
export function ChipCategoria({ texto, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  return <ChipFiltro texto={texto} activo={activo} onPress={onPress} variante="categoria" />;
}
