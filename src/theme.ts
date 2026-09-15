/**
 * FORJA · sistema visual
 *
 * Direccion: sesion nocturna. Carbon calido, una sola brasa ambar, y datos
 * que se leen de un vistazo desde el suelo.
 *
 * Por que oscuro: la app se usa en el gimnasio, en casa temprano o de
 * noche, muchas veces con el telefono en el suelo. Un fondo claro a
 * pantalla completa deslumbra en esas condiciones. Se usa carbon calido
 * (#100D0C) y no negro puro para evitar el halo de los paneles OLED.
 *
 * Reglas que se siguen en todas las pantallas:
 *
 * - UNA fuente de luz. Todo brillo de canto, todo borde iluminado y toda
 *   sombra obedecen al mismo angulo: arriba a la izquierda. Cuando cada
 *   tarjeta inventa su propia luz, el ojo detecta la mentira aunque no
 *   sepa nombrarla.
 *
 * - UN acento. La brasa marca la accion principal y el estado activo, y
 *   nada mas. La unica excepcion es el reproductor, donde el color
 *   codifica informacion: ambar para trabajar, azul frio para descansar.
 *   Familias opuestas, para distinguirlas de reojo sin enfocar la vista.
 *
 * - Escala cerrada de espaciado. Si un valor no esta en `esp`, se redondea
 *   al mas cercano que si este.
 *
 * - Nada de barras gruesas de color pegadas al margen de un bloque de
 *   texto. Un bloque destacado se distingue por su fondo y su forma.
 *
 * - Todo par texto/fondo pasa contraste AA.
 */

export const color = {
  /* --- superficies, de la mas honda a la mas elevada --- */
  fondo:        '#100D0C',   // base de la app
  lienzo:       '#17120F',   // superficie apoyada
  crema:        '#1F1815',   // superficie elevada
  cremaHonda:   '#261D18',   // superficie muy elevada
  borde:        '#2A211D',
  /** 3.82 sobre fondo · 3.26 sobre cremaHonda. Contraste de control (3:1), no de texto. */
  bordeFuerte:  '#7E6B5C',

  /* --- texto --- */
  texto:        '#F6F0EA',
  textoSuave:   '#A2948B',
  /** 5.49 sobre fondo · 4.69 sobre cremaHonda. */
  textoTenue:   '#94867C',
  /** Texto que va ENCIMA de un relleno de brasa. Tinta oscura. */
  sobreOscuro:  '#1B0F06',

  /**
   * La brasa. Relleno de la accion principal y del estado activo.
   * Conserva el nombre `carbon` porque es el token que las pantallas ya
   * usan para "la superficie de maximo contraste": cambia el color, no su
   * papel dentro del sistema.
   *
   * Cafe/caramelo en vez de naranja (pedido explicito). Contraste
   * verificado igual que antes: ver DISEÑO.md, seccion de color.
   */
  carbon:       '#C68A4E',
  carbonSuave:  '#D9A672',

  /**
   * Acento. El mismo ambar un paso mas claro, para cuando la brasa va
   * como TEXTO sobre fondo oscuro y necesita mas luminancia para pasar AA.
   */
  acento:       '#D9A672',
  acentoFuerte: '#C68A4E',
  acentoTinte:  'rgba(198,138,78,0.13)',
  acentoBorde:  'rgba(198,138,78,0.32)',

  /**
   * Estados del reproductor. Aqui el color codifica informacion, no
   * decora: es la unica parte de la app con una segunda familia cromatica.
   */
  trabajo:      '#FF8A3D',
  trabajoFondo: '#2A160B',
  descanso:     '#7FC4FF',
  descansoFondo:'#0E1C28',
  preparado:    '#A2948B',
  preparadoFondo:'#17120F',

  ok:           '#6FD79A',
  okFondo:      '#12241B',
  parcial:      '#FFC46B',
  parcialFondo: '#2A1F0C',
  mito:         '#FF8873',
  mitoFondo:    '#2A1512',
  cuidado:      '#A2948B',
  cuidadoFondo: '#1F1815',

  peligro:      '#E5604A',
  /** Borde tenido de peligro, para el contorno del boton "peligro". */
  peligroBorde: 'rgba(229,96,74,0.4)',
  /** Borde tenido de ok/parcial, para el marco de `Nota`. */
  okBorde:      'rgba(111,215,154,0.20)',
  parcialBorde: 'rgba(255,196,107,0.22)',

  /* --- luz --- */
  /** Filo iluminado: el canto de arriba de una superficie. */
  filo:         'rgba(255,255,255,0.16)',
  /** Velo: capa tenue para separar sin dibujar un borde. */
  velo:         'rgba(255,255,255,0.05)',
  /** Brasa a muy baja opacidad: el segundo orbe de fondo en Presentacion. */
  acentoTenue:  'rgba(198,138,78,0.08)',
  /** Filo mas brillante que `filo`, para el canto de arriba de un boton solido. */
  filoBoton:    'rgba(255,255,255,0.45)',
  /** El pixel claro pegado al canto de arriba de una tarjeta de vidrio. */
  cantoAlto:    'rgba(255,255,255,0.34)',
  /** Fondo/borde de un chip cuando va "oscuro", sobre una foto. */
  chipVidrioFondo: 'rgba(255,255,255,0.08)',
  chipVidrioBorde: 'rgba(255,255,255,0.12)',
  /** Halo de texto de la estrella de favoritos activa. */
  favoritoBrillo:  'rgba(198,138,78,0.55)',
  /** Sombra de texto/icono para que se lea encima de una foto cualquiera. */
  sombraSobreFoto: 'rgba(0,0,0,0.45)',
  /** Velo de fondo para superficies de vidrio a pantalla completa (modales). */
  veloFondo:    'rgba(9,7,6,0.55)',
  /** Velo mas claro, para una pastilla de vidrio encima de una foto. */
  veloPastilla: 'rgba(16,13,12,0.45)',
  /** Borde de una pastilla de vidrio. */
  bordeVidrio:  'rgba(255,255,255,0.14)',

  /**
   * Blanco puro. Reservado para lo que debe verse igual sobre CUALQUIER
   * fondo: la perilla del interruptor (cruza de bordeFuerte a carbon) y un
   * icono sobre una foto arbitraria. No es texto: `sobreOscuro` sigue
   * siendo obligatorio para texto sobre un relleno de brasa.
   */
  perilla:   '#FFFFFF',
  sobreFoto: '#FFFFFF',

  /** Texto del marcador generado de `Foto` (inicial y ruta esperada). */
  marcadorTexto: 'rgba(246,240,234,0.40)',
  marcadorTenue: 'rgba(246,240,234,0.30)',
};

