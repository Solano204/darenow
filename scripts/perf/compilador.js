/**
 * R4 · qué compila el React Compiler, función por función.
 *
 * Pasa cada archivo de src/ (y App.tsx) por el plugin del compilador con su `logger` y cuenta
 * los componentes y hooks compilados y los que se quedaron fuera, con el motivo. Un motivo
 * «Existing memoization could not be preserved» casi siempre es un useMemo/useCallback con
 * dependencias incompletas; «use no memo» es una exclusión a propósito (docs/perf/R4_REPORTE.md).
 *
 *   node scripts/perf/compilador.js          resumen y lista de exclusiones
 */
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '../..');
const archivos = [path.join(raiz, 'App.tsx')];
(function leer(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) leer(p);
    else if (/\.tsx?$/.test(f.name) && !f.name.endsWith('.d.ts')) archivos.push(p);
  }
})(path.join(raiz, 'src'));

let compiladas = 0;
const fuera = [];
for (const f of archivos) {
  const rel = path.relative(raiz, f);
  const src = fs.readFileSync(f, 'utf8');
  babel.transformSync(src, {
    filename: f, babelrc: false, configFile: false,
    presets: [['@babel/preset-typescript', { isTSX: true, allExtensions: true }]],
    plugins: [['babel-plugin-react-compiler', {
      logger: {
        logEvent(_archivo, ev) {
          const linea = ev.fnLoc?.start?.line;
          if (ev.kind === 'CompileSuccess') compiladas++;
          else if (ev.kind === 'CompileError' || ev.kind === 'CompileSkip' || ev.kind === 'PipelineError') {
            const motivo = ev.detail?.options?.reason ?? ev.detail?.reason ?? ev.reason ?? ev.kind;
            fuera.push(`${rel}:${linea ?? '?'}  ${String(motivo).split('\n')[0]}`);
          }
        },
      },
    }]],
  });
}
const unicos = [...new Set(fuera)];
console.log(`Componentes y hooks compilados: ${compiladas}. Fuera del compilador: ${unicos.length}.`);
for (const l of unicos) console.log(`  ${l}`);
