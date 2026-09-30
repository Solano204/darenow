/**
 * FORJA · detalle de un programa
 *
 * Un programa es un plan de carga en el tiempo: la rutina tiene forma en minutos (Parte 8),
 * el programa la tiene en semanas. Aqui se ve de un vistazo (el mapa de carga, una columna por
 * semana) y despues fase por fase (la linea de tiempo). Mismos datos, mismas fases, mismas
 * rutinas y misma accion que antes del rediseno (ver `docs/FUNCIONALIDAD.md`, seccion 18).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { paleta, familia, MARGEN_PANTALLA } from '@/theme';
import { Nota } from '@/components/ui';
import { BotonPlaca } from '@/components/ui/BotonPlaca';
import { BotonSecundario } from '@/components/ui/BotonSecundario';
import { BarraInferiorFija, ALTO_BARRA_INFERIOR } from '@/components/ui/BarraInferiorFija';
import { GomaTexture } from '@/components/fx/GomaTexture';
import { BloqueRevela } from '@/components/fx/BloqueRevela';
import { BarraSuperiorColapsable } from '@/components/exercise/BarraSuperiorColapsable';
import { TituloSeccion } from '@/components/exercise/TituloSeccion';
import { HeroRutina } from '@/components/routine-detail/HeroRutina';
import { DatosPrograma } from '@/components/program-detail/DatosPrograma';
import { MapaCarga } from '@/components/program-detail/MapaCarga';
import { LineaFases } from '@/components/program-detail/LineaFases';
import { TarjetaQueEsperar } from '@/components/program-detail/TarjetaQueEsperar';
import { HojaCambiarPrograma } from '@/components/program-detail/HojaCambiarPrograma';
import { MAX_PLACAS } from '@/components/program-detail/disposicionMapa';
import { programaPorId, rutinaPorId } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { fuente } from '@/media/registry';
import { useEstado } from '@/store/store';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { textoVisible } from '@/utils/presentacion';
import {
  fasesDePrograma, faseDeSemana, minutosPorSemana, placasPorSemana, resumenDePlan,
} from '@/utils/minutosPorSemana';

const ALTO_BARRA_SUPERIOR = 52;
const FRACCION_HERO = 0.38;
const SEPARACION_SECCIONES = 40;
const FRACCION_MAPA_PARA_ACTIVAR = 0.4;
const FRACCION_TARJETA_PARA_ACTIVAR = 0.3;
/** Deja terminar el scroll animado hasta la fase antes de hacerla brillar. */
const RETRASO_RESALTE_MS = 350;
const AIRE_AL_IR_A_FASE_PX = 24;

type Props = NativeStackScreenProps<ParamListBase, 'Programa'>;

