import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia, resorteMagnesia } from '../../theme';
import type { ItemSesion } from '../../engine/session';
import { nombreVisible } from '../../data/nombresVisibles';
import { FotoOscura } from '../ui/FotoOscura';
import { Entrada } from '../fx/Entrada';

const ALTO = 64;
const LADO_MINIATURA = 48;

/**
 * «Sigue»: el ejercicio que viene, en una tarjeta compacta de 64 px. Aparece
 * cuando hay un siguiente y la fase no es descanso ni fin (mismas condiciones
 * que la linea de texto de antes). No es tocable.
 */
export function TarjetaSigue({ item }: { item: ItemSesion }) {
  const nombre = nombreVisible(item.name);
  return (
    <Entrada key={item.id} activo y={12} resorte={resorteMagnesia}>
      <View style={s.caja} accessible accessibilityLabel={`Sigue: ${nombre}`}>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={s.contenido}>
          <FotoOscura tipo="ejercicio" id={item.id} ancho={LADO_MINIATURA} alto={LADO_MINIATURA} radioEsquina={12} velo={false} />
          <View style={s.textos}>
            <Text style={s.etiqueta}>Sigue</Text>
            <Text style={s.nombre} numberOfLines={1} maxFontSizeMultiplier={1.2}>{nombre}</Text>
          </View>
        </View>
      </View>
    </Entrada>
  );
}

const s = StyleSheet.create({
  caja: {
    height: ALTO, borderRadius: 16, paddingHorizontal: 8, justifyContent: 'center',
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textos: { flex: 1 },
  etiqueta: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  nombre: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.magnesia },
});
