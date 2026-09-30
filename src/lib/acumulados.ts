/**
 * Suma de los anteriores: `[3, 1, 2]` → `[0, 3, 4]`. Para calcular en el render dónde empieza
 * cada tramo (primer índice de un bloque, retraso de una animación en cadena) sin ir sumando en
 * una variable dentro de un `map`, que el React Compiler no acepta.
 */
export function acumuladosPrevios(numeros: readonly number[]): number[] {
  const salida: number[] = [];
  let suma = 0;
  for (const n of numeros) { salida.push(suma); suma += n; }
  return salida;
}
