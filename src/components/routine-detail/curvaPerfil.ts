import type { Tramo } from '@/utils/estimarTramos';

/**
 * La forma del perfil de una rutina. Es decorativa: la intensidad es fija por tipo de
 * bloque (no un dato medido ni inventado por ejercicio) y solo dibuja «subes, trabajas,
 * bajas». Devuelve valores de 0 a 1.
 */

const CALENTAMIENTO = { desde: 0.3, hasta: 0.6 };
const ENFRIAMIENTO = { desde: 0.5, hasta: 0.2 };
const PRINCIPAL = { valle: 0.7, cima: 0.95 };
const MESETA = { borde: 0.45, nivel: 0.82, rampa: 0.06 };
/** Lado, en muestras, de la ventana con la que se suaviza (dos pasadas): redondea las uniones entre tramos. */
const RADIO_SUAVIZADO = 3;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Intensidad de un tramo en su posicion relativa `u` (0 al inicio, 1 al final). */
function intensidadEn(tramo: Tramo, u: number): number {
  switch (tramo.tipo) {
    case 'calentamiento':
      return lerp(CALENTAMIENTO.desde, CALENTAMIENTO.hasta, u);
    case 'enfriamiento':
      return lerp(ENFRIAMIENTO.desde, ENFRIAMIENTO.hasta, u);
    case 'plano':
      if (tramo.vueltas <= 1) {
        if (u < MESETA.rampa) return lerp(MESETA.borde, MESETA.nivel, u / MESETA.rampa);
        if (u > 1 - MESETA.rampa) return lerp(MESETA.nivel, MESETA.borde, (u - (1 - MESETA.rampa)) / MESETA.rampa);
        return MESETA.nivel;
      }
      return joroba(u, tramo.vueltas);
    default:
      return joroba(u, tramo.vueltas);
  }
}

/** Una joroba por vuelta: de 70 % a 95 % y de vuelta a 70 %. */
function joroba(u: number, vueltas: number): number {
  const v = u * vueltas;
  const fase = v >= vueltas ? 1 : v - Math.floor(v);
  return PRINCIPAL.valle + (PRINCIPAL.cima - PRINCIPAL.valle) * Math.sin(Math.PI * fase) ** 2;
}

function suavizar(v: number[]): number[] {
  return v.map((_, i) => {
    let suma = 0;
    let n = 0;
    for (let k = -RADIO_SUAVIZADO; k <= RADIO_SUAVIZADO; k++) {
      const j = Math.min(v.length - 1, Math.max(0, i + k));
      suma += v[j];
      n++;
    }
    return suma / n;
  });
}

/** `n` muestras uniformes a lo ancho de todos los tramos (de 0 a 1 de ancho), ya suavizadas. */
export function muestrasPerfil(tramos: Tramo[], n: number): number[] {
  if (tramos.length === 0 || n < 2) return [];
  const crudas = Array.from({ length: n }, (_, i) => {
    const x = i / (n - 1);
    const k = tramos.findIndex((t, j) => x < t.inicio + t.fraccion || j === tramos.length - 1);
    const t = tramos[k];
    const u = Math.min(1, Math.max(0, (x - t.inicio) / t.fraccion));
    return intensidadEn(t, u);
  });
  return suavizar(suavizar(crudas));
}
