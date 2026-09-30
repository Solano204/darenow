import { useEffect, useMemo, useRef, useState } from 'react';
import { EQUIPO, GOALS } from '../data/catalog';
import { derivar, type Rs } from '../data/perfil';
import type { PerfilUsuario } from '../store/store';
import { useCuenta } from '../store/cuenta';
import { useConsentimientoMedidas, pedirConsentimientoMedidas } from '../store/consentimientoMedidas';

/** Campos de salud: nunca se rellenan solos con el valor por defecto al saltarse el paso, y piden consentimiento antes de guardar cualquier valor real. */
const ES_MEDIDA = new Set(['alturaCm', 'pesoKg', 'pesoObjetivoKg']);
const PREPARANDO_MS = 1100;

export type TipoPaso = 'unica' | 'multiple' | 'numero' | 'texto';

interface Paso {
  campo: string; tipo: TipoPaso; pregunta: string; ayuda?: string;
  opciones?: { id: string; texto: string; detalle?: string }[];
  obligatorio?: boolean; min?: number; max?: number; sufijo?: string;
  defecto?: unknown; saltarSi?: (r: Rs) => boolean;
  /** muestra un enlace para pasar sin responder */
  saltable?: boolean;
}

const EQUIPO_ONB = EQUIPO.filter(e => e.onboarding && e.id !== 'ninguno')
  .sort((a, b) => a.orden - b.orden)
  .map(e => ({
    id: e.id, texto: e.name,
    detalle: e.sustituto_casero ? `Si no tienes: ${e.sustituto_casero}` : undefined,
  }));

const PASOS: Paso[] = [
  { campo: 'objetivo', tipo: 'unica', obligatorio: true,
    pregunta: 'Qué quieres trabajar',
    ayuda: 'Puedes cambiarlo cuando quieras, sin perder tu historial.',
    opciones: GOALS.map(g => ({ id: g.id, texto: g.nombre, detalle: g.sub })) },

  { campo: 'experiencia', tipo: 'unica', defecto: 'nada',
    pregunta: 'Cuánto llevas entrenando',
    opciones: [
      { id: 'nada', texto: 'Nunca, o hace años' },
      { id: 'pausa', texto: 'Entrenaba, llevo meses parado' },
      { id: 'algo', texto: 'Algunos meses seguidos' },
      { id: 'constante', texto: 'Más de un año constante' },
    ] },

  { campo: 'diasPorSemana', tipo: 'numero', min: 2, max: 6, defecto: 3, sufijo: 'días por semana',
    pregunta: 'Cuántos días a la semana, de verdad',
    ayuda: 'Piensa en tu semana real, no en la ideal. Tres días sostenidos ganan a seis que no ocurren.' },

  { campo: 'minPorSesion', tipo: 'unica', defecto: 20,
    pregunta: 'Cuánto tiempo tienes por sesión',
    ayuda: 'La sesión siempre cabe en el tiempo que digas. Si un día no lo tienes, hay una de cinco minutos.',
    opciones: [
      { id: '10', texto: '10 minutos' }, { id: '20', texto: '20 minutos' },
      { id: '30', texto: '30 minutos' }, { id: '45', texto: '45 minutos' },
      { id: '60', texto: 'Una hora o más' },
    ] },

  { campo: 'lugar', tipo: 'unica', defecto: 'casa',
    pregunta: 'Dónde vas a entrenar',
    opciones: [
      { id: 'casa', texto: 'En casa' }, { id: 'gym', texto: 'En un gimnasio' },
      { id: 'exterior', texto: 'Al aire libre' }, { id: 'mixto', texto: 'Depende del día' },
    ] },

  { campo: 'equipo', tipo: 'multiple', defecto: [], saltarSi: r => r.lugar === 'gym',
    pregunta: 'Qué tienes a mano',
    ayuda: 'Sin marcar nada quedan más de 130 ejercicios. No hace falta comprar nada para empezar.',
    opciones: EQUIPO_ONB },

  { campo: 'espacio', tipo: 'unica', defecto: 'colchoneta', saltarSi: r => r.lugar === 'gym',
    pregunta: 'Cuánto espacio tienes',
    opciones: [
      { id: 'minimo', texto: 'Lo justo para estar de pie', detalle: 'Un metro cuadrado' },
      { id: 'colchoneta', texto: 'Para tumbarme', detalle: 'Dos por uno' },
      { id: 'amplio', texto: 'Puedo desplazarme', detalle: 'Sala o patio' },
    ] },

  { campo: 'ruido', tipo: 'unica', defecto: 'si', saltarSi: r => r.lugar === 'gym',
    pregunta: 'Puedes hacer ruido',
    ayuda: 'Si vives en departamento o entrenas de noche, quitamos saltos e impacto. No pierdes nada: cada rutina tiene su versión silenciosa.',
    opciones: [
      { id: 'si', texto: 'Sí, sin problema' },
      { id: 'no', texto: 'Mejor sin ruido ni saltos' },
    ] },

  { campo: 'contra', tipo: 'multiple', defecto: [],
    pregunta: 'Alguna lesión o molestia',
    ayuda: 'Sacamos del plan todo lo que cargue esas zonas, y ese filtro no se relaja nunca.',
    opciones: [
      { id: 'lesion_cuello', texto: 'Cuello' }, { id: 'lesion_hombro', texto: 'Hombro' },
      { id: 'lesion_codo', texto: 'Codo' }, { id: 'lesion_muneca', texto: 'Muñeca' },
      { id: 'lesion_lumbar', texto: 'Espalda baja' }, { id: 'hernia_discal', texto: 'Hernia discal' },
      { id: 'lesion_cadera', texto: 'Cadera' }, { id: 'lesion_rodilla', texto: 'Rodilla' },
      { id: 'lesion_tobillo', texto: 'Tobillo' }, { id: 'problema_atm', texto: 'Mandíbula (ATM)' },
    ] },

  { campo: 'situacion', tipo: 'multiple', defecto: [],
    pregunta: 'Alguna de estas te aplica',
    ayuda: 'Cambia qué ejercicios entran. Si marcas alguna, conviene que lo hables también con tu médico o fisioterapeuta.',
    opciones: [
      { id: 'embarazo', texto: 'Estoy embarazada' },
      { id: 'postparto', texto: 'Postparto reciente' },
      { id: 'hipertension', texto: 'Tensión alta' },
      { id: 'vertigo', texto: 'Mareos o vértigo' },
    ] },

  { campo: 'alturaCm', tipo: 'numero', min: 120, max: 220, defecto: 170, sufijo: 'cm',
    pregunta: 'Cuánto mides',
    ayuda: 'Opcional. Es un dato de tu perfil, no cambia tu plan ni ningún cálculo.',
    saltable: true },

  { campo: 'pesoKg', tipo: 'numero', min: 35, max: 200, defecto: 70, sufijo: 'kg ahora',
    pregunta: 'Cuánto pesas',
    ayuda: 'Opcional. Solo se usa para estimar el gasto de la sesión. Si prefieres no ponerlo, puedes saltar este paso.',
    saltable: true },

  { campo: 'pesoObjetivoKg', tipo: 'numero', min: 35, max: 200, defecto: 70, sufijo: 'kg objetivo',
    pregunta: 'Tienes un peso en mente',
    ayuda: 'Opcional, y no cambia tu plan: no ponemos dietas ni fechas. Sirve solo como referencia tuya en la pantalla de progreso.',
    saltable: true,
    saltarSi: r => r.pesoKg === undefined },

  { campo: 'nombre', tipo: 'texto', defecto: '', obligatorio: true,
    pregunta: 'Cómo te llamamos',
    ayuda: 'Solo se usa para saludarte.' },
];

