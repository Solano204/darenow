#!/usr/bin/env node
/**
 * FORJA · generar-iconos
 *
 * Genera todos los iconos de la app desde assets/brand/logo-master.png.
 *
 * El master tiene un simbolo ambar con ruido de IA sobre un fondo casi
 * negro, tambien con ruido: no son colores planos. Este script no intenta
 * conservar el color del master, solo su FORMA:
 *
 *   1. Mide el color de fondo real (promedio del anillo exterior del
 *      propio archivo, no un valor fijo, para que siga funcionando si el
 *      master cambia).
 *   2. Para cada pixel calcula la distancia de color contra ese fondo y la
 *      pasa por una rampa suave (smoothstep) para obtener alfa: lejos del
 *      fondo = opaco, cerca = transparente, y una franja intermedia que
 *      antialiasea el borde.
 *   3. Recorta al bounding box del simbolo y recolorea a un color PLANO
 *      (blanco o azul), conservando solo esa mascara alfa. Al no arrastrar
 *      nada del color original no hay halos oscuros en el borde.
 *   4. Centra el simbolo por su centroide de masa (no por el centro del
 *      bounding box), que es lo que de verdad se ve "centrado" en formas
 *      asimetricas como una flecha.
 *
 * El azul de abajo debe coincidir con color.acento en src/theme.ts (no se
 * importa el archivo porque este script corre fuera del bundle de
 * TypeScript). El fondo real de la app (color.fondo, #F7F4EF) no se usa
 * aqui: solo hace falta en app.json, para el backgroundColor del splash.
 *
 * Uso: node scripts/generar-iconos.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const MASTER = path.join(RAIZ, 'assets/brand/logo-master.png');

const AZUL = { r: 0x3b, g: 0x5e, b: 0xff };
const BLANCO = { r: 0xff, g: 0xff, b: 0xff };

// Umbrales de la rampa de alfa (distancia de color al fondo, 0-441 posibles
// en RGB). Medidos sobre logo-master.png: el fondo con ruido no pasa de
// ~60, el simbolo ambar arranca en ~235. Se deja margen de sobra a ambos
// lados para que el borde antialiasee sin comerse el trazo fino de la flecha.
const DIST_TRANSPARENTE = 70;
const DIST_OPACO = 200;

/** Color promedio del anillo exterior (3% del lado): el fondo real del archivo. */
function referenciaFondo(data, width, height, channels) {
  const anillo = Math.round(width * 0.03);
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < anillo || x >= width - anillo || y < anillo || y >= height - anillo) {
        const i = (y * width + x) * channels;
        sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; n++;
      }
    }
  }
  return { r: sr / n, g: sg / n, b: sb / n };
}

function smoothstep(lo, hi, x) {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

/** Mascara alfa (0-255) del simbolo, del tamaño del master. */
async function extraerMascara() {
  const { data, info } = await sharp(MASTER).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const fondo = referenciaFondo(data, width, height, channels);
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < data.length; i += channels, p++) {
    const dr = data[i] - fondo.r, dg = data[i + 1] - fondo.g, db = data[i + 2] - fondo.b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    alpha[p] = Math.round(smoothstep(DIST_TRANSPARENTE, DIST_OPACO, dist) * 255);
  }
  return { alpha, width, height, fondo };
}

/** Bounding box y centroide de masa (ponderado por alfa) del simbolo. */
function medirSimbolo(alpha, width, height, umbral = 13) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  let sx = 0, sy = 0, masa = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = alpha[y * width + x];
      if (a > umbral) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      sx += x * a; sy += y * a; masa += a;
    }
  }
  const caja = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  const centroide = { x: sx / masa - caja.left, y: sy / masa - caja.top };
  return { caja, centroide };
}

/** PNG del simbolo recortado a `caja`, en un color plano con la mascara alfa dada. */
async function simboloPlano(color, alpha, width, height, caja) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    rgba[p * 4] = color.r; rgba[p * 4 + 1] = color.g; rgba[p * 4 + 2] = color.b;
    rgba[p * 4 + 3] = alpha[p];
  }
  return sharp(rgba, { raw: { width, height, channels: 4 } }).extract(caja).png().toBuffer();
}

/**
 * Compone el simbolo (ya recortado a su bbox) en un lienzo cuadrado de
 * `lado`, ocupando `fraccion` del lado, centrado por `centroide` (en
 * coordenadas locales del recorte) en vez del centro geometrico del bbox.
 */
async function componer({ simbolo, lado, fraccion, fondo, centroide }) {
  const meta = await sharp(simbolo).metadata();
  const escala = Math.round(lado * fraccion) / Math.max(meta.width, meta.height);
  const anchoR = Math.round(meta.width * escala);
  const altoR = Math.round(meta.height * escala);
  const redimensionado = await sharp(simbolo).resize(anchoR, altoR).toBuffer();

  const cx = centroide.x * escala, cy = centroide.y * escala;
  const left = Math.round(lado / 2 - cx);
  const top = Math.round(lado / 2 - cy);

  return sharp({
    create: { width: lado, height: lado, channels: 4, background: fondo ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: redimensionado, left, top }]).png().toBuffer();
}

async function escribir(ruta, buffer) {
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, buffer);
  const meta = await sharp(buffer).metadata();
  console.log(`${path.relative(RAIZ, ruta).padEnd(34)} ${meta.width}x${meta.height}  ${(buffer.length / 1024).toFixed(1)} KB`);
}

async function main() {
  const { alpha, width, height, fondo } = await extraerMascara();
  const { caja, centroide } = medirSimbolo(alpha, width, height);
  console.log(`fondo del master: rgb(${fondo.r.toFixed(1)}, ${fondo.g.toFixed(1)}, ${fondo.b.toFixed(1)})`);
  console.log(`simbolo detectado: ${caja.width}x${caja.height} en (${caja.left},${caja.top})`);
  console.log('');

  const blanco = await simboloPlano(BLANCO, alpha, width, height, caja);
  const azul = await simboloPlano(AZUL, alpha, width, height, caja);

  await escribir(path.join(RAIZ, 'assets/icon.png'), await componer({
    simbolo: blanco, lado: 1024, fraccion: 0.62, fondo: { ...AZUL, alpha: 1 }, centroide,
  }));

  await escribir(path.join(RAIZ, 'assets/adaptive-icon.png'), await componer({
    simbolo: blanco, lado: 1024, fraccion: 0.58, fondo: null, centroide,
  }));

  await escribir(path.join(RAIZ, 'assets/adaptive-icon-mono.png'), await componer({
    simbolo: blanco, lado: 1024, fraccion: 0.58, fondo: null, centroide,
  }));

  await escribir(path.join(RAIZ, 'assets/splash-icon.png'), await componer({
    simbolo: azul, lado: 1024, fraccion: 0.80, fondo: null, centroide,
  }));

  const icon = fs.readFileSync(path.join(RAIZ, 'assets/icon.png'));

  await escribir(path.join(RAIZ, 'store/play-icon-512.png'),
    await sharp(icon).resize(512, 512).ensureAlpha().png({ compressionLevel: 9 }).toBuffer());

  await escribir(path.join(RAIZ, 'store/preview-48.png'),
    await sharp(icon).resize(48, 48).png().toBuffer());
}

main().catch(e => { console.error(e); process.exit(1); });
