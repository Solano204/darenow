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
const { extraerSimbolo, simboloPlano } = require('./lib/logo');

const RAIZ = path.join(__dirname, '..');
const MASTER = path.join(RAIZ, 'assets/brand/logo-master.png');

const AZUL = { r: 0x3b, g: 0x5e, b: 0xff };
const BLANCO = { r: 0xff, g: 0xff, b: 0xff };

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
  const { alpha, width, height, fondo, caja, centroide } = await extraerSimbolo(MASTER);
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
