/**
 * R4 · inventario de efectos: cuenta los useEffect/useLayoutEffect de src/ y App.tsx y los
 * clasifica por lo que hacen (heurística sobre el cuerpo), para docs/perf/R4_REPORTE.md §4.
 *
 *   node scripts/perf/efectos.js
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const raiz = path.join(__dirname, '../..');
const archivos = [path.join(raiz, 'App.tsx')];
(function leer(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) leer(p);
    else if (/\.tsx?$/.test(f.name)) archivos.push(p);
  }
})(path.join(raiz, 'src'));

const REGLAS = [
  ['suscripcion (AppState, teclado, listener)', /addEventListener|addListener|subscribe|Keyboard\.|AppState/],
  ['animacion (valores de Reanimated / Animated)', /\.set\(|withTiming|withSpring|withRepeat|withDelay|Animated\.(timing|spring|loop)|cancelAnimation/],
  ['temporizador', /setTimeout|setInterval|requestAnimationFrame|runAfterInteractions/],
  ['almacenamiento', /AsyncStorage|leerAlArrancar|cargarEstado/],
  ['sonido, voz o vibracion', /reproducir\(|hablar\(|haptico\.|Haptics\.|Speech\./],
  ['navegacion o sistema', /navigation\.|NavigationBar|SplashScreen|perfMark|mark\(/],
];
const conteo = {};
let total = 0;
let conEvento = 0;
for (const f of archivos) {
  const src = fs.readFileSync(f, 'utf8');
  let ast;
  try { ast = parser.parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] }); } catch { continue; }
  const eventos = new Map();
  traverse(ast, {
    VariableDeclarator(p) {
      const i = p.node.init;
      if (i?.type === 'CallExpression' && /useEffectEvent$/.test(src.slice(i.callee.start, i.callee.end))) {
        eventos.set(p.node.id.name, src.slice(i.start, i.end));
      }
    },
  });
  traverse(ast, {
    CallExpression(p) {
      const nombre = src.slice(p.node.callee.start, p.node.callee.end);
      if (!/^(React\.)?use(Layout)?Effect$/.test(nombre)) return;
      total++;
      let cuerpo = src.slice(p.node.start, p.node.end);
      const llamado = cuerpo.match(/=>\s*(alCambiar\w+|\w+)\(\)/);
      if (llamado && eventos.has(llamado[1])) { cuerpo += eventos.get(llamado[1]); conEvento++; }
      const tipo = REGLAS.find(([, re]) => re.test(cuerpo))?.[0] ?? 'otro (revisar)';
      conteo[tipo] = (conteo[tipo] ?? 0) + 1;
    },
  });
}
console.log(`Efectos: ${total} (${conEvento} leen props/estado con useEffectEvent)`);
for (const [k, v] of Object.entries(conteo).sort((a, b) => b[1] - a[1])) console.log(`  ${v}  ${k}`);
