import { useCallback, useState } from 'react';
import { ESTADISTICAS } from '../data/catalog';

export interface Lamina {
  id: string;
  titulo: string;
  cuerpo: string;
  pie?: string;
}

export const LAMINAS: Lamina[] = [
  {
    id: 'intro_04',
    titulo: 'Gratis. Todo. Sin trucos',
    cuerpo: `${ESTADISTICAS.rutinas} rutinas y ${ESTADISTICAS.programas} programas completos, sin versión de prueba ni funciones bloqueadas.`,
    pie: 'Sin tarjeta, sin suscripción, sin compras dentro de la app.',
  },
  {
    id: 'intro_01',
    titulo: 'Entrena lo que tú quieras trabajar',
    cuerpo: `${ESTADISTICAS.ejercicios} ejercicios en ocho objetivos: bajar peso, músculo, mandíbula, postura, cardio, correr, gym y calistenia.`,
    pie: `${ESTADISTICAS.sinEquipo} de ellos no necesitan nada de equipo.`,
  },
  {
    id: 'intro_02',
    titulo: 'La sesión cabe en tu tiempo',
    cuerpo: 'Dinos cuántos minutos tienes y el plan se ajusta a eso. Si un día no los tienes, hay una sesión de cinco minutos que cuenta igual.',
    pie: 'Nada de rachas que se rompen y castigan.',
  },
  {
    id: 'intro_03',
    titulo: 'Te decimos lo que sí funciona, y lo que no',
    cuerpo: 'Cada ejercicio lleva su insignia: Comprobado, Parcial o Mito. No te vamos a prometer que los abdominales queman la panza.',
    pie: `${ESTADISTICAS.mitos} mitos explicados con su razón.`,
  },
];

export function usePresentacion(onTerminar: () => void) {
  const [i, setI] = useState(0);
  const esUltima = i === LAMINAS.length - 1;

  const avanzar = useCallback(() => {
    if (esUltima) return onTerminar();
    setI(n => n + 1);
  }, [esUltima, onTerminar]);

  return { i, laminas: LAMINAS, esUltima, avanzar, saltar: onTerminar };
}
