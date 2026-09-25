/**
 * Goma y Magnesia. Ver DESIGN.md.
 *
 * `paleta` son los tokens nuevos. `color`, `degradado` y el resto de nombres
 * antiguos se conservan apuntando a esta paleta, para que las pantallas que
 * no se rehacen hereden el sistema sin cambiar de API.
 */

export const paleta = {
  goma: '#1B1C1E',
  gomaAlta: '#242528',
  gomaBorde: '#34363A',
  magnesia: '#F2F1EC',
  magnesia2: '#B9B7B0',
  magnesia3: '#7E7C77',
  placaAzul: '#2553E8',
  placaAzulPresionado: '#1C43C4',
  placaVerde: '#1FA463',
  placaAmarilla: '#F2C230',
  placaRoja: '#E0412F',

  // Variantes medidas para texto (WCAG AA sobre goma-alta o sobre su propio tinte al 16 %).
  magnesia3Texto: '#96948E',
  placaAzulTexto: '#6F8DFF',
  placaVerdeTexto: '#3DBE7A',
  placaRojaTexto: '#FF6F5E',

  blanco: '#FFFFFF',
} as const;

/** Orden real de las placas olímpicas en la barra de progreso. */
export const PLACAS = [paleta.placaVerde, paleta.placaAmarilla, paleta.placaAzul, paleta.placaRoja] as const;

export const polvo = {
  velo: 'rgba(242,241,236,0.35)',
  particula: 'rgba(242,241,236,1)',
};

export const tinte = {
  verde: 'rgba(31,164,99,0.16)',
  amarilla: 'rgba(242,194,48,0.16)',
  roja: 'rgba(224,65,47,0.16)',
  neutra: 'rgba(242,241,236,0.06)',
  notaEntrenador: 'rgba(36,37,40,0.85)',
};

export const color = {
  fondo: paleta.goma,
  lienzo: paleta.gomaAlta,
  crema: paleta.gomaAlta,
  cremaHonda: paleta.gomaAlta,
  borde: paleta.gomaBorde,
  /** Borde de control: 3.7:1 sobre goma-alta. */
  bordeFuerte: paleta.magnesia3,

  texto: paleta.magnesia,
  textoSuave: paleta.magnesia2,
  textoTenue: paleta.magnesia3Texto,
  sobreOscuro: paleta.blanco,

  /** Relleno de la acción: el único color de acción. */
  carbon: paleta.placaAzul,
  /** El azul un paso más claro, para cuando el acento va como texto o glifo. */
  carbonSuave: paleta.placaAzulTexto,
  acento: paleta.placaAzulTexto,
  acentoFuerte: paleta.placaAzulPresionado,
  acentoTinte: 'rgba(37,83,232,0.18)',
  acentoBorde: 'rgba(111,141,255,0.40)',

  trabajo: '#FF8A3D',
  trabajoFondo: '#2A160B',
  descanso: '#7FC4FF',
  descansoFondo: '#0E1C28',
  preparado: '#A2948B',
  preparadoFondo: '#17120F',

  ok: paleta.placaVerdeTexto,
  okFondo: tinte.verde,
  parcial: paleta.placaAmarilla,
  parcialFondo: tinte.amarilla,
  mito: paleta.placaRojaTexto,
  mitoFondo: tinte.roja,
  cuidado: paleta.magnesia2,
  cuidadoFondo: 'rgba(242,241,236,0.06)',

  peligro: paleta.placaRojaTexto,
  peligroBorde: 'rgba(224,65,47,0.45)',
  okBorde: 'rgba(31,164,99,0.35)',
  parcialBorde: 'rgba(242,194,48,0.35)',

  barraPestanas: 'rgba(36,37,40,0.96)',
  barraPestanasBlur: 'rgba(36,37,40,0.72)',
  /** Oscurece un 5 % una tarjeta mientras se presiona. */
  presionado: 'rgba(0,0,0,0.05)',
  filo: 'rgba(255,255,255,0.16)',
  velo: 'rgba(242,241,236,0.04)',
  acentoTenue: 'rgba(37,83,232,0.10)',
  filoBoton: 'rgba(255,255,255,0.20)',
  cantoAlto: 'rgba(255,255,255,0.10)',
  chipVidrioFondo: 'rgba(0,0,0,0.30)',
  chipVidrioBorde: 'rgba(255,255,255,0.12)',
  favoritoBrillo: 'rgba(111,141,255,0.45)',
  sombraSobreFoto: 'rgba(0,0,0,0.45)',
  veloFondo: 'rgba(0,0,0,0.60)',
  veloPastilla: 'rgba(16,13,12,0.45)',
  bordeVidrio: 'rgba(255,255,255,0.14)',

  perilla: paleta.blanco,
  sobreFoto: paleta.blanco,
  marcadorTexto: 'rgba(242,241,236,0.45)',
  marcadorTenue: 'rgba(242,241,236,0.32)',
};

