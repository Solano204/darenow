import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { paleta, familia, haptico, AREA_TACTIL_MIN } from '@/ui/theme';
import { PistaSwitch } from '@/ui/components/SwitchDarenow';

/**
 * «Medir por tiempo» como interruptor de verdad: la pista y la perilla son las de `PistaSwitch` (el interruptor de
 * DARENOW que tambien usa Ajustes: pista `gomaBorde`, azul de accion al activarse, perilla `magnesia` con
 * `resortePlaca`). Toda la fila (texto y pista) es el control, de 44 de alto. Solo avisa del cambio: quien la usa
 * decide que campos cambian.
 */
export function InterruptorTiempo({ activo, onCambio, etiqueta = 'Medir por tiempo' }: {
  activo: boolean;
  onCambio: () => void;
  etiqueta?: string;
}) {
  return (
    <Pressable
      onPress={() => { haptico.toque(); onCambio(); }}
      accessibilityRole="switch" accessibilityLabel={etiqueta} accessibilityState={{ checked: activo }}
      style={s.fila}
    >
      <Text style={s.texto} maxFontSizeMultiplier={1.2}>{etiqueta}</Text>
      <PistaSwitch activo={activo} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  fila: { minHeight: AREA_TACTIL_MIN, flexDirection: 'row', alignItems: 'center', gap: 10 },
  texto: { fontFamily: familia.medio, fontSize: 14, lineHeight: 20, color: paleta.magnesia },
});
