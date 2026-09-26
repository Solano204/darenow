import { nombreVisible } from '../data/nombresVisibles';
import { equipoPorId } from '../data/catalog';

/**
 * Ayudas de presentacion. Solo se usan para mostrar: nunca modifican los datos
 * originales ni entran en la logica, la busqueda o los identificadores.
 */

/** Primera letra en mayuscula, el resto tal cual. */
export const capitalizar = (texto: string): string =>
  texto.length > 0 ? texto[0].toUpperCase() + texto.slice(1) : texto;

/** Texto del catalogo listo para mostrar: con sus tildes y la primera letra en mayuscula. */
export const textoVisible = (texto: string): string => capitalizar(nombreVisible(texto));

/** La clave de una afirmacion de evidencia («fuerza_pierna») como texto: sin guiones bajos, con tildes y mayuscula inicial. */
export const textoDeAfirmacion = (clave: string): string => textoVisible(clave.replace(/_/g, ' '));

/** «60 s» → { numero: 60, unidad: 's' }. Si el valor no empieza por un numero entero, `numero` es null y la unidad es todo el texto. */
export function separarNumeroUnidad(valor: string): { numero: number | null; unidad: string } {
  const m = valor.trim().match(/^(\d+)\s*(.*)$/);
  return m ? { numero: Number(m[1]), unidad: m[2] } : { numero: null, unidad: valor };
}

/** Zonas de riesgo como una frase: «Rodilla, cadera». `atm` es una sigla. */
export function textoDeZonas(zonas: string[]): string {
  return capitalizar(zonas.map(z => (z === 'atm' ? 'ATM' : nombreVisible(z))).join(', '));
}

/** Equipo de un ejercicio como una frase: «Pared, silla o escalón». Sin equipo: «Sin equipo». */
export function textoDeEquipo(ids: string[]): string {
  const nombres = ids.filter(i => i !== 'ninguno').map(i => nombreVisible(equipoPorId.get(i)?.name ?? i));
  if (nombres.length === 0) return 'Sin equipo';
  return nombres.map((n, i) => (i === 0 ? capitalizar(n) : n[0].toLowerCase() + n.slice(1))).join(', ');
}
