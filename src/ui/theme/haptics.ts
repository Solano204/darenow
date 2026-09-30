import * as Haptics from 'expo-haptics';
import { hapticosActivos } from '@/state/haptics';

const SEGUNDO_GOLPE_MS = 90;

const golpe = (estilo: Haptics.ImpactFeedbackStyle) => {
  if (!hapticosActivos()) return;
  Haptics.impactAsync(estilo).catch(() => {});
};

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
  pestana: () => {
    if (!hapticosActivos()) return;
    Haptics.selectionAsync().catch(() => {});
  },
  seleccion: () => {
    if (!hapticosActivos()) return;
    Haptics.selectionAsync().catch(() => {});
  },
  aviso: () => {
    if (!hapticosActivos()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  exito: () => {
    if (!hapticosActivos()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error: () => {
    if (!hapticosActivos()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
