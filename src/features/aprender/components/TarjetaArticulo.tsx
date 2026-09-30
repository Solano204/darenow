import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, familia } from '@/ui/theme';
import type { Tip } from '@/data/catalog';
import { textoVisible } from '@/lib/presentacion';
import { iconoDeSala, nombreDeSala, textoDeLectura } from '@/lib/aprender';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Tocable } from '@/ui/components/Tocable';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { TextoDesvanecido } from '@/ui/components/TextoDesvanecido';
import { EstrellaDe } from '@/ui/components/EstrellaFavorito';
import { precargarSkia } from '@/ui/fx/imagenesSkia';
import { fuente } from '@/media/registry';
import { useReinicioPorId } from '@/ui/components/listaVirtual';

const ALTO_FOTO_ARTICULO = 170;
const ZOOM_PRESIONADO = 0.04;
const ESCALA_PRESIONADA = 0.02;
const ALTO_LINEA_EXTRACTO = 22;

/**
 * Tarjeta de un tip, a lo ancho: foto de 170 con el degradado hacia `gomaAlta` en el 25 % de
 * abajo y la estrella de favorito arriba a la derecha. Debajo, la categoria en tipo oracion con su
 * icono, el titulo (hasta 3 lineas) y el extracto en dos lineas, cuya segunda se desvanece hacia la
 * derecha en vez de cortarse con puntos suspensivos. Al presionar se hunde un 2 %, la foto hace
 * zoom a 1.04 y da un toque suave. Memoizada: `onPress` toma el id y llega estable; la estrella
 * lee su propio favorito.
 */
export const TarjetaArticulo = React.memo(function TarjetaArticulo({ tip, onPress }: {
  tip: Tip;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  useReinicioPorId(tip.id, presion);   // fila reciclada (FlashList): sin la presion de la anterior
  const titulo = textoVisible(tip.titulo);
  const categoria = nombreDeSala(tip.sala);

  const foto = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 1 + ZOOM_PRESIONADO * presion.value }],
  }), [reducido, tick]);

  return (
    <View style={s.caja}>
      <Tocable
        onPress={() => onPress(tip.id)} alPresionar={() => precargarSkia(fuente('tip', tip.id))} etiqueta={`${titulo}. ${categoria}`} presion={presion}
        escala={ESCALA_PRESIONADA} estilo={s.tarjeta}
      >
        <FotoOscura
          tipo="tip" id={tip.id} ancho="100%" alto={ALTO_FOTO_ARTICULO} radioEsquina={0}
          alturaVelo="25%" fondoVelo={paleta.gomaAlta} estiloImagen={foto}
        />
        <View style={s.cuerpo}>
          <View style={s.categoria}>
            <Ionicons name={iconoDeSala(tip.sala)} size={14} color={paleta.magnesia2} />
            <Text style={s.categoriaTexto} maxFontSizeMultiplier={1.3}>{categoria}</Text>
          </View>
          <Text style={s.titulo} numberOfLines={3} maxFontSizeMultiplier={1.3}>{titulo}</Text>
          <TextoDesvanecido
            texto={textoDeLectura(tip.cuerpo)} lineas={2} alturaLinea={ALTO_LINEA_EXTRACTO} estilo={s.extracto} horizontal
          />
        </View>
      </Tocable>
      <View style={s.estrella}>
        <EstrellaDe tipo="tips" id={tip.id} nombre={titulo} />
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  caja: { marginBottom: 16 },
  tarjeta: {
    borderRadius: 24, overflow: 'hidden', backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  estrella: { position: 'absolute', top: 8, right: 8 },
  cuerpo: { padding: 16, paddingTop: 12, gap: 6 },
  categoria: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoriaTexto: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  titulo: { fontFamily: familia.titulo, fontSize: 24, lineHeight: 26, color: paleta.magnesia },
  extracto: { fontFamily: familia.cuerpo, fontSize: 15, color: paleta.magnesia2 },
});