/**
 * Paleta de marcadores de `Foto`: superficies oscuras tenidas, en la linea
 * del resto del tema, para cuando falta el archivo de imagen. Mismo id,
 * mismo par de colores siempre.
 */
export const marcador: [string, string][] = [
  ['#3A2617', '#1E1512'],
  ['#22301F', '#151C16'],
  ['#1E2733', '#141920'],
  ['#33231F', '#1C1413'],
  ['#2A2233', '#17131C'],
  ['#1D2E30', '#131C1D'],
  ['#332B18', '#1B1710'],
  ['#2B2724', '#171514'],
];

/**
 * Velo de `Vidrio`: capa tenida sobre el desenfoque, a opacidad variable
 * segun la prop `velo`. Se calcula en vez de guardarse fijo porque la
 * opacidad cambia por caso de uso.
 */
export function veloVidrio(alpha: number): string {
  return `rgba(31,24,21,${alpha})`;
}

/**
 * Degradados de superficie, para expo-linear-gradient.
 * Todos van de arriba-izquierda a abajo-derecha: la direccion del sol.
 */
export const degradado = {
  /** Tarjeta estandar. */
  crema:  ['#211A16', '#171210'] as const,
  /** Tarjeta destacada, con un punto de calor. */
  acento: ['#33231A', '#1A1311'] as const,
  /** Superficie apoyada, mas plana. */
  suave:  ['#1D1714', '#161211'] as const,
  /** Heroe: la tarjeta que manda en la pantalla. */
  carbon: ['#2B201A', '#141110'] as const,
  /** Relleno de brasa, para lo que debe gritar. Su texto va en sobreOscuro. */
  brasa:  ['#D9A672', '#B27A3E'] as const,
  verde:  ['#18251D', '#131A17'] as const,
  azul:   ['#151E28', '#121719'] as const,

  /** Portada a pantalla completa: Presentacion, el fondo de Onboarding sin
   *  foto, y Bienvenida cuando todavia no hay imagen de fondo. */
  portada: ['#2A1A12', '#16100E', '#100D0C'] as const,
  /** Tarjeta de paso o de mensaje del dia: Bienvenida y el resumen de Onboarding. */
  paso:    ['#241C17', '#171210'] as const,
  /** Barrido de luz de `Brillo`: transparente-blanco-transparente. */
  brillo:  ['rgba(255,255,255,0)', 'rgba(255,255,255,0.13)', 'rgba(255,255,255,0)'] as const,
  /** Resplandor de esquina de `Vidrio3D`: la luz interior del vidrio. */
  vidrioLuz: ['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)'] as const,
  /** Reflejo especular de `Vidrio`. */
  especular: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.01)', 'rgba(255,255,255,0.04)'] as const,
  /** El sol del sistema: resplandor ambar fijo arriba a la izquierda de cada pantalla. */
  resplandor: ['rgba(198,138,78,0.20)', 'rgba(198,138,78,0.05)', 'rgba(198,138,78,0)'] as const,
  /** Velo que funde una foto de fondo hacia `fondo`, para Bienvenida. */
  velo: ['rgba(16,13,12,0.10)', 'rgba(16,13,12,0.88)', '#100D0C'] as const,
};

