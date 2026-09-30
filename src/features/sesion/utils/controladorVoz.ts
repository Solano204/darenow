/**
 * DARENOW · voz del reproductor
 *
 * El audio de voz es un sistema externo a React: aqui vive el player, su listener y el respaldo
 * de expo-speech, y el reproductor lee «esta hablando» con `useSyncExternalStore`. Asi los
 * efectos que anuncian fases solo arrancan la voz; no cambian estado de React (R4).
 */
import * as Speech from 'expo-speech';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { fuenteVoz, type TipoVoz } from '@/media/voz';

export interface FuenteVoz { tipo: TipoVoz; id: string; texto: string }

export function crearControladorVoz() {
  let hablando = false;
  const oyentes = new Set<() => void>();
  const marcar = (v: boolean) => {
    if (hablando === v) return;
    hablando = v;
    oyentes.forEach(f => f());
  };

  // Un solo player reutilizable para los 198 audios de voz: crearlo al
  // momento de hablar (no 198 de golpe al montar) cuesta 50-200ms una vez,
  // y de ahi en adelante cada frase solo hace replace()+play() sobre el
  // mismo player. Perezoso: si la voz esta apagada nunca se crea.
  let reproductor: AudioPlayer | null = null;
  let suscripcion: ReturnType<AudioPlayer['addListener']> | null = null;
  const obtenerReproductor = (): AudioPlayer => {
    if (!reproductor) reproductor = createAudioPlayer(null);
    return reproductor;
  };

  // Cada llamada corta la anterior y arranca una nueva. Con expo-speech el
  // aviso tardio de la que se corta ("onStopped") podia llegar DESPUES de
  // que la nueva ya arranco; con el player de archivos el equivalente es
  // un "playbackStatusUpdate" viejo llegando tarde. Por eso cada llamada
  // vuelve a registrar su propio listener (quitando el anterior) con su
  // propio id: solo el aviso de la llamada mas reciente apaga `hablando`.
  let hablaId = 0;
  function hablar(fuente: FuenteVoz, alTerminar?: () => void) {
    const id = ++hablaId;
    // Idempotente: ademas del guard de id, protege contra un doble disparo
    // (el listener y el catch de mas abajo podrian, en teoria, llamarlo los dos).
    let terminado = false;
    const terminar = () => {
      if (terminado || hablaId !== id) return;
      terminado = true;
      marcar(false);
      alTerminar?.();
    };

    const audio = fuenteVoz(fuente.tipo, fuente.id);
    if (audio != null) {
      try {
        marcar(true);
        const player = obtenerReproductor();
        suscripcion?.remove();
        suscripcion = player.addListener('playbackStatusUpdate', status => {
          if (status.didJustFinish) { suscripcion?.remove(); terminar(); }
        });
        player.replace(audio);
        player.play();
        return;
      } catch {
        // el archivo fallo al cargar o reproducir: no dejar la sesion
        // colgada esperando un "termino" que ya nunca va a llegar.
        terminar();
        return;
      }
    }

    // Respaldo: el mp3 todavia no existe en el registro (ver src/media/voz.ts).
    if (!fuente.texto) { alTerminar?.(); return; }
    Speech.stop();
    marcar(true);
    Speech.speak(fuente.texto, {
      language: 'es-MX',
      pitch: 0.85,
      onDone: terminar,
      onStopped: terminar,
      onError: terminar,
    });
  }

  /** Corta la voz y libera el player (al salir del reproductor). */
  function soltar() {
    Speech.stop();
    suscripcion?.remove();
    try { reproductor?.remove(); } catch { /* ya liberado */ }
  }

  return {
    hablar,
    soltar,
    suscribir: (f: () => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; },
    estaHablando: () => hablando,
  };
}
