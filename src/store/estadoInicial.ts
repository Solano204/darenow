/**
 * FORJA · estado inicial
 *
 * Los valores por defecto de `Estado`, separados de store.ts para que sean
 * importables sin arrastrar react-native (AppState): eso permite testear
 * "el store queda en estado inicial" con un script de node plano, igual que
 * el resto de tests/*.ts.
 *
 * Ubicacion: src/store/estadoInicial.ts
 */
import type { Estado, PerfilUsuario, Favoritos } from './tipos';

export const PERFIL_INICIAL: PerfilUsuario = {
  nombre: '', objetivo: 'bajar_peso', nivel: 1, diasPorSemana: 3, minPorSesion: 20,
  modoSinSaltos: false, espacio: 'colchoneta', equipo: [], contra: [], vetos: [],
  programaId: 'pg_001', mostrarKcal: true, mostrarPeso: true, sonido: true,
};

export const FAVORITOS_VACIOS: Favoritos = {
  ejercicios: [], musculos: [], rutinas: [], programas: [], tips: [],
};

export const ESTADO_INICIAL: Estado = {
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
