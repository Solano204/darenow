#!/usr/bin/env node
/**
 * FORJA · contraste
 *
 * Calcula la relacion de contraste WCAG entre un color de texto y un
 * color de fondo, con la formula estandar: luminancia relativa de cada
 * color, (claro+0.05)/(oscuro+0.05).
 *
 * Uso:
 *   node scripts/contraste.js <texto> <fondo> [--tamano=normal|grande] [--base=#hex]
 *   node scripts/contraste.js --selftest
 *
 * Colores: #RGB, #RRGGBB, o rgba(r,g,b,a). Un color con alpha se compone
 * sobre --base (blanco por defecto) antes de medir: eso es lo que el ojo
 * ve de verdad cuando el token es un velo semitransparente (acentoTinte,
 * un scrim sobre una foto, etc.), no el color "puro" del token.
 *
 * Umbrales WCAG:
 *   texto normal                      >= 4.5:1
 *   texto grande (18pt+ o 14pt bold)  >= 3:1
 *   cualquier cosa bajo 3:1 es ilegible, sin discusion
 */

function parseColor(str) {
  str = str.trim();
  const rgba = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (rgba) {
    const [, r, g, b, a] = rgba;
    return { r: +r, g: +g, b: +b, a: a === undefined ? 1 : +a };
  }
  let hex = str.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6 && hex.length !== 8) {
    throw new Error(`Color invalido: "${str}". Usa #RGB, #RRGGBB o rgba(r,g,b,a).`);
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
  };
}

/** "Source over": compone `color` (con alpha) sobre `base` (opaco). */
function componer(color, base) {
  if (color.a >= 1) return color;
  return {
    r: color.r * color.a + base.r * (1 - color.a),
    g: color.g * color.a + base.g * (1 - color.a),
    b: color.b * color.a + base.b * (1 - color.a),
    a: 1,
  };
}

function canalLineal(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminancia({ r, g, b }) {
  return 0.2126 * canalLineal(r) + 0.7152 * canalLineal(g) + 0.0722 * canalLineal(b);
}

function contraste(colorA, colorB) {
  const la = luminancia(colorA);
  const lb = luminancia(colorB);
  const [claro, oscuro] = la > lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Mide texto sobre fondo, componiendo alpha si hace falta. Devuelve el
 *  reporte completo (ratio, umbral, si pasa) en vez de solo imprimir. */
function medir(textoStr, fondoStr, { tamano = 'normal', base = { r: 255, g: 255, b: 255, a: 1 } } = {}) {
  const texto = componer(parseColor(textoStr), base);
  const fondo = componer(parseColor(fondoStr), base);
  const ratio = contraste(texto, fondo);
  const umbral = tamano === 'grande' ? 3 : 4.5;
  return { textoStr, fondoStr, tamano, umbral, ratio, pasa: ratio >= umbral };
}

function selftest() {
  const assert = require('assert');
  // Negro sobre blanco: el par de referencia, contraste maximo = 21:1.
  assert.strictEqual(Math.round(medir('#000000', '#FFFFFF').ratio), 21);
  // Mismo color: contraste minimo = 1:1.
  assert.ok(Math.abs(medir('#3B5EFF', '#3B5EFF').ratio - 1) < 0.001);
  // rgba con alpha 1 debe dar lo mismo que su hex equivalente.
  const conAlpha = medir('rgba(0,0,0,1)', '#FFFFFF').ratio;
  assert.ok(Math.abs(conAlpha - 21) < 0.1);
  // Componer sobre --base debe cambiar el resultado (no ignorar el alpha).
  const opaco = medir('rgba(59,94,255,1)', '#FFFFFF').ratio;
  const tenue = medir('rgba(59,94,255,0.10)', '#FFFFFF').ratio;
  assert.notStrictEqual(Math.round(opaco * 100), Math.round(tenue * 100));
  console.log('contraste.js: selftest OK');
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) { selftest(); return; }

  const posicionales = args.filter(a => !a.startsWith('--'));
  const flags = Object.fromEntries(
    args.filter(a => a.startsWith('--')).map(a => {
      const [k, v] = a.slice(2).split('=');
      return [k, v ?? true];
    }),
  );

  if (posicionales.length < 2) {
    console.error('Uso: node scripts/contraste.js <texto> <fondo> [--tamano=normal|grande] [--base=#hex]');
    console.error('     node scripts/contraste.js --selftest');
    process.exit(2);
  }

  const [textoStr, fondoStr] = posicionales;
  const tamano = flags.tamano === 'grande' ? 'grande' : 'normal';
  const base = flags.base ? parseColor(flags.base) : { r: 255, g: 255, b: 255, a: 1 };

  const r = medir(textoStr, fondoStr, { tamano, base });
  console.log(`texto:  ${r.textoStr}`);
  console.log(`fondo:  ${r.fondoStr}`);
  console.log(`tamano: ${r.tamano} (umbral ${r.umbral}:1)`);
  console.log(`contraste: ${r.ratio.toFixed(2)}:1`);
  console.log(r.pasa ? `PASA (${r.ratio.toFixed(2)} >= ${r.umbral})` : `NO PASA (${r.ratio.toFixed(2)} < ${r.umbral})`);
  process.exit(r.pasa ? 0 : 1);
}

if (require.main === module) main();

module.exports = { parseColor, componer, contraste, luminancia, medir };
