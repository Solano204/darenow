import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const TILE = require('../../../assets/img/goma-tile.png');

/**
 * Piso de goma: grano fino y motas de color escasas, estatico. Un solo
 * bitmap teselado y compartido por todas las pantallas, sin trabajo por
 * fotograma. Si el asset falta, la pantalla queda en `goma` plano.
 */
export function GomaTexture({ disabled }: { disabled?: boolean }) {
  if (disabled) return null;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image source={TILE} resizeMode="repeat" fadeDuration={0} style={StyleSheet.absoluteFill} />
    </View>
  );
}
