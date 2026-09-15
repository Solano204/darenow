/**
 * Pruebas de la maquina del reproductor.
 * Ejecutar: esbuild --bundle --platform=node --format=cjs tests/player.test.ts | node
 */
import { crearReducer, estadoInicial } from '../src/session/playerMachine';
import type { ItemSesion } from '../src/engine/session';

let ok = 0, fallos = 0;
function comprobar(nombre: string, cond: boolean, detalle = '') {
  if (cond) { ok++; console.log(`  ok   ${nombre}`); }
  else { fallos++; console.log(`  FALLA ${nombre} ${detalle}`); }
}

function ej(p: Partial<ItemSesion>): ItemSesion {
  return {
    id: 'ex_x', slug: 'x', name: 'X', family: 'fam_x', category: 'fuerza',
    level: 1, impact: 0, noise: 0, space: 'minimo', unilateral: false,
    measure: 'reps', met: 5, series: 3, reps: 10, seg: null, rest_s: 30,
    descripcion: '', clip: '', thumb: '',
    bloque: 'principal', seriesPlan: 3, repsPlan: 10, segPlan: null,
    descansoPlan: 30, ...p,
  } as ItemSesion;
}

/** Corre n ticks sobre un estado. */
function ticks(red: any, e: any, n: number) {
  for (let i = 0; i < n; i++) e = red(e, { t: 'tick' });
  return e;
}

console.log('\n--- Ejercicio por tiempo ---');
{
  const items = [ej({ id: 'a', measure: 'tiempo', seg: 20, segPlan: 20, repsPlan: null, seriesPlan: 2 })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);

  comprobar('arranca en preparado', e.fase === 'preparado');
  comprobar("preparacion de 9 s", e.restanteS === 9);

  e = ticks(red, e, 9);
  comprobar('pasa a trabajo tras la preparacion', e.fase === 'trabajo', e.fase);
  comprobar('carga los 20 s del ejercicio', e.restanteS === 20, String(e.restanteS));

  e = ticks(red, e, 20);
  comprobar('al acabar el trabajo pasa a descanso', e.fase === 'descanso', e.fase);
  comprobar('registra la serie hecha', e.hechas.length === 1);
  comprobar('guarda los segundos trabajados', e.hechas[0].segundos === 20);
  comprobar('descanso de 30 s', e.restanteS === 30, String(e.restanteS));

  e = ticks(red, e, 30);
  comprobar('vuelve a preparado para la serie 2', e.fase === 'preparado' && e.serieNum === 2);

  e = ticks(red, e, 9 + 20);
  comprobar('tras la ultima serie termina la sesion', e.fase === 'fin', e.fase);
  comprobar('dos series registradas', e.hechas.length === 2);
}

