/**
 * FORJA · sonido
 *
 * ARCHIVO GENERADO por generar_registry.py en su bloque de requires. El resto
 * del archivo es estable; solo se reescribe el objeto SONIDOS.
 *
 * Nueve tonos cortos, sin voz. La app no dice numeros: los tres tins de la
 * cuenta suben de altura y eso basta para saber que faltan tres, dos, uno.
 *
 * Reglas que sostienen todo el diseño:
 *
 *  - Un player por archivo, creado una sola vez. Crear el player en el
 *    momento de sonar mete entre 50 y 200 ms de retraso, y un pitido que
 *    llega tarde es peor que ninguno.
 *  - Antes de cada disparo se hace seekTo(0). Si no, el segundo tin del
 *    mismo archivo no suena porque el player ya esta al final.
 *  - Si el archivo no esta en el registro, reproducir() no hace nada. La app
 *    funciona con cero sonidos, igual que funciona con cero imagenes.
 *  - No se pide el foco de audio. Si el usuario trae musica puesta, sigue
 *    sonando y el tin se mezcla encima.
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export type Sonido =
  | 'cuenta_3' | 'cuenta_2' | 'cuenta_1'
  | 'inicio_serie' | 'fin_serie' | 'cambio_lado'
  | 'fin_descanso' | 'fin_sesion' | 'toque';

/* snd · 9 */
const SONIDOS: Partial<Record<Sonido, number>> = {
  'cuenta_3': require('../../assets/snd/cuenta_3.mp3'),
  'cuenta_2': require('../../assets/snd/cuenta_2.mp3'),
  'cuenta_1': require('../../assets/snd/cuenta_1.mp3'),
  'inicio_serie': require('../../assets/snd/inicio_serie.mp3'),
  'fin_serie': require('../../assets/snd/fin_serie.mp3'),
  'cambio_lado': require('../../assets/snd/cambio_lado.mp3'),
  'fin_descanso': require('../../assets/snd/fin_descanso.mp3'),
  'fin_sesion': require('../../assets/snd/fin_sesion.mp3'),
  'toque': require('../../assets/snd/toque.mp3'),
};

const players = new Map<Sonido, AudioPlayer>();
let encendido = true;
let preparado = false;

/** Lo llama el reproductor al montar. Idempotente. */
export function prepararSonido(): void {
  if (preparado) return;
  preparado = true;

  // Que el tin suene aunque el telefono este en silencio no es obvio: en iOS
  // hay que pedirlo. Se pide solo playsInSilentMode, no el foco de audio, asi
  // la musica del usuario no se corta.
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  }).catch(() => { /* si falla, los sonidos siguen funcionando con el perfil por defecto */ });

  for (const nombre of Object.keys(SONIDOS) as Sonido[]) {
    const fuente = SONIDOS[nombre];
    if (fuente == null) continue;
    try {
      players.set(nombre, createAudioPlayer(fuente));
    } catch {
      // un archivo corrupto no debe tumbar la sesion; ese sonido queda mudo
    }
  }
}

/** Lo llama el reproductor al desmontar. Libera los nueve players. */
export function soltarSonido(): void {
  for (const p of players.values()) {
    try { p.remove(); } catch { /* ya liberado */ }
  }
  players.clear();
  preparado = false;
}

/** Interruptor de Ajustes. Con false, reproducir() no hace nada. */
export function activarSonido(v: boolean): void {
  encendido = v;
}

export function reproducir(nombre: Sonido): void {
  if (!encendido) return;
  const p = players.get(nombre);
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // el player se libero entre el disparo y este punto
  }
}

export function cuantosSonidos(): number {
  return Object.keys(SONIDOS).length;
}
