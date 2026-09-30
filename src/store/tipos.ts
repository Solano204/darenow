/**
 * DARENOW · tipos del estado del usuario
 *
 * Separados de store.ts para que estadoInicial.ts los use sin importar el
 * store (y sin ciclo entre ambos). store.ts los re-exporta.
 */

export interface SerieGuardada {
  ejercicioId: string; serieNum: number; lado: 'izq' | 'der' | null;
  reps: number | null; segundos: number | null; pesoKg: number | null; omitida: boolean;
}

export interface SesionGuardada {
  id: string; fecha: string; iniciada: string; duracionS: number;
  /** Solo referencia (para "sesiones de esta rutina"). El contenido real de
   *  lo hecho vive en `series`, capturado en el momento: editar o borrar la
   *  rutina despues NO cambia sesiones ya guardadas. No uses `rutinaId` para
   *  reconstruir que se hizo. */
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
