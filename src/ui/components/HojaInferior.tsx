import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { paleta, conAlfa, tipo, familia, MARGEN_PANTALLA } from '@/ui/theme';

/**
 * Hoja que sube desde abajo sobre un velo de goma: titulo, texto y, debajo, las acciones que
 * trae cada hoja (`children`). La usan la salida de sesion, descartar cambios, cambiar de
 * programa y las confirmaciones de Ajustes. `onRequestClose` es el boton atras de Android.
 */
export function HojaInferior({ visible, titulo, texto, onRequestClose, onShow, children }: {
  visible: boolean;
  titulo: string;
  texto: string;
  onRequestClose?: () => void;
  onShow?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onRequestClose} onShow={onShow}>
      <View style={[s.velo, { backgroundColor: conAlfa(paleta.goma, 0.6) }]}>
        <View style={s.hoja}>
          <Text style={s.titulo} accessibilityRole="header">{titulo}</Text>
          <Text style={s.texto}>{texto}</Text>
          {children}
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
});
