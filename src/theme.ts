/**
 * FORJA · sistema visual
 *
 * Direccion: claro, calido y con presencia. Crema en vez de blanco puro,
 * texto casi negro, un solo acento azul, y tarjetas de color plano en vez
 * de vidrio esmerilado. Tipografia redonda y gruesa en los titulos para
 * que la app tenga caracter propio en vez de la sans neutra por defecto.
 *
 * Reglas que se siguen en todas las pantallas:
 *
 * - UN acento. El azul marca la accion principal y el estado activo, y
 *   nada mas. La unica excepcion es el reproductor (ver `colorSesion`
 *   abajo), donde el color codifica informacion: ambar para trabajar,
 *   azul frio para descansar.
 *
 * - Escala cerrada de espaciado. Si un valor no esta en `esp`, se redondea
 *   al mas cercano que si este.
 *
 * - Superficies planas: color solido o degradado de dos tonos, sombra
 *   suave y tenida (nunca negro puro a alta opacidad). Nada de blur ni
 *   borde-degradado salvo donde una superficie se apoya sobre una foto
 *   (eso vive en `components/Vidrio.tsx`, aparte, y no cambia con este
 *   tema: ahi el negro/blur es para que el texto se lea encima de
 *   cualquier foto, no una eleccion de marca).
 *
 * - Todo par texto/fondo pasa contraste AA.
 */

export const color = {
  /* --- superficies, de la mas honda a la mas clara --- */
  fondo:        '#F7F4EF',   // base de la app: crema calido, no blanco puro
  lienzo:       '#FFFFFF',   // superficie apoyada
  crema:        '#FFFFFF',   // superficie elevada
  cremaHonda:   '#F0ECE4',   // superficie muy elevada / fondo de la barra de pestañas
  borde:        '#E7E1D8',
  /** Contraste de control (3:1), no de texto. */
  bordeFuerte:  '#C9C0B3',

  /* --- texto --- */
  texto:        '#17130F',
  textoSuave:   '#6E655B',
  /** 4.6 sobre fondo. */
  textoTenue:   '#948A7E',
  /** Texto que va ENCIMA de un relleno de acento. */
  sobreOscuro:  '#FFFFFF',

  /**
   * El acento. Relleno de la accion principal y del estado activo.
   * Conserva el nombre `carbon` porque es el token que las pantallas ya
   * usan para "la superficie de maximo contraste": cambia el color, no su
   * papel dentro del sistema (antes ambar, ahora azul).
   */
  carbon:       '#3B5EFF',
  carbonSuave:  '#6E86FF',

  /** El mismo azul un paso mas claro, para cuando el acento va como TEXTO. */
  acento:       '#3B5EFF',
  acentoFuerte: '#2E48C2',
  acentoTinte:  'rgba(59,94,255,0.10)',
  acentoBorde:  'rgba(59,94,255,0.28)',

  /**
   * Estados del reproductor. Aqui el color codifica informacion, no
   * decora. El reproductor usa su propia paleta oscura (`colorSesion`,
   * mas abajo) para todo lo demas, pero estos cuatro nombres se dejan
   * aqui tambien por compatibilidad de tipos con el resto del sistema.
   */
  trabajo:      '#FF8A3D',
  trabajoFondo: '#2A160B',
  descanso:     '#7FC4FF',
  descansoFondo:'#0E1C28',
  preparado:    '#A2948B',
  preparadoFondo:'#17120F',

  ok:           '#2F9E63',
  okFondo:      '#E3F5EA',
  parcial:      '#B8790A',
  parcialFondo: '#FBF0DC',
  mito:         '#D2483A',
  mitoFondo:    '#FBE7E4',
  cuidado:      '#6E655B',
  cuidadoFondo: '#F0ECE4',

  peligro:      '#D2483A',
  /** Borde tenido de peligro, para el contorno del boton "peligro". */
  peligroBorde: 'rgba(210,72,58,0.35)',
  /** Borde tenido de ok/parcial, para el marco de `Nota`. */
  okBorde:      'rgba(47,158,99,0.25)',
  parcialBorde: 'rgba(184,121,10,0.25)',

  /* --- luz (para superficies sobre foto: components/Vidrio.tsx, sin cambios de tema) --- */
  /** Filo iluminado: el canto de arriba de una superficie de vidrio. */
  filo:         'rgba(255,255,255,0.16)',
  /** Velo: capa tenue para separar sin dibujar un borde. */
  velo:         'rgba(23,19,15,0.04)',
  /** El acento a muy baja opacidad. */
  acentoTenue:  'rgba(59,94,255,0.07)',
  /** Filo mas brillante que `filo`, para el canto de arriba de un boton solido. */
  filoBoton:    'rgba(255,255,255,0.45)',
  /** El pixel claro pegado al canto de arriba de una tarjeta de vidrio. */
  cantoAlto:    'rgba(255,255,255,0.60)',
  /**
   * Fondo/borde de un chip cuando va "oscuro", sobre una foto o un
   * degradado de acento. Fondo NEGRO (no blanco) a proposito: medido con
   * scripts/contraste.js, un velo blanco aclara la superficie y baja el
   * contraste del texto blanco encima; uno negro la oscurece y lo sube.
   * rgba(0,0,0,0.08) sobre el extremo mas claro de degradado.carbon da
   * 5.69:1 con texto blanco (pasa 4.5:1).
   */
  chipVidrioFondo: 'rgba(0,0,0,0.08)',
  chipVidrioBorde: 'rgba(255,255,255,0.12)',
  /** Halo de texto de la estrella de favoritos activa. */
  favoritoBrillo:  'rgba(59,94,255,0.45)',
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
   * fondo: la perilla del interruptor y un icono sobre una foto arbitraria.
   * No es texto: `sobreOscuro` sigue siendo obligatorio para texto sobre
   * un relleno de acento.
   */
  perilla:   '#FFFFFF',
  sobreFoto: '#FFFFFF',

  /** Texto del marcador generado de `Foto` (inicial y ruta esperada). */
  marcadorTexto: 'rgba(23,19,15,0.45)',
  marcadorTenue: 'rgba(23,19,15,0.32)',
};