export default function DetallePrograma({ route, navigation }: Props) {
  const inset = useSafeAreaInsets();
  const { height: ventana } = useWindowDimensions();
  const reducido = useReducedMotion();
  const scroll = useRef<Animated.ScrollView>(null);
  const y = useSharedValue(0);
  const zonas = useSharedValue<number[]>([]);
  const onScroll = useAnimatedScrollHandler(e => { y.value = e.contentOffset.y; });
  const { estado, guardarPerfil, alternarFavorito, esFavorito } = useEstado();
  const [hoja, setHoja] = useState(false);
  const [resaltar, setResaltar] = useState({ indice: -1, n: 0 });

  const p = programaPorId.get((route.params as { id: string }).id);
  const fases = useMemo(() => (p ? fasesDePrograma(p.fases) : null), [p]);
  const minutos = useMemo(
    () => (p && fases ? minutosPorSemana(p.semanas, p.dias_semana, fases, id => rutinaPorId.get(id)?.min) : null),
    [p, fases],
  );
  const placas = useMemo(() => (p ? placasPorSemana(minutos, p.semanas, MAX_PLACAS) : []), [p, minutos]);
  const abrirRutina = useCallback((id: string) => navigation.navigate('Rutina', { id }), [navigation]);
  if (!p) return null;

  const activo = estado.perfil.programaId === p.id;
  const actual = programaPorId.get(estado.perfil.programaId);
  // La semana en que va el usuario es la que guarda el perfil (`semanaPrograma`); solo cuenta si sigue este programa.
  const semanaActual = activo ? Math.min(Math.max(estado.semanaPrograma, 1), p.semanas) : undefined;
  const faseActual = fases && semanaActual !== undefined ? faseDeSemana(fases, semanaActual) : -1;
  const resumen = fases ? resumenDePlan(fases, minutos, semanaActual, nombreVisible) : '';
  const nombre = nombreVisible(p.name);
  const foto = fuente('programa', p.id);
  const barraTop = inset.top + ALTO_BARRA_SUPERIOR;
  const alturaHero = foto !== null ? Math.round(ventana * FRACCION_HERO) : barraTop;

  // Solo se sigue un programa a la vez: "cambiar" es en realidad dejar el
  // actual y unirse al nuevo. Si ya hay uno (siempre lo hay), se avisa
  // antes de reemplazarlo en vez de pisarlo en silencio.
  const cambiar = () => { guardarPerfil({ programaId: p.id, objetivo: p.goal }); navigation.goBack(); };
  const elegirPrograma = () => {
    if (!actual || actual.id === p.id) { cambiar(); return; }
    setHoja(true);
  };

  const irAFase = (i: number) => {
    const arriba = zonas.value[2 * i];
    if (arriba === undefined) return;
    scroll.current?.scrollTo({ y: Math.max(0, arriba - (barraTop + AIRE_AL_IR_A_FASE_PX)), animated: !reducido });
    setTimeout(() => setResaltar(r => ({ indice: i, n: r.n + 1 })), reducido ? 0 : RETRASO_RESALTE_MS);
  };

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <Animated.ScrollView
        ref={scroll} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: inset.bottom + ALTO_BARRA_INFERIOR + SEPARACION_SECCIONES }}
      >
        {foto !== null ? <HeroRutina fuente={foto} y={y} alto={alturaHero} /> : <View style={{ height: alturaHero }} />}

        <View style={s.cabecera}>
          <Text style={s.nombre} accessibilityRole="header">{nombre}</Text>
          <View style={s.datos}>
            <DatosPrograma semanas={p.semanas} dias={p.dias_semana} minutos={p.min_sesion} objetivo={p.goal} />
          </View>
          <Text style={s.descripcion}>{textoVisible(p.desc)}</Text>
          {p.honestidad ? (
            <View style={s.aviso}>
              <Nota titulo="Lo que sí y lo que no" texto={textoVisible(p.honestidad)} tono="cuidado" />
            </View>
          ) : null}
        </View>

        {fases ? (
          <>
            <BloqueRevela y={y} sinMovimiento fraccion={FRACCION_MAPA_PARA_ACTIVAR} estilo={s.seccion}>
              {activa => (
                <>
                  <TituloSeccion titulo="El plan" />
                  <MapaCarga
                    fases={fases} placas={placas} faseActual={faseActual} resumen={resumen} y={y} zonas={zonas}
                    activo={activa} onFase={irAFase}
                  />
                </>
              )}
            </BloqueRevela>
            <LineaFases
              fases={fases} semanaActual={semanaActual} resaltar={resaltar} y={y} zonas={zonas} onAbrirRutina={abrirRutina}
            />
          </>
        ) : null}

        {p.medicion ? (
          <View style={s.seccion}>
            <TituloSeccion titulo="Cómo se mide" />
            <Text style={s.medicion}>{textoVisible(p.medicion)}</Text>
          </View>
        ) : null}

        <BloqueRevela y={y} fraccion={FRACCION_TARJETA_PARA_ACTIVAR} estilo={s.seccion}>
          {() => <TarjetaQueEsperar texto={textoVisible(p.resultado_esperado)} />}
        </BloqueRevela>
      </Animated.ScrollView>

      <BarraSuperiorColapsable
        y={y} alturaHero={alturaHero} nombre={nombre} favorito={esFavorito('programas', p.id)}
        onFavorito={() => alternarFavorito('programas', p.id)} onAtras={() => navigation.goBack()}
      />

      <BarraInferiorFija>
        {activo ? (
          <BotonSecundario
            texto="Cambiar de programa"
            onPress={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'programas' } })}
          />
        ) : (
          <BotonPlaca texto="Cambiar a este programa" aplauso={!actual} onPress={elegirPrograma} />
        )}
      </BarraInferiorFija>

      <HojaCambiarPrograma
        visible={hoja} actual={actual ? nombreVisible(actual.name) : ''} nuevo={nombre}
        onConfirmar={() => { setHoja(false); cambiar(); }} onCancelar={() => setHoja(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  cabecera: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
  nombre: { fontFamily: familia.display, fontSize: 36, lineHeight: 38, letterSpacing: -0.5, color: paleta.magnesia },
  datos: { marginTop: 16 },
  descripcion: {
    fontFamily: familia.cuerpo, fontSize: 17, lineHeight: 26, color: paleta.magnesia, marginTop: 16, maxWidth: 560,
  },
  aviso: { marginTop: 16 },
  seccion: { marginHorizontal: MARGEN_PANTALLA, marginTop: SEPARACION_SECCIONES },
  medicion: { fontFamily: familia.cuerpo, fontSize: 17, lineHeight: 26, color: paleta.magnesia2, maxWidth: 560 },
});
