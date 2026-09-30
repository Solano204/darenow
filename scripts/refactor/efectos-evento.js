/**
 * R4 · convierte los efectos con dependencias incompletas en efecto + `useEffectEvent`, sin
 * cambiar cuándo corren: el efecto sigue disparándose con las mismas dependencias y el cuerpo
 * (ahora un evento de efecto) lee los valores más recientes, como hacía antes.
 *
 *   node scripts/refactor/efectos-evento.js lista.json
 *
 * `lista.json`: [{ "archivo": "...", "linea": N }], la línea del arreglo de dependencias que
 * marca `react-hooks/exhaustive-deps`.
 */
const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const lista = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const porArchivo = {};
for (const { archivo, linea } of lista) (porArchivo[archivo] ??= new Set()).add(linea);

const capital = s => s.charAt(0).toUpperCase() + s.slice(1);

for (const [archivo, lineas] of Object.entries(porArchivo)) {
  let src = fs.readFileSync(archivo, 'utf8');
  const ast = parser.parse(src, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const cambios = [];
  const usados = new Set(src.match(/\balCambiar\w*/g) ?? []);
  let conReact = false;
  traverse(ast, {
    CallExpression(p) {
      const c = p.node.callee;
      const esEfecto = (c.type === 'Identifier' && c.name === 'useEffect')
        || (c.type === 'MemberExpression' && c.object.name === 'React' && c.property.name === 'useEffect');
      if (!esEfecto || p.node.arguments.length !== 2) return;
      const [cb, deps] = p.node.arguments;
      if (deps.type !== 'ArrayExpression' || !lineas.has(deps.loc.start.line)) return;
      const stmt = p.parentPath;
      if (stmt.node.type !== 'ExpressionStatement') return;
      const primero = deps.elements[0];
      const base = primero ? src.slice(primero.start, primero.end).replace(/[^A-Za-z0-9]+(.)?/g, (_, ch) => (ch ? ch.toUpperCase() : '')) : 'Montar';
      let nombre = `alCambiar${capital(base)}`;
      for (let i = 2; usados.has(nombre); i++) nombre = `alCambiar${capital(base)}${i}`;
      usados.add(nombre);
      const indent = src.slice(src.lastIndexOf('\n', stmt.node.start) + 1, stmt.node.start);
      const hook = c.type === 'MemberExpression' ? 'React.useEffectEvent' : 'useEffectEvent';
      if (c.type !== 'MemberExpression') conReact = true;
      const efecto = c.type === 'MemberExpression' ? 'React.useEffect' : 'useEffect';
      const texto = `const ${nombre} = ${hook}(${src.slice(cb.start, cb.end)});\n${indent}${efecto}(() => ${nombre}(), ${src.slice(deps.start, deps.end)});`;
      cambios.push({ ini: stmt.node.start, fin: stmt.node.end, texto });
    },
  });
  if (cambios.length !== lineas.size) console.error(`${archivo}: ${cambios.length} de ${lineas.size}`);
  cambios.sort((a, b) => b.ini - a.ini);
  for (const x of cambios) src = src.slice(0, x.ini) + x.texto + src.slice(x.fin);
  if (conReact && !/useEffectEvent[,\s}]/.test(src.split('\n').find(l => /from 'react';/.test(l)) ?? '')) {
    src = src.replace(/import (React, )?\{([^}]*)\} from 'react';/, (m, r, lista2) => {
      const partes = lista2.split(',').map(s => s.trim()).filter(Boolean);
      if (!partes.includes('useEffectEvent')) partes.push('useEffectEvent');
      partes.sort((a, b) => a.localeCompare(b));
      return `import ${r ?? ''}{ ${partes.join(', ')} } from 'react';`;
    });
  }
  fs.writeFileSync(archivo, src);
  console.log(`${archivo.replace(process.cwd() + '/', '')}: ${cambios.length}`);
}
