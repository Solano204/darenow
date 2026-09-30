/**
 * Pools de particulas para Skia (R6).
 *
 * Un sistema de particulas pinta un arreglo de puntos (`<Points>`). Crear ese arreglo (y un objeto
 * por particula) en cada cuadro llena de basura el hilo de UI. Aqui el arreglo se crea una vez, con
 * el tamano maximo del sistema, y cada cuadro se llena en su sitio (`sharedValue.modify`, que avisa
 * a Skia sin copiar). Las particulas que sobran en un cuadro se mandan fuera de la pantalla.
 */
/** Un punto que se puede mover en su sitio (el `SkPoint` de Skia es de solo lectura). */
export interface Punto { x: number; y: number }

/** Donde se aparcan las particulas que no se dibujan en este cuadro. */
export const FUERA = -10000;

/** Un pool de `n` puntos, todos aparcados. Se crea una vez por sistema (no por cuadro). */
export function crearPuntos(n: number): Punto[] {
  return Array.from({ length: n }, () => ({ x: FUERA, y: FUERA }));
}

/** Aparca los puntos desde `desde` hasta el final (worklet). */
export function aparcar(puntos: Punto[], desde: number): void {
  'worklet';
  for (let i = desde; i < puntos.length; i++) {
    puntos[i].x = FUERA;
    puntos[i].y = FUERA;
  }
}

/**
 * Limites del rediseno (DESIGN.md, «Presupuesto de Skia»): ningun sistema pasa de aqui.
 * - `ambiente`: loops que flotan sin fin (polvo de Bienvenida/Hoy).
 * - `aplauso`: la nube de magnesia.
 * - `listo`: el texto que se arma con particulas («¿Listo?»).
 */
export const LIMITE_PARTICULAS = { ambiente: 25, aplauso: 80, listo: 220 } as const;