/** Direccion del sol. Se usa como start/end en cada LinearGradient. */
export const sol = { start: { x: 0, y: 0 }, end: { x: 0.9, y: 1 } } as const;

/**
 * Borde de luz: brilla del lado del sol y se apaga del opuesto. Es el
 * detalle que separa una superficie que parece vidrio de un rectangulo
 * gris. Se pinta como degradado de 1px por detras de la tarjeta.
 */
export const filoLuz = ['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.04)', 'rgba(198,138,78,0.18)'] as const;

/**
 * Con fuentes cargadas (expo-font), `fontWeight` se ignora en Android: hay
 * que nombrar la familia exacta. `display` usa Inter_700Bold y no Archivo
 * Black — decision razonada en DISEÑO.md, seccion Tipografia.
 */
export const tipo = {
  reloj:   { fontFamily: 'ArchivoBlack_400Regular', fontSize: 82, letterSpacing: -3,
             fontVariant: ['tabular-nums' as const, 'lining-nums' as const] },
  relojSm: { fontFamily: 'ArchivoBlack_400Regular', fontSize: 40, letterSpacing: -1,
             fontVariant: ['tabular-nums' as const, 'lining-nums' as const] },
  display: { fontFamily: 'Inter_700Bold', fontSize: 34, letterSpacing: -0.8 },
  h1:      { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.5 },
  h2:      { fontFamily: 'Inter_600SemiBold', fontSize: 21, letterSpacing: -0.3 },
  h3:      { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  cuerpo:  { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23 },
  dato:    { fontFamily: 'Inter_600SemiBold', fontSize: 13, fontVariant: ['tabular-nums' as const] },
  pie:     { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  micro:   { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.3 },
};

/** Pesos de Inter para overrides puntuales (fontWeight no basta con fuente propia). */
export const peso = {
  regular:   'Inter_400Regular',
  semibold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
} as const;

export const esp = { xs: 4, sm: 8, md: 16, lg: 24, xl: 36 };
export const radio = { pastilla: 999, tarjeta: 22, chip: 12, foto: 16 };

/**
 * Sombras. React Native solo admite una por vista, asi que la "sombra de
 * contacto" se simula con el filo iluminado del canto y aqui quedan los
 * niveles de altura.
 */
export const sombra = {
  suave: {
    shadowColor: '#000000', shadowOpacity: 0.55, shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }, elevation: 6,
  },
  alta: {
    shadowColor: '#000000', shadowOpacity: 0.70, shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 }, elevation: 12,
  },
  brasa: {
    shadowColor: '#C68A4E', shadowOpacity: 0.45, shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
};

export const TOQUE = 52;

export const insignia = {
  ok:      { fg: color.ok,      bg: color.okFondo,      texto: 'Comprobado' },
  parcial: { fg: color.parcial, bg: color.parcialFondo, texto: 'Parcial' },
  mito:    { fg: color.mito,    bg: color.mitoFondo,    texto: 'Mito' },
  cuidado: { fg: color.cuidado, bg: color.cuidadoFondo, texto: 'Cuidado' },
} as const;

export const anim = { rapida: 160, normal: 260, lenta: 420, muyLenta: 1100 };
