/**
 * FORJA · exportar / importar progreso
 *
 * No hay backend: cambiar de telefono significaba perder todo. Esto exporta
 * TODO lo que vive bajo claves `forja:*` de AsyncStorage a un JSON que el
 * usuario manda por donde quiera (WhatsApp, Drive, correo) y luego importa
 * en el telefono nuevo.
 *
 * Los valores se tratan como texto opaco: se leen y se escriben tal cual
 * salen de AsyncStorage, sin reinterpretar el formato interno de cada
 * store (unos son JSON, otros son '1'/'0'). Eso evita que este archivo
 * tenga que conocer la forma exacta de cada uno y se desincronice si
 * cambian.
 *
 * La cuenta (forja:cuenta:v1) se exporta para que el respaldo sea completo,
 * pero NUNCA se escribe al importar: el usuario logueado en el telefono
 * nuevo es el dueño de esa cuenta, no el del respaldo.
 *
 * Ubicacion: src/store/respaldo.ts
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { version as APP_VERSION } from '../../package.json';
import { hoy, CLAVE as CLAVE_ESTADO } from './store';
import { CLAVE_GUARDADO as CLAVE_SESION } from '../session/useSessionPlayer';
import { CLAVE as CLAVE_VOZ } from './voz';
import { CLAVE as CLAVE_HAPTICS } from './haptics';
import { CLAVE as CLAVE_MAQUINA } from './maquina';
import { CLAVE as CLAVE_CUENTA } from './cuenta';

/** Version del formato del archivo de respaldo. Sube si cambia su forma. */
const FORMATO_ACTUAL = 1;

/** Las 6 claves reales de AsyncStorage bajo forja:*, tal como las define cada store. */
const CLAVES = [
  { clave: CLAVE_ESTADO, json: true },
  { clave: CLAVE_SESION, json: true },
  { clave: CLAVE_MAQUINA, json: true },
  { clave: CLAVE_VOZ, json: false },
  { clave: CLAVE_HAPTICS, json: false },
  { clave: CLAVE_CUENTA, json: true },
] as const;

const CLAVES_VALIDAS = new Set<string>(CLAVES.map(c => c.clave));

export interface Respaldo {
  formato: number;
  exportadoEn: string;
  appVersion: string;
  datos: Record<string, string>;
}

export type ResultadoExportar = { ok: true } | { ok: false; motivo: string };

export async function exportarProgreso(): Promise<ResultadoExportar> {
  try {
    const datos: Record<string, string> = {};
    for (const { clave } of CLAVES) {
      const v = await AsyncStorage.getItem(clave);
      if (v != null) datos[clave] = v;
    }

    const respaldo: Respaldo = {
      formato: FORMATO_ACTUAL,
      exportadoEn: new Date().toISOString(),
      appVersion: APP_VERSION,
      datos,
    };

    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, motivo: 'Este teléfono no puede compartir archivos.' };
    }

    const archivo = new File(Paths.cache, `darenow-progreso-${hoy()}.json`);
    archivo.create({ overwrite: true });
    archivo.write(JSON.stringify(respaldo, null, 2));

    await Sharing.shareAsync(archivo.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar mi progreso',
    });
    return { ok: true };
  } catch {
    return { ok: false, motivo: 'No se pudo exportar el progreso. Intenta otra vez.' };
  }
}

export type ResultadoElegir =
  | { ok: true; respaldo: Respaldo }
  | { ok: false; motivo: string }
  | { ok: 'cancelado' };

/**
 * Abre el selector de archivo y VALIDA el contenido, pero no escribe nada
 * todavia: eso es aplicarRespaldo(), despues de que el usuario confirme.
 */
export async function elegirRespaldo(): Promise<ResultadoElegir> {
  // Todo el flujo (abrir el selector, leer, parsear) queda dentro del mismo
  // try: cualquier fallo nativo inesperado sale como mensaje entendible,
  // nunca como un stack trace sin capturar en la pantalla de Ajustes.
  try {
    const seleccion = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (seleccion.canceled) return { ok: 'cancelado' };

    const archivo = new File(seleccion.assets[0].uri);
    const texto = await archivo.text();
    const parsed: unknown = JSON.parse(texto);

    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, motivo: 'Ese archivo no es un respaldo válido de DARENOW.' };
    }
    const p = parsed as Partial<Respaldo>;

    if (p.formato !== FORMATO_ACTUAL) {
      return {
        ok: false,
        motivo: `Este respaldo usa un formato distinto (v${p.formato ?? '?'}); esta app espera v${FORMATO_ACTUAL}. Actualiza la app o exporta un respaldo nuevo.`,
      };
    }
    if (typeof p.datos !== 'object' || p.datos === null || !(CLAVE_ESTADO in p.datos)) {
      return { ok: false, motivo: 'Este archivo no tiene progreso de entrenamiento de DARENOW.' };
    }

    for (const [clave, valor] of Object.entries(p.datos)) {
      if (!CLAVES_VALIDAS.has(clave)) continue; // clave desconocida: se ignora, no invalida el resto
      if (typeof valor !== 'string') {
        return { ok: false, motivo: 'El respaldo está dañado o incompleto.' };
      }
      const meta = CLAVES.find(c => c.clave === clave);
      if (meta?.json) {
        try { JSON.parse(valor); } catch {
          return { ok: false, motivo: 'El respaldo está dañado o incompleto.' };
        }
      }
    }

    return { ok: true, respaldo: p as Respaldo };
  } catch {
    return { ok: false, motivo: 'Ese archivo no es un respaldo válido de DARENOW.' };
  }
}

/**
 * Escribe un respaldo ya validado por elegirRespaldo(). Nunca toca
 * CLAVE_CUENTA. Devuelve cuantas claves se escribieron de verdad.
 */
export async function aplicarRespaldo(respaldo: Respaldo): Promise<number> {
  const pares = Object.entries(respaldo.datos)
    .filter(([clave]) => clave !== CLAVE_CUENTA && CLAVES_VALIDAS.has(clave)) as [string, string][];
  if (pares.length === 0) return 0;
  await AsyncStorage.multiSet(pares);
  return pares.length;
}
