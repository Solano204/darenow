#!/usr/bin/env node
/**
 * FORJA · generar-banner
 *
 * Feature graphic de Google Play (1024x500) desde store/banner-bg.png:
 * recorta/escala el fondo, le suma un degradado de navy semitransparente
 * en el tercio izquierdo para que el texto blanco contraste sobre la
 * foto, y coloca ahi el simbolo del logo (misma extraccion que
 * generar-iconos.js, ver scripts/lib/logo.js) mas "DARENOW" y el eslogan.
 *
 * Tipografia: se intento incrustar la fuente real de la app (Baloo2/Inter,
 * tomadas de @expo-google-fonts/* ya que el proyecto no tiene
 * assets/fonts) como @font-face en base64, pero el renderer de sharp en
 * esta maquina (libvips 8.18 + librsvg 2.62) la ignora en silencio y cae
 * a una fuente de reemplazo aunque el SVG sea valido (se verifico
 * comparando el resultado contra una familia inexistente: son pixel por
 * pixel identicos). Las fuentes con NOMBRE de sistema si resuelven bien
 * via fontconfig, asi que este script usa Segoe UI (la sans del sistema
 * en esta maquina Windows) para el titulo y el eslogan. Si este script
 * se corre en otro SO, cambiar FUENTE_SISTEMA por una que exista ahi
 * (p.ej. "Helvetica Neue" en macOS o "Arial" para maxima portabilidad).
 *
 * Uso: node scripts/generar-banner.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { extraerSimbolo, simboloPlano } = require('./lib/logo');

const RAIZ = path.join(__dirname, '..');
const MASTER = path.join(RAIZ, 'assets/brand/logo-master.png');
const FONDO_BANNER = path.join(RAIZ, 'store/banner-bg.png');
const SALIDA = path.join(RAIZ, 'store/feature-graphic-1024x500.png');

const ANCHO = 1024;
const ALTO = 500;

const BLANCO = { r: 0xff, g: 0xff, b: 0xff };
const NAVY = '#0F1840'; // azul marino oscuro, derivado de color.acento (#3B5EFF) para que combine
const FUENTE_SISTEMA = 'Segoe UI';

const SIMBOLO_ALTO = 120;
const MARGEN_IZQUIERDO = 72;
const ESPACIO_SIMBOLO_TEXTO = 28;
const CENTRO_Y = ALTO / 2;
const TITULO_BASELINE_Y = CENTRO_Y - 6;
const ESLOGAN_BASELINE_Y = CENTRO_Y + 40;

function escaparSvg(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** SVG con el degradado de contraste y los dos textos, del tamaño del banner. */
function construirSvgTexto({ textoX }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="${Math.round(ANCHO / 3)}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${NAVY}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${NAVY}" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${ANCHO}" height="${ALTO}" fill="url(#fade)" />
  <text x="${textoX}" y="${TITULO_BASELINE_Y}" font-family="${FUENTE_SISTEMA}" font-weight="700"
    font-size="64" letter-spacing="1.5" fill="#FFFFFF">DARENOW</text>
  <text x="${textoX}" y="${ESLOGAN_BASELINE_Y}" font-family="${FUENTE_SISTEMA}" font-weight="400"
    font-size="26" fill="#FFFFFF" fill-opacity="0.85">${escaparSvg('Atrévete hoy. Entrena a tu medida.')}</text>
</svg>`;
}

async function main() {
  const fondo = await sharp(FONDO_BANNER)
    .resize({ width: ANCHO, height: ALTO, fit: 'cover', position: 'right' })
    .toBuffer();

  const { alpha, width, height, caja } = await extraerSimbolo(MASTER);
  const simboloBlanco = await simboloPlano(BLANCO, alpha, width, height, caja);
  const escala = SIMBOLO_ALTO / caja.height;
  const simboloAncho = Math.round(caja.width * escala);
  const simboloRedimensionado = await sharp(simboloBlanco).resize(simboloAncho, SIMBOLO_ALTO).toBuffer();
  const simboloTop = Math.round(CENTRO_Y - SIMBOLO_ALTO / 2);

  const textoX = MARGEN_IZQUIERDO + simboloAncho + ESPACIO_SIMBOLO_TEXTO;
  const svgTexto = construirSvgTexto({ textoX });

  const conCapas = await sharp(fondo)
    .composite([
      { input: Buffer.from(svgTexto) },
      { input: simboloRedimensionado, left: MARGEN_IZQUIERDO, top: simboloTop },
    ])
    .png()
    .toBuffer();

  // flatten() encadenado justo despues de composite() no quita el canal
  // alfa en esta version de sharp (deja hasAlpha=true igual); aplicarlo
  // en una segunda pasada sobre el buffer ya compuesto si funciona.
  const compuesto = await sharp(conCapas)
    .flatten({ background: NAVY })
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, compuesto);

  const meta = await sharp(compuesto).metadata();
  console.log(`simbolo: ${simboloAncho}x${SIMBOLO_ALTO} en (${MARGEN_IZQUIERDO},${simboloTop})`);
  console.log(`texto desde x=${textoX}`);
  console.log('');
  console.log(`${path.relative(RAIZ, SALIDA)}  ${meta.width}x${meta.height}  alfa=${meta.hasAlpha}  ${(compuesto.length / 1024).toFixed(1)} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });
