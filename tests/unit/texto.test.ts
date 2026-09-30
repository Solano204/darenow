import { describe, expect, it } from '@jest/globals';
import { plural } from '../../src/utils/plural';
import {
  capitalizar, textoVisible, textoDePregunta, comillasLatinas, textoDeEtiqueta, textoDeAfirmacion,
  textoDeZonas, textoDeEquipo,
} from '../../src/utils/presentacion';
import {
  textoDeMotivo, textoDeEstadoSesion, textoDeFrecuencia, unidadDeMedicion, PROTOCOLOS_SIN_VALOR,
} from '../../src/utils/textosVisibles';
import { nombreVisible } from '../../src/data/nombresVisibles';

describe('plural', () => {
  it('usa el singular solo con 1', () => {
    expect(plural(1, 'ejercicio')).toBe('ejercicio');
    expect(plural(0, 'ejercicio')).toBe('ejercicios');
    expect(plural(2, 'ejercicio')).toBe('ejercicios');
  });
  it('acepta un plural irregular', () => {
    expect(plural(3, 'sesión', 'sesiones')).toBe('sesiones');
    expect(plural(1, 'sesión', 'sesiones')).toBe('sesión');
  });
  it('trata negativos y decimales como plural', () => {
    expect(plural(-1, 'serie')).toBe('series');
    expect(plural(1.5, 'serie')).toBe('series');
  });
});

describe('capitalizar', () => {
  it('pone mayúscula inicial y deja el resto', () => {
    expect(capitalizar('hola mundo')).toBe('Hola mundo');
    expect(capitalizar('ÉXITO')).toBe('ÉXITO');
  });
  it('no rompe con texto vacío', () => {
    expect(capitalizar('')).toBe('');
  });
  it('funciona con una sola letra', () => {
    expect(capitalizar('a')).toBe('A');
  });
});

describe('nombreVisible / textoVisible', () => {
  it('agrega tildes a palabras conocidas', () => {
    expect(textoVisible('flexion de brazos')).toBe('Flexión de brazos');
  });
  it('deja igual lo que no conoce', () => {
    expect(textoVisible('sentadilla')).toBe('Sentadilla');
    expect(nombreVisible('')).toBe('');
  });
  it('no toca palabras ambiguas', () => {
    expect(nombreVisible('como esta')).toBe('como esta');
  });
});

describe('textoDePregunta', () => {
  it('agrega el signo de apertura y la tilde del interrogativo', () => {
    expect(textoDePregunta('Por que duele?')).toBe('¿Por qué duele?');
    expect(textoDePregunta('Cada cuanto entreno?')).toBe('¿Cada cuánto entreno?');
  });
  it('no duplica el signo de apertura', () => {
    // Comportamiento actual (caracterización): si ya trae «¿», no acentúa el interrogativo.
    expect(textoDePregunta('¿Que es?')).toBe('¿Que es?');
    expect(textoDePregunta('¿Es mito?')).toBe('¿Es mito?');
  });
  it('deja igual lo que no es pregunta', () => {
    expect(textoDePregunta('Esto no es pregunta')).toBe('Esto no es pregunta');
    expect(textoDePregunta('')).toBe('');
  });
});

describe('comillasLatinas', () => {
  it('cambia comillas simples por latinas', () => {
    expect(comillasLatinas("las 'calorias restantes' no existen")).toBe('las «calorias restantes» no existen');
  });
  it('funciona al inicio y antes de puntuación', () => {
    expect(comillasLatinas("'hola', dijo")).toBe('«hola», dijo');
  });
  it('no toca apóstrofes sueltos ni texto vacío', () => {
    expect(comillasLatinas("rock'n roll")).toBe("rock'n roll");
    expect(comillasLatinas('')).toBe('');
  });
});

describe('textoDeEtiqueta y textoDeAfirmacion', () => {
  it('quita guiones bajos y pone mayúscula', () => {
    expect(textoDeEtiqueta('tren_superior')).toBe('Tren superior');
    expect(textoDeAfirmacion('fuerza_pierna')).toBe('Fuerza pierna');
  });
  it('usa la etiqueta especial cuando existe', () => {
    expect(textoDeEtiqueta('cabeza_cuello')).toBe('Cabeza y cuello');
  });
  it('no rompe con vacío', () => {
    expect(textoDeEtiqueta('')).toBe('');
    expect(textoDeAfirmacion('')).toBe('');
  });
});

describe('textoDeZonas', () => {
  it('une las zonas con coma y mayúscula inicial', () => {
    expect(textoDeZonas(['rodilla', 'cadera'])).toBe('Rodilla, cadera');
  });
  it('escribe ATM como sigla', () => {
    expect(textoDeZonas(['atm'])).toBe('ATM');
  });
  it('lista vacía da texto vacío', () => {
    expect(textoDeZonas([])).toBe('');
  });
});

describe('textoDeEquipo', () => {
  it('sin equipo o solo «ninguno» dice Sin equipo', () => {
    expect(textoDeEquipo([])).toBe('Sin equipo');
    expect(textoDeEquipo(['ninguno'])).toBe('Sin equipo');
  });
  it('un id desconocido se muestra tal cual', () => {
    expect(textoDeEquipo(['cosa_rara'])).toBe('Cosa_rara');
  });
  it('solo el primero lleva mayúscula', () => {
    const t = textoDeEquipo(['cosa_a', 'Cosa_b']);
    expect(t).toBe('Cosa_a, cosa_b');
  });
});

describe('textosVisibles', () => {
  it('traduce motivos conocidos y desconocidos', () => {
    expect(textoDeMotivo('muy_dificil')).toBe('Muy difícil');
    expect(textoDeMotivo('otro_motivo')).toBe('Otro motivo');
    expect(textoDeMotivo('')).toBe('');
  });
  it('estado de sesión: completada o parcial', () => {
    expect(textoDeEstadoSesion('completada')).toBe('Completa');
    expect(textoDeEstadoSesion('abandonada')).toBe('Parcial');
    expect(textoDeEstadoSesion('')).toBe('Parcial');
  });
  it('frecuencia con mayúscula inicial', () => {
    expect(textoDeFrecuencia('cada 4 semanas')).toBe('Cada 4 semanas');
    expect(textoDeFrecuencia('')).toBe('');
    expect(textoDeFrecuencia('opcional')).toBe('Opcional');
  });
  it('unidad de medición conocida o indefinida', () => {
    expect(unidadDeMedicion('med_001')).toBe('cm');
    expect(unidadDeMedicion('med_005')).toBe('kg');
    expect(unidadDeMedicion('med_999')).toBeUndefined();
    expect(PROTOCOLOS_SIN_VALOR).toContain('med_003');
  });
});
