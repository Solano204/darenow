/**
 * FORJA · lint:color
 *
 * Falla si aparece un color hex o rgba(...) fuera de src/theme. Todo color
 * vive en un token; si hace falta uno nuevo, se añade ahi, no se repite el
 * literal en la pantalla que lo necesita.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'src');
const EXCLUIDO = path.join(RAIZ, 'theme');
const EXTENSIONES = new Set(['.ts', '.tsx']);
const PATRON = /#[0-9A-Fa-f]{3,8}\b|rgba?\(/g;

function archivos(dir) {
  const out = [];
  for (const nombre of fs.readdirSync(dir)) {
    const p = path.join(dir, nombre);
    const st = fs.statSync(p);
    if (p === EXCLUIDO) continue;
    if (st.isDirectory()) out.push(...archivos(p));
    else if (EXTENSIONES.has(path.extname(nombre))) out.push(p);
  }
  return out;
}

let hallazgos = 0;
for (const archivo of archivos(RAIZ)) {
  const lineas = fs.readFileSync(archivo, 'utf8').split('\n');
  lineas.forEach((linea, i) => {
    const m = linea.match(PATRON);
    if (m) {
      hallazgos++;
      console.log(`  ${path.relative(RAIZ, archivo)}:${i + 1}  ${m.join(', ')}`);
    }
  });
}

if (hallazgos) {
  console.log(`\n${hallazgos} color(es) fuera de src/theme. Muevelos a un token.\n`);
  process.exit(1);
}
console.log('lint:color OK — ningun color fuera de src/theme');
