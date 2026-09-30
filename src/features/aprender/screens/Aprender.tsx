/**
 * FORJA · Aprender
 *
 * Tips, mitos, alimentacion y glosario. Los datos, la busqueda, las categorias, los favoritos y las
 * rutas son los de siempre (ver `docs/FUNCIONALIDAD.md`, seccion 20); lo que cambia es la
 * presentacion. La cabecera (titulo que se encoge, buscador, segmentos y, en Tips, las categorias)
 * es la de Explorar: opaca y fija, fuera de la lista y en el flujo normal del layout, sin cambiar
 * de alto. Las listas van justo debajo, con un aire fijo de 16 px antes de la primera fila. Cada
 * segmento monta su propia vista; al cambiar, la vieja sale y la nueva entra desde el lado del
 * segmento elegido.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ParamListBase } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { useHuecoAbajo } from '@/ui/components';
import { seguirBarra } from '@/ui/components/cabecera';
import { barraBajada } from '@/ui/hooks/useBarraFlotante';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { MuroCategoria, Intersticial } from '@/ui/components/Anuncio';
import { TIPS, SALAS, tipsCompletos } from '@/data/catalog';
import { MITOS, GLOSARIO, FAQ } from '@/data/aprender';
import { useEstadoSel, useFavoritos } from '@/state/store';
import { alternarFavorito, registrarDescarga } from '@/state/acciones';
import { RUTA_DE_RELACIONADO, nombreDeSala, type RelacionadoVista } from '@/lib/aprender';
import { BuscadorVivo } from '@/ui/components/BuscadorVivo';
import { SegmentosIndicador } from '@/ui/components/SegmentosIndicador';
import { ChipCategoria } from '@/ui/components/ChipCategoria';
import { FilaChips, ALTO_FILA_CATEGORIA, SEPARACION_FILAS } from '@/ui/components/EncabezadoFiltrosColapsable';
import { EncabezadoExplorar, SEP_SEGMENTOS } from '@/ui/components/EncabezadoExplorar';
import { transicionesDeSegmento, type PropsLista } from '@/ui/components/listaBase';
import { ListaTips } from '@/features/aprender/components/ListaTips';
import { ListaMitos } from '@/features/aprender/components/ListaMitos';
import { VistaAlimentacion } from '@/features/aprender/components/VistaAlimentacion';
import { VistaGlosario } from '@/features/aprender/components/VistaGlosario';

type SegmentoAprender = 'tips' | 'mitos' | 'nutricion' | 'glosario';

const SEGMENTOS: readonly { id: SegmentoAprender; texto: string }[] = [
  { id: 'tips', texto: 'Tips' }, { id: 'mitos', texto: 'Mitos' },
  { id: 'nutricion', texto: 'Alimentación' }, { id: 'glosario', texto: 'Glosario' },
];
const AIRE_LISTA = 16;
const BAJADA_BARRA_MS = 180;

export default function Aprender({ navigation }: BottomTabScreenProps<ParamListBase, 'Aprender'>) {
  const abajo = useHuecoAbajo();
  const reducido = useReducedMotion();
  const desbloqueada = useEstadoSel(e => e.descargas.includes('aprender'));
  const favoritosTips = useFavoritos('tips');
  const [tab, setTab] = useState<SegmentoAprender>('tips');
  const [sala, setSala] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [verAnuncio, setVerAnuncio] = useState(false);

  const y = useSharedValue(0);
  const previo = useSharedValue(0);
  const bajando = useSharedValue(0);
  const foco = useSharedValue(0);
  const sentido = useSharedValue(1);

  /** Una vista nueva empieza arriba: sin scroll y con la barra de pestanas en su sitio. */
  const reiniciarScroll = () => {
    y.set(0); previo.set(0); bajando.set(0);
    barraBajada.set(withTiming(0, { duration: BAJADA_BARRA_MS }));
  };

  const irATab = (id: SegmentoAprender) => {
    if (id === tab) return;
    const indice = (s: SegmentoAprender) => SEGMENTOS.findIndex(x => x.id === s);
    sentido.set(indice(id) > indice(tab) ? 1 : -1);
    reiniciarScroll();
    setTab(id);
  };

  const onScroll = useAnimatedScrollHandler(e => {
    y.set(e.contentOffset.y);
    seguirBarra(e.contentOffset.y, previo, bajando);
  });

  const todos = useMemo(() => tipsCompletos(), []);
  const tips = useMemo(() => {
    const t = q.trim().toLowerCase();
    return todos.filter(x =>
      (!sala || x.sala === sala) &&
      (!t || x.titulo.toLowerCase().includes(t) || x.cuerpo.toLowerCase().includes(t)));
  }, [todos, sala, q]);

  const mitos = useMemo(() => {
    const t = q.trim().toLowerCase();
    return MITOS.filter(m => !t || m.titulo.toLowerCase().includes(t));
  }, [q]);

  const glosario = useMemo(() => {
    const t = q.trim().toLowerCase();
    return GLOSARIO.filter(g => !t || g.termino.toLowerCase().includes(t) || g.def.toLowerCase().includes(t));
  }, [q]);

  // Referencias estables: cada tecla en el buscador vuelve a pintar la pantalla y sin esto se
  // invalidaria el memo de cada tarjeta.
  const onPressTip = useCallback((id: string) => navigation.navigate('Tip', { id }), [navigation]);
  const onFavTip = useCallback((id: string) => alternarFavorito('tips', id), []);
  const favoritoTip = useCallback((id: string) => favoritosTips.includes(id), [favoritosTips]);
  const onPressMito = useCallback((id: string) => navigation.navigate('Mito', { id }), [navigation]);
  const onAbrirRelacionado = useCallback(
    (r: RelacionadoVista) => navigation.navigate(RUTA_DE_RELACIONADO[r.tipo], { id: r.id }), [navigation],
  );

  const { entrada: entradaSegmento, salida: salidaSegmento } = useMemo(
    () => transicionesDeSegmento(reducido, sentido), [reducido, sentido],
  );

  const propsLista = useMemo<PropsLista>(() => ({
    onScroll,
    contentContainerStyle: { paddingTop: AIRE_LISTA, paddingHorizontal: MARGEN_PANTALLA, paddingBottom: abajo },
  }), [onScroll, abajo]);

  const sinConexion = desbloqueada ? (
    <View style={s.sinConexion} accessible accessibilityLabel="Sin conexión">
      <Ionicons name="checkmark" size={14} color={paleta.magnesia2} />
      <Text style={s.sinConexionTexto}>Sin conexión</Text>
    </View>
  ) : undefined;

  return (
    <View style={s.raiz}>
      <EncabezadoExplorar y={y} foco={foco} titulo="Aprender" extraTitulo={sinConexion}>
        <View style={s.margen}>
          <BuscadorVivo valor={q} onCambio={setQ} foco={foco} placeholder="Buscar" />
        </View>
        <View style={{ marginTop: SEP_SEGMENTOS }}>
          <SegmentosIndicador segmentos={SEGMENTOS} activo={tab} onCambio={irATab} />
        </View>
        {tab === 'tips' && (
          <View style={{ paddingTop: SEPARACION_FILAS }}>
            <FilaChips alto={ALTO_FILA_CATEGORIA}>
              {[{ id: null, nombre: 'Todas' }, ...SALAS.map(x => ({ id: x.id, nombre: nombreDeSala(x.id) }))].map(c => (
                <ChipCategoria
                  key={c.id ?? 'todas'} texto={c.nombre} activo={sala === c.id}
                  onPress={() => setSala(sala === c.id ? null : c.id)}
                />
              ))}
            </FilaChips>
          </View>
        )}
      </EncabezadoExplorar>

      <View style={s.contenido}>
        <Animated.View key={tab} style={s.pantalla} entering={entradaSegmento} exiting={salidaSegmento}>
          {tab === 'tips' && (
            <ListaTips tips={tips} propsLista={propsLista} favorito={favoritoTip} onFav={onFavTip} onPress={onPressTip} />
          )}
          {tab === 'mitos' && (
            <ListaMitos mitos={mitos} propsLista={propsLista} onPress={onPressMito} onAbrirRelacionado={onAbrirRelacionado} />
          )}
          {tab === 'nutricion' && <VistaAlimentacion propsLista={propsLista} scrollY={y} />}
          {tab === 'glosario' && (
            <VistaGlosario
              terminos={glosario} preguntas={FAQ} propsLista={propsLista} scrollY={y} rellenoSuperior={AIRE_LISTA}
            />
          )}
        </Animated.View>
      </View>

      <MuroCategoria
        visible={!desbloqueada}
        categoria="todo el contenido"
        cuantos={TIPS.length + MITOS.length}
        onVerAnuncio={() => setVerAnuncio(true)}
        onVolver={() => navigation.navigate('Hoy')}
      />
      <Intersticial
        visible={verAnuncio}
        motivo="desbloqueando contenido"
        onCerrar={() => { setVerAnuncio(false); registrarDescarga('aprender'); }}
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
