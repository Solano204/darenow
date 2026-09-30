/**
 * FORJA · ficha de un musculo
 *
 * Los musculos no trabajan solos: la ficha muestra con quien tira («Trabaja junto a») y contra
 * quien jala («Antagonistas»). Mismos datos, mismas relaciones y mismas acciones que antes del
 * rediseno (ver `docs/FUNCIONALIDAD.md`, seccion 19); cambia como se ve y se mueve.
 */

import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { paleta, familia, MARGEN_PANTALLA } from '@/theme';
import { GomaTexture } from '@/components/fx/GomaTexture';
import { BloqueRevela } from '@/components/fx/BloqueRevela';
import { BarraSuperiorColapsable } from '@/components/exercise/BarraSuperiorColapsable';
import { HeroMusculo } from '@/components/muscles/HeroMusculo';
import { EtiquetasMusculo } from '@/components/muscles/EtiquetasMusculo';
import { TarjetaLoQueSuelePasar } from '@/components/muscles/TarjetaLoQueSuelePasar';
import { RelacionMuscular } from '@/components/muscles/RelacionMuscular';
import { TituloEjercicios, SubgrupoEjercicios } from '@/components/muscles/ListaEjerciciosMusculo';
import { EJERCICIOS, musculoPorId } from '@/data/catalog';
import { useEstado } from '@/store/store';
import { textoVisible } from '@/utils/presentacion';
import { ejerciciosDeMusculo, relacionados } from '@/utils/musculos';

const FRACCION_HERO = 0.36;
const SEPARACION_SECCIONES = 40;

type Props = NativeStackScreenProps<ParamListBase, 'Musculo'>;

export default function DetalleMusculo({ route, navigation }: Props) {
  const inset = useSafeAreaInsets();
  const { height: ventana } = useWindowDimensions();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { y.value = e.contentOffset.y; });
  const { alternarFavorito, esFavorito } = useEstado();

  const m = musculoPorId.get((route.params as { id: string }).id);
  const { principales, secundarios } = useMemo(
    () => (m ? ejerciciosDeMusculo(m.id, EJERCICIOS) : { principales: [], secundarios: [] }),
    [m],
  );
  const sinergicos = useMemo(() => relacionados(m?.trabaja_con, musculoPorId), [m]);
  const antagonistas = useMemo(() => relacionados(m?.antagonista, musculoPorId), [m]);
  const abrirEjercicio = useCallback((id: string) => navigation.push('Ejercicio', { id }), [navigation]);
  const alternarEjercicio = useCallback((id: string) => alternarFavorito('ejercicios', id), [alternarFavorito]);
  if (!m) return null;

  const alturaHero = Math.round(ventana * FRACCION_HERO);
  const nombre = textoVisible(m.name);
  const abrirMusculo = (id: string) => navigation.push('Musculo', { id });
  const todos = () => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } });
  const favoritoEjercicio = (id: string) => esFavorito('ejercicios', id);

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <Animated.ScrollView
        onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: inset.bottom + SEPARACION_SECCIONES }}
      >
        <HeroMusculo id={m.id} y={y} alto={alturaHero} />

        <View style={s.cabecera}>
          <Text style={s.nombre} accessibilityRole="header">{nombre}</Text>
          {m.name_en ? <Text style={s.latin}>{m.name_en}</Text> : null}
          <View style={s.etiquetas}><EtiquetasMusculo grupo={m.group} region={m.region} /></View>
          <Text style={s.funcion}>{textoVisible(m.funcion)}</Text>
        </View>

        {m.dolor_comun ? (
          <BloqueRevela y={y} sinMovimiento estilo={s.seccion}>
            {activo => <TarjetaLoQueSuelePasar texto={textoVisible(m.dolor_comun ?? '')} activo={activo} />}
          </BloqueRevela>
        ) : null}

        {sinergicos.length > 0 ? (
          <BloqueRevela y={y} sinMovimiento estilo={s.seccionLibre}>
            {activo => (
              <RelacionMuscular
                tipo="sinergico" titulo="Trabaja junto a" actual={m} items={sinergicos} activo={activo}
                onTodos={todos} onAbrir={abrirMusculo}
              />
            )}
          </BloqueRevela>
        ) : null}

        {antagonistas.length > 0 ? (
          <BloqueRevela y={y} sinMovimiento estilo={s.seccionLibre}>
            {activo => (
              <RelacionMuscular
                tipo="antagonista" titulo="Antagonistas" actual={m} items={antagonistas} activo={activo}
                onTodos={todos} onAbrir={abrirMusculo}
              />
            )}
          </BloqueRevela>
        ) : null}

        {principales.length + secundarios.length > 0 ? (
          <View style={s.seccion}><TituloEjercicios /></View>
        ) : null}

        {principales.length > 0 ? (
          <BloqueRevela y={y} sinMovimiento estilo={s.grupo}>
            {activo => (
              <SubgrupoEjercicios
                titulo="Como principal" ejercicios={principales} principal activo={activo}
                favorito={favoritoEjercicio} onFav={alternarEjercicio} onPress={abrirEjercicio}
              />
            )}
          </BloqueRevela>
        ) : null}

        {secundarios.length > 0 ? (
          <BloqueRevela y={y} sinMovimiento estilo={s.grupo}>
            {activo => (
              <SubgrupoEjercicios
                titulo="Como secundario" ejercicios={secundarios} principal={false} activo={activo}
                favorito={favoritoEjercicio} onFav={alternarEjercicio} onPress={abrirEjercicio}
              />
            )}
          </BloqueRevela>
        ) : null}
      </Animated.ScrollView>

      <BarraSuperiorColapsable
        y={y} alturaHero={alturaHero} nombre={nombre} favorito={esFavorito('musculos', m.id)}
        onFavorito={() => alternarFavorito('musculos', m.id)} onAtras={() => navigation.goBack()}
      />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  cabecera: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
  nombre: { fontFamily: familia.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.5, color: paleta.magnesia },
  latin: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia3Texto, marginTop: 2 },
  etiquetas: { marginTop: 12 },
  funcion: { fontFamily: familia.cuerpo, fontSize: 17, lineHeight: 26, color: paleta.magnesia, marginTop: 16, maxWidth: 560 },
  seccion: { marginHorizontal: MARGEN_PANTALLA, marginTop: SEPARACION_SECCIONES },
  seccionLibre: { marginTop: SEPARACION_SECCIONES },
  grupo: { marginHorizontal: MARGEN_PANTALLA, marginTop: 16 },
});
