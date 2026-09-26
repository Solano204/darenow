import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, tipo, MARGEN_PANTALLA } from '../../theme';
import { ESTADISTICAS } from '../../data/catalog';
import { Presionable } from '../ui/Presionable';
import { Odometro } from '../fx/Odometro';

const ESTILO_CIFRA = { ...tipo.numero, fontSize: 36, lineHeight: 38, color: paleta.magnesia };
const ESCALONADO_MS = 120;

/**
 * «Explorar todo»: una fila con las tres cifras del catalogo, que ruedan cuando
 * el bloque entra en pantalla, y una flecha. Las cifras salen de `ESTADISTICAS`
 * (190, 30 y 12 hoy); antes estaban escritas a mano en la pantalla.
 */
export function FilaExplorar({ activo, onPress }: { activo: boolean; onPress: () => void }) {
  const cifras: [number, string][] = [
    [ESTADISTICAS.ejercicios, 'ejercicios'],
    [ESTADISTICAS.rutinas, 'rutinas'],
    [ESTADISTICAS.programas, 'programas'],
  ];
  return (
    <View style={s.raiz}>
      <Presionable
        onPress={onPress}
        etiqueta={`Explorar todo: ${cifras.map(([n, t]) => `${n} ${t}`).join(', ')}`}
        estilo={s.caja}
      >
        <View style={s.textos} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={s.titulo}>Explorar todo</Text>
          <View style={s.cifras}>
            {cifras.map(([n, t], i) => (
              <View key={t}>
                <Odometro valor={n} activo={activo} retraso={i * ESCALONADO_MS} estilo={ESTILO_CIFRA} />
                <Text style={s.unidad}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.flecha}><Ionicons name="arrow-forward" size={20} color={paleta.magnesia} /></View>
      </Presionable>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  caja: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderRadius: 24,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  textos: { flex: 1, gap: 8 },
  titulo: { ...tipo.h2, color: paleta.magnesia },
  cifras: { flexDirection: 'row', gap: 20 },
  unidad: { ...tipo.pie, color: paleta.magnesia2 },
  flecha: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: paleta.magnesia3,
  },
});
