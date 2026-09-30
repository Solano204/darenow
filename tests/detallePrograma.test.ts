/**
 * Pruebas del detalle de programa: rangos de semanas, minutos por semana, placas del mapa
 * de carga, el resumen del lector de pantalla y las tildes de los programas.
 * esbuild --bundle --platform=node --format=cjs tests/detallePrograma.test.ts | node
 */

import {
  parsearRango, fasesDePrograma, faseDeSemana, minutosPorSemana, placasPorSemana, textoDeRango, resumenDePlan,
} from '@/utils/minutosPorSemana';
import { PROGRAMAS, rutinaPorId } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { geometriaMapa, disponerEtiquetas, MAX_PLACAS } from '@/ui/components/disposicionMapa';

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};
const minutosDe = (id: string) => rutinaPorId.get(id)?.min;

console.log('\n--- Rangos de semanas ---');
{
  const r = (t: string) => JSON.stringify(parsearRango(t));
  c('«1-2» son las semanas 1 a 2', r('1-2') === '{"desde":1,"hasta":2}', r('1-2'));
  c('«7» es la semana 7', r('7') === '{"desde":7,"hasta":7}', r('7'));
  c('acepta el guion largo', r('3–4') === '{"desde":3,"hasta":4}', r('3–4'));
  c('un rango al reves no se entiende', parsearRango('4-2') === null);
  c('texto libre no se entiende', parsearRango('primeras dos') === null && parsearRango('') === null);
  c('«Semanas 1–2» con guion corto', textoDeRango(1, 2) === 'Semanas 1–2', textoDeRango(1, 2));
  c('una sola semana va en singular', textoDeRango(7, 7) === 'Semana 7' && textoDeRango(8, 8) === 'Semana 8');
}

console.log('\n--- Los 12 programas ---');
{
  const malos: string[] = [];
  const sinMinutos: string[] = [];
  for (const p of PROGRAMAS) {
    const fases = fasesDePrograma(p.fases);
    if (!fases) { malos.push(`${p.id} (rango)`); continue; }
    let esperada = 1;
    for (const f of fases) { if (f.desde !== esperada) malos.push(`${p.id} (hueco en ${f.desde})`); esperada = f.hasta + 1; }
    if (esperada - 1 !== p.semanas) malos.push(`${p.id} (${esperada - 1} de ${p.semanas} semanas)`);
    const m = minutosPorSemana(p.semanas, p.dias_semana, fases, minutosDe);
    if (!m || m.length !== p.semanas || m.some(x => !(x > 0))) sinMinutos.push(p.id);
  }
  c('hay 12 programas', PROGRAMAS.length === 12);
  c('las fases de cada programa cubren sus semanas sin huecos ni solapes', malos.length === 0, malos.join(', '));
  c('cada semana de cada programa tiene minutos reales', sinMinutos.length === 0, sinMinutos.join(', '));

  const p1 = PROGRAMAS.find(p => p.id === 'pg_001')!;
  const f1 = fasesDePrograma(p1.fases)!;
  const m1 = minutosPorSemana(p1.semanas, p1.dias_semana, f1, minutosDe)!;
  c('pg_001 tiene 8 semanas', m1.length === 8);
  c('semana 1 de pg_001: 3 dias por el promedio de 15, 5 y 8 min = 28', m1[0] === 28, String(m1[0]));
  c('las semanas de una misma fase valen igual', m1[0] === m1[1] && m1[2] === m1[3] && m1[4] === m1[5]);
  c('la semana 7 (descarga, 15 y 15) es 45', m1[6] === 45, String(m1[6]));
  c('la semana 8 (test, 30 y 12) es 63', m1[7] === 63, String(m1[7]));
  c('faseDeSemana ubica la semana 7 en «Descarga»', f1[faseDeSemana(f1, 7)].foco === 'Descarga');
  c('una semana fuera del programa no tiene fase', faseDeSemana(f1, 9) === -1);
}

console.log('\n--- Falta un dato ---');
{
  const fases = fasesDePrograma([{ semanas: '1-2', foco: 'A', rutinas: ['rt_001'] }, { semanas: '4', foco: 'B', rutinas: ['rt_001'] }])!;
  c('una semana sin fase deja el mapa sin minutos', minutosPorSemana(4, 3, fases, minutosDe) === null);
  const otra = fasesDePrograma([{ semanas: '1-2', foco: 'A', rutinas: ['rt_001', 'no_existe'] }])!;
  c('una rutina sin duracion deja el mapa sin minutos', minutosPorSemana(2, 3, otra, minutosDe) === null);
  const iguales = placasPorSemana(null, 8, 12);
  c('sin minutos todas las columnas son iguales', iguales.length === 8 && new Set(iguales).size === 1, JSON.stringify(iguales));
}

console.log('\n--- Placas del mapa de carga ---');
{
  const p = placasPorSemana([28, 28, 42, 42, 63, 63, 45, 63], 8, 12);
  c('la semana mas larga lleva el maximo', Math.max(...p) === 12, JSON.stringify(p));
  c('mas minutos, mas placas', p[0] < p[2] && p[2] < p[4], JSON.stringify(p));
  c('semanas con los mismos minutos, las mismas placas', p[4] === p[5] && p[4] === p[7]);
  c('nunca menos de una placa', placasPorSemana([1, 500], 2, 12)[0] === 1);
  c('dentro del maximo', p.every(x => x >= 1 && x <= 12));
}

