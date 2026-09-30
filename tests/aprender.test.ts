/**
 * Pruebas de Aprender: tiempo de lectura, relacionados, agrupacion del glosario, preguntas,
 * comillas y tildes de los tips, mitos, alimentacion y glosario.
 * esbuild --bundle --platform=node --format=cjs tests/aprender.test.ts | node
 */

import { SALAS, tipsCompletos } from '@/data/catalog';

const TIPS = tipsCompletos();
import { MITOS, ERRORES, NUTRICION, GLOSARIO, FAQ } from '@/data/aprender';
import { nombreVisible } from '@/data/nombresVisibles';
import { textoDePregunta, comillasLatinas, textoDeEtiqueta } from '@/lib/presentacion';
import {
  tiempoDeLectura, textoDeLectura, nombreDeSala, iconoDeSala, relacionadosVista, agruparPorLetra, letraDe, partirInsignias,
} from '@/lib/aprender';

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};

console.log('\n--- Tiempo de lectura ---');
{
  c('un cuerpo corto son 1 minuto', tiempoDeLectura(TIPS[0].cuerpo) === 1, String(tiempoDeLectura(TIPS[0].cuerpo)));
  c('200 palabras son 1 minuto y 201 son 2', tiempoDeLectura('a '.repeat(200)) === 1 && tiempoDeLectura('a '.repeat(201)) === 2);
  c('un texto vacio tambien es 1 minuto', tiempoDeLectura('   ') === 1);
  c('ningun tip pasa de 2 minutos', TIPS.every(t => tiempoDeLectura(t.cuerpo) <= 2), TIPS.map(t => tiempoDeLectura(t.cuerpo)).join(','));
}

console.log('\n--- Categorias ---');
{
  c('las 9 categorias tienen icono propio', new Set(SALAS.map(s => iconoDeSala(s.id))).size === 9);
  c('«Tecnica» se lee «Técnica»', nombreDeSala('sala_tecnica') === 'Técnica', nombreDeSala('sala_tecnica'));
  c('«Alimentacion» se lee «Alimentación»', nombreDeSala('sala_alimentacion') === 'Alimentación');
  c('«Dolor y lesiones» queda igual', nombreDeSala('sala_dolor') === 'Dolor y lesiones');
  c('«Empezar» empieza con mayuscula', nombreDeSala('sala_empezar') === 'Empezar');
  c('una categoria que no existe no rompe', nombreDeSala('no_existe') === '');
}

console.log('\n--- Relacionados ---');
{
  const todos = TIPS.flatMap(t => t.relacionado);
  const vistos = TIPS.flatMap(t => relacionadosVista(t.relacionado));
  const abribles = todos.filter(id => /^(ex|rt|pg)_/.test(id));
  c('todos los ejercicios, rutinas y programas de los tips existen y llevan su nombre real', vistos.length === abribles.length, `${vistos.length} de ${abribles.length}`);
  const t1 = relacionadosVista(TIPS[0].relacionado);
  c('el primer tip lleva un programa y una rutina con su nombre', t1[0].tipo === 'programa' && t1[0].nombre === 'Empezar de cero · 8 semanas' && t1[1].tipo === 'rutina', JSON.stringify(t1));
  c('los ids de otro articulo no se muestran', relacionadosVista(['tip_001']).length === 0);
  const deMitos = MITOS.flatMap(m => relacionadosVista(m.relacionado));
  c('los mitos muestran sus ejercicios, rutinas y programas, no las familias', deMitos.length > 0 && deMitos.every(r => ['ejercicio', 'rutina', 'programa'].includes(r.tipo)));
}

console.log('\n--- Etiquetas de los tips ---');
{
  c('«habito» → «Hábito»', textoDeEtiqueta('habito') === 'Hábito', textoDeEtiqueta('habito'));
  c('«principiante» → «Principiante»', textoDeEtiqueta('principiante') === 'Principiante');
  const todas = [...new Set(TIPS.flatMap(t => t.tags))];
  c('ninguna etiqueta sale con guion bajo o en minuscula', todas.every(t => !/_/.test(textoDeEtiqueta(t)) && textoDeEtiqueta(t)[0] === textoDeEtiqueta(t)[0].toUpperCase()));
}

