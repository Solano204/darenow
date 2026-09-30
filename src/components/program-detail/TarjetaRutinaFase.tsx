import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { paleta, familia } from '@/theme';
import { rutinaPorId } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { plural } from '@/utils/plural';
import { Presionable } from '@/components/ui/Presionable';
import { FotoOscura } from '@/components/ui/FotoOscura';

const ANCHO_TARJETA_FASE = 150;
const ALTO_FOTO = 100;
const ESCALA_PRESIONADA = 0.03;

/**
 * Una rutina de una fase: foto de 150×100 (radio 16, con el tratamiento de color de las fotos
 * de lista) y el titulo tal como viene en Figtree 600 de 13, hasta dos lineas completas. Al
 * presionar se hunde a 0.97 con un toque suave y abre la rutina, como siempre.
 */
export function TarjetaRutinaFase({ id, onPress }: { id: string; onPress: () => void }) {
  const r = rutinaPorId.get(id);
  const nombre = r ? nombreVisible(r.name) : id;
  const etiqueta = r ? `${nombre}, ${r.min} ${plural(r.min, 'minuto')}` : nombre;

  return (
    <Presionable onPress={onPress} etiqueta={etiqueta} escala={ESCALA_PRESIONADA} estilo={s.caja}>
      <FotoOscura tipo="rutina" id={id} ancho={ANCHO_TARJETA_FASE} alto={ALTO_FOTO} radioEsquina={16} velo={false} />
      <Text style={s.titulo} numberOfLines={2}>{nombre}</Text>
    </Presionable>
  );
}

const s = StyleSheet.create({
  caja: { width: ANCHO_TARJETA_FASE, gap: 8 },
  titulo: { fontFamily: familia.enfasis, fontSize: 13, lineHeight: 17, color: paleta.magnesia },
});
