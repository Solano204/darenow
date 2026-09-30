export const familia = {
  display: 'BigShouldersDisplay_800ExtraBold',
  titulo: 'BigShouldersDisplay_700Bold',
  cuerpo: 'Figtree_400Regular',
  medio: 'Figtree_500Medium',
  enfasis: 'Figtree_600SemiBold',
  negrita: 'Figtree_700Bold',
} as const;

/** Con fuente propia `fontWeight` se ignora en Android: se nombra la familia exacta. */
export const peso = {
  regular: familia.cuerpo,
  semibold: familia.enfasis,
  bold: familia.negrita,
} as const;

const tabular = ['tabular-nums' as const];

export const tipo = {
  display: { fontFamily: familia.display, fontSize: 46, lineHeight: 44, letterSpacing: -0.5 },
  h1: { fontFamily: familia.titulo, fontSize: 26, lineHeight: 28 },
  h2: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 24 },
  h3: { fontFamily: familia.enfasis, fontSize: 17, lineHeight: 22 },
  numero: { fontFamily: familia.display, fontSize: 40, lineHeight: 40, fontVariant: tabular },
  reloj: { fontFamily: familia.display, fontSize: 104, lineHeight: 104, letterSpacing: -1, fontVariant: tabular },
  relojSm: { fontFamily: familia.display, fontSize: 44, lineHeight: 44, fontVariant: tabular },
  cuerpo: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 24 },
  cuerpoEnfasis: { fontFamily: familia.enfasis, fontSize: 17, lineHeight: 22 },
  dato: { fontFamily: familia.enfasis, fontSize: 13, lineHeight: 18, fontVariant: tabular },
  pie: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 19 },
  etiqueta: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18 },
  wordmark: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, letterSpacing: 2 },
};