console.log('\n--- Geometria del mapa de carga ---');
{
  const ancho = 312;
  const problemas: string[] = [];
  let maxFilas = 0;
  for (const p of PROGRAMAS) {
    const fases = fasesDePrograma(p.fases)!;
    const geo = geometriaMapa(p.semanas, ancho);
    if (Math.abs(geo.paso * (p.semanas - 1) + geo.colW - ancho) > 1e-6) problemas.push(`${p.id}: no llena el ancho`);
    if (geo.colW < 10) problemas.push(`${p.id}: columna de ${geo.colW.toFixed(1)} px`);
    const et = disponerEtiquetas(fases.map(f => ({ desde: f.desde, hasta: f.hasta, nombre: nombreVisible(f.foco) })), geo, ancho);
    et.forEach((a, i) => {
      if (a.izquierda < -1e-6 || a.izquierda + a.ancho > ancho + 1e-6) problemas.push(`${p.id}: etiqueta ${i} fuera del mapa`);
      et.forEach((b, j) => {
        if (j <= i || a.fila !== b.fila) return;
        const separadas = a.izquierda + a.ancho + 6 <= b.izquierda + 1e-6 || b.izquierda + b.ancho + 6 <= a.izquierda + 1e-6;
        if (!separadas) problemas.push(`${p.id}: etiquetas ${i} y ${j} se montan`);
      });
    });
    maxFilas = Math.max(maxFilas, ...et.map(e => e.fila + 1));
  }
  c('el alto del mapa admite 12 placas', MAX_PLACAS === 12, String(MAX_PLACAS));
  c('en los 12 programas las columnas llenan el ancho y miden al menos 10 px, y las etiquetas caben y no se montan',
    problemas.length === 0, problemas.join('; '));
  c('las etiquetas no pasan de cuatro filas (solo pg_004, con sus tres «Descarga» de una semana, llega a cuatro)', maxFilas <= 4, String(maxFilas));
}

console.log('\n--- Resumen del lector de pantalla ---');
{
  const p1 = PROGRAMAS.find(p => p.id === 'pg_001')!;
  const f1 = fasesDePrograma(p1.fases)!;
  const m1 = minutosPorSemana(p1.semanas, p1.dias_semana, f1, minutosDe)!;
  const t = resumenDePlan(f1, m1, undefined, nombreVisible);
  c('empieza por las semanas 1 y 2 y su fase', t.startsWith('Semanas 1 y 2, Aparecer, 28 minutos por semana; semanas 3 y 4, Volumen,'), t);
  c('una semana sola va en singular', t.includes('semana 7, Descarga, 45 minutos por semana'), t);
  c('menciona a los 5 tramos', t.split(';').length === 5);
  c('con semana actual dice en cual va', resumenDePlan(f1, m1, 3).endsWith('Vas en la semana 3.'));
  c('sin minutos no los menciona', !resumenDePlan(f1, null).includes('minutos'));
}

console.log('\n--- Tildes de los programas ---');
{
  const v = nombreVisible;
  c('Sesión mínima', v('Sesion minima de 5 minutos') === 'Sesión mínima de 5 minutos', v('Sesion minima de 5 minutos'));
  c('propósito y más', v('Sesiones cortas a proposito. Si terminas con ganas de mas, va bien.') === 'Sesiones cortas a propósito. Si terminas con ganas de más, va bien.');
  c('Día de descarga', v('Dia de descarga') === 'Día de descarga');
  c('sesión y sensación', v('Se repite la sesion de la semana 3 para comparar sensacion y repeticiones.') === 'Se repite la sesión de la semana 3 para comparar sensación y repeticiones.');
  c('«Qué esperar» de pg_001, entero',
    v('Habito de 3 sesiones semanales, mejor tolerancia al esfuerzo y entre 2 y 4 kg de perdida si hay deficit energetico sostenido. La app no promete una cifra concreta porque depende de la alimentacion, que no controlamos.')
    === 'Hábito de 3 sesiones semanales, mejor tolerancia al esfuerzo y entre 2 y 4 kg de pérdida si hay déficit energético sostenido. La app no promete una cifra concreta porque depende de la alimentación, que no controlamos.');
  c('«perdida» suelta no cambia', v('una hora perdida') === 'una hora perdida');
  c('«Lo que sí y lo que no»', v('Con honestidad sobre lo que si y lo que no.') === 'Con honestidad sobre lo que sí y lo que no.');
  c('pérdida de grasa localizada', v('Lo que NO ocurre: perdida de grasa localizada') === 'Lo que NO ocurre: pérdida de grasa localizada', v('Lo que NO ocurre: perdida de grasa localizada'));
  const fases = ['Adaptacion', 'Acumulacion', 'Intensificacion', 'Integracion', 'Consolidacion', 'Reactivacion', 'Tecnica y volumen base', 'Movilidad toracica'];
  c('nombres de fase con tilde',
    fases.map(v).join('|') === 'Adaptación|Acumulación|Intensificación|Integración|Consolidación|Reactivación|Técnica y volumen base|Movilidad torácica',
    fases.map(v).join('|'));
  c('medición, puntuación y superávit',
    v('Medicion de estatura, puntuacion, superavit y tipica') === 'Medición de estatura, puntuación, superávit y típica');
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
if (fallos > 0) process.exit(1);