/**
 * Logica del cuestionario, sin presentacion. `transicionar(dir, despues)` es la
 * coreografia de la vista: ejecuta `despues` (el cambio de indice) cuando el
 * paso actual termina de salir. Las reglas son las de siempre: nada de aqui
 * cambia respecto a la version anterior.
 */
export function useOnboarding(
  onTerminar: (p: PerfilUsuario) => void,
  transicionar: (dir: 1 | -1, despues: () => void) => void,
) {
  const [r, setR] = useState<Rs>({});
  const [i, setI] = useState(0);
  const [resumen, setResumen] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pasos = useMemo(() => PASOS.filter(p => !p.saltarSi?.(r)), [r]);
  const paso = pasos[Math.min(i, pasos.length - 1)];
  const valor = r[paso.campo] ?? paso.defecto;
  const respondido = r[paso.campo] !== undefined
    && !(paso.tipo === 'texto' && String(r[paso.campo]).trim() === '');
  const puedeSeguir = !paso.obligatorio || respondido;
  const esUltimo = i >= pasos.length - 1;

  const set = (v: unknown) => setR(prev => ({ ...prev, [paso.campo]: v }));
  const [consentimientoDado, darConsentimiento] = useConsentimientoMedidas();
  const cambiarNumero = ES_MEDIDA.has(paso.campo)
    ? (v: number) => pedirConsentimientoMedidas(consentimientoDado, darConsentimiento, () => set(v))
    : set;

  // Con esto, "Como te llamamos" se llena solo en vez de escribirlo a mano.
  // No crea cuenta ni sincroniza nada: solo lee el nombre de Google.
  const { cuenta } = useCuenta();
  useEffect(() => {
    if (cuenta?.nombre) setR(prev => ({ ...prev, nombre: cuenta.nombre }));
  }, [cuenta?.nombre]);

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  const avanzar = () => {
    // Para peso/altura/peso objetivo NO se aplica el valor por defecto:
    // sin consentimiento expreso, "Seguir" sin tocar el contador se
    // comporta igual que "Prefiero no decirlo" (se queda sin responder).
    if (r[paso.campo] === undefined && paso.defecto !== undefined && !ES_MEDIDA.has(paso.campo)) {
      set(paso.defecto);
    }
    if (!esUltimo) transicionar(1, () => setI(i + 1));
    else {
      // Pausa breve armando el plan. No es humo: el motor esta filtrando
      // el catalogo entero contra las respuestas.
      setPreparando(true);
      temporizador.current = setTimeout(() => { setPreparando(false); setResumen(true); }, PREPARANDO_MS);
    }
  };

  const atras = () => transicionar(-1, () => setI(i - 1));

  const saltarMedida = () => {
    setR(prev => { const n = { ...prev }; delete n[paso.campo]; return n; });
    if (!esUltimo) transicionar(1, () => setI(i + 1)); else setResumen(true);
  };

  const cambiarAlgo = () => setResumen(false);
  const plan = resumen ? derivar(r) : null;
  const empezar = () => { if (plan) onTerminar(plan.perfil); };

  return {
    r, i, pasos, paso, valor, puedeSeguir, esUltimo, preparando, resumen, plan,
    set, cambiarNumero, avanzar, atras, saltarMedida, cambiarAlgo, empezar,
  };
}
