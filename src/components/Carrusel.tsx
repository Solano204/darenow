/**
 * FORJA · carrusel
 *
 * Muestra hasta 4 elementos con foto y, como ultima tarjeta, un boton de
 * "Ver mas" que lleva a la lista completa. Esa ultima tarjeta es la clave:
 * el usuario descubre que hay mas contenido deslizando, no leyendo un
 * enlace pequeño arriba.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, tipo, esp, radio, sombra, degradado, MARGEN_PANTALLA } from '@/theme';
import { Toque, Aparece, Favorito } from '@/components/ui';
import Foto from './Foto';
import { VidrioPastilla } from './Vidrio';
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
const ALTO_FOTO = { alta: 132, baja: 104, circulo: 96 };

export default function Carrusel({
  items, tipoFoto, onItem, onVerMas, textoVerMas = 'Ver todas',
  forma = 'alta', onFavorito,
}: Props) {
  const w = ANCHO[forma];
  const h = ALTO_FOTO[forma];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: esp.sm, paddingRight: MARGEN_PANTALLA, paddingVertical: 4 }}
      decelerationRate="fast"
      snapToInterval={w + esp.sm}
      snapToAlignment="start"
    >
      {items.map((it, i) => (
        <Aparece key={it.id} retraso={i * 55}>
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
        </Aparece>
      ))}

      {/* Ultima tarjeta: la puerta a la lista completa. */}
      <Aparece retraso={items.length * 55}>
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
      </Aparece>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  circulo: { alignItems: 'center' },
  verMas: { alignItems: 'center', justifyContent: 'center' },
  favEsquina: { position: 'absolute', top: 8, right: 8 },
  etiqueta: { position: 'absolute', bottom: 8, left: 8 },
});
