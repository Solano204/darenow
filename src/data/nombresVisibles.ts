/**
 * Ortografia de los nombres y titulos en pantalla (ejercicios, rutinas,
 * programas, musculos, salas y tips).
 *
 * El catalogo (`assets/data/*.json`) guarda estos textos sin tilde y esos mismos
 * textos son la clave de busqueda de Explorar, Aprender y el editor de rutinas
 * (`name.toLowerCase().includes(...)`): corregirlos en el dato haria que quien
 * escribe «flexion» dejara de encontrar «Flexión». Por eso la tilde se pone aqui,
 * en la capa de presentacion, y el dato no se toca.
 */

const PALABRAS: Record<string, string> = {
  abduccion: 'abducción', activacion: 'activación', alimentacion: 'alimentación', alineacion: 'alineación',
  balon: 'balón', basica: 'básica', biceps: 'bíceps', bulgara: 'búlgara', cajon: 'cajón',
  cigomaticos: 'cigomáticos', circulos: 'círculos', cuadriceps: 'cuádriceps', deglucion: 'deglución',
  descompresion: 'descompresión', despues: 'después', dia: 'día', dias: 'días', dificil: 'difícil',
  digastrico: 'digástrico', dinamica: 'dinámica', elevacion: 'elevación', eliptica: 'elíptica',
  estatica: 'estática', extension: 'extensión', flexion: 'flexión', gluteo: 'glúteo', iliaco: 'ilíaco',
  intrinseca: 'intrínseca', isometrica: 'isométrica', isometrico: 'isométrico', jalon: 'jalón',
  liberacion: 'liberación', mandibula: 'mandíbula', mas: 'más', maquina: 'máquina', menton: 'mentón',
  metodo: 'método', minima: 'mínima', multifidos: 'multífidos', musculo: 'músculo', nordico: 'nórdico',
  pajaro: 'pájaro', pelvico: 'pélvico', posicion: 'posición', presion: 'presión', progresion: 'progresión',
  proteina: 'proteína', rapida: 'rápida', rapido: 'rápido', respiracion: 'respiración', retraccion: 'retracción',
  rotacion: 'rotación', sesion: 'sesión', soleo: 'sóleo', suspension: 'suspensión', talon: 'talón',
  tecnica: 'técnica', tension: 'tensión', toracica: 'torácica', torsion: 'torsión', traccion: 'tracción',
  triceps: 'tríceps', unico: 'único', version: 'versión',
};

const PALABRA = new RegExp(`\\b(${Object.keys(PALABRAS).join('|')})\\b`, 'gi');

/** Interrogativas que solo se acentuan en un titulo concreto (la misma palabra, sin tilde, es correcta en otros). */
const FRASES: [RegExp, string][] = [
  [/^Cuando volver\b/, 'Cuándo volver'],
  [/^Que dice\b/, 'Qué dice'],
];

/** El nombre o titulo con su ortografia correcta. Solo para mostrar: no usar como clave de busqueda. */
export function nombreVisible(nombre: string): string {
  const conFrase = FRASES.reduce((t, [patron, cambio]) => t.replace(patron, cambio), nombre);
  return conFrase.replace(PALABRA, m => {
    const correcta = PALABRAS[m.toLowerCase()];
    return m[0] === m[0].toUpperCase() ? correcta[0].toUpperCase() + correcta.slice(1) : correcta;
  });
}
