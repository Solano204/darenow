/**
 * R4 · envuelve componentes exportados en React.memo sin tocar su cuerpo:
 *   [export] function X(props) {...}  →  [export] const X = React.memo(function X(props) {...});
 *
 *   node scripts/refactor/envolver-memo.js archivo.tsx Nombre [Nombre...]
 */
const fs = require('fs');
const parser = require('@babel/parser');
const [archivo, ...nombres] = process.argv.slice(2);
let src = fs.readFileSync(archivo, 'utf8');
const ast = parser.parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
const cambios = [];
for (const n of ast.program.body) {
  const exportada = n.type === 'ExportNamedDeclaration' && n.declaration?.type === 'FunctionDeclaration';
  const f = exportada ? n.declaration : n.type === 'FunctionDeclaration' ? n : null;
  if (!f || !nombres.includes(f.id.name)) continue;
  const prefijo = exportada ? 'export ' : '';
  cambios.push({ ini: n.start, fin: n.end, texto: `${prefijo}const ${f.id.name} = React.memo(${src.slice(f.start, f.end)});` });
}
if (cambios.length !== nombres.length) { console.error(`${archivo}: ${cambios.length} de ${nombres.length}`); process.exit(1); }
for (const c of cambios.sort((a, b) => b.ini - a.ini)) src = src.slice(0, c.ini) + c.texto + src.slice(c.fin);
if (!/^import React\b/m.test(src)) src = src.replace(/^import \{([^}]*)\} from 'react';/m, "import React, {$1} from 'react';");
fs.writeFileSync(archivo, src);
console.log(`${archivo}: ${nombres.join(', ')}`);
