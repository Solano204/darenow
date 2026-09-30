/**
 * FORJA · derivacion del perfil
 *
 * Convierte las respuestas del onboarding en el perfil que consume el motor.
 * Puro y sin dependencias de React Native, para poder probarlo con node.
 *
 * Lo que NO hace, a proposito: no calcula calorias objetivo, no proyecta un
 * peso futuro y no dibuja una fecha. Esa curva depende de la alimentacion,
 * que no medimos. Hay pruebas que fallan si alguien intenta anadirlo.
 */

import type { PerfilUsuario } from '@/state/store';

export type Rs = Record<string, unknown>;

const EQUIPO_GYM = ['mancuernas','barra','kettlebell','banco','banda_larga','banda_mini',
  'barra_dominadas','polea','maquina_jalon','prensa','maquina_pecho','maquina_femoral',
  'remo_maquina','colchoneta','rodillo','anillas_trx','fitball','cuerda','espejo'];

export function derivarNivel(exp: string): 1 | 2 | 3 {
  if (exp === 'constante') return 3;
  if (exp === 'algo') return 2;
  return 1; // sin experiencia y vuelta tras pausa arrancan abajo
}

export function elegirPrograma(objetivo: string, exp: string): string {
  if (exp === 'pausa') return 'pg_012';
  const m: Record<string, [string, string]> = {
    bajar_peso: ['pg_001', 'pg_002'], musculo: ['pg_003', 'pg_011'],
    gym: ['pg_004', 'pg_004'], calistenia: ['pg_009', 'pg_010'],
    mandibula: ['pg_005', 'pg_005'], postura: ['pg_006', 'pg_006'],
    running: ['pg_007', 'pg_008'], cardio: ['pg_001', 'pg_002'],
  };
  const par = m[objetivo] ?? m.bajar_peso;
  return exp === 'nada' ? par[0] : par[1];
}

export function avisosDe(objetivo: string, contra: string[], situacion: string[]): string[] {
  const a: string[] = [];
  if (objetivo === 'mandibula') a.push('Sobre el rostro: el trabajo facial sube el tono del músculo, y corregir la postura de la cabeza cambia el perfil de forma visible. Lo que no hace, y nadie puede hacer, es quemar grasa de una zona concreta ni mover el hueso.');
  if (objetivo === 'postura') a.push('Sobre la altura: el hueso no crece después de cerrarse las placas de crecimiento. Lo que sí se recupera es la altura que la postura te quita, normalmente entre uno y tres centímetros en ocho a doce semanas.');
  if (objetivo === 'bajar_peso') a.push('No vamos a ponerte una dieta ni a pedirte que cuentes calorías. El entrenamiento es una parte; la alimentación la ve mejor un profesional que pueda verte.');
  if (contra.includes('problema_atm')) a.push('Quitamos todo el bloque de masticación. Si hay chasquido o dolor al abrir, eso lo ve un dentista.');
  if (contra.includes('hernia_discal') || contra.includes('lesion_lumbar')) a.push('Cambiamos los abdominales clásicos por trabajo de estabilidad, que es lo que se tolera mejor con molestia lumbar.');
  if (situacion.includes('embarazo') || situacion.includes('postparto')) a.push('Quitamos saltos e impacto. Aun así, conviene que un profesional te dé el visto bueno antes de empezar.');
  return a;
}

export function derivar(r: Rs): { perfil: PerfilUsuario; avisos: string[] } {
  const objetivo = (r.objetivo as string) ?? 'bajar_peso';
  const exp = (r.experiencia as string) ?? 'nada';
  const lugar = (r.lugar as string) ?? 'casa';
  const situacion = (r.situacion as string[]) ?? [];
  const enGym = lugar === 'gym';

  const contra = [...new Set([...((r.contra as string[]) ?? []), ...situacion])];

  return {
    perfil: {
      nombre: ((r.nombre as string) ?? '').trim(),
      objetivo,
      nivel: derivarNivel(exp),
      diasPorSemana: Number(r.diasPorSemana ?? 3),
      minPorSesion: Number(r.minPorSesion ?? 20),
      modoSinSaltos: enGym ? false : (r.ruido === 'no' || situacion.includes('embarazo') || situacion.includes('postparto')),
      espacio: enGym ? 'amplio' : ((r.espacio as PerfilUsuario['espacio']) ?? 'colchoneta'),
      equipo: enGym ? EQUIPO_GYM : ((r.equipo as string[]) ?? []),
      contra,
      vetos: [],
      programaId: elegirPrograma(objetivo, exp),
      pesoKg: r.pesoKg === undefined ? undefined : Number(r.pesoKg),
      pesoObjetivoKg: r.pesoObjetivoKg === undefined ? undefined : Number(r.pesoObjetivoKg),
      alturaCm: r.alturaCm === undefined ? undefined : Number(r.alturaCm),
      mostrarKcal: true, mostrarPeso: r.pesoKg !== undefined,
      sonido: true,
    },
    avisos: avisosDe(objetivo, contra, situacion),
  };
}

