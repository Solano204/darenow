/**
 * Lo que Ajustes ofrece elegir, separado de la pantalla para poder probarlo sin React Native: las lesiones y
 * condiciones (los ids son los que citan las contraindicaciones del catalogo), los espacios de entrenamiento y que
 * equipo se lista. Nada de esto cambia lo que se guarda.
 */

export const ESPACIOS = ['minimo', 'colchoneta', 'amplio'] as const;
export type Espacio = (typeof ESPACIOS)[number];

/** Lo que se ve de cada espacio (el id crudo, «minimo», no se muestra). */
export const ETIQUETAS_ESPACIO: Record<Espacio, string> = { minimo: 'Mínimo', colchoneta: 'Colchoneta', amplio: 'Amplio' };

/** Posicion del espacio en el control de tres; un valor que no se conoce cae en la primera. */
export const indiceDeEspacio = (espacio: string): 0 | 1 | 2 => {
  const i = (ESPACIOS as readonly string[]).indexOf(espacio);
  return (i < 0 ? 0 : i) as 0 | 1 | 2;
};

/** Lesiones y condiciones: el id que se guarda en `perfil.contra` y el nombre que se ve. */
export const LESIONES: readonly (readonly [string, string])[] = [
  ['lesion_cuello', 'Cuello'], ['lesion_hombro', 'Hombro'], ['lesion_codo', 'Codo'],
  ['lesion_muneca', 'Muñeca'], ['lesion_lumbar', 'Espalda baja'], ['hernia_discal', 'Hernia discal'],
  ['lesion_cadera', 'Cadera'], ['lesion_rodilla', 'Rodilla'], ['lesion_tobillo', 'Tobillo'],
  ['problema_atm', 'Mandíbula (ATM)'], ['embarazo', 'Embarazo'], ['postparto', 'Postparto'],
  ['hipertension', 'Tensión alta'], ['vertigo', 'Mareos'],
];

/** El equipo que se puede marcar en Ajustes: el del cuestionario, sin «Sin equipo» (que siempre cuenta). */
export const equipoElegible = <T extends { id: string; onboarding?: boolean }>(equipo: readonly T[]): T[] =>
  equipo.filter(e => e.onboarding && e.id !== 'ninguno');

/** Cuantos de `ids` estan marcados. Un id guardado que ya no se lista no cuenta. */
export const contarMarcados = (marcados: readonly string[], ids: readonly string[]): number =>
  ids.filter(id => marcados.includes(id)).length;
