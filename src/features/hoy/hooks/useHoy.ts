import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { haptico } from '@/ui/theme';
import { useHuecoAbajo, useScrollCabecera } from '@/ui/components';
import { ALTO_HEADER } from '@/ui/fx/HeaderColapsable';
import { useMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { type RutinaHoy } from '@/features/hoy/components/TarjetaRutina';
import {
  useEstadoSel, usePerfil, useSesiones, useRutinasPropias, estadisticas, ultimos7, hoy, imagenRutina, ultimaVezEn,
} from '@/state/store';
import { alternarFavorito } from '@/state/acciones';
import { armarSesion, sesionDeRutina, minutosPropios, type Perfil } from '@/lib/engine/session';
import {
  RUTINAS, PROGRAMAS, EJERCICIOS, MUSCULOS, TIPS, programaPorId, nombreGoal,
} from '@/data/catalog';
import { mark as perfMark } from '@/dev/perfMarks'; // perf:R1

const DURACION_REFRESCO_MS = 700;
const ID_RUTINA_CINCO_MIN = 'rt_030';

/** La logica de `Hoy`: estado, datos derivados y manejadores. La pantalla solo dibuja. */
export function useHoy({ navigation }: { navigation: NavigationProp<ParamListBase> }) {
  const abajo = useHuecoAbajo();
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const magnesia = useMagnesia();
  const { y, onScroll } = useScrollCabecera();
  const perfil = usePerfil();
  const sesiones = useSesiones();
  const racha = useEstadoSel(e => e.racha);
  const favoritos = useEstadoSel(e => e.favoritos);
  const semanaPrograma = useEstadoSel(e => e.semanaPrograma);
  const rutinasPropias = useRutinasPropias();
  const esFavorito = (tipo: keyof typeof favoritos, id: string) => (favoritos[tipo] ?? []).includes(id);
  // El «la ultima vez» de cada ejercicio sale de las sesiones: cambia cuando se guarda una.
  const ultimaVezDe = useCallback((id: string) => ultimaVezEn(sesiones, id), [sesiones]);

  const [fecha, setFecha] = useState(hoy());
  const [refrescando, setRefrescando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);
  useEffect(() => { requestAnimationFrame(() => perfMark('hoy-interactive')); }, []); // perf:R1

  const perfilMotor: Perfil = perfil;
  const stats = useMemo(() => estadisticas(sesiones), [sesiones]);
  const semana = useMemo(() => ultimos7(sesiones), [sesiones]);
  const sesionesHoy = sesiones.filter(s => s.fecha === hoy()).length;
  const entrenoHoy = sesionesHoy > 0;
  const programa = programaPorId.get(perfil.programaId);

  const semilla = useMemo(() => {
    let h = 2166136261; const s = fecha + perfil.objetivo;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }, [perfil.objetivo, fecha]);

  const sesion = useMemo(
    () => armarSesion(perfilMotor, semilla, ultimaVezDe),
    [perfilMotor, semilla, ultimaVezDe],
  );

  // Avisos derivados en la pantalla, sin tocar el motor: si el resultado
  // quedo mas corto de lo pedido, se dice en una linea; nunca se ofrece
  // una sesion mas larga de lo que el usuario declaro que tiene.
  const avisosSesion = useMemo(() => {
    const out = [...sesion.avisos];
    if (sesion.minutosEstimados < perfil.minPorSesion - 1) {
      out.push(`Ajustamos tu sesión a los ${sesion.minutosEstimados} minutos que tienes.`);
    }
    return out;
  }, [sesion, perfil.minPorSesion]);

  const sinEjercicios = sesion.items.length === 0;

  // Las rutinas propias van primero: si el usuario se tomo el trabajo de
  // armarlas, son lo que mas probablemente quiere abrir.
  const rutinas = useMemo<RutinaHoy[]>(() => {
    const mias = rutinasPropias.map(r => ({
      id: r.id, nombre: r.nombre, min: minutosPropios(r.items), mia: true,
      imagenId: imagenRutina(r.id, r.imagenId), ejercicios: r.items.length,
      hecha: sesiones.some(s => s.rutinaId === r.id),
    }));
    const catalogo = RUTINAS
      .filter(r => (r.goal === perfil.objetivo || r.min <= 15))
      .filter(r => !perfil.modoSinSaltos || r.modo_sin_saltos)
      .map(r => ({ id: r.id, nombre: r.name, min: r.min, mia: false, subtitulo: nombreGoal(r.goal) }));
    return [...mias, ...catalogo].slice(0, 4);
  }, [rutinasPropias, sesiones, perfil.objetivo, perfil.modoSinSaltos]);

  // Primero los del objetivo activo, luego el resto, sin repetir ninguno.
  const programas = useMemo(() => {
    const vistos = new Set<string>();
    const orden = [
      ...PROGRAMAS.filter(p => p.goal === perfil.objetivo),
      ...PROGRAMAS.filter(p => p.goal !== perfil.objetivo),
    ];
    return orden.filter(p => !vistos.has(p.id) && vistos.add(p.id)).slice(0, 4);
  }, [perfil.objetivo]);

  const ejercicios = useMemo(() => {
    const equipo = new Set([...perfil.equipo, 'ninguno', 'pared', 'silla']);
    return EJERCICIOS
      .filter(e => e.goals.includes(perfil.objetivo))
      .filter(e => e.equipment.every(q => equipo.has(q)))
      .filter(e => !e.contra.some(c => perfil.contra.includes(c)))
      .slice(semilla % 8, (semilla % 8) + 4);
  }, [perfil.objetivo, perfil.equipo, perfil.contra, semilla]);

  const musculosDeHoy = useMemo(() => new Set(sesion.items.flatMap(i => i.primary)), [sesion]);
  const musculos = useMemo(() => {
    const vistos = new Set<string>();
    const orden = [...MUSCULOS.filter(m => musculosDeHoy.has(m.id)), ...MUSCULOS];
    return orden.filter(m => !vistos.has(m.id) && vistos.add(m.id)).slice(0, 4);
  }, [musculosDeHoy]);

  const tips = useMemo(() => TIPS.slice(semilla % 20, (semilla % 20) + 4), [semilla]);

  // La huella se estampa al volver a Hoy con una sesion nueva terminada hoy.
  const sesionesVistas = useRef(sesionesHoy);
  const [sello, setSello] = useState(0);
  useFocusEffect(useCallback(() => {
    if (sesionesHoy <= sesionesVistas.current) return;
    sesionesVistas.current = sesionesHoy;
    setSello(n => n + 1);
  }, [sesionesHoy]));

  // Los datos son locales: refrescar solo vuelve a leer la fecha (mismo dia, misma sesion).
  const refrescar = useCallback(() => {
    setRefrescando(true);
    haptico.toque();
    magnesia.mini(width / 2, inset.top + ALTO_HEADER);
    setFecha(hoy());
    temporizador.current = setTimeout(() => setRefrescando(false), DURACION_REFRESCO_MS);
  }, [magnesia, width, inset.top]);

  const irAExplorar = (tab?: 'rutinas' | 'programas' | 'ejercicios' | 'musculos') => navigation.navigate(
    'Tabs', tab ? { screen: 'Explorar', merge: true, params: { tab } } : { screen: 'Explorar' },
  );
  const irAAprender = () => navigation.navigate('Tabs', { screen: 'Aprender' });

  const empezar = () => navigation.navigate('Reproductor', { sesion });
  const cincoMinutos = () => navigation.navigate('Reproductor', {
    sesion: sesionDeRutina(
      ID_RUTINA_CINCO_MIN, perfilMotor, RUTINAS.find(r => r.id === ID_RUTINA_CINCO_MIN)!, ultimaVezDe,
    ),
  });


  return {
    abajo, inset, y, onScroll, semanaPrograma, alternarFavorito, esFavorito, perfil, racha, refrescando,
    stats, semana, entrenoHoy, programa, sesion, avisosSesion, sinEjercicios, rutinas, programas,
    ejercicios, musculosDeHoy, musculos, tips, sello, refrescar, irAExplorar, irAAprender, empezar,
    cincoMinutos,
  };
}
