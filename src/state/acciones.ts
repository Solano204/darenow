/**
 * DARENOW · acciones del estado
 *
 * Todo lo que cambia el estado del usuario. Desde R4 son funciones de módulo (siempre las
 * mismas: no hacen re-renderizar a quien las recibe) que cambian la tienda con `cambiar`, que
 * aplica el cambio y pide el guardado diferido. Mismos cambios y mismo formato que antes.
 */
import { cambiar, reiniciarTienda, useTienda } from './tienda';
import { ESTADO_INICIAL } from './estadoInicial';
import { hoy, calcularRacha, mesActual, ultimaVezEn } from './derivados';
import type {
  Estado, Favoritos, MedicionGuardada, PerfilUsuario, Racha, RutinaPropia, SesionGuardada,
} from './tipos';

const leer = (): Estado => useTienda.getState().estado;

export function guardarPerfil(p: Partial<PerfilUsuario>) {
  cambiar(prev => ({ ...prev, perfil: { ...prev.perfil, ...p } }));
}

export function marcarPresentacion() {
  cambiar(prev => ({ ...prev, presentacionVista: true }));
}

export function terminarOnboarding(p: PerfilUsuario) {
  cambiar(prev => ({ ...prev, perfil: p, onboardingHecho: true }));
}

export function guardarSesion(s: Omit<SesionGuardada, 'id'>): { racha: Racha; logrosNuevos: string[]; graciaUsada: boolean } {
  let resultado = { racha: ESTADO_INICIAL.racha, logrosNuevos: [] as string[], graciaUsada: false };

  cambiar(prev => {
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
    return { ...prev, sesiones, racha, logros };
  });

  return resultado;
}

export function guardarMedicion(m: Omit<MedicionGuardada, 'id'>) {
  cambiar(prev => ({ ...prev, mediciones: [...prev.mediciones, { ...m, id: `${Date.now()}` }] }));
}

export function alternarVeto(id: string) {
  cambiar(prev => {
    const vetos = prev.perfil.vetos.includes(id)
      ? prev.perfil.vetos.filter(v => v !== id)
      : [...prev.perfil.vetos, id];
    return { ...prev, perfil: { ...prev.perfil, vetos } };
  });
}

export function alternarFavorito(tipo: keyof Favoritos, id: string) {
  cambiar(prev => {
    const actual = prev.favoritos[tipo] ?? [];
    const nuevo = actual.includes(id) ? actual.filter(x => x !== id) : [...actual, id];
    return { ...prev, favoritos: { ...prev.favoritos, [tipo]: nuevo } };
  });
}

export function marcarBienvenida() {
  cambiar(prev => (prev.bienvenidaVista === hoy() ? prev : { ...prev, bienvenidaVista: hoy() }));
}

export function registrarDescarga(seccion: string) {
  cambiar(prev => (prev.descargas.includes(seccion)
    ? prev
    : { ...prev, descargas: [...prev.descargas, seccion], anunciosAceptados: true }));
}

export function marcarTipLeido(id: string) {
  cambiar(prev => (prev.tipsLeidos.includes(id) ? prev : { ...prev, tipsLeidos: [...prev.tipsLeidos, id] }));
}

export function iniciarReto(id: string) {
  cambiar(prev => ({ ...prev, retos: { ...prev.retos, [id]: { iniciado: hoy(), progreso: 0 } } }));
}

/** Crea el borrador en memoria. No se guarda hasta que el usuario acepta. */
export function nuevaRutinaPropia(base: Partial<RutinaPropia> = {}): RutinaPropia {
  return {
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
  };
}

export function guardarRutinaPropia(r: RutinaPropia) {
  cambiar(prev => {
    const existe = prev.rutinasPropias.some(x => x.id === r.id);
    const lista = existe
      ? prev.rutinasPropias.map(x => (x.id === r.id ? { ...r, editada: hoy() } : x))
      : [...prev.rutinasPropias, r];
    return { ...prev, rutinasPropias: lista };
  });
}

export function borrarRutinaPropia(id: string) {
  cambiar(prev => ({
    ...prev,
    rutinasPropias: prev.rutinasPropias.filter(x => x.id !== id),
    favoritos: { ...prev.favoritos, rutinas: prev.favoritos.rutinas.filter(x => x !== id) },
  }));
}

/** Borra el progreso (lo usa «borrar todos los datos» de la cuenta). */
export function reiniciar() {
  reiniciarTienda();
}

/** Borra peso, altura, peso objetivo y todas las mediciones. Lo usa el retiro de consentimiento en Ajustes (ver consentimientoMedidas.ts). */
export function borrarMedidas() {
  cambiar(prev => ({
    ...prev,
    mediciones: [],
    perfil: { ...prev.perfil, pesoKg: undefined, pesoObjetivoKg: undefined, alturaCm: undefined },
  }));
}

/** Ultimo rendimiento registrado de un ejercicio, con las sesiones de ahora (para un manejador). */
export function ultimaVezDe(id: string): { reps?: number; segundos?: number; pesoKg?: number; fecha: string } | undefined {
  return ultimaVezEn(leer().sesiones, id);
}
