/**
 * FORJA · estado del usuario
 *
 * AsyncStorage en vez de SQLite para esta build de prueba: corre en Expo Go
 * sin pasos extra y el volumen de datos lo aguanta de sobra (unos 90 KB por
 * semestre de uso). El esquema SQL sigue en db/user_schema.sql para cuando
 * pases a build nativa; los campos son los mismos.
 *
 * Regla del producto: nada se pierde. Una sesion abandonada se guarda igual
 * y cuenta para la racha si hubo al menos una serie real.
 */

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE = 'forja:v1';

export interface SerieGuardada {
  ejercicioId: string; serieNum: number; lado: 'izq' | 'der' | null;
  reps: number | null; segundos: number | null; pesoKg: number | null; omitida: boolean;
}

export interface SesionGuardada {
  id: string; fecha: string; iniciada: string; duracionS: number;
  rutinaId: string | null; programaId: string | null;
  estado: 'completada' | 'abandonada';
  kcal: number | null; rpe: number | null; motivoAbandono: string | null;
  series: SerieGuardada[];
}

export interface MedicionGuardada {
  id: string; protocolo: string; fecha: string; valor: number;
  unidad: string; detalle?: Record<string, number>;
}

export interface PerfilUsuario {
  nombre: string;
  objetivo: string;
  nivel: 1 | 2 | 3;
  diasPorSemana: number;
  minPorSesion: number;
  modoSinSaltos: boolean;
  espacio: 'minimo' | 'colchoneta' | 'amplio';
  equipo: string[];
  contra: string[];
  vetos: string[];
  pesoKg?: number;
  pesoObjetivoKg?: number;
  alturaCm?: number;
  programaId: string;
  mostrarKcal: boolean;
  mostrarPeso: boolean;
  /** tonos de cuenta atras y de transicion durante la sesion */
  sonido: boolean;
}

export interface Racha {
  dias: number; mejor: number; ultimoDia: string | null;
  graciaUsada: number; mesGracia: string | null; enPausa: boolean;
}

/**
 * Rutina creada por el usuario.
 *
 * Guarda solo ids del catalogo y los numeros que el usuario eligio. No
 * duplica nombres ni descripciones: si mañana se corrige un ejercicio, la
 * rutina propia se actualiza sola.
 *
 * Vive en el telefono. Son unos 500 bytes cada una, asi que cabe cualquier
 * cantidad razonable, y funciona sin señal, que es justo cuando se abre.
 */
export interface ItemPropio {
  ejercicioId: string;
  series: number;
  /** uno de los dos, segun como se mida el ejercicio */
  reps?: number;
  seg?: number;
  descansoS: number;
}

export interface RutinaPropia {
  id: string;
  nombre: string;
  objetivo: string;
  items: ItemPropio[];
  creada: string;
  editada: string;
  /** copiada de una rutina del catalogo, para saber de donde salio */
  origen?: string;
  /**
   * Una de las 30 fotos de rutina del catalogo (rt_001..rt_030), elegida
   * al azar al crearla. Una rutina propia no tiene foto propia; sin esto
   * `Foto` dibuja el marcador generado en vez de una imagen de verdad.
   * Opcional: una rutina guardada antes de este campo sigue usando su
   * propio id (y por tanto el marcador) hasta que se edite y regrabe.
   */
  imagenId?: string;
}

export interface Favoritos {
  ejercicios: string[];
  musculos: string[];
  rutinas: string[];
  programas: string[];
  tips: string[];
}

export interface Estado {
  /** la intro animada solo se ve una vez, la primera */
  presentacionVista: boolean;
  onboardingHecho: boolean;
  /** ultimo dia en que se mostro la bienvenida, para no repetirla */
  bienvenidaVista: string | null;
  /** ultimo dia en que se mostro el intersticial */
  anuncioVisto: string | null;
  /** el usuario acepto ver anuncios a cambio de descargar el contenido */
  anunciosAceptados: boolean;
  /** secciones ya descargadas para uso sin conexion */
  descargas: string[];
  favoritos: Favoritos;
  rutinasPropias: RutinaPropia[];
  perfil: PerfilUsuario;
  sesiones: SesionGuardada[];
  mediciones: MedicionGuardada[];
  racha: Racha;
  logros: { id: string; fecha: string }[];
  retos: Record<string, { iniciado: string; progreso: number; completado?: string }>;
  tipsLeidos: string[];
  tipsGuardados: string[];
  semanaPrograma: number;
}

