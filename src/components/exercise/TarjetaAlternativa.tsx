import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia } from '@/ui/theme';
import type { Ejercicio } from '@/data/catalog';
import { textoVisible } from '@/utils/presentacion';
import { Presionable } from '@/ui/components/Presionable';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { NivelPlacas } from '@/ui/components/NivelPlacas';

export const ANCHO_ALTERNATIVA = 160;
const ALTO_FOTO = 120;

/**
 * Otro ejercicio relacionado (progresion, regresion o sustituto): foto de 160x120,
 * nombre completo a 2 lineas y un indicador pequeno. Una regresion o progresion
 * muestra su nivel en placas (se ve de un vistazo si es mas facil o mas dificil);
 * un sustituto, un icono de intercambio. Al presionar se hunde y da un toque suave.
 */
export function TarjetaAlternativa({ e, clase, onPress }: {
  e: Ejercicio;
  clase: 'nivel' | 'intercambio';
  onPress: () => void;
}) {
  const nombre = textoVisible(e.name);
  return (
    <Presionable
      onPress={onPress} estilo={{ width: ANCHO_ALTERNATIVA }}
      etiqueta={clase === 'nivel' ? `${nombre}, nivel ${e.level} de 3` : `${nombre}, sustituto`}
    >
      <FotoOscura tipo="ejercicio" id={e.id} ancho={ANCHO_ALTERNATIVA} alto={ALTO_FOTO} radioEsquina={20} />
      <Text style={s.nombre} numberOfLines={2}>{nombre}</Text>
      <View style={s.indicador}>
        {clase === 'nivel' ? (
          <>
            <NivelPlacas nivel={e.level} />
            <Text style={s.nivel}>Nivel {e.level}</Text>
          </>
        ) : (
          <Ionicons name="swap-horizontal" size={16} color={paleta.magnesia2} />
        )}
      </View>
    </Presionable>
  );
}

const s = StyleSheet.create({
  nombre: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.magnesia, marginTop: 10 },
  indicador: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6, minHeight: 18 },
  nivel: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
});
