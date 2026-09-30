/**
 * FORJA · detalle de un mito
 *
 * La pantalla va de la mentira tachada (rojo) a la respuesta (verde): la afirmacion se tacha y se
 * sella, «Lo que se dice» se lee como una cita y «Que hacer en su lugar» cierra con filo y palomita
 * verdes. Mismos datos, mismos relacionados y mismas acciones que antes del rediseno (ver
 * `docs/FUNCIONALIDAD.md`, seccion 20).
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { paleta, familia, insignia, haptico, MARGEN_PANTALLA } from '@/ui/theme';
import { fuente } from '@/media/registry';
import { MITOS, porId } from '@/data/catalog';
import { useEstado } from '@/state/store';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { textoVisible } from '@/lib/presentacion';
import { RUTA_DE_RELACIONADO, relacionadosVista, textoDeLectura } from '@/lib/aprender';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { BloqueRevela } from '@/ui/fx/BloqueRevela';
import { MATRIZ_DESATURADA } from '@/ui/fx/FotoTratada';
import { InsigniaEvidencia } from '@/ui/components/InsigniaEvidencia';
import { BarraSuperiorColapsable } from '@/ui/components/BarraSuperiorColapsable';
import { HeroRutina } from '@/ui/components/HeroRutina';
import { FilaEjercicio } from '@/ui/components/FilaEjercicio';
import { AfirmacionTachada } from '@/components/learn/AfirmacionTachada';
import { CitaLoQueSeDice } from '@/components/learn/CitaLoQueSeDice';
import { CuerpoLectura } from '@/components/learn/CuerpoLectura';
import { TarjetaEnSuLugar } from '@/components/learn/TarjetaEnSuLugar';
import { FilaRelacionados } from '@/components/learn/TarjetaRelacionada';
import { TituloBloque } from '@/components/learn/TituloBloque';

const FRACCION_HERO = 0.34;
const ALTO_BARRA_SUPERIOR = 52;
const SEPARACION_SECCIONES = 40;
/** Cuando cae el sello y cuando arranca el tachon, desde que se abre la pantalla. */
const ESPERA_SELLO_MS = 450;
const ESPERA_TACHADO_MS = 600;
const IMPACTO_SELLO_MS = 120;
const ESCALA_SELLO = 1.6;
const GIRO_SELLO = -4;

type Props = NativeStackScreenProps<ParamListBase, 'Mito'>;

export default function DetalleMito({ route, navigation }: Props) {
  const inset = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const { height: ventana } = useWindowDimensions();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { y.value = e.contentOffset.y; });
  const { alternarFavorito, esFavorito } = useEstado();

  const m = MITOS.find(x => x.id === (route.params as { id: string }).id);
  // Los ids de familia (fam_...) no llevan a ninguna parte: `relacionadosVista` los deja fuera.
  const relacionados = useMemo(() => relacionadosVista(m?.relacionado ?? []), [m]);
  const ejercicios = useMemo(() => relacionados.filter(r => r.tipo === 'ejercicio').flatMap(r => porId.get(r.id) ?? []), [relacionados]);
  const otros = useMemo(() => relacionados.filter(r => r.tipo !== 'ejercicio'), [relacionados]);
  const abrirEjercicio = useCallback((id: string) => navigation.navigate('Ejercicio', { id }), [navigation]);
  const alternarEjercicio = useCallback((id: string) => alternarFavorito('ejercicios', id), [alternarFavorito]);

  useEffect(() => {
    if (reducido) return;
    const golpe = setTimeout(haptico.golpe, ESPERA_SELLO_MS + IMPACTO_SELLO_MS);
    return () => clearTimeout(golpe);
  }, [reducido]);

  if (!m) return null;

  const foto = fuente('mito', m.id);
  const alturaHero = foto !== null ? Math.round(ventana * FRACCION_HERO) : inset.top + ALTO_BARRA_SUPERIOR + 16;
  const afirmacion = textoVisible(m.titulo);
  const veredicto = insignia[m.veredicto].texto;

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <Animated.ScrollView
        onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: inset.bottom + SEPARACION_SECCIONES }}
      >
        {foto !== null
          ? <HeroRutina fuente={foto} y={y} alto={alturaHero} matriz={MATRIZ_DESATURADA} />
          : <View style={{ height: alturaHero }} />}

        <View style={s.cabecera} accessible accessibilityRole="header" accessibilityLabel={`${afirmacion}. ${veredicto}.`}>
          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <AfirmacionTachada
              mascara texto={afirmacion} estilo={s.afirmacion} tachar={m.veredicto === 'mito'}
              activo animar retraso={ESPERA_TACHADO_MS}
            />
            <View style={s.sello}>
              <InsigniaEvidencia
                tipo={m.veredicto} grande
                estampar={{ activo: true, retraso: ESPERA_SELLO_MS, escala: ESCALA_SELLO, giro: GIRO_SELLO, haptica: false }}
              />
            </View>
          </View>
        </View>

        <BloqueRevela y={y} sinMovimiento estilo={s.seccion}>
          {activo => <CitaLoQueSeDice texto={textoDeLectura(m.afirmacion_popular)} activo={activo} />}
        </BloqueRevela>

        <View style={s.seccion}>
          <TituloBloque>Por qué</TituloBloque>
          <CuerpoLectura texto={textoDeLectura(m.explicacion)} />
        </View>

        <BloqueRevela y={y} sinMovimiento fraccion={0.4} estilo={s.seccion}>
          {activo => (
            <>
              <TituloBloque>Qué hacer en su lugar</TituloBloque>
              <TarjetaEnSuLugar texto={textoDeLectura(m.que_hacer)} activo={activo} />
            </>
          )}
        </BloqueRevela>

        {relacionados.length > 0 && (
          <View style={s.seccionLibre}>
            <View style={s.margen}><TituloBloque>Relacionado</TituloBloque></View>
            {ejercicios.length > 0 && (
              <View style={s.margen}>
                {ejercicios.map(e => (
                  <FilaEjercicio
                    key={e.id} e={e} favorito={esFavorito('ejercicios', e.id)}
                    onFav={alternarEjercicio} onPress={abrirEjercicio}
                  />
                ))}
              </View>
            )}
            {otros.length > 0 && (
              <View style={ejercicios.length > 0 ? s.otros : undefined}>
                <FilaRelacionados relacionados={otros} onAbrir={r => navigation.navigate(RUTA_DE_RELACIONADO[r.tipo], { id: r.id })} />
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>

      <BarraSuperiorColapsable y={y} alturaHero={alturaHero} nombre={afirmacion} onAtras={() => navigation.goBack()} />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  margen: { marginHorizontal: MARGEN_PANTALLA },
  cabecera: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
  afirmacion: { fontFamily: familia.display, fontSize: 34, lineHeight: 37, color: paleta.magnesia },
  sello: { marginTop: 16 },
  seccion: { marginHorizontal: MARGEN_PANTALLA, marginTop: SEPARACION_SECCIONES },
  seccionLibre: { marginTop: SEPARACION_SECCIONES },
  otros: { marginTop: 16 },
});
