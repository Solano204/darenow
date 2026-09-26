import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia } from '../../theme';
import { textoDeEtiqueta } from '../../utils/presentacion';

/**
 * Las etiquetas del musculo en una linea («Pecho · Tren superior»): Figtree 500 de 14 `magnesia2`,
 * con la primera letra en mayuscula y los guiones bajos del dato como espacios, separadas por un
 * punto de 3 px. Nunca se ve el dato crudo («tren_superior»). Si las dos etiquetas dicen lo mismo
 * (`core` y `core`), sale una sola.
 */
export function EtiquetasMusculo({ grupo, region }: { grupo: string; region: string }) {
  return <LineaDeEtiquetas etiquetas={[grupo, region].filter(Boolean)} />;
}

/** La linea de etiquetas de arriba, con cualquier lista del dato (los tips tambien la usan). */
export function LineaDeEtiquetas({ etiquetas: datos }: { etiquetas: string[] }) {
  const etiquetas = [...new Set(datos.map(textoDeEtiqueta))];
  if (etiquetas.length === 0) return null;
  return (
    <View style={s.fila} accessible accessibilityLabel={etiquetas.join(', ')}>
      {etiquetas.map((e, i) => (
        <View key={e} style={s.dato} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {i > 0 && <View style={s.punto} />}
          <Text style={s.texto}>{e}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 6, columnGap: 8 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  punto: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: paleta.gomaBorde },
  texto: { fontFamily: familia.medio, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
});
