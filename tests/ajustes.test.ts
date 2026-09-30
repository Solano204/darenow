/**
 * Pruebas de Ajustes: que las opciones que se ofrecen sean las que el resto de la app entiende (lesiones que citan
 * los ejercicios, espacios del catalogo, equipo del cuestionario), los contadores y las tildes de lo que se ve.
 * esbuild --bundle --platform=node --format=cjs tests/ajustes.test.ts | node
 */

import { EJERCICIOS, EQUIPO, GOALS, ESTADISTICAS, nombreGoal } from '@/data/catalog';
import { textoVisible } from '@/lib/presentacion';
import { plural } from '@/lib/plural';
import {
  ESPACIOS, ETIQUETAS_ESPACIO, indiceDeEspacio, LESIONES, equipoElegible, contarMarcados,
} from '@/utils/ajustes';

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};

console.log('\n--- Lesiones y condiciones ---');
{
  const ids = LESIONES.map(([id]) => id);
  const citadas = new Set(EJERCICIOS.flatMap(e => e.contra));
  c('hay 14 opciones y ningún id se repite', ids.length === 14 && new Set(ids).size === 14, String(ids.length));
  c('cada opción la citan ejercicios del catálogo (marcarla sí filtra algo)', ids.every(id => citadas.has(id)), ids.filter(id => !citadas.has(id)).join(', '));
  c('toda contraindicación del catálogo se puede marcar en Ajustes', [...citadas].every(id => ids.includes(id)), [...citadas].filter(id => !ids.includes(id)).join(', '));
  c('cada opción trae su nombre', LESIONES.every(([, nombre]) => nombre.trim().length > 0));
  c('los nombres ya llevan sus tildes', LESIONES.every(([, nombre]) => textoVisible(nombre) === nombre) && !LESIONES.some(([, nombre]) => /\b(Muneca|Mandibula|Tension)\b/.test(nombre)));
}

console.log('\n--- Espacio ---');
{
  const usados = new Set<string>(EJERCICIOS.map(e => e.space));
  c('los tres espacios son los que usa el catálogo', [...usados].every(e => (ESPACIOS as readonly string[]).includes(e)) && ESPACIOS.every(e => usados.has(e)), [...usados].join(', '));
  c('cada espacio se ve con mayúscula y tilde, no con el id crudo', ETIQUETAS_ESPACIO.minimo === 'Mínimo' && ETIQUETAS_ESPACIO.colchoneta === 'Colchoneta' && ETIQUETAS_ESPACIO.amplio === 'Amplio');
  c('la posición en el control sigue el orden de los ids', indiceDeEspacio('minimo') === 0 && indiceDeEspacio('colchoneta') === 1 && indiceDeEspacio('amplio') === 2);
  c('un espacio que no se conoce cae en la primera posición', indiceDeEspacio('enorme') === 0 && indiceDeEspacio('') === 0);
}

console.log('\n--- Equipo ---');
{
  const lista = equipoElegible(EQUIPO);
  c('se listan 19 equipos y «Sin equipo» no es uno', lista.length === 19 && !lista.some(e => e.id === 'ninguno'), String(lista.length));
  c('solo equipo del cuestionario (silla, pared y espejo no)', lista.every(e => e.onboarding) && !lista.some(e => ['silla', 'pared', 'espejo'].includes(e.id)));
  c('cada equipo tiene nombre y ningún id se repite', lista.every(e => e.name.length > 0) && new Set(lista.map(e => e.id)).size === lista.length);
  const visibles = lista.flatMap(e => [e.name, e.sustituto_casero ?? '']);
  const sinTilde = visibles.filter(t => /\b(olimpica|elastica|escalon|plastico|rigida|maquina|jalon|nordico)\b/i.test(t));
  c('los nombres y las alternativas se ven con sus tildes', sinTilde.length === 0, sinTilde.slice(0, 3).join(' | '));
  c('el texto que se muestra no cambia con el mapa de tildes', visibles.every(t => textoVisible(t) === t), visibles.find(t => textoVisible(t) !== t) ?? '');
  c('«Si no tienes» solo sale donde hay alternativa (16 de 19)', lista.filter(e => e.sustituto_casero).length === 16, String(lista.filter(e => e.sustituto_casero).length));
}

console.log('\n--- Contadores ---');
{
  const ids = equipoElegible(EQUIPO).map(e => e.id);
  c('0 marcados', contarMarcados([], ids) === 0);
  c('cuenta solo los que se listan (un id viejo no suma)', contarMarcados(['mancuernas', 'kettlebell', 'ya_no_existe', 'silla'], ids) === 2);
  c('todos marcados', contarMarcados(ids, ids) === ids.length);
  c('«1 marcada», «2 marcadas», «0 marcadas»', plural(1, 'marcada', 'marcadas') === 'marcada' && plural(2, 'marcada', 'marcadas') === 'marcadas' && plural(0, 'marcada', 'marcadas') === 'marcadas');
  c('las lesiones marcadas cuentan las de la lista', contarMarcados(['lesion_rodilla', 'embarazo', 'otra'], LESIONES.map(([id]) => id)) === 2);
}

console.log('\n--- Objetivo y catálogo ---');
{
  c('los 8 objetivos se ven con su tilde', GOALS.length === 8 && nombreGoal('musculo') === 'Ganar músculo' && nombreGoal('mandibula') === 'Mandíbula y rostro' && textoVisible(nombreGoal('musculo')) === 'Ganar músculo');
  c('un objetivo que no existe se ve como su id', nombreGoal('otro') === 'otro');
  const cifras = [ESTADISTICAS.ejercicios, ESTADISTICAS.sinEquipo, ESTADISTICAS.silenciosos, ESTADISTICAS.musculos, ESTADISTICAS.rutinas, ESTADISTICAS.programas, ESTADISTICAS.tips, ESTADISTICAS.mitos];
  c('las ocho cifras del catálogo son enteros y ninguna es 0', cifras.every(n => Number.isInteger(n) && n > 0), cifras.join(', '));
  c('sin equipo y aptos sin saltos son partes del total de ejercicios', ESTADISTICAS.sinEquipo <= ESTADISTICAS.ejercicios && ESTADISTICAS.silenciosos <= ESTADISTICAS.ejercicios);
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
if (fallos > 0) process.exit(1);