export const PERFIL_INICIAL: PerfilUsuario = {
  nombre: '', objetivo: 'bajar_peso', nivel: 1, diasPorSemana: 3, minPorSesion: 20,
  modoSinSaltos: false, espacio: 'colchoneta', equipo: [], contra: [], vetos: [],
  programaId: 'pg_001', mostrarKcal: true, mostrarPeso: true, sonido: true,
};

export const FAVORITOS_VACIOS: Favoritos = {
  ejercicios: [], musculos: [], rutinas: [], programas: [], tips: [],
};

const ESTADO_INICIAL: Estado = {
  presentacionVista: false,
  onboardingHecho: false,
  bienvenidaVista: null,
  anuncioVisto: null,
  anunciosAceptados: false,
  descargas: [],
  favoritos: FAVORITOS_VACIOS,
  rutinasPropias: [],
  perfil: PERFIL_INICIAL,
  sesiones: [],
  mediciones: [],
  racha: { dias: 0, mejor: 0, ultimoDia: null, graciaUsada: 0, mesGracia: null, enPausa: false },
  logros: [],
  retos: {},
  tipsLeidos: [],
  tipsGuardados: [],
  semanaPrograma: 1,
};

/* ------------------------------------------------------------------ */
/* Utilidades de fecha                                                 */
/* ------------------------------------------------------------------ */

export function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Imagen para una rutina propia: la que se le asigno al azar al crearla, o
 * (si es de antes de eso, y por lo tanto no tiene) una eleccion estable
 * segun su id. Estable para que no cambie de foto entre pantallas ni al
 * releer la lista.
 */
export function imagenRutina(id: string, imagenId?: string): string {
  if (imagenId) return imagenId;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `rt_${String((h % 30) + 1).padStart(3, '0')}`;
}
const mesActual = () => hoy().slice(0, 7);
const diasEntre = (a: string, b: string) =>
  Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);

const DIAS_DE_GRACIA = 2;

/**
 * Racha con dos dias de gracia al mes.
 * Nunca vuelve a cero: si se pasa el margen, se marca en pausa y al volver
 * a entrenar continua desde donde estaba.
 */
export function calcularRacha(r: Racha, fecha: string): Racha {
  const mes = fecha.slice(0, 7);
  const gracia = r.mesGracia === mes ? r.graciaUsada : 0;

  if (!r.ultimoDia) {
    return { dias: 1, mejor: Math.max(r.mejor, 1), ultimoDia: fecha, graciaUsada: gracia, mesGracia: mes, enPausa: false };
  }
  const hueco = diasEntre(r.ultimoDia, fecha);
  if (hueco <= 0) return r;                       // mismo dia, no suma

  let dias = r.dias + 1;
  let usada = gracia;
  if (hueco > 1) {
    const faltados = hueco - 1;
    if (gracia + faltados <= DIAS_DE_GRACIA) usada = gracia + faltados;
    // Sin gracia: la racha continua igual, solo deja de estar en pausa.
  }
  return {
    dias, mejor: Math.max(r.mejor, dias), ultimoDia: fecha,
    graciaUsada: usada, mesGracia: mes, enPausa: false,
  };
}

export function revisarPausa(r: Racha): Racha {
  if (!r.ultimoDia) return r;
  const hueco = diasEntre(r.ultimoDia, hoy());
  const gracia = r.mesGracia === mesActual() ? r.graciaUsada : 0;
  const disponible = DIAS_DE_GRACIA - gracia;
  return hueco - 1 > disponible ? { ...r, enPausa: true } : r;
}

/* ------------------------------------------------------------------ */
/* Contexto                                                            */
/* ------------------------------------------------------------------ */

interface Ctx {
  estado: Estado;
  cargando: boolean;
  guardarPerfil: (p: Partial<PerfilUsuario>) => void;
  terminarOnboarding: (p: PerfilUsuario) => void;
  marcarPresentacion: () => void;
  guardarSesion: (s: Omit<SesionGuardada, 'id'>) => { racha: Racha; logrosNuevos: string[]; graciaUsada: boolean };
  guardarMedicion: (m: Omit<MedicionGuardada, 'id'>) => void;
  alternarVeto: (id: string) => void;
  alternarFavorito: (tipo: keyof Favoritos, id: string) => void;
  esFavorito: (tipo: keyof Favoritos, id: string) => boolean;
  marcarBienvenida: () => void;
  marcarAnuncio: () => void;
  aceptarAnuncios: () => void;
  registrarDescarga: (seccion: string) => void;
  guardarRutinaPropia: (r: RutinaPropia) => void;
  borrarRutinaPropia: (id: string) => void;
  nuevaRutinaPropia: (base?: Partial<RutinaPropia>) => RutinaPropia;
  alternarTipGuardado: (id: string) => void;
  marcarTipLeido: (id: string) => void;
  iniciarReto: (id: string) => void;
  ultimaVezDe: (id: string) => { reps?: number; segundos?: number; pesoKg?: number; fecha: string } | undefined;
  reiniciar: () => void;
}

