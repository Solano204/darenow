/**
 * FORJA · scripts/lib/logo
 *
 * Extraccion compartida del simbolo de assets/brand/logo-master.png:
 * el master tiene un simbolo ambar con ruido de IA sobre un fondo casi
 * negro, tambien con ruido, no colores planos. Esto no conserva el color
 * del master, solo su FORMA (ver detalle en cada funcion), para que
 * generar-iconos.js y generar-banner.js recoloreen el mismo simbolo cada
 * uno a lo que necesiten sin duplicar la logica de extraccion.
 */

const sharp = require('sharp');

// Umbrales de la rampa de alfa (distancia de color al fondo, 0-441
// posibles en RGB). Medidos sobre logo-master.png: el fondo con ruido no
// pasa de ~60, el simbolo ambar arranca en ~235. Se deja margen de sobra
// a ambos lados para que el borde antialiasee sin comerse el trazo fino
// de la flecha.
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

/**
 * Mascara alfa (0-255) del simbolo, del tamaño del master: lejos del
 * fondo medido = opaco, cerca = transparente, con una franja intermedia
 * que antialiasea el borde.
 */
async function extraerMascara(rutaMaster) {
  const { data, info } = await sharp(rutaMaster).raw().toBuffer({ resolveWithObject: true });
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

/** Extrae y mide el simbolo del master en un solo paso. */
async function extraerSimbolo(rutaMaster) {
  const { alpha, width, height, fondo } = await extraerMascara(rutaMaster);
  const { caja, centroide } = medirSimbolo(alpha, width, height);
  return { alpha, width, height, fondo, caja, centroide };
}

module.exports = { extraerMascara, medirSimbolo, simboloPlano, extraerSimbolo };
