/**
 * FORJA · bienvenida diaria
 *
 * Un saludo y un mensaje distinto cada dia, elegidos por la fecha, no al
 * azar: si el usuario cierra y vuelve a abrir, ve el mismo. Cambiar el
 * mensaje cada vez que entra convierte el detalle en ruido.
 *
 * Tono: nada de gritos ni superlativos. Ni "¡ERES IMPARABLE!" ni frases de
 * poster. Lo que sostiene a alguien tres meses es que la app le hable como
 * una persona sensata, no como un entrenador de comercial.
 */

export interface Mensaje { id: string; titulo: string; cuerpo: string }

const MANANA = ['Buenos dias', 'Arriba', 'Buen dia'];
const TARDE = ['Buenas tardes', 'Que tal la tarde', 'Hola'];
const NOCHE = ['Buenas noches', 'Hola', 'Ya de noche'];

export function saludo(nombre?: string): string {
  const h = new Date().getHours();
  const banco = h < 12 ? MANANA : h < 19 ? TARDE : NOCHE;
  const base = banco[new Date().getDate() % banco.length];
  return nombre ? `${base}, ${nombre}` : base;
}

/** Mensajes generales, para cualquier dia. */
const GENERAL: Mensaje[] = [
  { id: 'mot_01', titulo: 'Hoy basta con empezar', cuerpo: 'La parte dificil son los primeros dos minutos. Lo demas se resuelve solo.' },
  { id: 'mot_02', titulo: 'Lo corto tambien cuenta', cuerpo: 'Cinco minutos hechos valen mas que una hora planeada.' },
  { id: 'mot_03', titulo: 'Nadie mira', cuerpo: 'No hay tecnica perfecta el primer dia. Hay tecnica que mejora.' },
  { id: 'mot_04', titulo: 'El promedio gana', cuerpo: 'Seis meses regulares le pasan por encima a tres semanas perfectas.' },
  { id: 'mot_05', titulo: 'Baja el liston', cuerpo: 'Si hoy no tienes ganas, haz la mitad. La mitad sigue siendo mas que nada.' },
  { id: 'mot_06', titulo: 'Sin prisa', cuerpo: 'Progresar despacio es la unica forma de progresar sin lesionarse.' },
  { id: 'mot_07', titulo: 'Tu unica competencia', cuerpo: 'Comparate con quien eras hace un mes, no con nadie mas.' },
  { id: 'mot_08', titulo: 'Los dias malos cuentan', cuerpo: 'Aparecer sin ganas es justo lo que construye el habito.' },
  { id: 'mot_09', titulo: 'Descansar es entrenar', cuerpo: 'El musculo no crece en la sesion, crece despues. Dormir es parte del plan.' },
  { id: 'mot_10', titulo: 'Una cosa a la vez', cuerpo: 'No cambies cinco habitos hoy. Cambia uno y sostenlo.' },
  { id: 'mot_11', titulo: 'La constancia no es motivacion', cuerpo: 'Es haber hecho tan facil empezar que ya no hay que decidirlo.' },
  { id: 'mot_12', titulo: 'Ritmo propio', cuerpo: 'No tienes que seguirle el paso a nadie. El plan se ajusta a ti, no al reves.' },
  { id: 'mot_13', titulo: 'Cuenta lo que hiciste', cuerpo: 'No lo que ibas a hacer. Lo hecho es el unico dato real.' },
  { id: 'mot_14', titulo: 'Vuelve sin castigo', cuerpo: 'Faltar no borra nada. Solo hay que volver a abrir la puerta.' },
];

/** Mensajes para quien lleva racha. */
const CON_RACHA: Mensaje[] = [
  { id: 'mot_15', titulo: 'Vas seguido', cuerpo: 'Lo que llevas ya no es casualidad. Ahora toca no acelerar de mas.' },
  { id: 'mot_16', titulo: 'Mantén el ritmo', cuerpo: 'La tentacion cuando algo funciona es doblar la carga. No lo hagas.' },
  { id: 'mot_17', titulo: 'Sigue sencillo', cuerpo: 'Lo que te trajo hasta aqui es lo mismo que te va a llevar el proximo mes.' },
];

/** Mensajes para quien vuelve despues de faltar. */
const AL_VOLVER: Mensaje[] = [
  { id: 'mot_18', titulo: 'Bien vuelto', cuerpo: 'Retomar cuesta mas que empezar. Hoy con una sesion corta va perfecto.' },
  { id: 'mot_19', titulo: 'Nada se perdio', cuerpo: 'Tu historial sigue completo. Se retoma donde estaba.' },
  { id: 'mot_20', titulo: 'Empieza suave', cuerpo: 'Los tendones tardan mas que los musculos. Hoy no es dia de records.' },
];

/** Mensajes para el primer dia. */
const PRIMER_DIA: Mensaje[] = [
  { id: 'mot_21', titulo: 'Bienvenido', cuerpo: 'El objetivo del primer mes no es quemar nada: es que aparezcas.' },
];

function indiceDelDia(n: number): number {
  const d = new Date();
  const clave = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  return clave % n;
}

export function mensajeDelDia(opciones: {
  sesiones: number; diasRacha: number; diasSinEntrenar: number;
}): Mensaje {
  if (opciones.sesiones === 0) return PRIMER_DIA[0];
  if (opciones.diasSinEntrenar >= 4) return AL_VOLVER[indiceDelDia(AL_VOLVER.length)];
  if (opciones.diasRacha >= 5) return CON_RACHA[indiceDelDia(CON_RACHA.length)];
  return GENERAL[indiceDelDia(GENERAL.length)];
}
