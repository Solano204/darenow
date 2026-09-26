/**
 * FORJA · Explorar
 *
 * Los datos, los filtros, el contador y las rutas son los de siempre (ver
 * `docs/FUNCIONALIDAD.md` §15). Lo que cambia es la presentacion:
 * - La cabecera (titulo, buscador, segmentos, filtros y contador) es fija y flota sobre
 *   las listas; las listas pasan por debajo con un relleno igual a su alto (que es una
 *   suma exacta de constantes: medirla haria bailar la lista al plegar los filtros).
 * - En Ejercicios, al bajar mas de 24 px las filas de categoria y objetivo se pliegan
 *   (solo visual: los filtros siguen aplicados) y la lista sube con ellas por una
 *   transformacion, sin volver a medirse.
 * - Cada segmento monta su propia lista; al cambiar, la vieja sale y la nueva entra
 *   desde el lado del segmento elegido.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, type ParamListBase } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta, familia, easing, MARGEN_PANTALLA } from '../theme';
import { useHuecoAbajo } from '../components/ui';
import { seguirBarra } from '../components/ui/cabecera';
import { ICONOS_OBJETIVO } from '../components/ui/iconosObjetivo';
import { barraBajada } from '../hooks/useBarraFlotante';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTick } from '../hooks/useTick';
import { MuroCategoria, Intersticial } from '../components/Anuncio';
import {
  EJERCICIOS, RUTINAS, PROGRAMAS, MUSCULOS, CATEGORIAS, GOALS, nombreGoal,
} from '../data/catalog';
import { useEstado } from '../store/store';
import { BuscadorVivo } from '../components/explore/BuscadorVivo';
import { SegmentosIndicador } from '../components/explore/SegmentosIndicador';
import { ChipFiltro } from '../components/explore/ChipFiltro';
import { ChipCategoria } from '../components/explore/ChipCategoria';
import { InterruptorDos } from '../components/explore/InterruptorDos';
import { ContadorResultados } from '../components/explore/ContadorResultados';
import {
  EncabezadoFiltrosColapsable, FilaChips, ALTO_FILA_CATEGORIA, ALTO_FILA_OBJETIVO, ALTO_FILTROS_EJERCICIOS,
  SEPARACION_FILAS,
} from '../components/explore/EncabezadoFiltrosColapsable';
import {
  EncabezadoExplorar, altoEncabezado, SEP_SEGMENTOS, SEP_CONTADOR, SEP_INTERRUPTOR, type SegmentoExplorar,
} from '../components/explore/EncabezadoExplorar';
import { CabeceraRutinas } from '../components/explore/CabeceraRutinas';
import { RejillaMusculos } from '../components/explore/RejillaMusculos';
import { ListaEjercicios, ListaRutinas, ListaProgramas } from '../components/explore/listas';
import type { PropsLista } from '../components/explore/listaBase';

const SEGMENTOS: readonly { id: SegmentoExplorar; texto: string }[] = [
  { id: 'ejercicios', texto: 'Ejercicios' }, { id: 'rutinas', texto: 'Rutinas' },
  { id: 'programas', texto: 'Programas' }, { id: 'musculos', texto: 'Músculos' },
];
const UNIDADES: Record<SegmentoExplorar, [singular: string, plural: string]> = {
  ejercicios: ['ejercicio', 'ejercicios'], rutinas: ['rutina', 'rutinas'],
  programas: ['programa', 'programas'], musculos: ['músculo', 'músculos'],
};
const OPCIONES_INTERRUPTOR = ['Lo que puedo hacer', 'Catálogo completo'] as const;

const UMBRAL_PLEGAR_PX = 24;
const DESPLEGAR_PX = 12;
const PLIEGUE_MS = 220;
const SEGMENTO_MS = 220;
const FUNDIDO_REDUCIDO_MS = 150;
const DESPLAZAMIENTO_SEGMENTO = 16;
const AIRE_LISTA = 16;
const RETRASO_CONTEO_MS = 350;
const BAJADA_BARRA_MS = 180;

export default function Explorar({ navigation, route }: BottomTabScreenProps<ParamListBase, 'Explorar'>) {
  const abajo = useHuecoAbajo();
  const { top } = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const tick = useTick();
  const { estado, alternarFavorito, esFavorito, registrarDescarga } = useEstado();
  const parametro = (route.params as { tab?: SegmentoExplorar } | undefined)?.tab;
  const [tab, setTab] = useState<SegmentoExplorar>(parametro ?? 'ejercicios');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [soloMios, setSoloMios] = useState(true);
  const [verAnuncio, setVerAnuncio] = useState(false);
  const [plegado, setPlegado] = useState(false);

  const y = useSharedValue(0);
  const ultimoY = useSharedValue(0);
  const ancla = useSharedValue(0);
  const previo = useSharedValue(0);
  const bajando = useSharedValue(0);
  const plegadoSV = useSharedValue(0);
  const plegableSV = useSharedValue(tab === 'ejercicios' ? 1 : 0);
  const pliegue = useSharedValue(0);
  const foco = useSharedValue(0);
  const sentido = useSharedValue(1);

  const plegable = tab === 'ejercicios';

  // La pestana ya montada ignoraba el parametro nuevo, asi que "Ver todas"
  // desde programas siempre acababa en ejercicios. Ahora se escucha el
  // cambio de parametros.
  useEffect(() => {
    if (parametro && parametro !== tab) irATab(parametro);
  }, [parametro]);

  useEffect(() => { plegableSV.value = plegable ? 1 : 0; }, [plegable]);
  useEffect(() => {
    pliegue.value = reducido ? (plegado ? 1 : 0) : withTiming(plegado ? 1 : 0, { duration: PLIEGUE_MS, easing: easing.salida });
  }, [plegado, reducido]);

  const desplegar = useCallback(() => { plegadoSV.value = 0; setPlegado(false); }, []);

  /** Una lista nueva empieza arriba: sin scroll, con los filtros abiertos y la barra de pestanas en su sitio. */
  const reiniciarScroll = () => {
    y.value = 0; ultimoY.value = 0; ancla.value = 0; previo.value = 0; bajando.value = 0;
    plegadoSV.value = 0; pliegue.value = 0;
    setPlegado(false);
    barraBajada.value = withTiming(0, { duration: BAJADA_BARRA_MS });
  };

  const irATab = (id: SegmentoExplorar) => {
    if (id === tab) return;
    const indice = (s: SegmentoExplorar) => SEGMENTOS.findIndex(x => x.id === s);
    sentido.value = indice(id) > indice(tab) ? 1 : -1;
    reiniciarScroll();
    setTab(id);
  };

  const onScroll = useAnimatedScrollHandler(e => {
    const v = e.contentOffset.y;
    const delta = v - ultimoY.value;
    ultimoY.value = v;
    y.value = v;
    seguirBarra(v, previo, bajando);
    if (!plegableSV.value) return;
    if (plegadoSV.value === 1) {
      if (v <= 0 || ancla.value - v > DESPLEGAR_PX) { plegadoSV.value = 0; runOnJS(setPlegado)(false); }
      else if (v > ancla.value) ancla.value = v;
    } else if (delta > 0 && v > UMBRAL_PLEGAR_PX && v <= e.contentSize.height - e.layoutMeasurement.height) {
      plegadoSV.value = 1; ancla.value = v; runOnJS(setPlegado)(true);
    }
  });

  const equipoDisp = useMemo(
    () => new Set([...estado.perfil.equipo, 'ninguno', 'pared', 'silla']),
    [estado.perfil.equipo],
  );
  const contra = useMemo(() => new Set(estado.perfil.contra), [estado.perfil.contra]);
  const desbloqueada = estado.descargas.includes(tab);

  const ejercicios = useMemo(() => {
    const t = q.trim().toLowerCase();
    return EJERCICIOS.filter(e => {
      if (t && !(
        e.name.toLowerCase().includes(t) ||
        (e.name_en ?? '').toLowerCase().includes(t) ||
        (e.aliases ?? []).some(a => a.toLowerCase().includes(t))
      )) return false;
      if (cat && e.category !== cat) return false;
      if (goal && !e.goals.includes(goal)) return false;
      if (soloMios) {
        if (e.contra.some(c => contra.has(c))) return false;
        if (!e.equipment.every(x => equipoDisp.has(x))) return false;
        if (estado.perfil.modoSinSaltos && (e.impact >= 2 || e.noise >= 2)) return false;
      }
      return true;
    });
  }, [q, cat, goal, soloMios, equipoDisp, contra, estado.perfil.modoSinSaltos]);

  const rutinas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return RUTINAS.filter(r => (!t || r.name.toLowerCase().includes(t)) && (!goal || r.goal === goal));
  }, [q, goal]);

  const programas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PROGRAMAS.filter(p => (!t || p.name.toLowerCase().includes(t)) && (!goal || p.goal === goal));
  }, [q, goal]);

  const musculos = useMemo(() => {
    const t = q.trim().toLowerCase();
    return MUSCULOS.filter(m => !t || m.name.toLowerCase().includes(t) || m.group.toLowerCase().includes(t));
  }, [q]);

  const cuantos = { ejercicios: ejercicios.length, rutinas: rutinas.length,
    programas: programas.length, musculos: musculos.length }[tab];

  // Referencias estables: si no, cada tecla en el buscador crea una funcion
  // nueva por fila y invalida el memo de FilaEjercicio para las 190 filas.
  const onPressEjercicio = useCallback(
    (id: string) => navigation.navigate('Ejercicio', { id }), [navigation]);
  const onFavEjercicio = useCallback(
    (id: string) => alternarFavorito('ejercicios', id), [alternarFavorito]);
  const favorito = (tipo: 'ejercicios' | 'rutinas' | 'programas') => (id: string) => esFavorito(tipo, id);

  // Rutinas propias recien creadas o editadas: al volver a la pestana, su fila entra y se
  // ilumina. Se reconocen por identidad (guardar una rutina crea un objeto nuevo).
  const vistas = useRef(new Map(estado.rutinasPropias.map(r => [r.id, r])));
  const [destacadas, setDestacadas] = useState<Record<string, number>>({});
  const [conteoGrupo, setConteoGrupo] = useState(estado.rutinasPropias.length);
  useFocusEffect(useCallback(() => {
    const propias = estado.rutinasPropias;
    const nuevas = propias.filter(r => vistas.current.get(r.id) !== r);
    vistas.current = new Map(propias.map(r => [r.id, r]));
    if (nuevas.length > 0) {
      setDestacadas(d => ({ ...d, ...Object.fromEntries(nuevas.map(r => [r.id, (d[r.id] ?? 0) + 1])) }));
    }
    const id = setTimeout(() => setConteoGrupo(propias.length), RETRASO_CONTEO_MS);
    return () => clearTimeout(id);
  }, [estado.rutinasPropias]));

  const resumenFiltros = useMemo(() => {
    const partes = [
      cat ? CATEGORIAS.find(c => c.id === cat)?.nombre : undefined,
      goal ? nombreGoal(goal) : undefined,
    ].filter((p): p is string => !!p);
    return partes.length > 0 ? partes.join(' · ') : 'Sin filtros';
  }, [cat, goal]);

  const entradaSegmento = useMemo<EntryExitAnimationFunction>(() => () => {
    'worklet';
    if (reducido) return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, { duration: FUNDIDO_REDUCIDO_MS }) } };
    return {
      initialValues: { opacity: 0, transform: [{ translateX: sentido.value * DESPLAZAMIENTO_SEGMENTO }] },
      animations: {
        opacity: withTiming(1, { duration: SEGMENTO_MS }),
        transform: [{ translateX: withTiming(0, { duration: SEGMENTO_MS }) }],
      },
    };
  }, [reducido, sentido]);
  const salidaSegmento = useMemo<EntryExitAnimationFunction>(() => () => {
    'worklet';
    if (reducido) return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: FUNDIDO_REDUCIDO_MS }) } };
    return {
      initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
      animations: {
        opacity: withTiming(0, { duration: SEGMENTO_MS }),
        transform: [{ translateX: withTiming(-sentido.value * DESPLAZAMIENTO_SEGMENTO, { duration: SEGMENTO_MS }) }],
      },
    };
  }, [reducido, sentido]);

  const sube = useAnimatedStyle(() => ({
    transform: [{ translateY: -ALTO_FILTROS_EJERCICIOS * pliegue.value }],
  }), [tick]);
  const resumen = useAnimatedStyle(() => ({ opacity: pliegue.value }), [tick]);

  const extraAbajo = plegable ? ALTO_FILTROS_EJERCICIOS : 0;
  const relleno = altoEncabezado(tab, top) + AIRE_LISTA;
  const propsLista = useMemo<PropsLista>(() => ({
    onScroll,
    contentContainerStyle: { paddingTop: relleno, paddingHorizontal: MARGEN_PANTALLA, paddingBottom: abajo + extraAbajo },
  }), [onScroll, relleno, abajo, extraAbajo]);

  const chipsObjetivo = (
    <>
      <ChipFiltro
        texto="Cualquier objetivo" activo={goal === null} onPress={() => setGoal(null)}
      />
      {GOALS.map(g => (
        <ChipFiltro
          key={g.id} texto={g.nombre} icono={ICONOS_OBJETIVO[g.id]} activo={goal === g.id}
          onPress={() => setGoal(goal === g.id ? null : g.id)}
        />
      ))}
    </>
  );

  const derecha = plegable || desbloqueada ? (
    <View style={s.derecha}>
      {plegable && (
        <Animated.View style={[s.resumen, resumen]} pointerEvents={plegado ? 'auto' : 'none'}
          accessibilityElementsHidden={!plegado} importantForAccessibility={plegado ? 'auto' : 'no-hide-descendants'}>
          <Pressable
            onPress={desplegar} hitSlop={8} accessibilityRole="button"
            accessibilityLabel={`Filtros: ${resumenFiltros}. Toca para mostrarlos`}
          >
            <Text style={s.resumenTexto} numberOfLines={1}>{resumenFiltros}</Text>
          </Pressable>
        </Animated.View>
      )}
      {desbloqueada && (
        <View style={s.sinConexion}>
          <Ionicons name="checkmark" size={14} color={paleta.magnesia2} />
          <Text style={s.resumenTexto}>Sin conexión</Text>
        </View>
      )}
    </View>
  ) : undefined;

  const cabeceraRutinas = (
    <CabeceraRutinas
      propias={estado.rutinasPropias} conteo={conteoGrupo} destacadas={destacadas}
      onCrear={() => navigation.navigate('EditorRutina')}
      onAbrir={id => navigation.navigate('RutinaPropia', { id })}
      onEditar={id => navigation.navigate('EditorRutina', { id })}
    />
  );

  return (
    <View style={s.raiz}>
      <Animated.View key={tab} style={s.pantalla} entering={entradaSegmento} exiting={salidaSegmento}>
        <Animated.View style={[s.interior, { bottom: -extraAbajo }, sube]}>
          {tab === 'ejercicios' && (
            <ListaEjercicios
              ejercicios={ejercicios} propsLista={propsLista} favorito={favorito('ejercicios')}
              onFav={onFavEjercicio} onPress={onPressEjercicio}
            />
          )}
          {tab === 'rutinas' && (
            <ListaRutinas
              rutinas={rutinas} cabecera={cabeceraRutinas} propsLista={propsLista} favorito={favorito('rutinas')}
              onFav={id => alternarFavorito('rutinas', id)} onPress={id => navigation.navigate('Rutina', { id })}
            />
          )}
          {tab === 'programas' && (
            <ListaProgramas
              programas={programas} propsLista={propsLista} favorito={favorito('programas')}
              onFav={id => alternarFavorito('programas', id)} onPress={id => navigation.navigate('Programa', { id })}
            />
          )}
          {tab === 'musculos' && (
            <RejillaMusculos
              musculos={musculos} propsLista={propsLista} onPress={id => navigation.navigate('Musculo', { id })}
            />
          )}
        </Animated.View>
      </Animated.View>

      <EncabezadoExplorar y={y} foco={foco}>
        <View style={s.margen}>
          <BuscadorVivo valor={q} onCambio={setQ} foco={foco} />
        </View>
        <View style={{ marginTop: SEP_SEGMENTOS }}>
          <SegmentosIndicador segmentos={SEGMENTOS} activo={tab} onCambio={irATab} />
        </View>
        {plegable ? (
          <EncabezadoFiltrosColapsable pliegue={pliegue} alto={ALTO_FILTROS_EJERCICIOS} plegado={plegado}>
            <FilaChips alto={ALTO_FILA_CATEGORIA}>
              {[{ id: null, nombre: 'Todo' }, ...CATEGORIAS].map(c => (
                <ChipCategoria
                  key={c.id ?? 'todo'} texto={c.nombre} activo={cat === c.id} onPress={() => setCat(c.id)}
                />
              ))}
            </FilaChips>
            <FilaChips alto={ALTO_FILA_OBJETIVO}>{chipsObjetivo}</FilaChips>
          </EncabezadoFiltrosColapsable>
        ) : tab !== 'musculos' ? (
          <View style={{ paddingTop: SEPARACION_FILAS }}>
            <FilaChips alto={ALTO_FILA_OBJETIVO}>{chipsObjetivo}</FilaChips>
          </View>
        ) : null}
        <View style={[s.margen, { marginTop: SEP_CONTADOR }]}>
          <ContadorResultados
            cuantos={cuantos} singular={UNIDADES[tab][0]} plural={UNIDADES[tab][1]} derecha={derecha}
          />
        </View>
        {tab === 'ejercicios' && (
          <View style={[s.margen, { marginTop: SEP_INTERRUPTOR }]}>
            <InterruptorDos
              opciones={OPCIONES_INTERRUPTOR} indice={soloMios ? 0 : 1} onCambio={i => setSoloMios(i === 0)}
            />
          </View>
        )}
      </EncabezadoExplorar>

      {/* Desbloqueo por categoria: se ve la lista detras del vidrio, que es
          justo lo que motiva a abrirla, pero no se puede usar todavia. */}
      <MuroCategoria
        visible={!desbloqueada}
        categoria={SEGMENTOS.find(x => x.id === tab)!.texto.toLowerCase()}
        cuantos={cuantos}
        onVerAnuncio={() => setVerAnuncio(true)}
        onVolver={() => navigation.navigate('Hoy')}
      />

      <Intersticial
        visible={verAnuncio}
        motivo="desbloqueando contenido"
        onCerrar={() => { setVerAnuncio(false); registrarDescarga(tab); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  pantalla: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  interior: { position: 'absolute', top: 0, left: 0, right: 0 },
  margen: { marginHorizontal: MARGEN_PANTALLA },
  derecha: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  resumen: { flexShrink: 1 },
  resumenTexto: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  sinConexion: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
