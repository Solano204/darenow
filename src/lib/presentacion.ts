import { nombreVisible } from '@/data/nombresVisibles';
import { equipoPorId } from '@/data/catalog';

/**
 * Ayudas de presentacion. Solo se usan para mostrar: nunca modifican los datos
 * originales ni entran en la logica, la busqueda o los identificadores.
 */

/** Primera letra en mayuscula, el resto tal cual. */
export const capitalizar = (texto: string): string =>
  texto.length > 0 ? texto[0].toUpperCase() + texto.slice(1) : texto;

/** Texto del catalogo listo para mostrar: con sus tildes y la primera letra en mayuscula. */
export const textoVisible = (texto: string): string => capitalizar(nombreVisible(texto));

const INTERROGATIVAS: Record<string, string> = {
  que: 'qué', cuanto: 'cuánto', cuanta: 'cuánta', cuantos: 'cuántos', cuantas: 'cuántas',
  cuando: 'cuándo', como: 'cómo', donde: 'dónde', quien: 'quién', quienes: 'quiénes', cual: 'cuál',
};

/**
 * Una pregunta lista para mostrar: con el signo de apertura «¿» si solo trae el «?», con las
 * tildes del catalogo y con el interrogativo acentuado cuando abre la pregunta o va tras «por»,
 * «cada», «de», «desde», «hasta» o «para» («Por que…» → «¿Por qué…?», «Cada cuanto…» → «¿Cada
 * cuánto…?»). Solo actua sobre lo que termina en «?»; una frase que no es pregunta pasa igual.
 */
export function textoDePregunta(pregunta: string): string {
  const t = nombreVisible(pregunta.trim());
  if (!t.endsWith('?')) return t;
  const acentuada = t.replace(
    /^((?:Por |Cada |De |Desde |Hasta |Para )?)(que|cuantos|cuantas|cuanto|cuanta|cuando|como|donde|quienes|quien|cual)\b/i,
    (_, prefijo: string, palabra: string) => {
      const con = INTERROGATIVAS[palabra.toLowerCase()];
      return prefijo + (palabra[0] === palabra[0].toUpperCase() ? capitalizar(con) : con);
    },
  );
  return acentuada.startsWith('¿') ? acentuada : `¿${acentuada}`;
}

/** Las comillas simples rectas de un texto ('calorías restantes') como comillas latinas («calorías restantes»). */
export const comillasLatinas = (texto: string): string =>
  texto.replace(/(^|[\s([])'([^'\n]+?)'(?=$|[\s.,;:!?)\]])/g, '$1«$2»');

/** Las etiquetas del dato que solas no se leen bien («cabeza_cuello» sin mas seria «Cabeza cuello»). */
const ETIQUETAS: Record<string, string> = { cabeza_cuello: 'Cabeza y cuello' };

/** Una etiqueta del dato («tren_superior», «pecho») como texto: sin guiones bajos, con tildes y mayuscula inicial. */
export const textoDeEtiqueta = (dato: string): string =>
  ETIQUETAS[dato] ?? capitalizar(nombreVisible(dato.replace(/_/g, ' ')));

/** La clave de una afirmacion de evidencia («fuerza_pierna») como texto: sin guiones bajos, con tildes y mayuscula inicial. */
export const textoDeAfirmacion = (clave: string): string => textoVisible(clave.replace(/_/g, ' '));

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
