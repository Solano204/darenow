import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { paleta, conAlfa, tipo, familia, MARGEN_PANTALLA, haptico } from '@/theme';
import { BotonSecundario } from '@/components/ui/BotonSecundario';

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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onSeguir}>
      <View style={[s.velo, { backgroundColor: conAlfa(paleta.goma, 0.6) }]}>
        <View style={s.hoja}>
          <Text style={s.titulo} accessibilityRole="header">Descartar cambios</Text>
          <Text style={s.texto}>Tienes cambios sin guardar en esta rutina. Si sales ahora se pierden.</Text>
          <Pressable
            onPress={() => { haptico.toque(); onDescartar(); }}
            accessibilityRole="button" accessibilityLabel="Descartar"
            style={({ pressed }) => [s.descartar, pressed && s.descartarPresionado]}
          >
            <Text style={s.descartarTexto}>Descartar</Text>
          </Pressable>
          <BotonSecundario texto="Seguir editando" onPress={onSeguir} estilo={s.seguir} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  velo: { flex: 1, justifyContent: 'flex-end' },
  hoja: {
    backgroundColor: paleta.gomaAlta, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderBottomWidth: 0, borderColor: paleta.gomaBorde,
    padding: MARGEN_PANTALLA, gap: 10,
  },
  titulo: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 26, color: paleta.magnesia },
  texto: { ...tipo.cuerpo, color: paleta.magnesia2, marginBottom: 8 },
  descartar: {
    minHeight: 56, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  descartarPresionado: { backgroundColor: paleta.gomaAltaAzul },
  descartarTexto: { ...tipo.cuerpoEnfasis, color: paleta.placaRojaTexto },
  seguir: { marginTop: 4 },
});
