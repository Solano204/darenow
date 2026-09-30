import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, type ParamListBase } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { useHuecoAbajo } from '@/ui/components';
import { seguirBarra } from '@/ui/components/cabecera';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';
import { barraBajada } from '@/ui/hooks/useBarraFlotante';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { EJERCICIOS, RUTINAS, PROGRAMAS, MUSCULOS, GOALS } from '@/data/catalog';
import { useEstado } from '@/state/store';
import { ChipFiltro } from '@/ui/components/ChipFiltro';
import { InterruptorDos } from '@/features/explorar/components/InterruptorDos';
import { type SegmentoExplorar } from '@/ui/components/EncabezadoExplorar';
import { CabeceraRutinas } from '@/features/explorar/components/CabeceraRutinas';
import { transicionesDeSegmento, type PropsLista } from '@/ui/components/listaBase';

export const SEGMENTOS: readonly { id: SegmentoExplorar; texto: string }[] = [
  { id: 'ejercicios', texto: 'Ejercicios' }, { id: 'rutinas', texto: 'Rutinas' },
  { id: 'programas', texto: 'Programas' }, { id: 'musculos', texto: 'Músculos' },
];
const TEXTOS_INTERRUPTOR = ['Puedo hacer', 'Catálogo'] as const;
const ETIQUETAS_INTERRUPTOR = ['Lo que puedo hacer', 'Catálogo completo'] as const;

const AIRE_LISTA = 16;
const RETRASO_CONTEO_MS = 350;
const BAJADA_BARRA_MS = 180;

/** La logica de `Explorar`: estado, datos derivados y manejadores. La pantalla solo dibuja. */
export function useExplorar({ navigation, route }: BottomTabScreenProps<ParamListBase, 'Explorar'>) {
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


  return {
    alternarFavorito, registrarDescarga, tab, q, setQ, cat, setCat, verAnuncio, setVerAnuncio, y,
    foco, esEjercicios, irATab, desbloqueada, ejercicios, rutinas, programas, musculos, cuantos,
    onPressEjercicio, onFavEjercicio, favorito, entradaSegmento, salidaSegmento, propsLista,
    chipsObjetivo, sinConexion, derecha, cabeceraRutinas,
  };
}

const s = StyleSheet.create({
  sinConexion: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sinConexionTexto: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
});
