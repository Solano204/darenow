import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, type View } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import { haptico } from '@/ui/theme';
import { useMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { useEstado, type RutinaPropia, type ItemPropio } from '@/state/store';
import { itemPropioPorDefecto, minutosPropios, revisarPropia } from '@/lib/engine/session';
import type { EjercicioIndice } from '@/data/catalog';
import { plural } from '@/lib/plural';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { ALTO_BARRA_COMPACTA } from '@/ui/components/BarraRutina';
import { fraseResumen, ALTO_RESUMEN_COMPACTO } from '@/features/rutinas/components/ResumenRutina';
import type { NavigationAction, ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export const PADDING_PEGAJOSO = 8;
export const ALTO_PEGAJOSO = 2 * PADDING_PEGAJOSO + ALTO_BARRA_COMPACTA + 4 + ALTO_RESUMEN_COMPACTO;
const APARICION_PEGAJOSO_PX = 24;
const AIRE_SCROLL = 12;
/** Lo que tarda en cerrarse el selector: el ejercicio elegido entra cuando ya se ve la pantalla. */
const CIERRE_SELECTOR_MS = 300;

interface Errores { nombre?: string; items?: string; intento: number }
interface Marca { id: string; n: number }

/** Lo que recibe «EditorRutina»: `id` de la rutina a editar y si viene de duplicar una del catalogo. */
export type PropsEditorRutina = NativeStackScreenProps<
  ParamListBase & { EditorRutina: { id?: string; desdeCopia?: boolean } | undefined }, 'EditorRutina'
>;

/**
 * El estado del editor de rutinas: la rutina en edicion, los errores en linea, la cabecera
 * pegajosa, el desplazamiento hasta la tarjeta tocada, el selector y la hoja de descartar.
 * La pantalla (`EditorRutina`) solo dibuja.
 */
export function useEditorRutina(
  route: PropsEditorRutina['route'], navigation: PropsEditorRutina['navigation'],
) {
  const { estado, guardarRutinaPropia, nuevaRutinaPropia } = useEstado();
  const magnesia = useMagnesia();
  const reducido = useReducedMotion();
  const tick = useTick();

  const original = route.params?.id
    ? estado.rutinasPropias.find(r => r.id === route.params?.id)
    : undefined;

  const [r, setR] = useState<RutinaPropia>(
    () => original ?? nuevaRutinaPropia({ objetivo: estado.perfil.objetivo }),
  );
  // Foto fija del arranque (crear en blanco o editar lo cargado), para
  // saber si hubo cambios reales antes de dejar salir sin avisar.
  const inicial = useRef(r).current;
  const salidaLibre = useRef(false);
  const [selector, setSelector] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<NavigationAction | null>(null);
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
    const unsubscribe = navigation.addListener('beforeRemove', e => {
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

  const anadir = (e: EjercicioIndice) => {
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
    navigation.dispatch(accion!);
  };


  return {
    original, r, set, errores, setErrores, claves, frase, levantar, series, minutos, avisos, vacia,
    posiciones, umbral, scroll, alDesplazar, pegajoso, montada, movida, recien, cambiarItem, mover, quitar, alMedir,
    selector, setSelector, anadir, botonCrear, guardar, accionPendiente, setAccionPendiente, descartar,
  };
}
