/**
 * Pruebas de los musculos: etiquetas, agrupacion por region, disposicion del catalogo,
 * relaciones y tildes.
 * esbuild --bundle --platform=node --format=cjs tests/musculos.test.ts | node
 */

import { MUSCULOS, EJERCICIOS, musculoPorId } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { textoDeEtiqueta, textoVisible } from '@/lib/presentacion';
import { relacionados, ejerciciosDeMusculo } from '@/utils/musculos';
import {
  COLUMNAS, ALTO_REGION, ladoFicha, lineasDeNombre, agruparPorGrupo, armarFilas, regionActiva,
} from '@/ui/components/disposicionCatalogo';

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};

console.log('\n--- Etiquetas ---');
{
  c('«tren_superior» → «Tren superior»', textoDeEtiqueta('tren_superior') === 'Tren superior', textoDeEtiqueta('tren_superior'));
  c('«pecho» → «Pecho»', textoDeEtiqueta('pecho') === 'Pecho');
  c('«gluteo» → «Glúteo»', textoDeEtiqueta('gluteo') === 'Glúteo', textoDeEtiqueta('gluteo'));
  c('«cabeza_cuello» → «Cabeza y cuello»', textoDeEtiqueta('cabeza_cuello') === 'Cabeza y cuello');
  const crudas = new Set(MUSCULOS.flatMap(m => [m.group, m.region]));
  const malas = [...crudas].filter(d => /_/.test(textoDeEtiqueta(d)) || textoDeEtiqueta(d)[0] !== textoDeEtiqueta(d)[0].toUpperCase());
  c('ninguna de las etiquetas del dato sale con guion bajo ni en minuscula', malas.length === 0, malas.join(', '));
}

console.log('\n--- El catalogo ---');
{
  c('hay 52 musculos', MUSCULOS.length === 52);
  const tramos = agruparPorGrupo(MUSCULOS);
  c('los tramos suman los 52 musculos', tramos.reduce((a, t) => a + t.musculos.length, 0) === 52);
  c('hay 14 tramos (cadera y core vuelven a aparecer)', tramos.length === 14, String(tramos.length));
  c('el orden de los musculos no cambia', tramos.flatMap(t => t.musculos).map(m => m.id).join() === MUSCULOS.map(m => m.id).join());
  c('el primer tramo es «Pecho» con 2', tramos[0].etiqueta === 'Pecho' && tramos[0].musculos.length === 2);
  c('cada tramo es de un solo grupo', tramos.every(t => t.musculos.every(m => m.group === t.grupo)));

  const lado = ladoFicha(312);
  c('el lado de la ficha en 360 px es 96', lado === 96, String(lado));
  const filas = armarFilas(MUSCULOS, lado);
  const regiones = filas.filter(f => f.tipo === 'region');
  const fichas = filas.filter(f => f.tipo === 'fichas');
  c('un encabezado por tramo', regiones.length === 14);
  c('las filas llevan las 52 fichas', fichas.reduce((a, f) => a + (f.tipo === 'fichas' ? f.musculos.length : 0), 0) === 52);
  c('ninguna fila lleva mas de tres fichas', fichas.every(f => f.tipo === 'fichas' && f.musculos.length <= COLUMNAS));
  c('cada fila empieza donde acaba la anterior', filas.every((f, i) => f.arriba === (i === 0 ? 0 : filas[i - 1].arriba + filas[i - 1].alto)));
  c('el orden de las fichas es el de los musculos', fichas.flatMap(f => (f.tipo === 'fichas' ? f.musculos : [])).map(m => m.id).join() === MUSCULOS.map(m => m.id).join());
  c('el encabezado de espalda dice 9', regiones.some(r => r.tipo === 'region' && r.etiqueta === 'Espalda' && r.cantidad === 9));
  c('un encabezado mide lo mismo que su constante', regiones.every(r => r.alto === ALTO_REGION));
  c('todas las filas de fichas reservan al menos dos lineas de nombre', fichas.every(f => f.tipo === 'fichas' && f.lineas >= 2));

  const sinGrupo = armarFilas(MUSCULOS.map(m => ({ ...m, group: '' })), lado);
  c('sin dato de region no hay encabezados', sinGrupo.every(f => f.tipo === 'fichas') && sinGrupo.length === Math.ceil(52 / 3));
  c('sin musculos no hay filas', armarFilas([], lado).length === 0);

  const busqueda = MUSCULOS.filter(m => m.name.toLowerCase().includes('deltoide'));
  const filasBusqueda = armarFilas(busqueda, lado);
  c('una busqueda agrupa solo lo que quedo', filasBusqueda.filter(f => f.tipo === 'region').length === 1 && busqueda.length === 3, String(busqueda.length));

  const segunda = filas.findIndex((f, i) => f.tipo === 'region' && i > 0);
  c('el encabezado pegado es el ultimo que ya paso por arriba', regionActiva(filas, filas[segunda].arriba + 1) === segunda);
  c('al inicio no hay ninguno pegado', regionActiva(filas, 0) === -1);
  c('con el primer encabezado justo arriba todavia no hay que pegarlo', regionActiva(filas, filas[0].arriba) === -1);
}

