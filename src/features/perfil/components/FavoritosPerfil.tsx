import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { porId, musculoPorId, rutinaPorId, programaPorId, TIPS } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { imagenRutina, type Favoritos, type RutinaPropia } from '@/state/store';
import type { TipoFoto } from '@/media/registry';
import { textoVisible } from '@/lib/presentacion';
import { mezclarFavoritos, totalFavoritos, type ItemFavorito, type TipoFavorito } from '@/lib/perfil';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { Tocable } from '@/ui/components/Tocable';
import { EstrellaFavorito } from '@/ui/components/EstrellaFavorito';
import { IconoTrazo } from '@/ui/fx/IconoTrazo';

const ANCHO = 160;
const ALTO_FOTO = 110;
const TOPE_FAVORITOS = 8;

const TIPOS: Record<TipoFavorito, { foto: TipoFoto; etiqueta: string; icono: React.ComponentProps<typeof Ionicons>['name'] }> = {
  ejercicios: { foto: 'ejercicio', etiqueta: 'Ejercicio', icono: 'fitness-outline' },
  musculos: { foto: 'musculo', etiqueta: 'Músculo', icono: 'body-outline' },
  rutinas: { foto: 'rutina', etiqueta: 'Rutina', icono: 'list-outline' },
  programas: { foto: 'programa', etiqueta: 'Programa', icono: 'barbell-outline' },
  tips: { foto: 'tip', etiqueta: 'Artículo', icono: 'book-outline' },
};

/** A donde lleva cada favorito, el nombre con el que se ve y el id de su foto: lo mismo que hacia la pantalla de Favoritos. */
function detalleDe(item: ItemFavorito, propias: RutinaPropia[]): { nombre: string; fotoId: string; ruta: string } {
  const { id } = item;
  switch (item.tipo) {
    case 'ejercicios': return { nombre: textoVisible(porId.get(id)?.name ?? id), fotoId: id, ruta: 'Ejercicio' };
    case 'musculos': return { nombre: textoVisible(musculoPorId.get(id)?.name ?? id), fotoId: id, ruta: 'Musculo' };
    case 'programas': return { nombre: nombreVisible(programaPorId.get(id)?.name ?? id), fotoId: id, ruta: 'Programa' };
    case 'tips': return { nombre: textoVisible(TIPS.find(t => t.id === id)?.titulo ?? id), fotoId: id, ruta: 'Tip' };
    case 'rutinas': {
      const mia = propias.find(x => x.id === id);
      if (mia) return { nombre: mia.nombre, fotoId: imagenRutina(mia.id, mia.imagenId), ruta: 'RutinaPropia' };
      return { nombre: nombreVisible(rutinaPorId.get(id)?.name ?? id), fotoId: id, ruta: id.startsWith('mi_') ? 'RutinaPropia' : 'Rutina' };
    }
  }
}

/**
 * Los favoritos en Yo. Sin ninguno: una estrella de linea de 32 px `magnesia3` que se dibuja al entrar
 * en pantalla y el texto de siempre, alineado a la izquierda y sin tarjeta. Con favoritos: una fila que
 * se desliza con los de todos los tipos mezclados (`mezclarFavoritos`), cada uno con su foto, una etiqueta
 * de tipo con icono, su nombre y su estrella rellena (quitarla lo saca de la fila). Cada tarjeta de 160 lleva
 * al mismo lugar que en la pantalla de Favoritos; «Ver todos» lleva al resto.
 */
export function FavoritosPerfil({ favoritos, propias, activo, onAbrir, onQuitar }: {
  favoritos: Favoritos;
  propias: RutinaPropia[];
  activo: boolean;
  onAbrir: (ruta: string, id: string) => void;
  onQuitar: (tipo: TipoFavorito, id: string) => void;
}) {
  const items = useMemo(() => mezclarFavoritos(favoritos, TOPE_FAVORITOS), [favoritos]);

  if (totalFavoritos(favoritos) === 0) {
    return (
      <View style={s.vacio}>
        <IconoTrazo nombre="estrella" tamano={32} color={paleta.magnesia3} activo={activo} />
        <Text style={s.vacioTexto} maxFontSizeMultiplier={1.3}>
          Toca la estrella en cualquier ejercicio, rutina o tip para guardarlo aquí.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fila}>
      {items.map(item => {
        const t = TIPOS[item.tipo];
        const d = detalleDe(item, propias);
        return (
          <View key={`${item.tipo}:${item.id}`} style={s.tarjeta}>
            <Tocable onPress={() => onAbrir(d.ruta, item.id)} etiqueta={`${t.etiqueta}: ${d.nombre}`}>
              <FotoOscura tipo={t.foto} id={d.fotoId} ancho={ANCHO} alto={ALTO_FOTO} radioEsquina={16} velo={false} />
              <View style={s.tipo}>
                <Ionicons name={t.icono} size={14} color={paleta.magnesia2} />
                <Text style={s.tipoTexto} maxFontSizeMultiplier={1.3}>{t.etiqueta}</Text>
              </View>
              <Text style={s.nombre} numberOfLines={2} maxFontSizeMultiplier={1.3}>{d.nombre}</Text>
            </Tocable>
            <View style={s.estrella}>
              <EstrellaFavorito activo onPress={() => onQuitar(item.tipo, item.id)} nombre={d.nombre} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  vacio: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginHorizontal: MARGEN_PANTALLA },
  vacioTexto: { flex: 1, fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2, marginTop: 5 },
  fila: { paddingHorizontal: MARGEN_PANTALLA, gap: 12 },
  tarjeta: { width: ANCHO },
  estrella: { position: 'absolute', top: 6, right: 6 },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  tipoTexto: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  nombre: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.magnesia, marginTop: 2 },
});