/** El reproductor conserva su paleta propia: fuera del alcance de este rediseño. */
export const colorSesion = {
  fondo: '#100D0C',
  lienzo: '#17120F',
  texto: '#F6F0EA',
  textoSuave: '#A2948B',
  textoTenue: '#94867C',
  borde: '#2A211D',
  bordeFuerte: '#7E6B5C',
  acento: '#6E86FF',
  acentoTinte: 'rgba(110,134,255,0.13)',
  trabajo: '#FF8A3D',
  trabajoFondo: '#FFFFFF',
  descanso: '#7FC4FF',
  descansoFondo: '#0E1C28',
  preparado: '#A2948B',
  preparadoFondo: '#17120F',
  velo: 'rgba(255,255,255,0.05)',
};

export const marcador: [string, string][] = [
  ['#26272A', '#2E2F33'],
  ['#27282B', '#303136'],
  ['#25272A', '#2D3034'],
  ['#28272A', '#313035'],
  ['#262829', '#2F3233'],
  ['#272729', '#303032'],
  ['#28282A', '#313134'],
  ['#262628', '#2F2F32'],
];

export function veloVidrio(alpha: number): string {
  return `rgba(31,24,21,${alpha})`;
}

const GOMA_0 = 'rgba(27,28,30,0)';

export const degradado = {
  crema: [paleta.gomaAlta, paleta.gomaAlta] as const,
  acento: ['#242A3F', '#232B44'] as const,
  suave: [paleta.goma, paleta.goma] as const,
  carbon: [paleta.placaAzul, paleta.placaAzul] as const,
  brasa: [paleta.placaAzul, paleta.placaAzul] as const,
  verde: [paleta.gomaAlta, paleta.gomaAlta] as const,
  azul: [paleta.gomaAlta, paleta.gomaAlta] as const,
  purpura: [paleta.gomaAlta, paleta.gomaAlta] as const,
  background: [paleta.goma, paleta.goma] as const,
  purpuraClaro: [paleta.gomaAlta, paleta.gomaAlta] as const,
  verdeClaro: [paleta.gomaAlta, paleta.gomaAlta] as const,

  portada: [paleta.goma, paleta.goma, paleta.goma] as const,
  paso: [paleta.gomaAlta, paleta.gomaAlta] as const,
  brillo: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)'] as const,
  vidrioLuz: ['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)'] as const,
  especular: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.01)', 'rgba(255,255,255,0.04)'] as const,
  resplandor: [GOMA_0, GOMA_0, GOMA_0] as const,
  /** Oscurece el borde superior de una foto para que se lea el encabezado. */
  veloArriba: ['rgba(27,28,30,0.78)', GOMA_0] as const,
  /** Funde una foto hacia goma. Sin velo blanco. Locations sugeridas: 0.2, 0.5, 0.78, 1. */
  velo: [GOMA_0, 'rgba(27,28,30,0.55)', 'rgba(27,28,30,0.94)', paleta.goma] as const,
};

export const sol = { start: { x: 0, y: 0 }, end: { x: 0.9, y: 1 } } as const;

export const filoLuz = ['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.10)'] as const;

export const insignia = {
  ok: { fg: color.ok, bg: color.okFondo, texto: 'Comprobado' },
  parcial: { fg: color.parcial, bg: color.parcialFondo, texto: 'Parcial' },
  mito: { fg: color.mito, bg: color.mitoFondo, texto: 'Mito' },
  cuidado: { fg: color.cuidado, bg: color.cuidadoFondo, texto: 'Cuidado' },
} as const;
