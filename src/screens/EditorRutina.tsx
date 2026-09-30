/**
 * FORJA · editor de rutinas
 *
 * El usuario arma su propia rutina: elige ejercicios del catalogo y define
 * series, repeticiones o segundos y descanso de cada uno.
 *
 * Tres decisiones:
 *
 * 1. Los avisos no bloquean. Si mete un ejercicio que carga una lesion que
 *    el mismo declaro, se lo decimos, pero la rutina es suya y decide el.
 *    Distinto de las sesiones que genera la app, donde el filtro es duro:
 *    ahi elegimos nosotros, aqui elige el.
 *
 * 2. Se guarda solo al tocar Guardar. Un editor que persiste cada tecla
 *    deja rutinas a medias por todos lados cuando alguien entra a mirar.
 *
 * 3. Armar una rutina es cargar una barra: cada ejercicio es una placa
 *    (`BarraRutina`). La barra y el resumen se quedan pegados arriba al bajar.
 *    Toda la logica es la de siempre (`docs/FUNCIONALIDAD.md` §16); lo nuevo es la
 *    presentacion, los errores en linea (antes eran alertas) y la hoja de descartar.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, FlatList, Pressable, KeyboardAvoidingView, Platform,
  AccessibilityInfo, type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, peso, paleta, familia, conAlfa, MARGEN_PANTALLA, haptico } from '@/theme';
import { Boton, Chip, Toque, Nota, Buscador, Vacio } from '@/components/ui';
import { ICONOS_OBJETIVO } from '@/components/ui/iconosObjetivo';
import { BotonPlaca } from '@/components/ui/BotonPlaca';
import { GomaTexture } from '@/components/fx/GomaTexture';
import { useMagnesia } from '@/components/fx/MagnesiaOverlay';
import Foto from '@/components/Foto';
import { useEstado, type RutinaPropia, type ItemPropio } from '@/store/store';
import {
  itemPropioPorDefecto, minutosPropios, revisarPropia,
} from '@/engine/session';
import {
  EJERCICIOS, porId, GOALS, CATEGORIAS, nombreEquipo, type Ejercicio,
} from '@/data/catalog';
import { plural } from '@/utils/plural';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { ChipFiltro } from '@/components/explore/ChipFiltro';
import { FilaChips } from '@/components/explore/EncabezadoFiltrosColapsable';
import { FilaCrear } from '@/components/explore/FilaCrear';
import { BarraRutina, ALTO_BARRA_COMPACTA } from '@/components/routine-builder/BarraRutina';
import { ResumenRutina, fraseResumen, ALTO_RESUMEN_COMPACTO } from '@/components/routine-builder/ResumenRutina';
import { CampoTitulo, TextoError } from '@/components/routine-builder/CampoTitulo';
import { TarjetaEjercicioRutina } from '@/components/routine-builder/TarjetaEjercicioRutina';
import { HojaDescartar } from '@/components/routine-builder/HojaDescartar';

const ALTO_FILA_OBJETIVO = 36;
const PADDING_PEGAJOSO = 8;
const ALTO_PEGAJOSO = 2 * PADDING_PEGAJOSO + ALTO_BARRA_COMPACTA + 4 + ALTO_RESUMEN_COMPACTO;
const APARICION_PEGAJOSO_PX = 24;
const AIRE_SCROLL = 12;
/** Lo que tarda en cerrarse el selector: el ejercicio elegido entra cuando ya se ve la pantalla. */
const CIERRE_SELECTOR_MS = 300;

interface Errores { nombre?: string; items?: string; intento: number }
interface Marca { id: string; n: number }

