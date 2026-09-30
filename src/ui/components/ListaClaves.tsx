import React, { useEffect, useEffectEvent, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '@/ui/theme';
import { textoVisible } from '@/lib/presentacion';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { PalomitaTrazo } from '@/ui/fx/PalomitaTrazo';

const LADO_ICONO = 18;
const ESCALONADO_MS = 80;

/**
 * Las claves como una lista de verificacion: una palomita verde de 18 px por fila
 * (ya no son chips que parecen botones). Cada palomita se dibuja de trazo,
 * escalonada 80 ms, una sola vez cuando `activo`.
 */
export function ListaClaves({ claves, activo }: { claves: string[]; activo: boolean }) {
  return (
    <View>
      {claves.map((c, i) => <Clave key={i} texto={textoVisible(c)} retraso={i * ESCALONADO_MS} activo={activo} />)}
    </View>
  );
}

function Clave({ texto, retraso, activo }: { texto: string; retraso: number; activo: boolean }) {
  const reducido = useReducedMotion();
  const [dibujada, setDibujada] = useState(reducido);

  const alCambiarActivo = useEffectEvent(() => {
    if (dibujada || !activo) return;
    const id = setTimeout(() => setDibujada(true), retraso);
    return () => clearTimeout(id);
  });
  useEffect(() => alCambiarActivo(), [activo]);

  return (
    <View style={s.fila} accessible accessibilityLabel={texto}>
      <View style={s.icono} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <PalomitaTrazo visible={dibujada} tamano={LADO_ICONO} color={paleta.placaVerde} />
      </View>
      <Text style={s.texto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  icono: { width: LADO_ICONO, height: LADO_ICONO },
  texto: { flex: 1, fontFamily: familia.medio, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
});
