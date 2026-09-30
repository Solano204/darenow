/**
 * FORJA · carrusel
 *
 * Los elementos con foto y, como ultima tarjeta, un boton de "Ver mas" que
 * lleva a la lista completa. Esa ultima tarjeta es la clave: el usuario
 * descubre que hay mas contenido deslizando, no leyendo un enlace pequeño
 * arriba.
 *
 * Con FlashList horizontal (R5): la seccion de favoritos puede tener los 190
 * ejercicios y solo se montan las tarjetas que se ven. Las primeras entran
 * escalonadas una sola vez; el snap es por tarjeta.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { color, tipo, esp, radio, sombra, degradado, anim, MARGEN_PANTALLA } from '@/ui/theme';
import { Toque, Favorito } from '@/ui/components';
import { EntradaUnaVez, idsAnimados } from '@/ui/components/listaVirtual';
import { useReducedMotion as useMovimientoReducido } from '@/ui/hooks/useReducedMotion';
import Foto from '@/ui/components/Foto';
import { VidrioPastilla } from '@/ui/components/Vidrio';
import type { TipoFoto } from '@/media/registry';

interface ItemCarrusel {
  id: string;
  titulo: string;
  sub?: string;
  etiqueta?: string;
  favorito?: boolean;
  /** solo si la imagen a mostrar es distinta del id real (p.ej. una
   *  rutina propia usando una foto del catalogo). Por defecto, `id`. */
  imagenId?: string;
}

interface Props {
  items: ItemCarrusel[];
  tipoFoto: TipoFoto;
  onItem: (id: string) => void;
  onVerMas: () => void;
  textoVerMas?: string;
  /** 'alta' para rutinas y programas, 'baja' para ejercicios */
  forma?: 'alta' | 'baja' | 'circulo';
  onFavorito?: (id: string) => void;
}

const ANCHO = { alta: 200, baja: 150, circulo: 96 };
/** Solo las tarjetas que se ven al abrir entran escalonadas (55 ms). */
const CON_ENTRADA = 6;
const ESCALONADO_MS = 55;
const CURVA = Easing.bezier(0.2, 0.7, 0.3, 1);
const animados = idsAnimados('favoritos/carrusel');
const ALTO_FOTO = { alta: 132, baja: 104, circulo: 96 };

export default function Carrusel({
  items, tipoFoto, onItem, onVerMas, textoVerMas = 'Ver todas',
  forma = 'alta', onFavorito,
}: Props) {
  const w = ANCHO[forma];
  const h = ALTO_FOTO[forma];

  const reducido = useMovimientoReducido();
  const renderItem = useCallback(({ item: it, index: i }: ListRenderItemInfo<ItemCarrusel>) => (
    <EntradaUnaVez
      id={`${tipoFoto}/${it.id}`} animados={animados} animar={i < CON_ENTRADA}
      desde={16} retraso={i * ESCALONADO_MS} duracion={anim.normal} curva={CURVA} reducido={reducido}
    >
      <Toque onPress={() => onItem(it.id)} escala={0.98} oscurecer={radio.tarjeta} estilo={{ width: w } as ViewStyle}>
        <View style={forma === 'circulo' ? s.circulo : undefined}>
          <Foto
            tipo={tipoFoto} id={it.imagenId ?? it.id} nombre={it.titulo}
            alto={h} ancho={forma === 'circulo' ? h : '100%'}
            forma={forma === 'circulo' ? 'circulo' : 'tarjeta'}
          />
          {onFavorito && forma !== 'circulo' && (
            <View style={s.favEsquina}>
              <Favorito activo={!!it.favorito} onPress={() => onFavorito(it.id)} tamano={32} sobreFoto />
            </View>
          )}
          {it.etiqueta && forma !== 'circulo' && (
            <View style={s.etiqueta}>
              <VidrioPastilla>
                <View style={{ paddingVertical: 5, paddingHorizontal: 10 }}>
                  <Text style={[tipo.micro, { color: color.texto }]}>{it.etiqueta}</Text>
                </View>
              </VidrioPastilla>
            </View>
          )}
        </View>

        <Text
          style={[tipo.h2, {
            fontSize: 20, lineHeight: 22, color: color.texto, marginTop: esp.sm,
            textAlign: forma === 'circulo' ? 'center' : 'left',
          }]}
          numberOfLines={2}
        >
          {it.titulo}
        </Text>
        {it.sub && forma !== 'circulo' && (
          <Text style={[tipo.pie, { color: color.textoSuave }]} numberOfLines={1}>{it.sub}</Text>
        )}
      </Toque>
    </EntradaUnaVez>
  ), [forma, h, onFavorito, onItem, reducido, tipoFoto, w]);

  // Ultima tarjeta: la puerta a la lista completa.
  const verMas = (
    <EntradaUnaVez
      id={`${tipoFoto}/ver-mas`} animados={animados} animar
      desde={16} retraso={Math.min(items.length, CON_ENTRADA) * ESCALONADO_MS} duracion={anim.normal} curva={CURVA} reducido={reducido}
      estilo={s.separado}
    >
      <Toque onPress={onVerMas} estilo={{ width: forma === 'circulo' ? 96 : w } as ViewStyle}>
        <LinearGradient
          colors={degradado.brasa}
          style={[
            s.verMas,
            { height: h, borderRadius: forma === 'circulo' ? h / 2 : radio.tarjeta },
            sombra.suave,
          ]}
        >
          <Text style={{ color: color.sobreOscuro, fontSize: 22 }}>→</Text>
        </LinearGradient>
        <Text style={[tipo.h3, {
          color: color.texto, marginTop: esp.sm,
          textAlign: forma === 'circulo' ? 'center' : 'left',
        }]}>
          {textoVerMas}
        </Text>
      </Toque>
    </EntradaUnaVez>
  );

  return (
    <FlashList
      horizontal
      data={items}
      keyExtractor={idDe}
      renderItem={renderItem}
      ItemSeparatorComponent={Separador}
      ListFooterComponent={verMas}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.contenido}
      decelerationRate="fast"
      snapToInterval={w + esp.sm}
      snapToAlignment="start"
      disableIntervalMomentum
    />
  );
}

const idDe = (it: ItemCarrusel) => it.id;
const Separador = () => <View style={s.hueco} />;

const s = StyleSheet.create({
  contenido: { paddingRight: MARGEN_PANTALLA, paddingVertical: 4 },
  hueco: { width: esp.sm },
  separado: { marginLeft: esp.sm },
  circulo: { alignItems: 'center' },
  verMas: { alignItems: 'center', justifyContent: 'center' },
  favEsquina: { position: 'absolute', top: 8, right: 8 },
  etiqueta: { position: 'absolute', bottom: 8, left: 8 },
});