const Contexto = createContext<Ctx | null>(null);

export function ProveedorEstado({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(ESTADO_INICIAL);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CLAVE);
        if (raw) {
          const cargado = { ...ESTADO_INICIAL, ...JSON.parse(raw) } as Estado;
          // El merge de arriba es superficial: un perfil guardado antes de
          // que existiera un campo nuevo lo dejaria en undefined. Se rellena
          // con los valores iniciales para que anadir ajustes no rompa a
          // quien ya venia usando la app.
          cargado.perfil = { ...PERFIL_INICIAL, ...cargado.perfil };
          cargado.racha = revisarPausa(cargado.racha);
          setEstado(cargado);
        }
      } catch { /* arranca limpio */ }
      setCargando(false);
    })();
  }, []);

  /**
   * Guardado diferido.
   *
   * Antes cada cambio serializaba el estado completo dentro del setState, y
   * tocar "cambiar programa" congelaba la pantalla medio segundo. Ahora la
   * interfaz responde de inmediato y el guardado se agrupa: si llegan varios
   * cambios seguidos, se escribe una sola vez.
   */
  const pendiente = useRef<Estado | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guardar = useCallback((e: Estado) => {
    pendiente.current = e;
    if (temporizador.current) return;
    temporizador.current = setTimeout(() => {
      temporizador.current = null;
      const x = pendiente.current;
      pendiente.current = null;
      if (x) AsyncStorage.setItem(CLAVE, JSON.stringify(x)).catch(() => {});
    }, 350);
  }, []);

  // Si la app se va a segundo plano, se escribe ya lo que quede pendiente.
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      if (st !== 'active' && pendiente.current) {
        AsyncStorage.setItem(CLAVE, JSON.stringify(pendiente.current)).catch(() => {});
        pendiente.current = null;
      }
    });
    return () => sub.remove();
  }, []);

  const guardarPerfil = useCallback((p: Partial<PerfilUsuario>) => {
    setEstado(prev => {
      const e = { ...prev, perfil: { ...prev.perfil, ...p } };
      guardar(e);
      return e;
    });
  }, []);

  const marcarPresentacion = useCallback(() => {
    setEstado(prev => {
      const e = { ...prev, presentacionVista: true };
      guardar(e);
      return e;
    });
  }, [guardar]);

  const terminarOnboarding = useCallback((p: PerfilUsuario) => {
    setEstado(prev => {
      const e = { ...prev, perfil: p, onboardingHecho: true };
      guardar(e);
      return e;
    });
  }, []);

  const guardarSesion: Ctx['guardarSesion'] = useCallback((s) => {
    let resultado = { racha: ESTADO_INICIAL.racha, logrosNuevos: [] as string[], graciaUsada: false };

    setEstado(prev => {
      const reales = s.series.filter(x => !x.omitida);
      const cuenta = reales.length >= 1;
      const graciaAntes = prev.racha.mesGracia === mesActual() ? prev.racha.graciaUsada : 0;
      const racha = cuenta ? calcularRacha(prev.racha, s.fecha) : prev.racha;

      const sesiones = [...prev.sesiones, { ...s, id: `${Date.now()}` }];
      const logros = [...prev.logros];
      const nuevos: string[] = [];
      const otorgar = (id: string) => {
        if (!logros.some(l => l.id === id)) { logros.push({ id, fecha: hoy() }); nuevos.push(id); }
      };

      if (racha.dias >= 7) otorgar('logro_007dias');
      if (sesiones.length >= 100) otorgar('logro_100sesiones');
      if (sesiones.length >= 365) otorgar('logro_365sesiones');

      const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const diasMes = new Set(sesiones.filter(x => x.fecha >= hace30).map(x => x.fecha));
      if (diasMes.size >= 20) otorgar('logro_030dias');

      const silenciosas = sesiones.filter(x => x.estado === 'completada').length;
      if (silenciosas >= 5 && prev.perfil.modoSinSaltos) otorgar('logro_silenciosa');
      if (sesiones.length >= 1) otorgar('logro_programa1');

      resultado = {
        racha,
        logrosNuevos: nuevos,
        graciaUsada: racha.graciaUsada > graciaAntes,
      };

      const e = { ...prev, sesiones, racha, logros };
      guardar(e);
      return e;
    });

    return resultado;
  }, []);

  const guardarMedicion = useCallback((m: Omit<MedicionGuardada, 'id'>) => {
    setEstado(prev => {
      const e = { ...prev, mediciones: [...prev.mediciones, { ...m, id: `${Date.now()}` }] };
      guardar(e);
      return e;
    });
  }, []);

  const alternarVeto = useCallback((id: string) => {
    setEstado(prev => {
      const vetos = prev.perfil.vetos.includes(id)
        ? prev.perfil.vetos.filter(v => v !== id)
        : [...prev.perfil.vetos, id];
      const e = { ...prev, perfil: { ...prev.perfil, vetos } };
      guardar(e);
      return e;
    });
  }, []);

  const alternarFavorito = useCallback((tipo: keyof Favoritos, id: string) => {
    setEstado(prev => {
      const actual = prev.favoritos[tipo] ?? [];
      const nuevo = actual.includes(id) ? actual.filter(x => x !== id) : [...actual, id];
      const e = { ...prev, favoritos: { ...prev.favoritos, [tipo]: nuevo } };
      guardar(e);
      return e;
    });
  }, []);

  const esFavorito = useCallback(
    (tipo: keyof Favoritos, id: string) => (estado.favoritos[tipo] ?? []).includes(id),
    [estado.favoritos],
  );

  const marcarBienvenida = useCallback(() => {
    setEstado(prev => {
      if (prev.bienvenidaVista === hoy()) return prev;
      const e = { ...prev, bienvenidaVista: hoy() };
      guardar(e);
      return e;
    });
  }, []);

  const marcarAnuncio = useCallback(() => {
    setEstado(prev => {
      const e = { ...prev, anuncioVisto: hoy() };
      guardar(e);
      return e;
    });
  }, []);

  const aceptarAnuncios = useCallback(() => {
    setEstado(prev => {
      const e = { ...prev, anunciosAceptados: true };
      guardar(e);
      return e;
    });
  }, []);

  const registrarDescarga = useCallback((seccion: string) => {
    setEstado(prev => {
      if (prev.descargas.includes(seccion)) return prev;
      const e = { ...prev, descargas: [...prev.descargas, seccion], anunciosAceptados: true };
      guardar(e);
      return e;
    });
  }, []);

  const alternarTipGuardado = useCallback((id: string) => {
    setEstado(prev => {
      const g = prev.tipsGuardados.includes(id)
        ? prev.tipsGuardados.filter(x => x !== id)
        : [...prev.tipsGuardados, id];
      const e = { ...prev, tipsGuardados: g };
      guardar(e);
      return e;
    });
  }, []);

  const marcarTipLeido = useCallback((id: string) => {
    setEstado(prev => {
      if (prev.tipsLeidos.includes(id)) return prev;
      const e = { ...prev, tipsLeidos: [...prev.tipsLeidos, id] };
      guardar(e);
      return e;
    });
  }, []);

  const iniciarReto = useCallback((id: string) => {
    setEstado(prev => {
      const e = { ...prev, retos: { ...prev.retos, [id]: { iniciado: hoy(), progreso: 0 } } };
      guardar(e);
      return e;
    });
  }, []);

  /** Crea el borrador en memoria. No se guarda hasta que el usuario acepta. */
  const nuevaRutinaPropia = useCallback((base: Partial<RutinaPropia> = {}): RutinaPropia => ({
    id: `mi_${Date.now().toString(36)}`,
    nombre: '',
    objetivo: 'bajar_peso',
    items: [],
    creada: hoy(),
    editada: hoy(),
    // rt_001..rt_030: las 30 fotos de rutina del catalogo. Al azar para que
    // una rutina nueva se vea terminada de una vez, no con el marcador.
    imagenId: `rt_${String(Math.floor(Math.random() * 30) + 1).padStart(3, '0')}`,
    ...base,
  }), []);

  const guardarRutinaPropia = useCallback((r: RutinaPropia) => {
    setEstado(prev => {
      const existe = prev.rutinasPropias.some(x => x.id === r.id);
      const lista = existe
        ? prev.rutinasPropias.map(x => (x.id === r.id ? { ...r, editada: hoy() } : x))
        : [...prev.rutinasPropias, r];
      const e = { ...prev, rutinasPropias: lista };
      guardar(e);
      return e;
    });
  }, [guardar]);

  const borrarRutinaPropia = useCallback((id: string) => {
    setEstado(prev => {
      const e = {
        ...prev,
        rutinasPropias: prev.rutinasPropias.filter(x => x.id !== id),
        favoritos: { ...prev.favoritos, rutinas: prev.favoritos.rutinas.filter(x => x !== id) },
      };
      guardar(e);
      return e;
    });
  }, [guardar]);

  const reiniciar = useCallback(() => {
    AsyncStorage.removeItem(CLAVE).catch(() => {});
    setEstado(ESTADO_INICIAL);
  }, []);

  /** Ultimo rendimiento registrado de un ejercicio. */
  const ultimaVezDe = useCallback((id: string) => {
    for (let i = estado.sesiones.length - 1; i >= 0; i--) {
      const s = estado.sesiones[i];
      const serie = [...s.series].reverse().find(x => x.ejercicioId === id && !x.omitida);
      if (serie) {
        return {
          reps: serie.reps ?? undefined,
          segundos: serie.segundos ?? undefined,
          pesoKg: serie.pesoKg ?? undefined,
          fecha: s.fecha,
        };
      }
    }
    return undefined;
  }, [estado.sesiones]);

  const valor = useMemo<Ctx>(() => ({
    estado, cargando, guardarPerfil, terminarOnboarding, marcarPresentacion, guardarSesion,
    guardarMedicion, alternarVeto, alternarTipGuardado, marcarTipLeido,
    iniciarReto, ultimaVezDe, reiniciar,
    alternarFavorito, esFavorito, marcarBienvenida, marcarAnuncio,
    aceptarAnuncios, registrarDescarga,
    guardarRutinaPropia, borrarRutinaPropia, nuevaRutinaPropia,
  }), [estado, cargando, guardarPerfil, terminarOnboarding, marcarPresentacion, guardarSesion,
       guardarMedicion, alternarVeto, alternarTipGuardado, marcarTipLeido,
       iniciarReto, ultimaVezDe, reiniciar,
       alternarFavorito, esFavorito, marcarBienvenida, marcarAnuncio,
       aceptarAnuncios, registrarDescarga,
       guardarRutinaPropia, borrarRutinaPropia, nuevaRutinaPropia]);

  return React.createElement(Contexto.Provider, { value: valor }, children);
}

