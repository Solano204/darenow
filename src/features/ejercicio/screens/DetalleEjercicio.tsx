/**
 * FORJA · ficha de ejercicio
 *
 * Es donde la app cumple su promesa: «te decimos lo que sí funciona, y lo que no».
 * La evidencia va justo despues de la descripcion, con su nota. Mismos datos,
 * mismo orden de secciones, mismas acciones que antes del rediseno (ver
 * `docs/FUNCIONALIDAD.md`, seccion 14); cambia como se ve y se mueve.
 */

import React from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { Nota } from '@/ui/components';
import { BotonSecundario } from '@/ui/components/BotonSecundario';
import { BloqueRevela } from '@/ui/fx/BloqueRevela';
import { TarjetaVerMas } from '@/ui/components/CarruselHoy';
import { HeroEjercicio } from '@/features/ejercicio/components/HeroEjercicio';
import { BarraSuperiorColapsable } from '@/ui/components/BarraSuperiorColapsable';
import { MetadatosEjercicio } from '@/features/ejercicio/components/MetadatosEjercicio';
import { TarjetaEvidencia } from '@/features/ejercicio/components/TarjetaEvidencia';
import { PasosLineaTiempo } from '@/ui/components/PasosLineaTiempo';
import { FilaRespiracion } from '@/features/ejercicio/components/FilaRespiracion';
import { ListaClaves } from '@/ui/components/ListaClaves';
import { ListaErrores } from '@/features/ejercicio/components/ListaErrores';
import { FichaMusculo, medidasFichas } from '@/features/ejercicio/components/FichaMusculo';
import { RejillaDetalles } from '@/features/ejercicio/components/RejillaDetalles';
import { TarjetaAlternativa, ANCHO_ALTERNATIVA } from '@/features/ejercicio/components/TarjetaAlternativa';
import { TituloSeccion } from '@/ui/components/TituloSeccion';
import { porId, getEjercicio, musculoPorId, familiaPorId, evidenciaDe, type EjercicioIndice } from '@/data/catalog';
import { useEstadoSel, useEsFavorito } from '@/state/store';
import { alternarVeto, alternarFavorito } from '@/state/acciones';
import { textoVisible } from '@/lib/presentacion';

const ALTO_HERO_FRACCION = 0.46;
const SEPARACION_SECCIONES = 40;
const ALTO_FICHA_MUSCULO = 104;
const FRACCION_TARJETA_PARA_ACTIVAR = 0.4;
const FRACCION_LISTA_PARA_ACTIVAR = 0.3;
const SEPARACION_TARJETAS = 12;

type Props = NativeStackScreenProps<ParamListBase, 'Ejercicio'>;