console.log('\n--- Glosario ---');
{
  c('hay 32 terminos', GLOSARIO.length === 32);
  const tramos = agruparPorLetra(GLOSARIO);
  c('los tramos suman los 32 terminos y no reordenan', tramos.flatMap(t => t.terminos).map(t => t.termino).join() === GLOSARIO.map(t => t.termino).join());
  c('cada tramo es de una sola letra', tramos.every(t => t.terminos.every(x => letraDe(x.termino) === t.letra)));
  c('el primer tramo es «A» con AMRAP, Antiextensión y Antirrotación', tramos[0].letra === 'A' && tramos[0].terminos.length === 3);
  c('«A» vuelve a salir en el segundo bloque (ATM)', tramos.filter(t => t.letra === 'A').length === 2);
  c('«Escápula alada» se agrupa bajo la «E»', letraDe('Escapula alada') === 'E' && letraDe('Álamo') === 'A');
  c('sin terminos no hay tramos', agruparPorLetra([]).length === 0);
}

console.log('\n--- Preguntas ---');
{
  const q = (p: string) => textoDePregunta(p);
  c('las 18 preguntas abren con «¿» y cierran con «?»', FAQ.every(f => q(f.p).startsWith('¿') && q(f.p).endsWith('?')));
  c('«¿Cuántos días a la semana debo entrenar?»', q('Cuantos dias a la semana debo entrenar?') === '¿Cuántos días a la semana debo entrenar?', q('Cuantos dias a la semana debo entrenar?'));
  c('«¿Cuánto tardo en ver resultados?»', q('Cuanto tardo en ver resultados?') === '¿Cuánto tardo en ver resultados?');
  c('«¿Hago cardio antes o después de pesas?»', q('Hago cardio antes o despues de pesas?') === '¿Hago cardio antes o después de pesas?');
  c('«¿Qué hago si me duele algo durante un ejercicio?»', q('Que hago si me duele algo durante un ejercicio?') === '¿Qué hago si me duele algo durante un ejercicio?');
  c('«¿Por qué la app no me pone una dieta?»', q('Por que la app no me pone una dieta?') === '¿Por qué la app no me pone una dieta?');
  c('«¿Se me rompió la racha, perdí mi progreso?»', q('Se me rompio la racha, perdi mi progreso?') === '¿Se me rompió la racha, perdí mi progreso?');
  c('«¿Qué significan las insignias de colores?»', q('Que significan las insignias de colores?') === '¿Qué significan las insignias de colores?');
  c('«¿Cada cuánto cambia mi rutina?»', q('Cada cuanto cambia mi rutina?') === '¿Cada cuánto cambia mi rutina?', q('Cada cuanto cambia mi rutina?'));
  c('«¿Qué es la semana de descarga y puedo saltármela?»', q('Que es la semana de descarga y puedo saltarmela?') === '¿Qué es la semana de descarga y puedo saltármela?');
  c('«mandíbula» y «Por qué hay ejercicios etiquetados como mito…»',
    q('Los ejercicios de mandibula funcionan de verdad?') === '¿Los ejercicios de mandíbula funcionan de verdad?'
    && q('Por que hay ejercicios etiquetados como mito y siguen en el catalogo?') === '¿Por qué hay ejercicios etiquetados como mito y siguen en el catálogo?');
  c('una frase que no es pregunta pasa igual', q('Hola mundo') === 'Hola mundo');
  c('el signo de apertura no se duplica', !q('¿Hago pesas?').startsWith('¿¿'));
}

console.log('\n--- Comillas y «DARENOW» ---');
{
  c('las comillas rectas simples pasan a latinas', comillasLatinas("no muestra 'calorías restantes'.") === 'no muestra «calorías restantes».', comillasLatinas("no muestra 'calorías restantes'."));
  c('un apostrofe suelto no se toca', comillasLatinas("l'ame") === "l'ame");
  const p = textoDeLectura(NUTRICION.principio_de_diseno);
  c('«calorías restantes» sale con comillas latinas y con tilde', p.includes('«calorías restantes»'), p.slice(0, 160));
  c('la lista de lo que la app no hace lleva comillas latinas', NUTRICION.lo_que_la_app_no_hace.some(x => textoDeLectura(x).includes('«calorías restantes»')));
  const visibles = JSON.stringify([TIPS, MITOS, ERRORES, NUTRICION.conceptos, NUTRICION.lo_que_la_app_no_hace, NUTRICION.aviso, GLOSARIO, FAQ]);
  // La marca cambio de FORJA a DARENOW: el texto de Aprender ya dice DARENOW y FORJA no aparece en ninguno.
  c('«DARENOW» aparece una sola vez en los textos de Aprender (en «Cómo funciona aquí»)', (JSON.stringify(NUTRICION.principio_de_diseno).match(/DARENOW/g) ?? []).length === 1 && !/DARENOW|FORJA/.test(visibles));
}

