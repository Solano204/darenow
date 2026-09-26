/**
 * Pruebas del detalle de rutina: tramos del perfil, su curva y el resumen del lector
 * de pantalla.
 * esbuild --bundle --platform=node --format=cjs tests/detalleRutina.test.ts | node
 */

import { estimarTramos, resumenDeTramos, PISO_TRAMO } from '../src/utils/estimarTramos';
import { muestrasPerfil } from '../src/components/routine-detail/curvaPerfil';
import { RUTINAS } from '../src/data/catalog';

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};
const suma = (v: number[]) => v.reduce((a, x) => a + x, 0);

/** Cuantas jorobas (grupos contiguos por encima de `umbral`) hay entre las fracciones `desde` y `hasta`. */
function jorobas(m: number[], desde: number, hasta: number, umbral: number): number {
  let n = 0;
  let dentro = false;
  m.forEach((v, i) => {
    const x = i / (m.length - 1);
    if (x < desde || x > hasta) return;
    if (v > umbral && !dentro) { n++; dentro = true; }
    if (v <= umbral) dentro = false;
  });
  return n;
}

console.log('\n--- Tramos ---');
{
  const t = estimarTramos([
    { tipo: 'calentamiento', peso: 2, ejercicios: 3 },
    { tipo: 'principal', peso: 11, vueltas: 3, ejercicios: 5 },
    { tipo: 'enfriamiento', peso: 2, ejercicios: 2 },
  ]);
  c('las fracciones suman 1', Math.abs(suma(t.map(x => x.fraccion)) - 1) < 1e-9, String(suma(t.map(x => x.fraccion))));
  c('el calentamiento no baja del piso', t[0].fraccion >= PISO_TRAMO - 1e-9, String(t[0].fraccion));
  c('el enfriamiento no baja del piso', t[2].fraccion >= PISO_TRAMO - 1e-9, String(t[2].fraccion));
  c('el principal sigue siendo el mas largo', t[1].fraccion > t[0].fraccion && t[1].fraccion > t[2].fraccion);
  c('los tramos empiezan donde acaba el anterior', Math.abs(t[1].inicio - t[0].fraccion) < 1e-9 && t[0].inicio === 0);
  c('etiquetas con mayuscula y vueltas',
    t.map(x => x.etiqueta).join('|') === 'Calentamiento|Principal ×3|Enfriamiento', t.map(x => x.etiqueta).join('|'));
  c('resumen del lector de pantalla',
    resumenDeTramos(t) === 'Calentamiento de 3 ejercicios, bloque principal de 5 ejercicios repetido 3 veces, enfriamiento de 2 ejercicios',
    resumenDeTramos(t));
}
{
  const uno = estimarTramos([{ tipo: 'plano', peso: 12, ejercicios: 1 }]);
  c('un solo bloque ocupa todo el ancho', uno.length === 1 && uno[0].fraccion === 1 && uno[0].inicio === 0);
  c('un bloque plano se llama «Ejercicios»', uno[0].etiqueta === 'Ejercicios');
  c('resumen con 1 ejercicio en singular', resumenDeTramos(uno) === '1 ejercicio', resumenDeTramos(uno));
  c('sin bloques no hay tramos', estimarTramos([]).length === 0);
  const sinMin = estimarTramos([
    { tipo: 'calentamiento', peso: 0, ejercicios: 2 },
    { tipo: 'principal', peso: 0, ejercicios: 6 },
  ]);
  c('sin minutos reparte por ejercicios', sinMin[1].fraccion > sinMin[0].fraccion && Math.abs(suma(sinMin.map(x => x.fraccion)) - 1) < 1e-9);
  const parejos = estimarTramos([1, 1, 1, 1, 1].map(() => ({ tipo: 'principal', peso: 1, ejercicios: 1 })));
  c('cinco tramos iguales quedan iguales', parejos.every(x => Math.abs(x.fraccion - 0.2) < 1e-9));
}
{
  const malas = RUTINAS.filter(r => {
    const t = estimarTramos(r.bloques.map(b => ({ tipo: b.tipo, peso: b.min, vueltas: b.vueltas, ejercicios: b.items.length })));
    const piso = Math.min(PISO_TRAMO, 1 / t.length) - 1e-9;
    return Math.abs(suma(t.map(x => x.fraccion)) - 1) > 1e-9 || t.some(x => x.fraccion < piso);
  });
  c('las 30 rutinas del catalogo dan tramos validos', RUTINAS.length === 30 && malas.length === 0, malas.map(r => r.id).join(', '));
}

console.log('\n--- Curva del perfil ---');
{
  const tres = estimarTramos([
    { tipo: 'calentamiento', peso: 2, ejercicios: 3 },
    { tipo: 'principal', peso: 11, vueltas: 3, ejercicios: 5 },
    { tipo: 'enfriamiento', peso: 2, ejercicios: 2 },
  ]);
  const m = muestrasPerfil(tres, 400);
  const p = tres[1];
  c('todas las muestras estan entre 0 y 1', m.every(v => v >= 0 && v <= 1));
  c('3 vueltas dan 3 jorobas', jorobas(m, p.inicio, p.inicio + p.fraccion, 0.9) === 3, String(jorobas(m, p.inicio, p.inicio + p.fraccion, 0.9)));
  c('empieza bajo (calentamiento)', m[0] < 0.4, String(m[0]));
  c('termina bajo (enfriamiento)', m[m.length - 1] < 0.3, String(m[m.length - 1]));
  c('la cima del principal llega a 0.9 o mas', Math.max(...m) >= 0.9, String(Math.max(...m)));
  c('el principal no baja de 0.65', Math.min(...m.slice(Math.floor((p.inicio + 0.03) * 400), Math.floor((p.inicio + p.fraccion - 0.03) * 400))) >= 0.65);

  const una = estimarTramos([{ tipo: 'principal', peso: 9, vueltas: 1, ejercicios: 4 }]);
  const mu = muestrasPerfil(una, 300);
  c('un principal sin vueltas tiene 1 joroba', jorobas(mu, 0, 1, 0.9) === 1, String(jorobas(mu, 0, 1, 0.9)));

  const plano = estimarTramos([{ tipo: 'plano', peso: 20, ejercicios: 6 }]);
  const mp = muestrasPerfil(plano, 300);
  const centro = mp.slice(60, 240);
  c('una rutina sin bloques es una meseta', Math.max(...centro) - Math.min(...centro) < 0.02, String(Math.max(...centro) - Math.min(...centro)));
  c('la meseta sube y baja en los bordes', mp[0] < mp[150] && mp[299] < mp[150]);
  c('sin tramos no hay curva', muestrasPerfil([], 100).length === 0);
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
if (fallos > 0) process.exit(1);
