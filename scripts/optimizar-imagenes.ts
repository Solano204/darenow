/**
 * DARENOW · optimizar-imagenes (R5)
 *
 * Convierte las fotos originales (media-fuente/img/<carpeta>/<id>.jpg, fuera del bundle) en lo que
 * la app empaqueta (assets/img/...):
 *
 *   assets/img/<carpeta>/<id>.webp        la foto a su tamano real mas grande en pantalla: 800 px de
 *                                         ancho como maximo (las originales ya miden eso; nunca se
 *                                         agranda). WebP calidad 80, sin diferencia visible frente
 *                                         al JPEG (PSNR ~42 dB).
 *   assets/img/<carpeta>-mini/<id>.webp   solo ejercicios y musculos: la miniatura de las listas
 *                                         (lado corto de 192 px = 64 dp a densidad 3).
 *   src/data/indice/blurhash.json         "tipo/id" -> blurhash (4x3), el `placeholder` de `Imagen`.
 *
 * Al terminar vuelve a escribir src/media/registry.ts con generar_registry.py. Solo procesa lo que
 * cambio (el .webp es mas viejo que el original o no existe); `--todo` lo rehace todo.
 *
 * Correrlo cada vez que se agregue o cambie una foto en media-fuente/img (y commitear lo generado):
 *   npm run imagenes
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import { encode } from 'blurhash';

const RAIZ = process.cwd();
const FUENTE = path.join(RAIZ, 'media-fuente/img');
const DESTINO = path.join(RAIZ, 'assets/img');
const BLURHASH = path.join(RAIZ, 'src/data/indice/blurhash.json');

/** Carpeta de media-fuente/img -> tipo de `fuente(tipo, id)` en la app. */
export const CARPETAS: Record<string, string> = {
  ejercicios: 'ejercicio', musculos: 'musculo', rutinas: 'rutina', programas: 'programa',
  tips: 'tip', mitos: 'mito', motivacion: 'motivacion', fondos: 'fondo',
};
/** Las que se ven tambien como miniatura en listas y rejillas. */
const CON_MINI = new Set(['ejercicios', 'musculos']);

const ANCHO_MAX = 800;
const LADO_CORTO_MINI = 192;
const CALIDAD = 80;
/** Las miniaturas se ven a 64 dp: la compresion se nota todavia menos. */
const CALIDAD_MINI = 75;
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const todo = process.argv.includes('--todo');

function viejo(destino: string, origen: string): boolean {
  return todo || !fs.existsSync(destino) || fs.statSync(destino).mtimeMs < fs.statSync(origen).mtimeMs;
}

async function blurhashDe(archivo: string): Promise<string> {
  const { data, info } = await sharp(archivo).resize(32, 32, { fit: 'inside' }).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
}

async function main() {
  const hashes: Record<string, string> = fs.existsSync(BLURHASH) ? JSON.parse(fs.readFileSync(BLURHASH, 'utf8')) : {};
  const vistos = new Set<string>();
  let hechas = 0;
  let antes = 0;
  let despues = 0;

  for (const [carpeta, tipo] of Object.entries(CARPETAS)) {
    const dir = path.join(FUENTE, carpeta);
    if (!fs.existsSync(dir)) continue;
    fs.mkdirSync(path.join(DESTINO, carpeta), { recursive: true });
    if (CON_MINI.has(carpeta)) fs.mkdirSync(path.join(DESTINO, `${carpeta}-mini`), { recursive: true });

    for (const archivo of fs.readdirSync(dir).sort()) {
      const ext = path.extname(archivo).toLowerCase();
      if (!EXTS.has(ext)) continue;
      const id = path.basename(archivo, path.extname(archivo));
      const origen = path.join(dir, archivo);
      const grande = path.join(DESTINO, carpeta, `${id}.webp`);
      const mini = path.join(DESTINO, `${carpeta}-mini`, `${id}.webp`);
      const clave = `${tipo}/${id}`;
      vistos.add(clave);

      if (viejo(grande, origen)) {
        await sharp(origen).resize({ width: ANCHO_MAX, withoutEnlargement: true })
          .webp({ quality: CALIDAD, effort: 6 }).toFile(grande);
        hechas++;
      }
      if (CON_MINI.has(carpeta) && viejo(mini, origen)) {
        const { width = 0, height = 0 } = await sharp(origen).metadata();
        const escala = LADO_CORTO_MINI / Math.min(width, height);
        await sharp(origen).resize({
          width: Math.round(width * escala), height: Math.round(height * escala), withoutEnlargement: true,
        }).webp({ quality: CALIDAD_MINI, effort: 6 }).toFile(mini);
      }
      if (todo || !hashes[clave] || viejo(grande, origen)) hashes[clave] = await blurhashDe(origen);

      antes += fs.statSync(origen).size;
      despues += fs.statSync(grande).size + (CON_MINI.has(carpeta) ? fs.statSync(mini).size : 0);
    }
  }

  // Lo que ya no tiene original se va del indice.
  for (const clave of Object.keys(hashes)) if (!vistos.has(clave)) delete hashes[clave];
  const ordenado = Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(BLURHASH, `${JSON.stringify(ordenado, null, 0)}\n`);

  console.log(`imagenes: ${vistos.size} (${hechas} rehechas) · originales ${(antes / 1024).toFixed(0)} KB -> empaquetadas ${(despues / 1024).toFixed(0)} KB`);
  execFileSync('python3', ['generar_registry.py'], { cwd: RAIZ, stdio: 'inherit' });
}

main().catch(e => { console.error(e); process.exit(1); });
