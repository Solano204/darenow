/**
 * Ortografia de los textos del catalogo en pantalla: nombres y titulos
 * (ejercicios, rutinas, programas, musculos, salas, tips) y los textos de la
 * ficha de ejercicio (descripcion, pasos, claves, errores, respiracion,
 * afirmaciones de evidencia).
 *
 * El catalogo (`assets/data/*.json`) esta escrito sin tildes y esos textos son
 * la clave de busqueda de Explorar, Aprender y el editor de rutinas
 * (`name.toLowerCase().includes(...)`), o son identificadores (las claves de
 * evidencia): corregirlos en el dato haria que quien escribe «flexion» dejara de
 * encontrar «Flexión». Por eso la tilde se pone aqui, en la capa de
 * presentacion, y el dato no se toca.
 *
 * Solo entran palabras sin ambiguedad. Se dejan fuera a proposito las que
 * cambian de significado con la tilde (esta/está, si/sí, aun/aún, solo,
 * continua/continúa, perdida/pérdida, como, cuando, que...).
 */

const PARES = `
abduccion:abducción aduccion:aducción activacion:activación alimentacion:alimentación alla:allá
alineacion:alineación angulo:ángulo antiextension:antiextensión antiflexion:antiflexión
antirotacion:antirrotación articulacion:articulación asi:así asimetrias:asimetrías atras:atrás
automaticamente:automáticamente balon:balón basica:básica basico:básico biceps:bíceps bulgara:búlgara
buscaras:buscarás cajon:cajón calorico:calórico capsula:cápsula catalogo:catálogo
centimetros:centímetros cigomaticos:cigomáticos circulo:círculo circulos:círculos clasica:clásica
clasico:clásico clavicula:clavícula clinica:clínica clinico:clínico cojin:cojín colocate:colócate
comoda:cómoda comodamente:cómodamente comodo:cómodo comun:común congestion:congestión
contraccion:contracción coordinacion:coordinación correccion:corrección cronica:crónica
cronico:crónico cronometro:cronómetro cuadriceps:cuádriceps cuelgate:cuélgate deberias:deberías
deficit:déficit definicion:definición deglucion:deglución dejalas:déjalas dejandose:dejándose
demas:demás descompresion:descompresión deslizala:deslízala deslizaras:deslizarás
desplazate:desplázate despues:después desviacion:desviación detras:detrás diagnostico:diagnóstico
diametro:diámetro dia:día dias:días dificil:difícil digastrico:digástrico dinamica:dinámica
dinamicas:dinámicas dinamico:dinámico direccion:dirección dorsiflexion:dorsiflexión duracion:duración
economia:economía elevacion:elevación eliptica:elíptica encontro:encontró energetico:energético
energia:energía escalon:escalón escapula:escápula escapulas:escápulas especifica:específica
estatica:estática estatico:estático estimulo:estímulo estres:estrés excentrico:excéntrico
exhalacion:exhalación extension:extensión facil:fácil flexion:flexión fraccion:fracción frio:frío
funcion:función gluteo:glúteo gluteos:glúteos habito:hábito humero:húmero iliaco:ilíaco
inclinacion:inclinación inclinate:inclínate indices:índices inespecifico:inespecífico
intrinseca:intrínseca isometrica:isométrica isometrico:isométrico isometricos:isométricos
jalon:jalón lanzalo:lánzalo lesion:lesión levantate:levántate liberacion:liberación
limitacion:limitación limite:límite limites:límites linea:línea lineas:líneas locomocion:locomoción
mandibula:mandíbula manten:mantén mas:más maquina:máquina maquinas:máquinas
masticacion:masticación maxima:máxima maximo:máximo maximos:máximos mayoria:mayoría
mecanica:mecánica mecanicas:mecánicas medico:médico menique:meñique menton:mentón metodo:método
metronomo:metrónomo minima:mínima minimo:mínimo minimos:mínimos moviendose:moviéndose
multifidos:multífidos muevete:muévete muneca:muñeca munecas:muñecas musculo:músculo
musculos:músculos ningun:ningún nordico:nórdico numero:número obstruccion:obstrucción opcion:opción
organos:órganos osea:ósea oseo:óseo pajaro:pájaro participacion:participación pasalo:pásalo
pasaras:pasarás patron:patrón pelvica:pélvica pelvico:pélvico pelvicos:pélvicos platano:plátano
pliometria:pliometría porcion:porción posicion:posición preparacion:preparación presion:presión
prevencion:prevención progresion:progresión proporcion:proporción proposito:propósito
proteccion:protección proteina:proteína protraidas:protraídas protrusion:protrusión puno:puño
punos:puños quemazon:quemazón rapida:rápida rapidas:rápidas rapido:rápido razon:razón
recogelo:recógelo recuperacion:recuperación reduccion:reducción reeducacion:reeducación
rehabilitacion:rehabilitación relacion:relación relajacion:relajación remodelacion:remodelación
repeticion:repetición respiracion:respiración retraccion:retracción retraidas:retraídas
retroversion:retroversión rigida:rígida rigidas:rígidas rigido:rígido rigidos:rígidos
ritmica:rítmica rotacion:rotación rotula:rótula segun:según sensacion:sensación sesion:sesión
sientate:siéntate sillin:sillín sintiendote:sintiéndote sintomas:síntomas soleo:sóleo solida:sólida
sonrie:sonríe succion:succión sujetandose:sujetándose sujetate:sujétate supinacion:supinación
suspension:suspensión talon:talón tambien:también tecnica:técnica tecnicamente:técnicamente
tecnicas:técnicas tecnico:técnico telefono:teléfono tendon:tendón tension:tensión
toracica:torácica tocandola:tocándola tocandose:tocándose torax:tórax torsion:torsión
traccion:tracción transicion:transición triceps:tríceps tumbate:túmbate ultima:última
ultimo:último unica:única unico:único util:útil vacio:vacío valoracion:valoración
veras:verás version:versión via:vía abrelos:ábrelos acompanando:acompañando agachate:agáchate
alejandolos:alejándolos anade:añade arrancon:arrancón bajate:bájate caida:caída caido:caído
caidos:caídos cruzala:crúzala cruzalos:crúzalos ahi:ahí aerea:aérea aerobica:aeróbica
aerobico:aeróbico seccion:sección excentricas:excéntricas monotematico:monotemático
`;

const PALABRAS: Record<string, string> = Object.fromEntries(
  PARES.split(/\s+/).filter(Boolean).map(par => par.split(':') as [string, string]),
);

const PALABRA = new RegExp(`\\b(${Object.keys(PALABRAS).join('|')})\\b`, 'gi');

/** Interrogativas que solo se acentuan en un titulo concreto (la misma palabra, sin tilde, es correcta en otros). */
const FRASES: [RegExp, string][] = [
  [/^Cuando volver\b/, 'Cuándo volver'],
  [/^Que dice\b/, 'Qué dice'],
];

/** El texto con su ortografia correcta. Solo para mostrar: no usar como clave de busqueda ni como identificador. */
export function nombreVisible(nombre: string): string {
  const conFrase = FRASES.reduce((t, [patron, cambio]) => t.replace(patron, cambio), nombre);
  return conFrase.replace(PALABRA, m => {
    const correcta = PALABRAS[m.toLowerCase()];
    return m[0] === m[0].toUpperCase() ? correcta[0].toUpperCase() + correcta.slice(1) : correcta;
  });
}
