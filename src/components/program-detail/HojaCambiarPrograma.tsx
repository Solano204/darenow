import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { paleta, conAlfa, tipo, familia, MARGEN_PANTALLA } from '@/theme';
import { BotonPlaca } from '@/components/ui/BotonPlaca';
import { BotonSecundario } from '@/components/ui/BotonSecundario';

/**
 * «Cambiar de programa» como hoja inferior (la misma de salir de la sesion y de descartar
 * cambios: `gomaAlta`, esquinas superiores de 28) en lugar de la alerta del sistema. Mismo
 * texto y mismas dos salidas; confirmar es un `BotonPlaca` con el aplauso de magnesia.
 * Cerrarla con el boton atras de Android es «Cancelar».
 */
export function HojaCambiarPrograma({ visible, actual, nuevo, onConfirmar, onCancelar }: {
  visible: boolean;
  /** Nombre del programa que sigue hoy. */
  actual: string;
  /** Nombre del programa al que se quiere cambiar. */
  nuevo: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancelar}>
      <View style={[s.velo, { backgroundColor: conAlfa(paleta.goma, 0.6) }]}>
        <View style={s.hoja}>
          <Text style={s.titulo} accessibilityRole="header">Cambiar de programa</Text>
          <Text style={s.texto}>
            {`Ahora sigues "${actual}". Solo se puede seguir un programa a la vez: para unirte a "${nuevo}" hay que dejarlo primero.`}
          </Text>
          <BotonPlaca texto="Dejarlo y cambiar" aplauso onPress={onConfirmar} />
          <BotonSecundario texto="Cancelar" onPress={onCancelar} estilo={s.cancelar} />
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
  cancelar: { marginTop: 4 },
});