export default function DetalleEjercicio({ route, navigation }: Props) {
  const inset = useSafeAreaInsets();
  const { height: ventana } = useWindowDimensions();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(ev => { y.set(ev.contentOffset.y); });
  const idEjercicio = (route.params as { id: string }).id;
  const vetos = useEstadoSel(x => x.perfil.vetos);
  const contraPerfil = useEstadoSel(x => x.perfil.contra);
  const favorito = useEsFavorito('ejercicios', idEjercicio);

  const e = getEjercicio(idEjercicio);
  if (!e) return null;

  const alturaHero = Math.round(ventana * ALTO_HERO_FRACCION);
  const { mapa, nota } = evidenciaDe(e);
  const fam = familiaPorId.get(e.family);
  const vetado = vetos.includes(e.id);
  const bloqueado = e.contra.some(c => contraPerfil.includes(c));
  // Principales primero (el orden real: son los que mas carga el ejercicio),
  // acotado a 4 como todo carrusel de la app: sin esto, un ejercicio con
  // varios musculos secundarios desbordaba la fila sin limite ni "ver mas".
  const musculos = [...e.primary, ...e.secondary]
    .map(id => musculoPorId.get(id)).filter((m): m is NonNullable<typeof m> => !!m).slice(0, 4);
  const medidas = medidasFichas(musculos.map(m => textoVisible(m.name)));
  const hayEvidencia = Object.keys(mapa).length > 0 || !!nota;

  const abrir = (id: string) => navigation.push('Ejercicio', { id });

  return (
    <View style={s.raiz}>
      <Animated.ScrollView
        onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: inset.bottom + SEPARACION_SECCIONES }}
      >
        <HeroEjercicio ejercicio={e} y={y} alto={alturaHero} />

        <View style={s.cabecera}>
          <Text style={s.nombre} accessibilityRole="header">{textoVisible(e.name)}</Text>
          {e.name_en ? <Text style={s.ingles}>{e.name_en}</Text> : null}
          <View style={s.metadatos}><MetadatosEjercicio ejercicio={e} /></View>

          {bloqueado && (
            <View style={s.aviso}>
              <Nota
                tono="cuidado" titulo="Fuera de tu plan"
                texto="Lo quitamos por las lesiones que declaraste. Puedes verlo, pero no te lo vamos a proponer."
              />
            </View>
          )}

          <Text style={s.descripcion}>{textoVisible(e.desc)}</Text>
        </View>

        {/* La evidencia va aqui, con su nota al lado. Nunca suelta en una lista. */}
        {hayEvidencia && (
          <BloqueRevela y={y} sinMovimiento fraccion={FRACCION_TARJETA_PARA_ACTIVAR} estilo={s.seccion}>
            {activo => (
              <>
                <TituloSeccion titulo="Qué dice la evidencia" />
                <TarjetaEvidencia mapa={mapa} nota={nota} activo={activo} />
              </>
            )}
          </BloqueRevela>
        )}

        <PasosLineaTiempo
          estilo={s.seccion} pasos={e.steps.map(textoVisible)} y={y}
          titulo={<TituloSeccion titulo="Cómo se hace" />}
          pie={e.breathing ? <FilaRespiracion texto={e.breathing} /> : undefined}
        />

        {e.cues.length > 0 && (
          <BloqueRevela y={y} sinMovimiento fraccion={FRACCION_LISTA_PARA_ACTIVAR} estilo={s.seccion}>
            {activo => (
              <>
                <TituloSeccion titulo="Claves" />
                <ListaClaves claves={e.cues} activo={activo} />
              </>
            )}
          </BloqueRevela>
        )}

        {e.errors.length > 0 && (
          <BloqueRevela y={y} sinMovimiento fraccion={FRACCION_LISTA_PARA_ACTIVAR} estilo={s.seccion}>
            {activo => (
              <>
                <TituloSeccion titulo="Errores comunes" />
                <ListaErrores errores={e.errors} activo={activo} />
              </>
            )}
          </BloqueRevela>
        )}

        {/* Musculos en fichas cuadradas, con nombre e imagen. */}
        <BloqueRevela y={y} sinMovimiento fraccion={FRACCION_LISTA_PARA_ACTIVAR} estilo={s.seccionLibre}>
          {activo => (
            <>
              <View style={s.margen}><TituloSeccion titulo="Músculos que trabaja" /></View>
              {musculos.length > 0 && (
                <FlatList
                  data={musculos} keyExtractor={m => m.id} horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.fila}
                  renderItem={({ item, index }) => (
                    <FichaMusculo
                      m={item} principal={e.primary.includes(item.id)} medidas={medidas} indice={index} activo={activo}
                      onPress={() => navigation.push('Musculo', { id: item.id })}
                    />
                  )}
                  ListFooterComponent={(
                    <TarjetaVerMas
                      ancho={medidas.ancho} alto={ALTO_FICHA_MUSCULO} radioEsquina={24} texto="Todos"
                      onPress={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } })}
                    />
                  )}
                />
              )}
              <Text style={[s.principales, s.margen]}>
                <Text style={s.principalesEtiqueta}>Principales: </Text>
                <Text style={s.principalesNombres}>
                  {e.primary.map(m => textoVisible(musculoPorId.get(m)?.name ?? m)).join(', ')}
                </Text>
              </Text>
            </>
          )}
        </BloqueRevela>

        <BloqueRevela y={y} sinMovimiento fraccion={FRACCION_LISTA_PARA_ACTIVAR} estilo={s.seccion}>
          {activo => (
            <>
              <TituloSeccion titulo="Detalles" />
              <RejillaDetalles ejercicio={e} familia={fam} activo={activo} />
            </>
          )}
        </BloqueRevela>

        <Alternativas titulo="Progresiones" ayuda="Una versión más difícil" ids={e.progressions} clase="nivel" abrir={abrir} />
        <Alternativas titulo="Regresiones" ayuda="Una versión más fácil" ids={e.regressions} clase="nivel" abrir={abrir} />
        <Alternativas titulo="Sustitutos" ayuda="Si no puedes hacer este" ids={e.substitutes} clase="intercambio" abrir={abrir} />

        <View style={s.seccion}>
          <BotonSecundario
            texto={vetado ? 'Volver a proponérmelo' : 'No me lo propongas más'}
            onPress={() => alternarVeto(e.id)}
          />
        </View>
      </Animated.ScrollView>

      <BarraSuperiorColapsable
        y={y} alturaHero={alturaHero} nombre={textoVisible(e.name)}
        favorito={favorito} onFavorito={() => alternarFavorito('ejercicios', e.id)}
        onAtras={() => navigation.goBack()}
      />
    </View>
  );
}

/** Progresiones, regresiones o sustitutos: una fila de tarjetas con una linea de ayuda. Sin ejercicios, la seccion no aparece. */
function Alternativas({ titulo, ayuda, ids, clase, abrir }: {
  titulo: string; ayuda: string; ids: string[]; clase: 'nivel' | 'intercambio'; abrir: (id: string) => void;
}) {
  const items = ids.map(i => porId.get(i)).filter((x): x is EjercicioIndice => !!x);
  if (!items.length) return null;
  return (
    <View style={s.seccionLibre}>
      <View style={s.margen}><TituloSeccion titulo={titulo} ayuda={ayuda} /></View>
      <FlatList
        data={items} keyExtractor={x => x.id} horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.fila}
        getItemLayout={(_, i) => ({ length: ANCHO_ALTERNATIVA, offset: (ANCHO_ALTERNATIVA + SEPARACION_TARJETAS) * i, index: i })}
        renderItem={({ item }) => <TarjetaAlternativa e={item} clase={clase} onPress={() => abrir(item.id)} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  cabecera: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
  nombre: { fontFamily: familia.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.5, color: paleta.magnesia },
  ingles: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia3Texto, marginTop: 2 },
  metadatos: { marginTop: 12 },
  aviso: { marginTop: 16 },
  descripcion: {
    fontFamily: familia.cuerpo, fontSize: 17, lineHeight: 26, color: paleta.magnesia, marginTop: 16, maxWidth: 560,
  },
  seccion: { marginTop: SEPARACION_SECCIONES, marginHorizontal: MARGEN_PANTALLA },
  seccionLibre: { marginTop: SEPARACION_SECCIONES },
  margen: { marginHorizontal: MARGEN_PANTALLA },
  fila: { paddingHorizontal: MARGEN_PANTALLA, gap: SEPARACION_TARJETAS },
  principales: { marginTop: 16, fontSize: 15, lineHeight: 22 },
  principalesEtiqueta: { fontFamily: familia.cuerpo, color: paleta.magnesia2 },
  principalesNombres: { fontFamily: familia.enfasis, color: paleta.magnesia },
});
