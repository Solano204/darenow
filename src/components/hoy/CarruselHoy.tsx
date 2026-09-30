import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, tipo, MARGEN_PANTALLA } from '@/theme';
import { Presionable } from '@/components/ui/Presionable';

export interface VerMas {
  texto: string;
  onPress: () => void;
  alto: number;
  radioEsquina?: number;
}

/**
 * Fila horizontal con ajuste al deslizar y, si se pide, una ultima tarjeta que
 * lleva a la lista completa (igual que el carrusel de antes). Es virtualizada y
 * usa `getItemLayout`: el ancho de cada elemento es fijo.
 */
export function CarruselHoy<T>({ data, keyExtractor, renderItem, ancho, separacion = 12, verMas }: {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactElement;
  ancho: number;
  separacion?: number;
  verMas?: VerMas;
}) {
  const paso = ancho + separacion;
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={paso}
      snapToAlignment="start"
      getItemLayout={(_, i) => ({ length: paso, offset: paso * i, index: i })}
      initialNumToRender={4}
      windowSize={5}
      contentContainerStyle={s.contenido}
      renderItem={({ item, index }) => (
        <View style={{ width: ancho, marginRight: separacion }}>{renderItem(item, index)}</View>
      )}
      ListFooterComponent={verMas ? <TarjetaVerMas ancho={ancho} {...verMas} /> : null}
    />
  );
}

export function TarjetaVerMas({ ancho, texto, onPress, alto, radioEsquina = 20 }: VerMas & { ancho: number }) {
  return (
    <View style={{ width: ancho }}>
      <Presionable onPress={onPress} etiqueta={texto}>
        <View style={[s.verMas, { height: alto, borderRadius: radioEsquina }]}>
          <View style={s.flecha}><Ionicons name="arrow-forward" size={22} color={paleta.magnesia} /></View>
          <Text style={s.verMasTexto}>{texto}</Text>
        </View>
      </Presionable>
    </View>
  );
}

const s = StyleSheet.create({
  contenido: { paddingHorizontal: MARGEN_PANTALLA },
  verMas: {
    alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  flecha: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: paleta.magnesia3,
  },
  verMasTexto: { ...tipo.h3, color: paleta.magnesia },
});