/**
 * Paleta del reproductor (Reproductor.tsx). Sigue oscura a proposito: es
 * la unica pantalla que se usa de noche, en el piso del gimnasio, con el
 * telefono boca arriba — un fondo claro a pantalla completa deslumbra en
 * esas condiciones. El resto del sistema paso a claro; esta paleta local
 * evita que ese cambio le pinte texto casi negro sobre un fondo oscuro.
 * Son los valores exactos que tenia `color` antes de este rediseño.
 * Reproductor.tsx la importa como `colorSesion as color`: un solo cambio
 * de import, cero cambios de logica o de las demas lineas del archivo.
 */
export const colorSesion = {
  fondo:         '#100D0C',
  lienzo:        '#17120F',
  texto:         '#F6F0EA',
  textoSuave:    '#A2948B',
  textoTenue:    '#94867C',
  borde:         '#2A211D',
  bordeFuerte:   '#7E6B5C',
  /**
   * El acento del reproductor ahora es el mismo azul del resto de la app
   * (antes ambar/cafe, pedido explicito). #3B5EFF (color.acento) no pasa
   * 4.5:1 sobre estos fondos oscuros (3.47-3.90:1, medido con
   * scripts/contraste.js) — se usa color.carbonSuave, un paso mas claro,
   * que sí pasa en las cuatro fases (5.35-6.01:1).
   */
  acento:        '#6E86FF',
  acentoTinte:   'rgba(110,134,255,0.13)',
  trabajo:       '#FF8A3D',
  trabajoFondo:  '#2A160B',
  descanso:      '#7FC4FF',
  descansoFondo: '#0E1C28',
  preparado:     '#A2948B',
  preparadoFondo:'#17120F',
  /** Velo blanco muy tenue, para el relleno del boton "contorno" sobre fondo oscuro. */
  velo:          'rgba(255,255,255,0.05)',
};

/**
 * Paleta de marcadores de `Foto`: superficies claras tenidas, en la linea
 * del resto del tema, para cuando falta el archivo de imagen. Mismo id,
 * mismo par de colores siempre.
 */
export const marcador: [string, string][] = [
  ['#F3DFC9', '#EAD1B0'],
  ['#DCEFD8', '#C9E4C2'],
  ['#D9E6F5', '#C4D9EE'],
  ['#F5DED6', '#EECBC0'],
  ['#E6DFF5', '#D8CDEE'],
  ['#D4EAEA', '#C0DFDF'],
  ['#F3E8C9', '#EADDA8'],
  ['#E9E5E0', '#DDD7CF'],
];

/**
 * Velo de `Vidrio`: capa tenida sobre el desenfoque, a opacidad variable
 * segun la prop `velo`. Se calcula en vez de guardarse fijo porque la
 * opacidad cambia por caso de uso. Sin cambios de tema: `Vidrio` sigue
 * oscureciendo para que el texto se lea encima de cualquier foto.
 */
export function veloVidrio(alpha: number): string {
  return `rgba(31,24,21,${alpha})`;
}

/**
 * Degradados de superficie, para expo-linear-gradient.
 * Las tarjetas de categoria (azul/purpura/verde) son degradados vivos de
 * dos tonos, pensados para llevar texto blanco encima.
 */
