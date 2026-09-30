import { textoVisible } from './presentacion';

/**
 * Los valores internos que la app guarda y como se leen (solo vista). El dato guardado no cambia: aqui
 * solo se traduce lo que hasta ahora salia crudo («muy_dificil», «cada 4 semanas»).
 */

/**
 * Los motivos de salida de una sesion, uno por opcion de la hoja de salida (`MOTIVOS_SALIDA` en
 * `HojaSalida.tsx`): el `id` es lo que se guarda en `motivoAbandono`.
 */
export const MOTIVOS_DE_SALIDA: Record<string, string> = {
  sin_tiempo: 'Sin tiempo',
  muy_dificil: 'Muy difícil',
  muy_facil: 'Muy fácil',
  molestia: 'Molestia',
  sin_ganas: 'Sin ganas',
};

/** Un motivo de salida legible. Uno que no esta en el mapa se muestra con espacios en vez de guiones bajos y con mayuscula inicial. */
export const textoDeMotivo = (valor: string): string =>
  MOTIVOS_DE_SALIDA[valor] ?? textoVisible(valor.replace(/_/g, ' ').trim());

/** El estado guardado de una sesion (`completada` o `abandonada`) con el texto de siempre: «Completa» y «Parcial». */
export const textoDeEstadoSesion = (estado: string): string => (estado === 'completada' ? 'Completa' : 'Parcial');

/** La frecuencia de un protocolo («cada 4 semanas», «opcional») con su mayuscula inicial. */
export const textoDeFrecuencia = (frecuencia: string): string => textoVisible(frecuencia);

/**
 * La unidad del valor que se captura en un protocolo de medicion. El dato no trae unidad (se guarda vacia), asi que
 * solo se sugiere en el campo, para los protocolos donde no hay duda: estatura y circunferencias en cm, peso en
 * kg, cadencia en pasos por minuto y frecuencia cardiaca en latidos por minuto.
 */
const UNIDADES_DE_MEDICION: Record<string, string> = {
  med_001: 'cm', med_004: 'cm', med_005: 'kg', med_007: 'pasos/min', med_008: 'lpm',
};
export const unidadDeMedicion = (id: string): string | undefined => UNIDADES_DE_MEDICION[id];

/** Los protocolos que no piden un valor (una foto y un conjunto de pruebas): hoy no llevan campo. */
export const PROTOCOLOS_SIN_VALOR: readonly string[] = ['med_003', 'med_006'];
