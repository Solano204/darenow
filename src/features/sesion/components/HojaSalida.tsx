import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { paleta, tipo, haptico } from '@/ui/theme';
import { BotonSecundario } from '@/ui/components/BotonSecundario';
import { HojaInferior } from '@/ui/components/HojaInferior';

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
    <HojaInferior visible={visible} titulo="Guardamos lo que llevas" texto="Cuéntanos qué pasó y ajustamos la próxima.">
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
    </HojaInferior>
  );
}

const s = StyleSheet.create({
  opcion: {
    minHeight: 56, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  opcionPresionada: { backgroundColor: paleta.gomaAltaAzul },
  opcionTexto: { ...tipo.cuerpo, color: paleta.magnesia },
  seguir: { marginTop: 4 },
});
