import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { paleta, tipo, haptico } from '@/ui/theme';
import { BotonSecundario } from '@/ui/components/BotonSecundario';
import { HojaInferior } from '@/ui/components/HojaInferior';

/**
 * «Descartar cambios» como hoja inferior (la misma de salir de la sesion: `gomaAlta`, esquinas
 * superiores de 28) en lugar de la alerta del sistema. Mismo texto y mismas dos salidas. Cerrarla
 * con el boton atras de Android es «Seguir editando».
 */
export function HojaDescartar({ visible, onDescartar, onSeguir }: {
  visible: boolean;
  onDescartar: () => void;
  onSeguir: () => void;
}) {
  return (
    <HojaInferior
      visible={visible} onRequestClose={onSeguir}
      titulo="Descartar cambios" texto="Tienes cambios sin guardar en esta rutina. Si sales ahora se pierden."
    >
      <Pressable
        onPress={() => { haptico.toque(); onDescartar(); }}
        accessibilityRole="button" accessibilityLabel="Descartar"
        style={({ pressed }) => [s.descartar, pressed && s.descartarPresionado]}
      >
        <Text style={s.descartarTexto}>Descartar</Text>
      </Pressable>
      <BotonSecundario texto="Seguir editando" onPress={onSeguir} estilo={s.seguir} />
    </HojaInferior>
  );
}

const s = StyleSheet.create({
  descartar: {
    minHeight: 56, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  descartarPresionado: { backgroundColor: paleta.gomaAltaAzul },
  descartarTexto: { ...tipo.cuerpoEnfasis, color: paleta.placaRojaTexto },
  seguir: { marginTop: 4 },
});