console.log('\n--- Insignias en linea ---');
{
  const respuesta = FAQ.find(f => f.p.startsWith('Que significan'))!.r;
  const trozos = partirInsignias(respuesta);
  const insignias = trozos.filter(t => typeof t !== 'string');
  c('la respuesta de las insignias nombra Comprobado, Parcial y Mito', insignias.map(t => (typeof t === 'string' ? '' : t.tipo)).join() === 'ok,parcial,mito', JSON.stringify(insignias));
  c('el texto completo es el mismo', trozos.map(t => (typeof t === 'string' ? t : t.texto)).join('') === respuesta);
  c('sin esas palabras no hay insignias', partirInsignias('Hola mundo').length === 1);
  c('«mito» en minuscula no cuenta', partirInsignias('es un mito').length === 1);
}

console.log('\n--- Tildes de Aprender ---');
{
  const v = nombreVisible;
  c('Técnica y Dolor y lesiones', v('Tecnica') === 'Técnica' && v('Dolor y lesiones') === 'Dolor y lesiones');
  c('«El error más común…»', v('El error mas comun de quien empieza') === 'El error más común de quien empieza');
  c('día, sesión, consolación', v('El dia que no tengas tiempo, haz la sesion de 5 minutos. No es un premio de consolacion') === 'El día que no tengas tiempo, haz la sesión de 5 minutos. No es un premio de consolación');
  c('estímulo, hábitos, repetición, único, cuántos días',
    v('estimulo habitos repeticion unico cuantos dias') === 'estímulo hábitos repetición único cuántos días');
  c('según, energético, termorregulación, sudoración, sí, clásico',
    v('segun energetico termorregulacion sudoracion lo que si hace Crunch clasico') === 'según energético termorregulación sudoración lo que sí hace Crunch clásico');
  c('calorías, decisión, nutrición, analíticas, medicación, colección, calórico, condición',
    v('calorias decision nutricion analiticas medicacion coleccion calorico condicion') === 'calorías decisión nutrición analíticas medicación colección calórico condición');
  c('alimentación, térmico, lácteos, añadir, Proteína, músculo',
    v('alimentacion termico lacteos anadir Proteina musculo') === 'alimentación térmico lácteos añadir Proteína músculo');
  c('«de qué se compone» y «Por qué el peso no es el único indicador»',
    v('Gasto energetico: de que se compone') === 'Gasto energético: de qué se compone'
    && v('Por que el peso no es el unico indicador') === 'Por qué el peso no es el único indicador');
  c('«Cuándo esto deja de ser tema de una app»', v('Cuando esto deja de ser tema de una app') === 'Cuándo esto deja de ser tema de una app');
  c('Antiextensión, Antirrotación, Función, Patrón, atrás, Concéntrica',
    v('Antiextension Antirotacion Funcion Patron atras Concentrica') === 'Antiextensión Antirrotación Función Patrón atrás Concéntrica');
  c('«pérdida de grasa» y «la pérdida temporal»', v('la perdida de grasa y la perdida temporal') === 'la pérdida de grasa y la pérdida temporal');
  c('«Ámbar Parcial»', v('Ambar Parcial') === 'Ámbar Parcial');
  c('los mitos: reducción, según, energético', v('La reduccion localizada segun el balance energetico') === 'La reducción localizada según el balance energético');
  c('«si partías», «esté tensa», «qué foto era cuál»',
    v('si partias de cifosis') === 'si partías de cifosis'
    && v('antes de que la espalda este tensa, ahi es donde ocurre') === 'antes de que la espalda esté tensa, ahí es donde ocurre'
    && v('no sabian que foto era cual estimaron') === 'no sabían qué foto era cuál estimaron');
  c('«en cuánto músculo», «es cuánto tiempo», «en cómo te sientes»',
    v('influye en cuanto musculo conservas') === 'influye en cuánto músculo conservas'
    && v('es cuanto tiempo la persona lleva') === 'es cuánto tiempo la persona lleva'
    && v('un lugar central en como te sientes') === 'un lugar central en cómo te sientes');
  c('«añadir», «añaden», «añade» y «microdaño» (la ñ que falta en el dato)',
    v('Anadir anadir anaden Anade face pull, anade volumen y microdano') === 'Añadir añadir añaden Añade face pull, añade volumen y microdaño');
  c('«cuanto» y «como» relativos no se tocan', v('lo cual, cuanto antes, como referencia') === 'lo cual, cuanto antes, como referencia');
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
if (fallos > 0) process.exit(1);
