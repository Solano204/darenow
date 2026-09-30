/**
 * FORJA · ui / datos
 *
 * Piezas para mostrar informacion: filas etiqueta/valor, insignias,
 * barras, notas destacadas, el buscador y los titulos de pantalla.
 */

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { color, tipo, esp, radio } from '@/theme';

/* ═════════════════════════════════════════ insignias */

/**
 * Bloque destacado sobre superficie `gomaAlta`. El tono `cuidado` solo sube el
 * borde y el texto: el amarillo y el rojo quedan para las insignias de evidencia.
 */
export function Nota({ texto, titulo, tono = 'neutro' }: {
  texto: string; titulo?: string; tono?: 'neutro' | 'cuidado' | 'bueno';
}) {
  const enfasis = tono !== 'neutro';
  return (
    <View style={[s.nota, { backgroundColor: color.lienzo, borderColor: enfasis ? color.bordeFuerte : color.borde }]}>
      {titulo && <Text style={[tipo.micro, { color: enfasis ? color.texto : color.textoSuave, marginBottom: 4 }]}>{titulo}</Text>}
      <Text style={[tipo.pie, { color: color.texto }]}>{texto}</Text>
    </View>
  );
}

export function Buscador({ valor, onCambio, placeholder }: {
  valor: string; onCambio: (t: string) => void; placeholder: string;
}) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={[s.buscadorCaja, foco && { borderColor: color.acentoBorde }]}>
      <Text style={{ color: foco ? color.acento : color.textoTenue, fontSize: 15 }}>⌕</Text>
      <TextInput
        value={valor} onChangeText={onCambio} placeholder={placeholder}
        placeholderTextColor={color.textoTenue} style={s.buscador}
        onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
        clearButtonMode="while-editing"
        keyboardAppearance="dark"
      />
    </View>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return (
    <View style={{ paddingVertical: esp.xl, alignItems: 'center' }}>
      <Text style={[tipo.cuerpo, { color: color.textoTenue, textAlign: 'center' }]}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  nota: {
    borderRadius: radio.tarjeta, padding: esp.md, marginBottom: esp.sm, borderWidth: 1,
  },
  buscadorCaja: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm,
    backgroundColor: color.lienzo, borderRadius: radio.pastilla, paddingHorizontal: esp.md,
    borderWidth: 1, borderColor: color.borde,
  },
  buscador: { flex: 1, minHeight: 46, color: color.texto, fontSize: 15 },
});
