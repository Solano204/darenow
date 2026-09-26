import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, tipo, familia, MARGEN_PANTALLA } from '../../theme';
import { ESTADISTICAS } from '../../data/catalog';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Presionable } from '../ui/Presionable';
import { Odometro } from '../fx/Odometro';

const ESTILO_CIFRA = { ...tipo.numero, fontSize: 18, lineHeight: 22, color: paleta.magnesia };
const ESCALONADO_MS = 120;
const EMPUJE_FLECHA_PX = 4;

/**
 * «Explorar todo»: una fila de 72 px (`gomaAlta`, radio 20) con los tres conteos
 * del catalogo, que ruedan desde 0 la primera vez que entra en pantalla, y un
 * chevron que se adelanta 4 px al presionar. Las cifras salen de `ESTADISTICAS`
 * (190, 30 y 12 hoy); antes estaban escritas a mano en la pantalla.
 */
export function FilaExplorar({ activo, onPress }: { activo: boolean; onPress: () => void }) {
  const reducido = useReducedMotion();
  const presion = useSharedValue(0);
  const flecha = useAnimatedStyle(() => ({
    transform: [{ translateX: reducido ? 0 : EMPUJE_FLECHA_PX * presion.value }],
  }), [reducido]);

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
        escala={0.02} presion={presion} estilo={s.caja}
      >
        <View style={s.textos} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={s.titulo}>Explorar todo</Text>
          <View style={s.cifras}>
            {cifras.map(([n, t], i) => (
              <View key={t} style={s.cifra}>
                {i > 0 && <View style={s.punto} />}
                <Odometro valor={n} activo={activo} retraso={i * ESCALONADO_MS} estilo={ESTILO_CIFRA} />
                <Text style={s.unidad}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <Animated.View style={flecha}><Ionicons name="chevron-forward" size={20} color={paleta.magnesia2} /></Animated.View>
      </Presionable>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  caja: {
    minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  textos: { flex: 1, gap: 2 },
  titulo: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 21, color: paleta.magnesia },
  cifras: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 6 },
  cifra: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  punto: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: paleta.magnesia3, alignSelf: 'center', marginRight: 2 },
  unidad: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
});
