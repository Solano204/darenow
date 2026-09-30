/**
 * DARENOW · lectura inicial
 *
 * Al arrancar, estado, cuenta y vibracion se leian con tres `getItem` separados (tres viajes al
 * almacenamiento nativo). Aqui se piden juntos con un solo `multiGet`, la primera vez que alguien
 * los necesita. Mismas claves y el mismo texto guardado: cada modulo lo sigue interpretando igual.
 *
 * Cada clave se entrega una sola vez (la primera lectura de la app). Cualquier lectura posterior
 * va directo a AsyncStorage, para no devolver un valor viejo despues de un guardado.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CLAVE_CUENTA, CLAVE_ESTADO, CLAVE_HAPTICS } from './claves';

const CLAVES = [CLAVE_ESTADO, CLAVE_CUENTA, CLAVE_HAPTICS] as const;
type ClaveInicial = (typeof CLAVES)[number];

let lote: Promise<Map<string, string | null>> | null = null;
const entregadas = new Set<string>();

export function leerAlArrancar(clave: ClaveInicial): Promise<string | null> {
  if (entregadas.has(clave)) return AsyncStorage.getItem(clave);
  entregadas.add(clave);
  lote ??= AsyncStorage.multiGet([...CLAVES]).then(pares => new Map(pares));
  return lote.then(m => m.get(clave) ?? null);
}