export function useEstado(): Ctx {
  const c = useContext(Contexto);
  if (!c) throw new Error('useEstado fuera del proveedor');
  return c;
}

/* ------------------------------------------------------------------ */
/* Estadisticas derivadas                                              */
/* ------------------------------------------------------------------ */

export function estadisticas(s: SesionGuardada[]) {
  const completadas = s.filter(x => x.estado === 'completada').length;
  const minutos = Math.round(s.reduce((a, x) => a + x.duracionS, 0) / 60);
  const series = s.reduce((a, x) => a + x.series.filter(y => !y.omitida).length, 0);
  const kcal = s.reduce((a, x) => a + (x.kcal ?? 0), 0);
  const dias = new Set(s.map(x => x.fecha)).size;
  return { total: s.length, completadas, minutos, series, kcal, dias };
}

/** Minutos por dia de los ultimos 7 dias, para la grafica de Yo. */
export function ultimos7(s: SesionGuardada[]): { fecha: string; min: number }[] {
  const salida: { fecha: string; min: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const min = Math.round(
      s.filter(x => x.fecha === d).reduce((a, x) => a + x.duracionS, 0) / 60,
    );
    salida.push({ fecha: d, min });
  }
  return salida;
}


/** Minutos por fecha. Alimenta el calendario mensual. */
export function minutosPorDia(s: SesionGuardada[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of s) out[x.fecha] = (out[x.fecha] ?? 0) + Math.round(x.duracionS / 60);
  return out;
}

/** Fechas unicas con sesion. */
export function diasEntrenados(s: SesionGuardada[]): string[] {
  return [...new Set(s.map(x => x.fecha))];
}