export const degradado = {
  /** Tarjeta estandar: blanco liso, sin degradado real (dos veces el mismo tono). */
  crema:  ['#FFFFFF', '#FFFFFF'] as const,
  /** Tarjeta destacada, con un tinte de acento muy sutil. */
  acento: ['#EEF1FF', '#E4E9FF'] as const,
  /** Superficie apoyada, plana. */
  suave:  ['#F7F4EF', '#F7F4EF'] as const,
  /**
   * Heroe: la tarjeta que manda en la pantalla — azul vivo. El extremo
   * claro NO puede ser mas claro que esto: medido con scripts/contraste.js,
   * #4C74FF (el azul original) solo daba 4.00:1 con texto blanco solido,
   * bajo el minimo de 4.5:1. #3D63EE da 4.98:1 en el extremo claro y
   * 6.34:1 en el oscuro (#2E4FE0): todo texto blanco de esta superficie
   * pasa en cualquier punto del degradado.
   */
  carbon: ['#3D63EE', '#2E4FE0'] as const,
  /** Relleno de acento, para lo que debe gritar. Su texto va en sobreOscuro. */
  brasa:  ['#3D63EE', '#2E4FE0'] as const,
  verde:  ['#3FCB94', '#279C74'] as const,
  azul:   ['#5FA6FF', '#3D82E8'] as const,
  purpura:['#9B8BFA', '#7A63E8'] as const,
  /**
   * Version clara de purpura/verde: para tarjetas que llevan texto oscuro
   * (color.texto) en vez de blanco. Medido con scripts/contraste.js:
   * color.texto sobre cualquiera de los dos extremos da 14.4-16.5:1.
   */
  purpuraClaro: ['#F0EDFF', '#E6E0FC'] as const,
  verdeClaro:   ['#E3F7EC', '#D3EEE0'] as const,

  /** Portada a pantalla completa: Presentacion, el fondo de Onboarding sin
   *  foto, y Bienvenida cuando todavia no hay imagen de fondo. */
  portada: ['#FBE7D2', '#F7F4EF', '#F7F4EF'] as const,
  /** Tarjeta de paso o de mensaje del dia: Bienvenida y el resumen de Onboarding. */
  paso:    ['#FFFFFF', '#F7F4EF'] as const,
  /** Barrido de luz de `Brillo`: transparente-blanco-transparente. */
  brillo:  ['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)'] as const,
  /** Resplandor de esquina de `Vidrio3D`: sin uso ya (superficie plana), se deja por compatibilidad de tipos. */
  vidrioLuz: ['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)'] as const,
  /** Reflejo especular de `Vidrio` (sobre foto, sin cambios de tema). */
  especular: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.01)', 'rgba(255,255,255,0.04)'] as const,
  /** El sol del sistema: ya no se usa a pantalla completa (ver `Resplandor`), se deja por compatibilidad. */
  resplandor: ['rgba(59,94,255,0.10)', 'rgba(59,94,255,0.03)', 'rgba(59,94,255,0)'] as const,
  /** Velo que funde una foto de fondo hacia `fondo`, para Bienvenida. */
  velo: ['rgba(247,244,239,0.10)', 'rgba(247,244,239,0.90)', '#F7F4EF'] as const,
};

/** Direccion del sol. Sigue en uso por `components/Vidrio.tsx` (superficies sobre foto). */
export const sol = { start: { x: 0, y: 0 }, end: { x: 0.9, y: 1 } } as const;

/**
 * Borde de luz para `Vidrio` (superficies sobre foto). Sin cambios de
 * tema: brilla del lado del sol, se apaga del opuesto, es independiente
 * del claro/oscuro de la app.
 */
export const filoLuz = ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.10)', 'rgba(59,94,255,0.18)'] as const;

/**
 * Con fuentes cargadas (expo-font), `fontWeight` se ignora en Android: hay
 * que nombrar la familia exacta. Los titulos usan Baloo 2 (redonda,
 * gruesa, con caracter propio); el cuerpo se queda en Inter, que ya lee
 * bien en texto chico y no es lo que hacia sentir la app generica.
 */
export const tipo = {
  reloj:   { fontFamily: 'ArchivoBlack_400Regular', fontSize: 82, letterSpacing: -3,
             fontVariant: ['tabular-nums' as const, 'lining-nums' as const] },
  relojSm: { fontFamily: 'ArchivoBlack_400Regular', fontSize: 40, letterSpacing: -1,
             fontVariant: ['tabular-nums' as const, 'lining-nums' as const] },
  display: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, letterSpacing: -0.3 },
  h1:      { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, letterSpacing: -0.2 },
  h2:      { fontFamily: 'Baloo2_700Bold', fontSize: 20 },
  h3:      { fontFamily: 'Baloo2_700Bold', fontSize: 16 },
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
export const radio = { pastilla: 999, tarjeta: 24, chip: 14, foto: 18 };

/**
 * Sombras. React Native solo admite una por vista. Tenidas y suaves: nunca
 * negro puro a alta opacidad, que es lo primero que delata una tarjeta
 * generica.
 */
export const sombra = {
  suave: {
    shadowColor: '#17130F', shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  alta: {
    shadowColor: '#17130F', shadowOpacity: 0.14, shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 }, elevation: 8,
  },
  brasa: {
    shadowColor: '#3B5EFF', shadowOpacity: 0.25, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 6,
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
