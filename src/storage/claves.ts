/**
 * DARENOW · claves de AsyncStorage
 *
 * Todas las claves bajo `forja:` en un solo lugar. Cada store las importa de aqui en vez de
 * definirlas y exportarlas por su cuenta: asi cuenta.ts y respaldo.ts (que necesitan la lista
 * completa) no se importan entre si. Los valores son los de siempre: cambiarlos perderia los
 * datos guardados.
 */

export const CLAVE_ESTADO = 'forja:v1';
export const CLAVE_CUENTA = 'forja:cuenta:v1';
export const CLAVE_SESION_EN_CURSO = 'forja:sesion_en_curso';
export const CLAVE_VOZ = 'forja:voz';
export const CLAVE_HAPTICS = 'forja:haptics';
export const CLAVE_MAQUINA = 'forja:ajustes_maquina';
export const CLAVE_CONSENTIMIENTO_MEDIDAS = 'forja:consentimiento_medidas';
