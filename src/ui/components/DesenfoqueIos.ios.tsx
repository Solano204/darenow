import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * Desenfoque oscuro detras de barras y velos. Solo existe en iOS: en Android el mismo lugar lo
 * ocupa un color solido que pone cada componente (ver `DesenfoqueIos.tsx`, que no pinta nada).
 */
export function DesenfoqueIos({ intensidad, estilo }: { intensidad: number; estilo: StyleProp<ViewStyle> }) {
  return <BlurView intensity={intensidad} tint="dark" style={estilo} />;
}
