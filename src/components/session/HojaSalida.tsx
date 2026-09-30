import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { paleta, conAlfa, tipo, familia, MARGEN_PANTALLA, haptico } from '../../theme';
import { BotonSecundario } from '../ui/BotonSecundario';

/** Los motivos de siempre y su texto. El `id` es lo que se guarda como `motivoAbandono`. */
const MOTIVOS_SALIDA: [id: string, texto: string][] = [
  ['sin_tiempo', 'No tengo tiempo hoy'],
  ['muy_dificil', 'Está muy difícil'],
  ['muy_facil', 'Está muy fácil'],
  ['molestia', 'Me molesta algo'],
  ['sin_ganas', 'Hoy no'],
];

/** Hoja inferior al salir de la sesion: `gomaAlta` con esquinas superiores de 28. Mismo texto y mismas opciones. */
export function HojaSalida({ visible, onElegir, onCancelar }: {
  visible: boolean;
  onElegir: (motivo: string) => void;
  onCancelar: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[s.velo, { backgroundColor: conAlfa(paleta.goma, 0.6) }]}>
        <View style={s.hoja}>
          <Text style={s.titulo} accessibilityRole="header">Guardamos lo que llevas</Text>
          <Text style={s.texto}>Cuéntanos qué pasó y ajustamos la próxima.</Text>
          {MOTIVOS_SALIDA.map(([id, texto]) => (
            <Pressable
              key={id}
              onPress={() => { haptico.toque(); onElegir(id); }}
              accessibilityRole="button" accessibilityLabel={texto}
              style={({ pressed }) => [s.opcion, pressed && s.opcionPresionada]}
            >
              <Text style={s.opcionTexto}>{texto}</Text>
            </Pressable>
          ))}
          <BotonSecundario texto="Mejor sigo" onPress={onCancelar} estilo={s.seguir} />
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
  opcion: {
    minHeight: 56, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  opcionPresionada: { backgroundColor: paleta.gomaAltaAzul },
  opcionTexto: { ...tipo.cuerpo, color: paleta.magnesia },
  seguir: { marginTop: 4 },
});