console.log('\n--- Ejercicio por repeticiones ---');
{
  const items = [ej({ id: 'b', seriesPlan: 2 })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  e = ticks(red, e, 9);
  comprobar('entra a trabajo', e.fase === 'trabajo');

  e = ticks(red, e, 60);
  comprobar('por reps el reloj NO corta solo', e.fase === 'trabajo', e.fase);
  comprobar('el reloj cuenta hacia arriba', e.restanteS === 60, String(e.restanteS));

  e = red(e, { t: 'registrar', reps: 12, pesoKg: 15 });
  comprobar('registrar avanza a descanso', e.fase === 'descanso');
  comprobar('guarda las reps reales', e.hechas[0].reps === 12);
  comprobar('guarda el peso usado', e.hechas[0].pesoKg === 15);
}

console.log('\n--- Unilateral: dos lados por serie ---');
{
  const items = [ej({ id: 'c', unilateral: true, measure: 'reps_por_lado', seriesPlan: 1 })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  comprobar('empieza por el lado izquierdo', e.lado === 'izq');

  e = ticks(red, e, 9);
  e = red(e, { t: 'registrar', reps: 10 });
  comprobar('tras el izquierdo pide cambio de lado', e.fase === 'cambio_lado', e.fase);
  comprobar('cambia a lado derecho', e.lado === 'der');

  e = ticks(red, e, 9);
  comprobar('vuelve a trabajo con el otro lado', e.fase === 'trabajo');
  e = red(e, { t: 'registrar', reps: 10 });
  comprobar('con una sola serie y ambos lados, termina', e.fase === 'fin', e.fase);
  comprobar('registra los dos lados por separado', e.hechas.length === 2);
  comprobar('cada lado queda etiquetado',
    e.hechas[0].lado === 'izq' && e.hechas[1].lado === 'der');
}

console.log('\n--- Descanso: +20 s y saltar ---');
{
  const items = [ej({ id: 'd', seriesPlan: 2 })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  e = ticks(red, e, 9);
  e = red(e, { t: 'registrar', reps: 10 });
  comprobar('descanso inicial de 30 s', e.restanteS === 30);

  e = red(e, { t: 'masDescanso', seg: 20 });
  comprobar('+20 s suma al descanso', e.restanteS === 50, String(e.restanteS));

  e = red(e, { t: 'avanzar' });
  comprobar('"ya estoy" salta el descanso', e.fase === 'preparado', e.fase);
  comprobar('pasa a la serie 2', e.serieNum === 2);

  const antes = e.restanteS;
  e = red(e, { t: 'masDescanso', seg: 20 });
  comprobar('+20 s no hace nada fuera del descanso', e.restanteS === antes);
}

console.log('\n--- Pausa ---');
{
  const items = [ej({ id: 'e', measure: 'tiempo', seg: 30, segPlan: 30, repsPlan: null })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  e = ticks(red, e, 9 + 10);
  const restante = e.restanteS;

  e = red(e, { t: 'pausar' });
  comprobar('entra en pausa', e.fase === 'pausa');

  e = ticks(red, e, 30);
  comprobar('en pausa el reloj no corre', e.restanteS === restante, String(e.restanteS));

  e = red(e, { t: 'reanudar' });
  comprobar('reanuda en la fase donde estaba', e.fase === 'trabajo', e.fase);
  comprobar('conserva el tiempo restante', e.restanteS === restante);
}

console.log('\n--- Omitir deja constancia ---');
{
  const items = [ej({ id: 'f', seriesPlan: 2 }), ej({ id: 'g', seriesPlan: 1 })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  e = ticks(red, e, 9);
  e = red(e, { t: 'omitir' });
  comprobar('omitir registra la serie como omitida', e.hechas[0].omitida === true);
  comprobar('omitir no borra el historial', e.hechas.length === 1);
  comprobar('omitir avanza igual que terminar', e.fase === 'descanso', e.fase);
}

console.log('\n--- Sesion completa de varios ejercicios ---');
{
  const items = [
    ej({ id: 'h1', seriesPlan: 2 }),
    ej({ id: 'h2', measure: 'tiempo', seg: 15, segPlan: 15, repsPlan: null, seriesPlan: 1 }),
    ej({ id: 'h3', seriesPlan: 1 }),
  ];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  let guardia = 0;
  while (e.fase !== 'fin' && guardia++ < 2000) {
    e = e.fase === 'trabajo' && items[e.indice].segPlan === null
      ? red(e, { t: 'registrar', reps: 10 })
      : red(e, { t: 'tick' });
  }
  comprobar('la sesion llega al final', e.fase === 'fin', e.fase);
  comprobar('registra las 4 series planeadas', e.hechas.length === 4, String(e.hechas.length));
  comprobar('recorre los 3 ejercicios', new Set(e.hechas.map(h => h.ejercicioId)).size === 3);
  comprobar('acumula tiempo de descanso', e.descansoAcumuladoS > 0);
}

console.log('\n--- Saltar a un ejercicio concreto ---');
{
  const items = [ej({ id: 'i1' }), ej({ id: 'i2', unilateral: true })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  e = red(e, { t: 'irA', indice: 1 });
  comprobar('salta al ejercicio elegido', e.indice === 1);
  comprobar('reinicia el contador de series', e.serieNum === 1);
  comprobar('detecta que el nuevo es unilateral', e.lado === 'izq');
}

console.log('\n--- Deshacer ---');
{
  const items = [ej({ id: 'd1' })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  comprobar('no hay nada que deshacer al arrancar', e.anterior === null);

  e = ticks(red, e, 9);   // pasa a trabajo
  const antesDeRegistrar = e;
  e = red(e, { t: 'registrar', reps: 8 });
  comprobar('registrar deja una serie', e.hechas.length === 1);
  comprobar('registrar guarda una foto de antes', e.anterior !== null);

  e = red(e, { t: 'deshacer' });
  comprobar('deshacer borra la serie registrada', e.hechas.length === 0);
  comprobar('deshacer vuelve a la fase de antes', e.fase === antesDeRegistrar.fase, e.fase);
  comprobar('deshacer no encadena: ya no se puede volver a deshacer', e.anterior === null);
}
{
  const items = [ej({ id: 'd2' })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  e = ticks(red, e, 9);
  e = red(e, { t: 'omitir' });
  comprobar('omitir deja constancia', e.hechas.length === 1 && e.hechas[0].omitida);
  e = red(e, { t: 'deshacer' });
  comprobar('deshacer tambien revierte un omitir', e.hechas.length === 0);
}
{
  const items = [ej({ id: 'd3' }), ej({ id: 'd4' })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  e = ticks(red, e, 9);
  e = red(e, { t: 'registrar', reps: 5 });
  comprobar('hay algo que deshacer', e.anterior !== null);
  e = red(e, { t: 'irA', indice: 1 });
  comprobar('cambiar de ejercicio de un salto ya no permite deshacer lo anterior', e.anterior === null);
}

console.log('\n--- Avanzar reloj por tiempo real (sesion interrumpida) ---');
{
  const items = [ej({ id: 'r1', measure: 'tiempo', segPlan: 30, repsPlan: null })];
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  e = ticks(red, e, 9);
  comprobar('arranca el trabajo con 30 s', e.restanteS === 30, String(e.restanteS));

  e = red(e, { t: 'avanzarReloj', segundos: 10 });
  comprobar('resta los segundos reales transcurridos', e.restanteS === 20, String(e.restanteS));
  comprobar('suma al tiempo total de sesion', e.transcurridoS === 19, String(e.transcurridoS));

  e = red(e, { t: 'avanzarReloj', segundos: 999 });
  comprobar('nunca baja de cero', e.restanteS === 0, String(e.restanteS));
  comprobar('no encadena fases solo: falta el tick real', e.fase === 'trabajo', e.fase);
}
{
  const items = [ej({ id: 'r2' })];   // por repeticiones: segPlan null
  const red = crearReducer({ items });
  let e = estadoInicial(items);
  e = ticks(red, e, 9);
  e = red(e, { t: 'avanzarReloj', segundos: 15 });
  comprobar('por repeticiones, avanzar el reloj suma en vez de restar', e.restanteS === 15, String(e.restanteS));

  e = red(e, { t: 'pausar' });
  const pausado = e;
  e = red(e, { t: 'avanzarReloj', segundos: 60 });
  comprobar('en pausa, avanzar el reloj no hace nada', e.restanteS === pausado.restanteS);
}

console.log('\n--- ctx.items en vivo (bug: seguia viendo el ejercicio de antes) ---');
{
  // crearReducer recibe el MISMO objeto ctx durante toda la sesion (asi
  // lo usa useSessionPlayer, con un ref). Si el reductor leyera items una
  // sola vez al crearse, cambiar ctx.items despues no haria nada.
  const original = ej({ id: 'x1', seriesPlan: 1 });
  const ctx = { items: [original, ej({ id: 'x2' })] };
  const red = crearReducer(ctx);
  let e = estadoInicial(ctx.items);
  e = ticks(red, e, 9);   // pasa a trabajo del ejercicio original

  // "Cambiar ejercicio": la pantalla sustituye el item 0 por uno con mas
  // series, sin recrear el reductor.
  const sustituto = ej({ id: 'x1-sustituto', seriesPlan: 3 });
  ctx.items = [sustituto, ctx.items[1]];

  e = red(e, { t: 'registrar', reps: 10 });
  comprobar('la serie queda con el id del sustituto', e.hechas[0].ejercicioId === 'x1-sustituto', e.hechas[0].ejercicioId);
  comprobar('pasa a descanso tras la serie', e.fase === 'descanso', e.fase);

  e = red(e, { t: 'avanzar' });   // "ya estoy": termina el descanso
  comprobar(
    'respeta las series del sustituto (3), no salta al siguiente ejercicio tras solo 1',
    e.indice === 0 && e.serieNum === 2 && e.fase === 'preparado',
    `indice=${e.indice} serieNum=${e.serieNum} fase=${e.fase}`,
  );
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
process.exit(fallos ? 1 : 0);
