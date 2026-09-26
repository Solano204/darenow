/**
 * Ortografia de los nombres de ejercicio en pantalla.
 *
 * El catalogo (`assets/data/*.json`) guarda los nombres sin tilde y esos
 * mismos textos son la clave de busqueda de Explorar y del editor de rutinas
 * (`name.toLowerCase().includes(...)`): corregirlos en el dato haria que quien
 * escribe «flexion» dejara de encontrar «Flexión». Por eso la tilde se pone
 * aqui, en la capa de presentacion, y el dato no se toca.
 */

const PALABRAS: Record<string, string> = {
  abduccion: 'abducción', activacion: 'activación', alineacion: 'alineación', balon: 'balón',
  biceps: 'bíceps', bulgara: 'búlgara', cajon: 'cajón', circulos: 'círculos',
  cuadriceps: 'cuádriceps', deglucion: 'deglución', descompresion: 'descompresión', dias: 'días',
  dinamica: 'dinámica', elevacion: 'elevación', eliptica: 'elíptica', estatica: 'estática',
  extension: 'extensión', flexion: 'flexión', gluteo: 'glúteo', isometrica: 'isométrica',
  isometrico: 'isométrico', jalon: 'jalón', liberacion: 'liberación', maquina: 'máquina',
  menton: 'mentón', metodo: 'método', nordico: 'nórdico', pajaro: 'pájaro', posicion: 'posición',
  presion: 'presión', progresion: 'progresión', rapida: 'rápida', respiracion: 'respiración',
  retraccion: 'retracción', rotacion: 'rotación', suspension: 'suspensión', talon: 'talón',
  tension: 'tensión', toracica: 'torácica', torsion: 'torsión', triceps: 'tríceps',
};

const PALABRA = new RegExp(`\\b(${Object.keys(PALABRAS).join('|')})\\b`, 'gi');

/** El nombre del ejercicio con su ortografia correcta. Solo para mostrar: no usar como clave de busqueda. */
export function nombreVisible(nombre: string): string {
  return nombre.replace(PALABRA, m => {
    const correcta = PALABRAS[m.toLowerCase()];
    return m[0] === m[0].toUpperCase() ? correcta[0].toUpperCase() + correcta.slice(1) : correcta;
  });
}