console.log('\n--- Nombres partidos ---');
{
  c('«Core» cabe en una linea', lineasDeNombre('Core') === 1);
  c('«Pectoral mayor» ocupa dos', lineasDeNombre('Pectoral mayor') === 2);
  c('no parte una palabra por la mitad', lineasDeNombre('Musculatura intrínseca del pie') >= 3);
  const lado = ladoFicha(312);
  const filas = armarFilas(MUSCULOS, lado);
  const maxLineas = Math.max(...filas.map(f => (f.tipo === 'fichas' ? f.lineas : 0)));
  c('el nombre mas largo no pasa de cuatro lineas', maxLineas <= 4, String(maxLineas));
}

console.log('\n--- Relaciones y ejercicios ---');
{
  const rotas: string[] = [];
  for (const m of MUSCULOS) {
    for (const r of [...relacionados(m.trabaja_con, musculoPorId), ...relacionados(m.antagonista, musculoPorId)]) {
      if (!r.musculo) rotas.push(`${m.id}→${r.id}`);
    }
  }
  c('hay 6 referencias a musculos que no existen (BUG-13)', rotas.length === 6, rotas.join(', '));
  const dl = relacionados(musculoPorId.get('deltoide_lateral')!.trabaja_con, musculoPorId).concat(relacionados(musculoPorId.get('deltoide_lateral')!.antagonista, musculoPorId));
  c('una referencia rota se conserva con nombre legible y sin musculo', dl.some(r => r.id === 'supraespinoso' && r.nombre === 'Supraespinoso' && !r.musculo), JSON.stringify(dl.map(r => r.nombre)));
  const pm = relacionados(musculoPorId.get('pectoral_mayor')!.trabaja_con, musculoPorId);
  c('las relaciones sanas traen su musculo y el orden del dato', pm.map(r => r.id).join() === 'deltoide_anterior,triceps,serrato_anterior' && pm.every(r => !!r.musculo));
  c('sin relaciones no hay lista', relacionados(undefined, musculoPorId).length === 0);

  const sinPrincipal = MUSCULOS.filter(m => ejerciciosDeMusculo(m.id, EJERCICIOS).principales.length === 0);
  c('7 musculos no tienen ejercicios como principal', sinPrincipal.length === 7, String(sinPrincipal.length));
  c('ningun ejercicio es principal y secundario a la vez',
    MUSCULOS.every(m => { const e = ejerciciosDeMusculo(m.id, EJERCICIOS); return !e.principales.some(x => e.secundarios.includes(x)); }));
}

console.log('\n--- Tildes de los 52 musculos ---');
{
  const v = nombreVisible;
  c('Tríceps braquial', textoVisible('Triceps braquial') === 'Tríceps braquial');
  c('Bíceps braquial', textoVisible('Biceps braquial') === 'Bíceps braquial');
  c('escápula', v('Desciende y protrae la escapula.') === 'Desciende y protrae la escápula.');
  c('Extensión torácica sobre rodillo', v('Extension toracica sobre rodillo') === 'Extensión torácica sobre rodillo');
  c('«musculos» → «músculos»', v('52 musculos') === '52 músculos');
  c('crónicamente, débil, síndrome',
    v('cronicamente debil, sindrome, distension, insercion, teorico, tipico') === 'crónicamente débil, síndrome, distensión, inserción, teórico, típico');
  const pendientes: string[] = [];
  for (const m of MUSCULOS) {
    for (const t of [m.name, m.funcion, m.dolor_comun ?? '']) {
      if (/\b(cronicamente|debil|debiles|sindrome|distension|insercion|teorico|tipico)\b/i.test(v(t))) pendientes.push(m.id);
    }
  }
  c('ninguno de los 52 musculos conserva esas palabras sin tilde', pendientes.length === 0, pendientes.join(', '));
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
if (fallos > 0) process.exit(1);