export default function EditorRutina({ route, navigation }: any) {
  const { estado, guardarRutinaPropia, nuevaRutinaPropia } = useEstado();
  const magnesia = useMagnesia();
  const reducido = useReducedMotion();
  const tick = useTick();

  const original = route.params?.id
    ? estado.rutinasPropias.find(r => r.id === route.params.id)
    : undefined;

  const [r, setR] = useState<RutinaPropia>(
    () => original ?? nuevaRutinaPropia({ objetivo: estado.perfil.objetivo }),
  );
  // Foto fija del arranque (crear en blanco o editar lo cargado), para
  // saber si hubo cambios reales antes de dejar salir sin avisar.
  const inicial = useRef(r).current;
  const salidaLibre = useRef(false);
  const [selector, setSelector] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<unknown>(null);
  const [errores, setErrores] = useState<Errores>({ intento: 0 });
  const [levantar, setLevantar] = useState(0);
  const [recien, setRecien] = useState<Marca>({ id: '', n: 0 });
  const [movida, setMovida] = useState<Marca>({ id: '', n: 0 });

  const scroll = useRef<Animated.ScrollView>(null);
  const botonCrear = useRef<View>(null);
  const montada = useRef(false);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendiente = useRef<string | null>(null);
  const medidas = useRef(new Map<string, { y: number; alto: number }>());
  const posiciones = useRef({ lista: 0, ejercicios: 0, vista: 0 });
  const y = useSharedValue(0);
  const umbral = useSharedValue(1e6);

  const minutos = useMemo(() => minutosPropios(r.items), [r.items]);
  const series = useMemo(() => r.items.reduce((a, x) => a + x.series, 0), [r.items]);
  const avisos = useMemo(() => revisarPropia(r.items, estado.perfil), [r.items, estado.perfil]);
  const hayCambios = useMemo(() => JSON.stringify(r) !== JSON.stringify(inicial), [r, inicial]);
  const frase = fraseResumen(r.items.length, series, minutos);
  const vacia = r.items.length === 0;

  // Clave estable por ejercicio (con el numero de repeticion si una rutina copiada lo trae dos veces):
  // asi reordenar mueve la tarjeta y su placa en lugar de recrearlas.
  const claves = useMemo(() => {
    const vistos = new Map<string, number>();
    return r.items.map(it => {
      const n = vistos.get(it.ejercicioId) ?? 0;
      vistos.set(it.ejercicioId, n + 1);
      return n ? `${it.ejercicioId}#${n}` : it.ejercicioId;
    });
  }, [r.items]);

  useEffect(() => { montada.current = true; }, []);
  useEffect(() => () => { if (espera.current) clearTimeout(espera.current); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (salidaLibre.current || !hayCambios) return;
      e.preventDefault();
      setAccionPendiente(e.data.action);
    });
    return unsubscribe;
  }, [navigation, hayCambios]);

  const alDesplazar = useAnimatedScrollHandler(e => { y.value = e.contentOffset.y; });

  const pegajoso = useAnimatedStyle(() => {
    const p = interpolate(y.value, [umbral.value - APARICION_PEGAJOSO_PX, umbral.value], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ translateY: reducido ? 0 : (1 - p) * -8 }] };
  }, [reducido, tick]);

  const set = (cambio: Partial<RutinaPropia>) => setR(prev => ({ ...prev, ...cambio }));

  const cambiarItem = (i: number, cambio: Partial<ItemPropio>) =>
    setR(prev => ({
      ...prev,
      items: prev.items.map((x, n) => (n === i ? { ...x, ...cambio } : x)),
    }));

  /** Si la tarjeta queda tapada por la cabecera pegajosa o por el borde de abajo, la lista se corre hasta ella. */
  const mostrar = (clave: string) => {
    const m = medidas.current.get(clave);
    const p = posiciones.current;
    if (!m || p.vista === 0) return;
    const arriba = m.y + p.lista;
    const abajo = arriba + m.alto;
    const actual = y.value;
    if (arriba < actual + ALTO_PEGAJOSO + AIRE_SCROLL) {
      scroll.current?.scrollTo({ y: Math.max(0, arriba - ALTO_PEGAJOSO - AIRE_SCROLL), animated: !reducido });
    } else if (abajo > actual + p.vista - AIRE_SCROLL) {
      scroll.current?.scrollTo({ y: abajo - p.vista + AIRE_SCROLL, animated: !reducido });
    }
  };

  const alMedir = (clave: string) => (yy: number, alto: number) => {
    medidas.current.set(clave, { y: yy, alto });
    if (pendiente.current !== clave) return;
    pendiente.current = null;
    requestAnimationFrame(() => mostrar(clave));
  };

  const mover = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= r.items.length) return;
    const copia = [...r.items];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    set({ items: copia });
    haptico.seleccion();
    setMovida(m => ({ id: claves[i], n: m.n + 1 }));
    pendiente.current = claves[i];
    AccessibilityInfo.announceForAccessibility(`Ejercicio movido a posición ${j + 1}`);
  };

  const quitar = (i: number) => {
    const quedan = r.items.length - 1;
    set({ items: r.items.filter((_, n) => n !== i) });
    AccessibilityInfo.announceForAccessibility(`Ejercicio quitado, ${quedan} ${plural(quedan, 'ejercicio', 'ejercicios')}`);
  };

  const anadir = (e: Ejercicio) => {
    setSelector(false);
    if (r.items.some(it => it.ejercicioId === e.id)) return;
    const nuevo = itemPropioPorDefecto(e);
    const total = r.items.length + 1;
    espera.current = setTimeout(() => {
      setR(prev => (prev.items.some(it => it.ejercicioId === e.id) ? prev : { ...prev, items: [...prev.items, nuevo] }));
      setRecien(m => ({ id: e.id, n: m.n + 1 }));
      setErrores(x => ({ ...x, items: undefined }));
      pendiente.current = e.id;
      AccessibilityInfo.announceForAccessibility(`Ejercicio agregado, ${total} ${plural(total, 'ejercicio', 'ejercicios')}`);
    }, CIERRE_SELECTOR_MS);
  };

  const celebrar = () => {
    haptico.aplauso();
    botonCrear.current?.measureInWindow((x, yy, w, h) => magnesia.aplaudir(x + w / 2, yy + h / 2));
  };

  const guardar = () => {
    const nombre = r.nombre.trim();
    if (!nombre) {
      setErrores(x => ({ nombre: 'Ponle nombre. Así la reconoces después en tu lista.', intento: x.intento + 1 }));
      scroll.current?.scrollTo({ y: 0, animated: !reducido });
      return;
    }
    if (r.items.length === 0) {
      setErrores(x => ({ items: 'Falta contenido. Agrega al menos un ejercicio.', intento: x.intento + 1 }));
      scroll.current?.scrollTo({ y: Math.max(0, posiciones.current.ejercicios - ALTO_PEGAJOSO), animated: !reducido });
      return;
    }
    salidaLibre.current = true;
    guardarRutinaPropia({ ...r, nombre });
    setLevantar(n => n + 1);
    celebrar();
    navigation.goBack();
  };

  const descartar = () => {
    const accion = accionPendiente;
    salidaLibre.current = true;
    setAccionPendiente(null);
    navigation.dispatch(accion);
  };

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <SafeAreaView style={s.llena} edges={['bottom']}>
        <KeyboardAvoidingView style={s.llena} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.ScrollView
            ref={scroll} onScroll={alDesplazar} scrollEventThrottle={16}
            onLayout={(e: LayoutChangeEvent) => { posiciones.current.vista = e.nativeEvent.layout.height; }}
            contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          >
            <View style={s.margen}>
              <Text style={s.etiquetaPantalla} accessibilityRole="header">
                {original ? 'Editar rutina' : 'Crear rutina'}
              </Text>
              <View style={s.campo}>
                <CampoTitulo
                  valor={r.nombre}
                  onCambio={t => { set({ nombre: t }); if (errores.nombre) setErrores(x => ({ ...x, nombre: undefined })); }}
                />
              </View>
              {errores.nombre ? <TextoError key={errores.intento} texto={errores.nombre} /> : null}
            </View>

            <Text style={[s.etiqueta, s.margen, s.separaObjetivo]}>Objetivo</Text>
            <View style={s.filaObjetivo}>
              <FilaChips alto={ALTO_FILA_OBJETIVO}>
                {GOALS.map(g => (
                  <ChipFiltro
                    key={g.id} texto={g.nombre} icono={ICONOS_OBJETIVO[g.id]} activo={r.objetivo === g.id}
                    onPress={() => set({ objetivo: g.id })}
                  />
                ))}
              </FilaChips>
            </View>

            <View
              style={[s.margen, s.bloqueBarra]}
              onLayout={(e: LayoutChangeEvent) => {
                umbral.value = e.nativeEvent.layout.y + e.nativeEvent.layout.height - ALTO_PEGAJOSO;
              }}
            >
              <BarraRutina ids={claves} etiqueta={`Rutina: ${frase}`} levantar={levantar} cargaInicial={!!route.params?.desdeCopia} />
              <View style={s.resumen}>
                <ResumenRutina ejercicios={r.items.length} series={series} minutos={minutos} />
              </View>
            </View>

            {avisos.length > 0 && (
              <View style={[s.margen, s.avisos]}>
                {avisos.map((a, i) => (
                  <Nota key={i} texto={a} tono="cuidado" titulo={i === 0 ? 'Revisa' : undefined} />
                ))}
              </View>
            )}

            <View
              style={[s.margen, s.tituloEjercicios]}
              onLayout={(e: LayoutChangeEvent) => { posiciones.current.ejercicios = e.nativeEvent.layout.y; }}
            >
              <Text style={s.titulo} accessibilityRole="header">Ejercicios</Text>
              {vacia && (
                <Text style={s.vacio}>Todavía no hay ninguno. Toca el botón de abajo para agregar el primero.</Text>
              )}
              {errores.items ? <TextoError key={errores.intento} texto={errores.items} /> : null}
            </View>

            <View
              style={[s.margen, s.lista]}
              onLayout={(e: LayoutChangeEvent) => { posiciones.current.lista = e.nativeEvent.layout.y; }}
            >
              {r.items.map((it, i) => {
                const e = porId.get(it.ejercicioId);
                if (!e) return null;
                const clave = claves[i];
                return (
                  <TarjetaEjercicioRutina
                    key={clave} item={it} ejercicio={e} indice={i} animarEntrada={montada.current}
                    impulso={movida.id === clave ? movida.n : 0} brillo={recien.id === clave ? recien.n : 0}
                    onCambio={cambio => cambiarItem(i, cambio)}
                    onMover={dir => mover(i, dir)}
                    onQuitar={() => quitar(i)}
                    onAbrir={() => navigation.navigate('Ejercicio', { id: e.id })}
                    alMedir={alMedir(clave)}
                  />
                );
              })}
            </View>

            <View style={[s.margen, s.agregar]}>
              <FilaCrear texto="Agregar ejercicio" pulsar={vacia} onPress={() => setSelector(true)} />
            </View>
          </Animated.ScrollView>

          <View style={s.pie}>
            <Pressable
              onPress={() => { haptico.toque(); navigation.goBack(); }}
              accessibilityRole="button" accessibilityLabel="Cancelar" style={s.cancelar}
            >
              <Text style={s.cancelarTexto} maxFontSizeMultiplier={1.15}>Cancelar</Text>
            </Pressable>
            <View ref={botonCrear} collapsable={false} style={s.crear}>
              <BotonPlaca texto={original ? 'Guardar cambios' : 'Crear rutina'} onPress={guardar} />
            </View>
          </View>
        </KeyboardAvoidingView>

        <Animated.View
          style={[s.pegajoso, pegajoso]} pointerEvents="none"
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        >
          <BarraRutina ids={claves} etiqueta={frase} compacta silenciosa />
          <View style={s.resumenPegajoso}>
            <ResumenRutina ejercicios={r.items.length} series={series} minutos={minutos} compacto />
          </View>
        </Animated.View>
      </SafeAreaView>

      <SelectorEjercicio
        visible={selector}
        yaPuestos={r.items.map(x => x.ejercicioId)}
        onElegir={anadir}
        onCerrar={() => setSelector(false)}
      />
      <HojaDescartar
        visible={accionPendiente !== null}
        onDescartar={descartar}
        onSeguir={() => setAccionPendiente(null)}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */

