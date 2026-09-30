/**
 * DARENOW · optimizar-clips (R5)
 *
 * De los clips originales (media-fuente/video/ejercicios/<id>.mp4, fuera del bundle) saca lo que la
 * app empaqueta:
 *
 *   assets/video/posters/<id>.webp     el PRIMER fotograma del clip (WebP q80, a la resolucion del
 *                                      clip): tapa el video mientras decodifica y, como es el mismo
 *                                      cuadro con el que arranca, no hay salto al empezar.
 *   assets/video/ejercicios/<id>.mp4   el clip. Se prueba H.264 perfil main, CRF 28, 24 fps, sin
 *                                      audio y con faststart, a 480 p como maximo (el mayor tamano
 *                                      en que se ve); si no queda al menos un 10 % mas liviano que el
 *                                      original, se copia el original tal cual (los de hoy ya son
 *                                      480 p, mudos y con faststart: recodificar solo perderia calidad).
 *
 * Al terminar vuelve a escribir src/media/videos.ts con generar_registry.py. Solo procesa lo que
 * cambio; `--todo` lo rehace todo.
 *
 *   npm run clips
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import ffmpeg from 'ffmpeg-static';

const RAIZ = process.cwd();
const FUENTE = path.join(RAIZ, 'media-fuente/video/ejercicios');
const CLIPS = path.join(RAIZ, 'assets/video/ejercicios');
const POSTERS = path.join(RAIZ, 'assets/video/posters');
const TMP = path.join(RAIZ, 'node_modules/.cache/optimizar-clips');

const ALTO_MAX = 480;
const CRF = 28;
const FPS = 24;
const AHORRO_MINIMO = 0.1;
const CALIDAD_POSTER = 80;

const todo = process.argv.includes('--todo');
const viejo = (destino: string, origen: string) =>
  todo || !fs.existsSync(destino) || fs.statSync(destino).mtimeMs < fs.statSync(origen).mtimeMs;

function correr(args: string[]) {
  execFileSync(ffmpeg as unknown as string, ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

function main() {
  for (const d of [CLIPS, POSTERS, TMP]) fs.mkdirSync(d, { recursive: true });
  let antes = 0;
  let despues = 0;
  let recodificados = 0;
  let posters = 0;
  const ids: string[] = [];

  for (const archivo of fs.readdirSync(FUENTE).sort()) {
    if (!/\.(mp4|m4v|mov)$/i.test(archivo)) continue;
    const id = path.basename(archivo, path.extname(archivo));
    ids.push(id);
    const origen = path.join(FUENTE, archivo);
    const clip = path.join(CLIPS, `${id}.mp4`);
    const poster = path.join(POSTERS, `${id}.webp`);

    if (viejo(clip, origen)) {
      const prueba = path.join(TMP, `${id}.mp4`);
      correr([
        '-i', origen, '-an', '-c:v', 'libx264', '-profile:v', 'main', '-preset', 'slow', '-crf', String(CRF),
        '-r', String(FPS), '-vf', `scale=-2:'min(${ALTO_MAX},ih)'`, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', prueba,
      ]);
      if (fs.statSync(prueba).size <= fs.statSync(origen).size * (1 - AHORRO_MINIMO)) {
        fs.copyFileSync(prueba, clip);
        recodificados++;
      } else {
        fs.copyFileSync(origen, clip);
      }
      fs.rmSync(prueba);
    }
    if (viejo(poster, origen)) {
      correr(['-i', origen, '-frames:v', '1', '-c:v', 'libwebp', '-quality', String(CALIDAD_POSTER), poster]);
      posters++;
    }
    antes += fs.statSync(origen).size;
    despues += fs.statSync(clip).size;
  }

  // Lo que ya no tiene original se borra.
  for (const [dir, ext] of [[CLIPS, '.mp4'], [POSTERS, '.webp']] as const) {
    for (const f of fs.readdirSync(dir)) if (!ids.includes(path.basename(f, ext))) fs.rmSync(path.join(dir, f));
  }

  const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
  const pesoPosters = fs.readdirSync(POSTERS).reduce((s, f) => s + fs.statSync(path.join(POSTERS, f)).size, 0);
  console.log(`clips: ${ids.length} (${recodificados} recodificados) · ${kb(antes)} -> ${kb(despues)} · posters ${posters} nuevos, ${kb(pesoPosters)}`);
  execFileSync('python3', ['generar_registry.py'], { cwd: RAIZ, stdio: 'inherit' });
}

main();
