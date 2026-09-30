import * as Haptics from 'expo-haptics';
import { hapticosActivos } from '@/state/haptics';

const SEGUNDO_GOLPE_MS = 90;
/** Nunca mas de una haptica cada 40 ms (R6): dos golpes mas juntos se sienten como uno y gastan motor. */
const INTERVALO_MIN_MS = 40;
let ultima = -Infinity;

/**
 * La unica puerta al motor de vibracion. Respeta el ajuste de hapticas y el limitador. Se llama
 * desde el hilo JS en respuesta a un evento (un toque, el fin de una animacion con `runOnJS`),
 * nunca desde un loop de animacion.
 */
function vibrar(disparo: () => Promise<void>): void {
  if (!hapticosActivos()) return;
  const ahora = Date.now();
  if (ahora - ultima < INTERVALO_MIN_MS) return;
  ultima = ahora;
  disparo().catch(() => {});
}

const golpe = (estilo: Haptics.ImpactFeedbackStyle) => vibrar(() => Haptics.impactAsync(estilo));

export const haptico = {
  toque: () => golpe(Haptics.ImpactFeedbackStyle.Light),
  placa: () => golpe(Haptics.ImpactFeedbackStyle.Medium),
  sello: () => golpe(Haptics.ImpactFeedbackStyle.Rigid),
  golpe: () => golpe(Haptics.ImpactFeedbackStyle.Heavy),
  suave: () => golpe(Haptics.ImpactFeedbackStyle.Soft),
  aplauso: () => {
    golpe(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => golpe(Haptics.ImpactFeedbackStyle.Soft), SEGUNDO_GOLPE_MS);
  },
  pestana: () => vibrar(() => Haptics.selectionAsync()),
  seleccion: () => vibrar(() => Haptics.selectionAsync()),
  aviso: () => vibrar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  exito: () => vibrar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => vibrar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