function SelectorEjercicio({ visible, yaPuestos, onElegir, onCerrar }: {
  visible: boolean; yaPuestos: string[];
  onElegir: (e: Ejercicio) => void; onCerrar: () => void;
}) {
  const { estado } = useEstado();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [soloMios, setSoloMios] = useState(true);

  const equipo = useMemo(
    () => new Set([...estado.perfil.equipo, 'ninguno', 'pared', 'silla']),
    [estado.perfil.equipo],
  );

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return EJERCICIOS.filter(e => {
      if (t && !(e.name.toLowerCase().includes(t) || (e.name_en ?? '').toLowerCase().includes(t))) return false;
      if (cat && e.category !== cat) return false;
      if (soloMios && !e.equipment.every(x => equipo.has(x))) return false;
      return true;
    });
  }, [q, cat, soloMios, equipo]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
        <View style={{ padding: esp.md, gap: esp.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[tipo.h2, { color: color.texto, flex: 1 }]}>Agregar ejercicio</Text>
            <Pressable onPress={onCerrar} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Text style={[tipo.dato, { color: color.textoSuave }]}>Cerrar</Text>
            </Pressable>
          </View>
          <Buscador valor={q} onCambio={setQ} placeholder="Buscar entre 190 ejercicios" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: esp.xs }}>
            {[{ id: null, nombre: 'Todo' }, ...CATEGORIAS].map((c, i) => (
              <Chip key={i} texto={c.nombre} pequeno activo={cat === c.id}
                onPress={() => setCat(c.id as string | null)} />
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: esp.xs }}>
            <Pressable
              onPress={() => setSoloMios(true)}
              accessibilityRole="radio"
              accessibilityState={{ selected: soloMios }}
              accessibilityLabel="Solo con mi equipo"
              style={[s.segmento, soloMios && s.segmentoActivo]}
            >
              <Text style={[tipo.micro, {
                fontFamily: soloMios ? peso.bold : peso.semibold,
                color: soloMios ? color.sobreOscuro : color.textoSuave,
              }]}>Solo con mi equipo</Text>
            </Pressable>
            <Pressable
              onPress={() => setSoloMios(false)}
              accessibilityRole="radio"
              accessibilityState={{ selected: !soloMios }}
              accessibilityLabel="Catálogo completo"
              style={[s.segmento, !soloMios && s.segmentoActivo]}
            >
              <Text style={[tipo.micro, {
                fontFamily: !soloMios ? peso.bold : peso.semibold,
                color: !soloMios ? color.sobreOscuro : color.textoSuave,
              }]}>Catálogo completo</Text>
            </Pressable>
          </View>
          <Text style={[tipo.pie, { color: color.textoSuave }]}>
            Mostrando {lista.length} {lista.length === 1 ? 'ejercicio' : 'ejercicios'}
            {soloMios ? ' para tu equipo' : ''}
          </Text>
        </View>

        <FlatList
          data={lista}
          keyExtractor={e => e.id}
          contentContainerStyle={{ paddingHorizontal: esp.md, paddingBottom: esp.xl }}
          initialNumToRender={14}
          ListEmptyComponent={soloMios ? (
            <View style={{ alignItems: 'center', gap: esp.sm }}>
              <Vacio texto="Nada con tu equipo actual." />
              <Boton texto="Ver catálogo completo" variante="contorno" onPress={() => setSoloMios(false)} />
            </View>
          ) : <Vacio texto="Nada con esa búsqueda." />}
          renderItem={({ item }) => (
            <FilaSelector item={item} puesto={yaPuestos.includes(item.id)} onElegir={onElegir} />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

/** Memoizada: la busqueda re-renderiza el selector en cada tecla sobre las
 *  190 filas posibles; `onElegir` llega estable desde el padre. */
const FilaSelector = React.memo(function FilaSelector({ item, puesto, onElegir }: {
  item: Ejercicio; puesto: boolean; onElegir: (e: Ejercicio) => void;
}) {
  return (
    <Toque onPress={puesto ? undefined : () => onElegir(item)} estilo={s.filaSelector as never}>
      <Foto tipo="ejercicio" id={item.id} nombre={item.name} alto={50} ancho={50} />
      <View style={{ flex: 1, opacity: puesto ? 0.5 : 1 }}>
        <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[tipo.pie, { color: color.textoSuave }]} numberOfLines={1}>
          {nombreEquipo(item.equipment)} · nivel {item.level}
        </Text>
      </View>
      {puesto
        ? <Text style={[tipo.micro, { color: color.textoTenue }]}>ya está</Text>
        : <Text style={{ color: color.acento, fontSize: 20 }}>+</Text>}
    </Toque>
  );
});

/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  llena: { flex: 1 },
  contenido: { paddingTop: 8, paddingBottom: 24 },
  margen: { marginHorizontal: MARGEN_PANTALLA },
  etiquetaPantalla: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
  campo: { marginTop: 4 },
  etiqueta: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  separaObjetivo: { marginTop: 24 },
  filaObjetivo: { marginTop: 8 },
  bloqueBarra: { marginTop: 24 },
  resumen: { marginTop: 12 },
  avisos: { marginTop: 16 },
  tituloEjercicios: { marginTop: 32 },
  titulo: { ...tipo.h1, color: paleta.magnesia },
  vacio: { ...tipo.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2, marginTop: 8 },
  lista: { marginTop: 12, gap: 12 },
  agregar: { marginTop: 12 },
  pie: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: MARGEN_PANTALLA, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: paleta.gomaBorde, backgroundColor: paleta.goma,
  },
  cancelar: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  cancelarTexto: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia2 },
  crear: { flex: 1 },
  pegajoso: {
    position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: MARGEN_PANTALLA, paddingVertical: PADDING_PEGAJOSO,
    backgroundColor: conAlfa(paleta.goma, 0.92), borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde,
  },
  resumenPegajoso: { marginTop: 4 },
  filaSelector: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm, paddingVertical: esp.sm,
    borderBottomWidth: 1, borderBottomColor: color.borde,
  },
  segmento: {
    minHeight: 24, justifyContent: 'center', paddingHorizontal: esp.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: color.borde, backgroundColor: color.velo,
    borderRadius: radio.pastilla,
  },
  segmentoActivo: { backgroundColor: color.carbon, borderColor: color.carbon },
});
