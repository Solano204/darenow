/**
 * FORJA · seleccion de claves a borrar
 *
 * Logica pura (sin AsyncStorage, sin React) para que borrarTodosLosDatos()
 * sea testeable con un script de node plano: recibe la lista conocida y las
 * claves que de verdad existen ahorita, y devuelve la union con cualquier
 * otra que empiece con "forja:" (red de seguridad si se agrega un store
 * nuevo y se olvida sumarlo a la lista explicita). Nunca toca claves de
 * otras librerias.
 *
 * Ubicacion: src/store/clavesForja.ts
 */
export const PREFIJO_FORJA = 'forja:';

export function seleccionarClavesForja(
  conocidas: readonly string[],
  existentes: readonly string[],
): string[] {
  const set = new Set(conocidas);
  for (const k of existentes) if (k.startsWith(PREFIJO_FORJA)) set.add(k);
  return [...set];
}
