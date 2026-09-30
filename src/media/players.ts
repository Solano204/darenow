/**
 * DARENOW · players de video (R5)
 *
 * Todo player de la app se crea y se suelta aqui (`ClipEjercicio` es el unico que los usa). Asi
 * se cumple la politica de clips y se puede comprobar:
 * - Cada player es mudo, en bucle y sin eventos de progreso (como siempre).
 * - `prepararClip(id)` crea el player del siguiente ejercicio pausado, con su fuente cargando (el
 *   reproductor lo pide en el descanso); `tomarPreparado(id)` lo entrega al clip que lo muestra.
 *   Solo se guarda uno: preparar otro suelta el anterior.
 * - Con `EXPO_PUBLIC_PERF=1` cada cambio imprime `[players] vivos N · reproduciendo M`
 *   (`adb logcat -s ReactNativeJS | grep "\[players\]"`). La meta: nunca mas de 1 reproduciendo
 *   (2 vivos durante una transicion).
 */
import { createVideoPlayer, type VideoPlayer, type VideoSource } from 'expo-video';
import { clipFuente } from './videos';

const PERF = process.env.EXPO_PUBLIC_PERF === '1';

const vivos = new Set<VideoPlayer>();
const reproduciendo = new Set<VideoPlayer>();
let preparado: { id: string; player: VideoPlayer } | null = null;

function reportar(motivo: string): void {
  if (!PERF) return;
  // eslint-disable-next-line no-console
  console.log(`[players] vivos ${vivos.size} · reproduciendo ${reproduciendo.size} (${motivo})`);
}

/** Un player mudo y en bucle para `fuente`. Arranca pausado: quien lo muestra decide cuando suena. */
export function crearPlayer(fuente: VideoSource): VideoPlayer {
  const player = createVideoPlayer(fuente);
  player.loop = true;
  player.muted = true;
  player.timeUpdateEventInterval = 0;   // no se usan eventos de progreso
  vivos.add(player);
  if (PERF) {
    player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) reproduciendo.add(player); else reproduciendo.delete(player);
      reportar(isPlaying ? 'play' : 'pausa');
    });
  }
  reportar('crear');
  return player;
}

/** Suelta el player y su decodificador. */
export function soltarPlayer(player: VideoPlayer): void {
  if (!vivos.has(player)) return;
  vivos.delete(player);
  reproduciendo.delete(player);
  if (preparado?.player === player) preparado = null;
  try { player.release(); } catch { /* ya liberado */ }
  reportar('soltar');
}

/** Deja listo (pausado) el clip de `id`, para que empiece sin espera cuando se muestre. */
export function prepararClip(id: string | null | undefined): void {
  if (preparado?.id === id) return;
  if (preparado) soltarPlayer(preparado.player);
  const fuente = id ? clipFuente(id) : null;
  preparado = id && fuente != null ? { id, player: crearPlayer(fuente) } : null;
}

/** El player preparado para `id`, si lo hay (deja de estar preparado: ahora es de quien lo pide). */
export function tomarPreparado(id: string): VideoPlayer | null {
  if (preparado?.id !== id) return null;
  const { player } = preparado;
  preparado = null;
  return player;
}
