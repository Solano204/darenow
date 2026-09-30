/**
 * DARENOW · datos de Aprender
 *
 * Mitos, errores de ejecucion, nutricion, glosario y preguntas frecuentes. Solo los usa Aprender:
 * viven aparte de catalog.ts para que no se evaluen al arrancar.
 */

import myths from '../../assets/data/31_myths_errors.json';
import nutrition from '../../assets/data/32_nutrition.json';
import glossary from '../../assets/data/33_glossary_faq.json';
import type { ErrorEjecucion, Mito } from './catalog';

export const MITOS = (myths as unknown as { mitos: Mito[] }).mitos;
export const ERRORES = (myths as unknown as { errores_de_ejecucion_mas_frecuentes: ErrorEjecucion[] })
  .errores_de_ejecucion_mas_frecuentes;
export const NUTRICION = (nutrition as unknown as {
  conceptos: { id: string; titulo: string; nivel: string; cuerpo: string; implicacion: string }[];
  lo_que_la_app_no_hace: string[];
  principio_de_diseno: string;
  aviso: string;
});
export const GLOSARIO = (glossary as unknown as { glosario: { termino: string; def: string }[] }).glosario;
export const FAQ = (glossary as unknown as { faq: { p: string; r: string }[] }).faq;
