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
acumulacion:acumulación adaptacion:adaptación basicos:básicos consolidacion:consolidación
habia:había integracion:integración intensificacion:intensificación maximas:máximas
medicion:medición puntuacion:puntuación reactivacion:reactivación superavit:superávit tipica:típica
cronicamente:crónicamente debil:débil debiles:débiles distension:distensión insercion:inserción
sindrome:síndrome teorico:teórico tipico:típico
absorcion:absorción acordandose:acordándose ademas:además afirmacion:afirmación ambar:ámbar
anabolica:anabólica anaden:añaden anadir:añadir anaerobicas:anaeróbicas analisis:análisis
analiticas:analíticas aparicion:aparición autorizacion:autorización bascula:báscula cafeina:cafeína
calorias:calorías caloria:caloría clinicos:clínicos coleccion:colección composicion:composición
concentrica:concéntrica condicion:condición conexion:conexión conservacion:conservación
consolacion:consolación conversion:conversión cuantas:cuántas cuantos:cuántos decision:decisión
deberia:debería dermatologos:dermatólogos distribucion:distribución ecuacion:ecuación
energetica:energética estabilizacion:estabilización excentrica:excéntrica excepcion:excepción
friccion:fricción genetica:genética glucemico:glucémico guiate:guíate habitos:hábitos
hidratacion:hidratación jerarquia:jerarquía informacion:información lacteos:lácteos
medicacion:medicación metabolico:metabólico microdano:microdaño miercoles:miércoles
momentaneo:momentáneo monotonia:monotonía nutricion:nutrición numeros:números oxigeno:oxígeno
percepcion:percepción perdi:perdí planificacion:planificación poblacion:población podrias:podrías
popularizo:popularizó produccion:producción programacion:programación proponertelo:proponértelo
quizas:quizás recomendacion:recomendación rompio:rompió saltarmela:saltármela saltarsela:saltársela
saltartela:saltártela seleccion:selección sintesis:síntesis simplificacion:simplificación
simultaneos:simultáneos sirvio:sirvió sistematica:sistemática situacion:situación
sudoracion:sudoración tardia:tardía tardio:tardío tabu:tabú termico:térmico
termorregulacion:termorregulación utiles:útiles volvio:volvió sabian:sabían partias:partías anade:añade
kilometros:kilómetros kilometro:kilómetro veintiun:veintiún critico:crítico fotografico:fotográfico perfeccion:perfección
camara:cámara cardiaca:cardíaca estan:están guia:guía inhalacion:inhalación metrica:métrica superposicion:superposición
`;

const PALABRAS: Record<string, string> = Object.fromEntries(
  PARES.split(/\s+/).filter(Boolean).map(par => par.split(':') as [string, string]),
);

const PALABRA = new RegExp(`\\b(${Object.keys(PALABRAS).join('|')})\\b`, 'gi');

/** Interrogativas que solo se acentuan en un titulo concreto (la misma palabra, sin tilde, es correcta en otros). */
const FRASES: [RegExp, string][] = [
  [/^Cuando volver\b/, 'Cuándo volver'],
  [/^Que dice\b/, 'Qué dice'],
  // «perdida» y «si» solo se acentuan en estas frases de los programas; sueltas cambian de sentido.
  [/\bde perdida\b/g, 'de pérdida'],
  [/\bperdida de grasa\b/g, 'pérdida de grasa'],
  [/\bLo que si\b/g, 'Lo que sí'],
  [/\blo que si\b/g, 'lo que sí'],
  [/\b([Pp])erdida (de|temporal)\b/g, '$1érdida $2'],
  // Titulos y frases de Aprender donde «que» y «cuando» son interrogativos.
  [/^Por que\b/, 'Por qué'],
  [/\by por que suelen\b/g, 'y por qué suelen'],
  [/\bentiendes por que\b/g, 'entiendes por qué'],
  [/\bde que se compone\b/g, 'de qué se compone'],
  [/^Cuando esto deja\b/, 'Cuándo esto deja'],
  // Interrogativos indirectos y un subjuntivo que en los textos de Aprender salen sin tilde.
  [/\bque la espalda este tensa\b/g, 'que la espalda esté tensa'],
  [/\bque foto era cual\b/g, 'qué foto era cuál'],
  [/\ben cuanto (?=m[uú]sculo)/g, 'en cuánto '],
  [/\bes cuanto tiempo\b/g, 'es cuánto tiempo'],
  [/\ben como te sientes\b/g, 'en cómo te sientes'],
];

/** El texto con su ortografia correcta. Solo para mostrar: no usar como clave de busqueda ni como identificador. */
export function nombreVisible(nombre: string): string {
  const conFrase = FRASES.reduce((t, [patron, cambio]) => t.replace(patron, cambio), nombre);
  return conFrase.replace(PALABRA, m => {
    const correcta = PALABRAS[m.toLowerCase()];
    return m[0] === m[0].toUpperCase() ? correcta[0].toUpperCase() + correcta.slice(1) : correcta;
  });
}
