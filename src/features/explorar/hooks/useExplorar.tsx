import React, { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, type ParamListBase } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { useHuecoAbajo } from '@/ui/components';
import { seguirBarra } from '@/ui/components/cabecera';
import { barraBajada } from '@/ui/hooks/useBarraFlotante';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useEstadoSel, useRutinasPropias } from '@/state/store';
import { registrarDescarga } from '@/state/acciones';
import { InterruptorMios } from '@/features/explorar/components/FiltrosExplorar';
import { filtros } from '@/features/explorar/hooks/filtrosExplorar';
import { type SegmentoExplorar } from '@/ui/components/EncabezadoExplorar';
import { CabeceraRutinas } from '@/features/explorar/components/CabeceraRutinas';
import { transicionesDeSegmento, type PropsLista } from '@/ui/components/listaBase';

export const SEGMENTOS: readonly { id: SegmentoExplorar; texto: string }[] = [
  { id: 'ejercicios', texto: 'Ejercicios' }, { id: 'rutinas', texto: 'Rutinas' },
  { id: 'programas', texto: 'Programas' }, { id: 'musculos', texto: 'Músculos' },
];

const AIRE_LISTA = 16;
const RETRASO_CONTEO_MS = 350;
const BAJADA_BARRA_MS = 180;

/** La logica de `Explorar`: estado, datos derivados y manejadores. La pantalla solo dibuja. */
export function useExplorar({ navigation, route }: BottomTabScreenProps<ParamListBase, 'Explorar'>) {
  const abajo = useHuecoAbajo();
  const reducido = useReducedMotion();
  const rutinasPropias = useRutinasPropias();
  const descargas = useEstadoSel(e => e.descargas);
  const parametro = (route.params as { tab?: SegmentoExplorar } | undefined)?.tab;
  const [tab, setTab] = useState<SegmentoExplorar>(parametro ?? 'ejercicios');
  const [verAnuncio, setVerAnuncio] = useState(false);

  const y = useSharedValue(0);
  const previo = useSharedValue(0);
  const bajando = useSharedValue(0);
  const foco = useSharedValue(0);
  const sentido = useSharedValue(1);

  const esEjercicios = tab === 'ejercicios';

  /** Una lista nueva empieza arriba: sin scroll y con la barra de pestanas en su sitio. */
  const reiniciarScroll = () => {
    y.set(0); previo.set(0); bajando.set(0);
    barraBajada.set(withTiming(0, { duration: BAJADA_BARRA_MS }));
  };

  const irATab = (id: SegmentoExplorar) => {
    if (id === tab) return;
    const indice = (s: SegmentoExplorar) => SEGMENTOS.findIndex(x => x.id === s);
    sentido.set(indice(id) > indice(tab) ? 1 : -1);
    reiniciarScroll();
    setTab(id);
  };

  // La pestana ya montada ignoraba el parametro nuevo, asi que "Ver todas"
  // desde programas siempre acababa en ejercicios. Ahora se escucha el
  // cambio de parametros (solo el parametro: `irATab` lee la pestaña actual al correr).
  const irAParametro = useEffectEvent((p: SegmentoExplorar) => { if (p !== tab) irATab(p); });
  useEffect(() => {
    // Excepcion documentada (R4): el cambio de pestaña llega de fuera (la navegacion) y mueve
    // valores compartidos del scroll, que no se pueden tocar durante el render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (parametro) irAParametro(parametro);
  }, [parametro]);

  const onScroll = useAnimatedScrollHandler(e => {
    y.set(e.contentOffset.y);
    seguirBarra(e.contentOffset.y, previo, bajando);
  });

  const desbloqueada = descargas.includes(tab);

  // Los filtros viven en su store (filtrosExplorar.ts); al salir de Explorar vuelven a empezar.
  useEffect(() => filtros.reiniciar, []);

  // Referencias estables (reciben el id): si no, cada tecla en el buscador crea una funcion
  // nueva por fila e invalida el memo de las filas. El favorito lo lee cada estrella.
  const onPressEjercicio = useCallback(
    (id: string) => navigation.navigate('Ejercicio', { id }), [navigation]);
  const onPressRutina = useCallback((id: string) => navigation.navigate('Rutina', { id }), [navigation]);
  const onPressPrograma = useCallback((id: string) => navigation.navigate('Programa', { id }), [navigation]);

  // Rutinas propias recien creadas o editadas: al volver a la pestana, su fila entra y se
  // ilumina. Se reconocen por identidad (guardar una rutina crea un objeto nuevo).
  const vistas = useRef(new Map(rutinasPropias.map(r => [r.id, r])));
  const [destacadas, setDestacadas] = useState<Record<string, number>>({});
  const [conteoGrupo, setConteoGrupo] = useState(rutinasPropias.length);
  useFocusEffect(useCallback(() => {
    const propias = rutinasPropias;
    const nuevas = propias.filter(r => vistas.current.get(r.id) !== r);
    vistas.current = new Map(propias.map(r => [r.id, r]));
    if (nuevas.length > 0) {
      setDestacadas(d => ({ ...d, ...Object.fromEntries(nuevas.map(r => [r.id, (d[r.id] ?? 0) + 1])) }));
    }
    const id = setTimeout(() => setConteoGrupo(propias.length), RETRASO_CONTEO_MS);
    return () => clearTimeout(id);
  }, [rutinasPropias]));

  const { entrada: entradaSegmento, salida: salidaSegmento } = useMemo(
    () => transicionesDeSegmento(reducido, sentido), [reducido, sentido],
  );

  const propsLista = useMemo<PropsLista>(() => ({
    onScroll,
    contentContainerStyle: { paddingTop: AIRE_LISTA, paddingHorizontal: MARGEN_PANTALLA, paddingBottom: abajo },
  }), [onScroll, abajo]);

  // En Ejercicios la linea del contador lleva el interruptor a la derecha y no queda sitio
  // para la frase «Sin conexión»: ahi solo se ve la palomita, junto a la unidad.
  const sinConexion = desbloqueada ? (
    <View style={s.sinConexion} accessible accessibilityLabel="Sin conexión">
      <Ionicons name="checkmark" size={14} color={paleta.magnesia2} />
      {!esEjercicios && <Text style={s.sinConexionTexto}>Sin conexión</Text>}
    </View>
  ) : undefined;
  const derecha = esEjercicios ? <InterruptorMios /> : sinConexion;

  const cabeceraRutinas = (
    <CabeceraRutinas
      propias={rutinasPropias} conteo={conteoGrupo} destacadas={destacadas}
      onCrear={() => navigation.navigate('EditorRutina')}
      onAbrir={id => navigation.navigate('RutinaPropia', { id })}
      onEditar={id => navigation.navigate('EditorRutina', { id })}
    />
  );


  return {
    registrarDescarga, tab, verAnuncio, setVerAnuncio, y,
    foco, esEjercicios, irATab, desbloqueada,
    onPressEjercicio, onPressRutina, onPressPrograma, entradaSegmento, salidaSegmento, propsLista,
    sinConexion, derecha, cabeceraRutinas,
  };
}

const s = StyleSheet.create({
  sinConexion: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sinConexionTexto: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
});
