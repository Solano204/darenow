/**
 * DARENOW · retos, logros y mediciones
 *
 * Los usan Yo, Retos, Mediciones y el Resumen de la sesion: viven aparte de catalog.ts para que no
 * se evaluen al arrancar.
 */

import challenges from '../../assets/data/40_challenges_achievements.json';
import measurements from '../../assets/data/41_measurements.json';
import type { Logro, Protocolo, Reto } from './catalog';

export const RETOS = (challenges as unknown as { retos: Reto[] }).retos;
export const LOGROS = (challenges as unknown as { logros: Logro[] }).logros;
export const MEDICIONES = (measurements as unknown as { protocolos: Protocolo[] }).protocolos;
export const logroPorId = new Map(LOGROS.map(l => [l.id, l]));
