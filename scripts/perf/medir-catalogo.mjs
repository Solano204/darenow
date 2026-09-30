/**
 * Proxy de laboratorio (NO sustituye la medicion en el telefono): cuanto cuesta evaluar el
 * modulo del catalogo en node. Empaqueta `src/data/catalog.ts` con esbuild y lo evalua N veces
 * en un contexto limpio. Sirve para comparar antes/despues de cambiar como se carga el catalogo.
 *
 *   node scripts/perf/medir-catalogo.mjs [archivo=src/data/catalog.ts] [N=30]
 */
import { buildSync } from 'esbuild';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';

const entrada = process.argv[2] ?? 'src/data/catalog.ts';
const n = Number(process.argv[3] ?? 30);
const { outputFiles } = buildSync({
  entryPoints: [entrada], bundle: true, write: false, platform: 'node', format: 'cjs',
  tsconfig: 'tsconfig.json', logLevel: 'silent',
});
const codigo = outputFiles[0].text;
const script = new vm.Script(codigo);
const tiempos = [];
for (let i = 0; i < n; i++) {
  const ctx = vm.createContext({ module: { exports: {} }, exports: {}, require: () => ({}), process: { env: {} }, console });
  const t0 = performance.now();
  script.runInContext(ctx);
  tiempos.push(performance.now() - t0);
}
tiempos.sort((a, b) => a - b);
const med = tiempos[Math.floor(n / 2)];
console.log(`${entrada}: ${(codigo.length / 1024).toFixed(0)} KB de JS, evaluar: mediana ${med.toFixed(2)} ms, peor ${tiempos[n - 1].toFixed(2)} ms (${n} corridas, node ${process.version})`);
