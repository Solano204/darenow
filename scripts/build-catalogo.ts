/**
 * DARENOW · build-catalogo
 *
 * Genera, a partir de los datos fuente (assets/data/*.json), lo que la app importa ya hecho:
 *
 *   src/data/indice/ejercicios.json   los 190 ejercicios SIN sus textos largos, con `patron` ya puesto
 *   src/data/indice/musculos.json     los 52 musculos sin `funcion` ni `dolor_comun`
 *   src/data/indice/tips.json         los tips sin `cuerpo`
 *   src/data/indice/salas.json        las salas de tips (sin importar el JSON entero de tips)
 *   src/data/indice/conteos.json      los numeros de ESTADISTICAS (190 ejercicios, 52 musculos...)
 *   src/data/detalle/<tipo>.json      id -> textos largos (ejercicios, musculos, tips)
 *
 * En el indice cada texto largo queda como `null` en su misma posicion: `getEjercicio(id)` (y
 * `getMusculo`, `getTip`) hace `{ ...indice, ...detalle }`, asi que el orden de las claves y el
 * resultado de `JSON.stringify` son los de antes. `catalog.ts` hace el `require` del detalle
 * dentro de una funcion: Metro solo lo evalua la primera vez que alguien pide un texto.
 *
 * Correrlo cada vez que cambie algo en assets/data (y commitear lo generado):
 *   npm run catalogo
 * `npm run test:unit` compara el resultado contra el catalogo de antes de R3.
 */
import * as fs from 'fs';
import * as path from 'path';

// npm corre los scripts desde la raiz del proyecto.
const RAIZ = process.cwd();
const FUENTE = path.join(RAIZ, 'assets/data');
const INDICE = path.join(RAIZ, 'src/data/indice');
const DETALLE = path.join(RAIZ, 'src/data/detalle');

/** Campos que solo se leen al abrir la ficha (o al armar una sesion): van al detalle. */
export const TEXTOS = {
  ejercicios: ['desc', 'steps', 'cues', 'errors', 'breathing', 'progressions', 'regressions'],
  musculos: ['funcion', 'dolor_comun'],
  tips: ['cuerpo'],
} as const;

type Obj = Record<string, unknown>;
const leer = (f: string) => JSON.parse(fs.readFileSync(path.join(FUENTE, f), 'utf8'));
const escribir = (f: string, datos: unknown) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(datos) + '\n');
};

function separar(items: Obj[], campos: readonly string[]): { indice: Obj[]; detalle: Record<string, Obj> } {
  const indice: Obj[] = [];
  const detalle: Record<string, Obj> = {};
  for (const it of items) {
    const base: Obj = {};
    const d: Obj = {};
    for (const [k, v] of Object.entries(it)) {
      if (campos.includes(k)) { base[k] = null; d[k] = v; } else base[k] = v;
    }
    indice.push(base);
    detalle[it.id as string] = d;
  }
  return { indice, detalle };
}

function main() {
  fs.rmSync(DETALLE, { recursive: true, force: true });

  const familias = (leer('03_families.json').items as Obj[]);
  const patronDe = new Map(familias.map(f => [f.id as string, f.patron as string | undefined]));
  const archivosEj = fs.readdirSync(FUENTE).filter(f => /^1\d_exercises_.*\.json$/.test(f)).sort();
  const ejercicios = archivosEj.flatMap(f => leer(f).items as Obj[])
    // Lo que antes hacia catalog.ts al arrancar: cada ejercicio hereda el patron de su familia.
    .map((e): Obj => ({ ...e, patron: patronDe.get(e.family as string) }));
  const musculos = leer('01_muscles.json').items as Obj[];
  const tips = leer('30_tips.json').items as Obj[];

  const tipos: [string, Obj[], readonly string[]][] = [
    ['ejercicios', ejercicios, TEXTOS.ejercicios],
    ['musculos', musculos, TEXTOS.musculos],
    ['tips', tips, TEXTOS.tips],
  ];
  for (const [tipo, items, campos] of tipos) {
    const { indice, detalle } = separar(items, campos);
    escribir(path.join(INDICE, `${tipo}.json`), indice);
    escribir(path.join(DETALLE, `${tipo}.json`), detalle);
  }

  escribir(path.join(INDICE, 'salas.json'), leer('30_tips.json').salas);

  const ninguno = (e: Obj) => (e.equipment as string[]).includes('ninguno');
  escribir(path.join(INDICE, 'conteos.json'), {
    ejercicios: ejercicios.length,
    musculos: musculos.length,
    rutinas: (leer('20_routines.json').items as Obj[]).length,
    programas: (leer('21_programs.json').items as Obj[]).length,
    tips: tips.length,
    mitos: (leer('31_myths_errors.json').mitos as Obj[]).length,
    sinEquipo: ejercicios.filter(ninguno).length,
    silenciosos: ejercicios.filter(e => (e.impact as number) < 2 && (e.noise as number) < 2).length,
  });

  console.log(`catalogo: ${ejercicios.length} ejercicios, ${musculos.length} musculos, ${tips.length} tips -> src/data/indice y src/data/detalle`);
}

main();
