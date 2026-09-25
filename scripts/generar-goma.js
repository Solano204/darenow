#!/usr/bin/env node
/**
 * Genera assets/img/goma-tile.png: grano fino + motas de color muy escasas,
 * para teselar como fondo de piso de goma. Determinista (semilla fija).
 *
 * Uso: node scripts/generar-goma.js
 */
const sharp = require('sharp');
const path = require('path');

const LADO = 512;
const OPACIDAD_GRANO = 0.10;
const OPACIDAD_MOTA = 0.06;
const MOTAS = 18;
const NIVELES = 6;
const COLORES = [
  [0x1f, 0xa4, 0x63],
  [0xf2, 0xc2, 0x30],
  [0x25, 0x53, 0xe8],
  [0xe0, 0x41, 0x2f],
];

function semilla(n) {
  return () => {
    n |= 0; n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = semilla(20260925);
const buf = Buffer.alloc(LADO * LADO * 4);

for (let i = 0; i < LADO * LADO; i++) {
  const v = rnd();
  const claro = v > 0.5;
  const fuerza = Math.abs(v - 0.5) * 2 * OPACIDAD_GRANO;
  buf[i * 4] = buf[i * 4 + 1] = buf[i * 4 + 2] = claro ? 255 : 0;
  // Pocos niveles de alfa: el PNG paletizado pesa una fraccion.
  buf[i * 4 + 3] = Math.round((Math.round(fuerza / OPACIDAD_GRANO * NIVELES) / NIVELES) * OPACIDAD_GRANO * 255);
}

for (let m = 0; m < MOTAS; m++) {
  const cx = Math.floor(rnd() * LADO);
  const cy = Math.floor(rnd() * LADO);
  const r = 2 + Math.floor(rnd() * 3);
  const [R, G, B] = COLORES[m % COLORES.length];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      // Envuelve en los bordes para que el tile encaje sin costura.
      const x = (cx + dx + LADO) % LADO;
      const y = (cy + dy + LADO) % LADO;
      const o = (y * LADO + x) * 4;
      buf[o] = R; buf[o + 1] = G; buf[o + 2] = B;
      buf[o + 3] = Math.round(OPACIDAD_MOTA * 255);
    }
  }
}

sharp(buf, { raw: { width: LADO, height: LADO, channels: 4 } })
  .png({ palette: true, colours: 32, compressionLevel: 9 })
  .toFile(path.join(__dirname, '..', 'assets', 'img', 'goma-tile.png'))
  .then(info => console.log(`goma-tile.png ${info.width}x${info.height}, ${(info.size / 1024).toFixed(0)} KB`));
