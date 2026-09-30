/**
 * FORJA · Explorar
 *
 * Los datos, los filtros, el contador y las rutas son los de siempre (ver
 * `docs/FUNCIONALIDAD.md` §15). Lo que cambia es la presentacion:
 * - La cabecera (titulo, buscador, segmentos, filtros y contador) es opaca y fija, fuera
 *   de la FlatList y en el flujo normal del layout: no flota ni cambia de alto. Con el
 *   scroll solo el titulo encoge (`scale`). Las listas van justo debajo, con un aire fijo
 *   de 16 px antes de la primera fila (sin relleno calculado).
 * - En Ejercicios, las filas de categoria y objetivo quedan siempre visibles (no se pliegan).
 * - Cada segmento monta su propia lista; al cambiar, la vieja sale y la nueva entra
 *   desde el lado del segmento elegido.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, type ParamListBase } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { useHuecoAbajo } from '@/ui/components';
import { seguirBarra } from '@/ui/components/cabecera';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';
import { barraBajada } from '@/ui/hooks/useBarraFlotante';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { MuroCategoria, Intersticial } from '@/ui/components/Anuncio';
import {
  EJERCICIOS, RUTINAS, PROGRAMAS, MUSCULOS, CATEGORIAS, GOALS,
} from '@/data/catalog';
import { useEstado } from '@/state/store';
import { BuscadorVivo } from '@/ui/components/BuscadorVivo';
import { SegmentosIndicador } from '@/ui/components/SegmentosIndicador';
import { ChipFiltro } from '@/ui/components/ChipFiltro';
import { ChipCategoria } from '@/ui/components/ChipCategoria';
import { InterruptorDos } from '@/features/explorar/components/InterruptorDos';
import { ContadorResultados } from '@/features/explorar/components/ContadorResultados';
import { FilaChips, ALTO_FILA_CATEGORIA, ALTO_FILA_OBJETIVO, SEPARACION_FILAS } from '@/ui/components/EncabezadoFiltrosColapsable';
import { EncabezadoExplorar, SEP_SEGMENTOS, SEP_CONTADOR, type SegmentoExplorar } from '@/ui/components/EncabezadoExplorar';
import { CabeceraRutinas } from '@/features/explorar/components/CabeceraRutinas';
import { RejillaMusculos } from '@/features/explorar/components/RejillaMusculos';
import { ListaEjercicios, ListaRutinas, ListaProgramas } from '@/features/explorar/components/listas';
import { transicionesDeSegmento, type PropsLista } from '@/ui/components/listaBase';

const SEGMENTOS: readonly { id: SegmentoExplorar; texto: string }[] = [
  { id: 'ejercicios', texto: 'Ejercicios' }, { id: 'rutinas', texto: 'Rutinas' },
  { id: 'programas', texto: 'Programas' }, { id: 'musculos', texto: 'Músculos' },
];
const UNIDADES: Record<SegmentoExplorar, [singular: string, plural: string]> = {
  ejercicios: ['ejercicio', 'ejercicios'], rutinas: ['rutina', 'rutinas'],
  programas: ['programa', 'programas'], musculos: ['músculo', 'músculos'],
};
// El interruptor comparte linea con el contador y en 360 px no caben las frases enteras:
// se ve la version corta y el lector de pantalla oye la completa.
const TEXTOS_INTERRUPTOR = ['Puedo hacer', 'Catálogo'] as const;
const ETIQUETAS_INTERRUPTOR = ['Lo que puedo hacer', 'Catálogo completo'] as const;

const AIRE_LISTA = 16;
const RETRASO_CONTEO_MS = 350;
const BAJADA_BARRA_MS = 180;

export default function Explorar({ navigation, route }: BottomTabScreenProps<ParamListBase, 'Explorar'>) {
  const abajo = useHuecoAbajo();
  const reducido = useReducedMotion();
  const { estado, alternarFavorito, esFavorito, registrarDescarga } = useEstado();
  const parametro = (route.params as { tab?: SegmentoExplorar } | undefined)?.tab;
  const [tab, setTab] = useState<SegmentoExplorar>(parametro ?? 'ejercicios');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [soloMios, setSoloMios] = useState(true);
  const [verAnuncio, setVerAnuncio] = useState(false);

  const y = useSharedValue(0);
  const previo = useSharedValue(0);
  const bajando = useSharedValue(0);
  const foco = useSharedValue(0);
  const sentido = useSharedValue(1);

  const esEjercicios = tab === 'ejercicios';

  // La pestana ya montada ignoraba el parametro nuevo, asi que "Ver todas"
  // desde programas siempre acababa en ejercicios. Ahora se escucha el
  // cambio de parametros.
  useEffect(() => {
    if (parametro && parametro !== tab) irATab(parametro);
  }, [parametro]);

  /** Una lista nueva empieza arriba: sin scroll y con la barra de pestanas en su sitio. */
  const reiniciarScroll = () => {
    y.value = 0; previo.value = 0; bajando.value = 0;
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
    y.value = e.contentOffset.y;
    seguirBarra(e.contentOffset.y, previo, bajando);
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

  const { entrada: entradaSegmento, salida: salidaSegmento } = useMemo(
    () => transicionesDeSegmento(reducido, sentido), [reducido, sentido],
  );

  const propsLista = useMemo<PropsLista>(() => ({
    onScroll,
    contentContainerStyle: { paddingTop: AIRE_LISTA, paddingHorizontal: MARGEN_PANTALLA, paddingBottom: abajo },
  }), [onScroll, abajo]);

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

  // En Ejercicios la linea del contador lleva el interruptor a la derecha y no queda sitio
  // para la frase «Sin conexión»: ahi solo se ve la palomita, junto a la unidad.
  const sinConexion = desbloqueada ? (
    <View style={s.sinConexion} accessible accessibilityLabel="Sin conexión">
      <Ionicons name="checkmark" size={14} color={paleta.magnesia2} />
      {!esEjercicios && <Text style={s.sinConexionTexto}>Sin conexión</Text>}
    </View>
  ) : undefined;
  const derecha = esEjercicios ? (
    <InterruptorDos
      opciones={TEXTOS_INTERRUPTOR} etiquetas={ETIQUETAS_INTERRUPTOR}
      indice={soloMios ? 0 : 1} onCambio={i => setSoloMios(i === 0)}
    />
  ) : sinConexion;

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
      <EncabezadoExplorar y={y} foco={foco}>
        <View style={s.margen}>
          <BuscadorVivo valor={q} onCambio={setQ} foco={foco} />
        </View>
        <View style={{ marginTop: SEP_SEGMENTOS }}>
          <SegmentosIndicador segmentos={SEGMENTOS} activo={tab} onCambio={irATab} />
        </View>
        {esEjercicios ? (
          <View style={{ paddingTop: SEPARACION_FILAS, gap: SEPARACION_FILAS }}>
            <FilaChips alto={ALTO_FILA_CATEGORIA}>
              {[{ id: null, nombre: 'Todo' }, ...CATEGORIAS].map(c => (
                <ChipCategoria
                  key={c.id ?? 'todo'} texto={c.nombre} activo={cat === c.id} onPress={() => setCat(c.id)}
                />
              ))}
            </FilaChips>
            <FilaChips alto={ALTO_FILA_OBJETIVO}>{chipsObjetivo}</FilaChips>
          </View>
        ) : tab !== 'musculos' ? (
          <View style={{ paddingTop: SEPARACION_FILAS }}>
            <FilaChips alto={ALTO_FILA_OBJETIVO}>{chipsObjetivo}</FilaChips>
          </View>
        ) : null}
        <View style={[s.margen, { marginTop: SEP_CONTADOR }]}>
          <ContadorResultados
            cuantos={cuantos} singular={UNIDADES[tab][0]} plural={UNIDADES[tab][1]}
            junto={esEjercicios ? sinConexion : undefined} derecha={derecha}
          />
        </View>
      </EncabezadoExplorar>

      <View style={s.contenido}>
        <Animated.View key={tab} style={s.pantalla} entering={entradaSegmento} exiting={salidaSegmento}>
          {tab === 'ejercicios' && (
            <ListaEjercicios
              ejercicios={ejercicios} propsLista={propsLista} favorito={favorito('ejercicios')}
              onFav={onFavEjercicio} onPress={onPressEjercicio}
            />
          )}
          {tab === 'rutinas' && (
            <ListaRutinas
              rutinas={rutinas} cabecera={cabeceraRutinas} propsLista={propsLista} scrollY={y} favorito={favorito('rutinas')}
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
              musculos={musculos} propsLista={propsLista} scrollY={y}
              onPress={id => navigation.navigate('Musculo', { id })}
            />
          )}
        </Animated.View>
      </View>

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
  contenido: { flex: 1 },
  pantalla: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  margen: { marginHorizontal: MARGEN_PANTALLA },
  sinConexion: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sinConexionTexto: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
});
