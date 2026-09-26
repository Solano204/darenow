/**
 * Pruebas de la pestana Yo: fechas legibles, placas de los ultimos 7 dias, celdas y etiquetas del calendario,
 * favoritos mezclados, indicador de cada reto, filas del historial y tildes de los textos que se ven.
 * esbuild --bundle --platform=node --format=cjs tests/perfil.test.ts | node
 */

import { LOGROS, RETOS, GOALS, PROGRAMAS, MEDICIONES, nombreGoal } from '../src/data/catalog';
import {
  textoDeMotivo, textoDeEstadoSesion, textoDeFrecuencia, unidadDeMedicion, PROTOCOLOS_SIN_VALOR, MOTIVOS_DE_SALIDA,
} from '../src/utils/textosVisibles';
import { nombreVisible } from '../src/data/nombresVisibles';
import { textoVisible } from '../src/utils/presentacion';
import { plural } from '../src/utils/plural';
import { fechaLarga, diaCorto, esSesionLarga, fechaLocal } from '../src/utils/fechas';
import {
  placasPorDia, semanaEnCero, resumenDeSemana, celdasDelMes, fechaDeDia, diaDelCalendario, diasDelMes,
  etiquetasDeEstadisticas, mezclarFavoritos, totalFavoritos, metaDeReto, progresoAcotado, filaDeHistorial,
  MAX_PLACAS_DIA, vistaPreviaDeReto, agruparPorMes,
} from '../src/utils/perfil';

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};

console.log('\n--- Fechas ---');
{
  const ahora = new Date(2026, 8, 26);
  c('«2026-09-25» es «Viernes 25 de septiembre»', fechaLarga('2026-09-25', ahora) === 'Viernes 25 de septiembre', fechaLarga('2026-09-25', ahora));
  c('otro año lleva el año', fechaLarga('2025-12-03', ahora) === 'Miércoles 3 de diciembre de 2025', fechaLarga('2025-12-03', ahora));
  c('el 1 de enero no se confunde por la zona horaria', fechaLarga('2026-01-01', ahora) === 'Jueves 1 de enero', fechaLarga('2026-01-01', ahora));
  c('una fecha que no se lee pasa igual', fechaLarga('ayer', ahora) === 'ayer');
  c('«Viernes 25» para el lector de pantalla', diaCorto('2026-09-25') === 'Viernes 25');
  c('25 minutos ya es sesión larga, 24 no', esSesionLarga(25) && !esSesionLarga(24) && !esSesionLarga(0));
  c('fechaLocal no corre el día', fechaLocal('2026-09-25').getDate() === 25);
}

console.log('\n--- Últimos 7 días ---');
{
  const p = placasPorDia([0, 15, 30, 60, 0, 0, 5]);
  c('el día más largo llena la columna y los demás van a escala', p[3] === MAX_PLACAS_DIA && p[2] === 6 && p[1] === 3, JSON.stringify(p));
  c('un día sin actividad no lleva placas y uno con poca lleva al menos una', p[0] === 0 && p[6] === 1, JSON.stringify(p));
  c('con menos de 30 minutos la referencia sigue siendo 30', placasPorDia([0, 15])[1] === 6, JSON.stringify(placasPorDia([0, 15])));
  c('nunca pasa del máximo', Math.max(...placasPorDia([500, 1, 1])) === MAX_PLACAS_DIA);
  c('una semana en cero se detecta y no lleva placas', semanaEnCero([0, 0, 0, 0, 0, 0, 0]) && placasPorDia([0, 0, 0]).every(x => x === 0) && !semanaEnCero([0, 1]));
  const r = resumenDeSemana([{ fecha: '2026-09-24', min: 0 }, { fecha: '2026-09-25', min: 12 }]);
  c('el resumen para el lector dice el día y los minutos', r === 'Minutos de los últimos siete días: Jueves 24, 0; Viernes 25, 12', r);
}

console.log('\n--- Calendario ---');
{
  const septiembre = celdasDelMes(2026, 8);
  c('septiembre de 2026 empieza en martes: un hueco y 30 días', septiembre[0] === null && septiembre[1] === 1 && septiembre.filter(x => x).length === 30, JSON.stringify(septiembre.slice(0, 3)));
  c('las celdas cierran la fila de 7', septiembre.length % 7 === 0 && septiembre.length === 35);
  c('febrero de 2026 empieza en domingo (seis huecos) y trae 28 días', celdasDelMes(2026, 1).slice(0, 6).every(x => x === null) && celdasDelMes(2026, 1).filter(x => x).length === 28);
  c('las fechas salen como el dato', fechaDeDia(2026, 8, 5) === '2026-09-05' && fechaDeDia(2026, 11, 25) === '2026-12-25');

  const entrenados = new Set(['2026-09-25', '2026-09-10']);
  const minutos = { '2026-09-25': 0, '2026-09-10': 32 };
  const hoy = '2026-09-25';
  const d25 = diaDelCalendario(2026, 8, 25, hoy, minutos, entrenados);
  c('el 25, sesión de 0 minutos y hoy: marcado, corto, con etiqueta completa', d25.entreno && !d25.largo && d25.esHoy && d25.etiqueta === 'Viernes 25, hoy, sesión corta', d25.etiqueta);
  const d10 = diaDelCalendario(2026, 8, 10, hoy, minutos, entrenados);
  c('el 10, de 32 minutos: huella rellena', d10.entreno && d10.largo && !d10.esHoy && d10.etiqueta === 'Jueves 10, sesión de 25 minutos o más', d10.etiqueta);
  const d11 = diaDelCalendario(2026, 8, 11, hoy, minutos, entrenados);
  c('un día pasado sin sesión no lleva marca', !d11.entreno && !d11.futuro && d11.etiqueta === 'Viernes 11', d11.etiqueta);
  c('un día futuro se reconoce', diaDelCalendario(2026, 8, 30, hoy, minutos, entrenados).futuro);
  c('un día de otro mes no cuenta en «días este mes»', diasDelMes(new Set([...entrenados, '2026-10-01']), 2026, 8) === 2 && diasDelMes(entrenados, 2026, 9) === 0);
  c('las etiquetas de las placas: «1 sesión» y «1 serie» sin plural', JSON.stringify(etiquetasDeEstadisticas(1, 0, 1)) === JSON.stringify(['racha', 'sesión', 'minutos', 'serie']) && plural(1, 'día', 'días') === 'día');
  c('con 2 sesiones y 1 minuto', JSON.stringify(etiquetasDeEstadisticas(2, 1, 0)) === JSON.stringify(['racha', 'sesiones', 'minuto', 'series']));
}

console.log('\n--- Favoritos ---');
{
  const f = { ejercicios: ['ex_1', 'ex_2', 'ex_3'], musculos: ['m_1'], rutinas: ['rt_1', 'rt_2'], programas: [], tips: ['tip_1'] };
  const m = mezclarFavoritos(f, 6);
  c('se reparten por turnos, del más reciente al más antiguo', m.map(x => x.id).join() === 'ex_3,rt_2,tip_1,m_1,ex_2,rt_1', m.map(x => x.id).join());
  c('respeta el tope', mezclarFavoritos(f, 3).length === 3 && mezclarFavoritos(f).length === 7);
  c('sin favoritos no hay nada', mezclarFavoritos({ ejercicios: [], musculos: [], rutinas: [], programas: [], tips: [] }).length === 0);
  c('el total suma todos los tipos', totalFavoritos(f) === 7);
}

console.log('\n--- Retos ---');
{
  c('«Siete días» lleva 7 placas', metaDeReto('ch_001')?.tipo === 'placas' && metaDeReto('ch_001')?.total === 7);
  c('«Treinta días de movimiento» lleva 30 celdas', metaDeReto('ch_002')?.tipo === 'celdas' && metaDeReto('ch_002')?.total === 30);
  c('«Cien sesiones» lleva una barra de 100', metaDeReto('ch_003')?.tipo === 'barra' && metaDeReto('ch_003')?.total === 100);
  c('un reto sin indicador definido no lleva ninguno', metaDeReto('ch_004') === undefined);
  c('el progreso se acota a su meta', progresoAcotado(9, 7) === 7 && progresoAcotado(-2, 7) === 0 && progresoAcotado(3.4, 7) === 3);
  c('los tres primeros retos de la lista son los que tienen indicador', RETOS.slice(0, 3).every(r => metaDeReto(r.id) !== undefined));
}

console.log('\n--- Historial ---');
{
  const ahora = new Date(2026, 8, 26);
  const abandonada = filaDeHistorial({ fecha: '2026-09-25', duracionS: 0, series: [] }, ahora);
  c('una sesión de 0 minutos y 0 series se lee «Viernes 25 de septiembre», 0 min, 0 series, corta', abandonada.fecha === 'Viernes 25 de septiembre' && abandonada.minutos === 0 && abandonada.series === 0 && !abandonada.largo, JSON.stringify(abandonada));
  const buena = filaDeHistorial({ fecha: '2026-09-20', duracionS: 1800, series: [{}, {}, { omitida: true }] }, ahora);
  c('30 minutos y 2 series reales: larga', buena.minutos === 30 && buena.series === 2 && buena.largo, JSON.stringify(buena));
}

console.log('\n--- Tildes de Yo ---');
{
  const v = nombreVisible;
  c('«Ganar músculo» y «Músculo en casa con mancuernas»', textoVisible(nombreGoal('musculo')) === 'Ganar músculo' && textoVisible('Musculo en casa con mancuernas') === 'Músculo en casa con mancuernas', textoVisible(nombreGoal('musculo')));
  c('«Cinco kilómetros»', v('Cinco kilometros') === 'Cinco kilómetros');
  c('«Siete días», «Treinta días de movimiento», «en 30 días», «siete días seguidos»',
    v('Siete dias') === 'Siete días' && v('Treinta dias de movimiento') === 'Treinta días de movimiento'
    && v('Al menos 20 sesiones en 30 dias') === 'Al menos 20 sesiones en 30 días' && v('siete dias seguidos') === 'siete días seguidos');
  c('«Completar una sesión»', v('Completar una sesion, aunque sea la de 5 minutos') === 'Completar una sesión, aunque sea la de 5 minutos');
  const todos = [
    ...LOGROS.flatMap(l => [l.name, l.desc]), ...RETOS.flatMap(r => [r.name, r.objetivo, r.desc]),
    ...GOALS.map(g => g.nombre), ...PROGRAMAS.map(p => p.name),
  ].map(t => textoVisible(t));
  const sinTilde = todos.filter(t => /\b(dias|sesion|kilometros|musculo|critico|veintiun|tecnica)\b/i.test(t));
  c('los logros, retos, objetivos y programas se ven con sus tildes', sinTilde.length === 0, sinTilde.slice(0, 5).join(' | '));
}

console.log('\n--- Retos: vista previa de la meta (Parte 13) ---');
{
  const de = (id: string) => vistaPreviaDeReto(RETOS.find(r => r.id === id)!);
  c('«Siete días»: 7 circulos', JSON.stringify(de('ch_001')) === JSON.stringify({ tipo: 'circulos', total: 7 }), JSON.stringify(de('ch_001')));
  c('«Treinta días de movimiento»: rejilla de 30 con la meta en 20', JSON.stringify(de('ch_002')) === JSON.stringify({ tipo: 'rejilla', total: 30, meta: 20 }), JSON.stringify(de('ch_002')));
  c('«Cien sesiones»: barra de 100 (10 tramos)', JSON.stringify(de('ch_003')) === JSON.stringify({ tipo: 'tramos', total: 100 }), JSON.stringify(de('ch_003')));
  c('«21 días seguidos» pasa de circulos a rejilla sin meta', JSON.stringify(de('ch_014')) === JSON.stringify({ tipo: 'rejilla', total: 21 }), JSON.stringify(de('ch_014')));
  const sin = ['ch_004', 'ch_005', 'ch_006', 'ch_007', 'ch_008', 'ch_009', 'ch_010', 'ch_011', 'ch_012', 'ch_013', 'ch_015'];
  c('las metas que no se pueden leer del dato no llevan vista previa', sin.every(id => de(id) === undefined), sin.filter(id => de(id) !== undefined).join());
  c('los 15 retos: 4 con vista previa', RETOS.filter(r => vistaPreviaDeReto(r) !== undefined).length === 4);
}

console.log('\n--- Historial por mes y textos visibles (Parte 13) ---');
{
  const ses = [
    { fecha: '2026-09-25', n: 1 }, { fecha: '2026-09-02', n: 2 }, { fecha: '2026-08-30', n: 3 }, { fecha: '2025-12-01', n: 4 }, { fecha: '2026-08-01', n: 5 },
  ];
  const meses = agruparPorMes(ses);
  c('cada cambio de mes abre un tramo nuevo, en el orden que traen', meses.map(m => `${m.clave}:${m.items.length}`).join() === '2026-09:2,2026-08:1,2025-12:1,2026-08:1', meses.map(m => m.clave).join());
  c('el nombre del mes lleva el año', meses[0].nombre === 'Septiembre 2026' && meses[2].nombre === 'Diciembre 2025', meses.map(m => m.nombre).join());
  c('nada se reordena ni se pierde', meses.flatMap(m => m.items).map(x => x.n).join() === '1,2,3,4,5');
  c('sin sesiones no hay meses', agruparPorMes([]).length === 0);

  c('«muy_dificil» se lee «Muy difícil»', textoDeMotivo('muy_dificil') === 'Muy difícil');
  c('los 5 motivos de la hoja de salida tienen texto', ['sin_tiempo', 'muy_dificil', 'muy_facil', 'molestia', 'sin_ganas'].every(id => id in MOTIVOS_DE_SALIDA && !/_/.test(textoDeMotivo(id))));
  c('un motivo sin traducir se muestra sin guiones bajos y con mayúscula', textoDeMotivo('cambio_de_plan') === 'Cambio de plan', textoDeMotivo('cambio_de_plan'));
  c('«completada» es «Completa» y «abandonada» es «Parcial» (el texto de hoy)', textoDeEstadoSesion('completada') === 'Completa' && textoDeEstadoSesion('abandonada') === 'Parcial');
  c('las frecuencias llevan mayúscula inicial', textoDeFrecuencia('cada 4 semanas') === 'Cada 4 semanas' && textoDeFrecuencia('opcional') === 'Opcional' && textoDeFrecuencia('semanal') === 'Semanal');
  c('unidades sugeridas: estatura cm, peso kg, cadencia pasos/min, pulso lpm; el test de pared no lleva', unidadDeMedicion('med_001') === 'cm' && unidadDeMedicion('med_005') === 'kg' && unidadDeMedicion('med_007') === 'pasos/min' && unidadDeMedicion('med_008') === 'lpm' && unidadDeMedicion('med_002') === undefined);
  c('la foto y el test de rendimiento no piden valor', PROTOCOLOS_SIN_VALOR.join() === 'med_003,med_006' && MEDICIONES.filter(p => PROTOCOLOS_SIN_VALOR.includes(p.id)).length === 2);
  c('las 8 mediciones traen frecuencia legible', MEDICIONES.length === 8 && MEDICIONES.every(p => /^[A-ZÁÉÍÓÚ]/.test(textoDeFrecuencia(p.frecuencia))));

  const v = nombreVisible;
  c('«Sin límite», «10 días libres», «perfección»', v('Sin limite de tiempo') === 'Sin límite de tiempo' && v('Deja margen para 10 dias libres') === 'Deja margen para 10 días libres' && v('la perfeccion') === 'la perfección');
  c('mediciones: día, glúteo, inhalación, rígido, ángulo, medición, están, método',
    v('Misma hora del dia') === 'Misma hora del día' && v('gluteo') === 'glúteo' && v('inhalacion') === 'inhalación' && v('libro rigido') === 'libro rígido'
    && v('angulo recto') === 'ángulo recto' && v('medicion') === 'medición' && v('estan') === 'están' && v('metodo') === 'método');
  c('cámara, guía, cinta métrica, cardíaca, superposición', v('camara') === 'cámara' && v('guia') === 'guía' && v('cinta metrica') === 'cinta métrica' && v('Frecuencia cardiaca') === 'Frecuencia cardíaca' && v('superposicion animada') === 'superposición animada');
  const todo = [
    ...RETOS.flatMap(r => [r.name, r.desc, r.objetivo]),
    ...MEDICIONES.flatMap(p => [p.name, p.instrumento ?? '', ...p.condiciones_fijas, ...(p.pasos ?? []), p.advertencia ?? '', p.interpretacion ?? '']),
  ].map(t => textoVisible(t));
  const sinTilde = todo.filter(t => /\b(dias|sesion|gluteo|inhalacion|rigido|angulo|medicion|estan|metodo|camara|guia|metrica|superposicion|kilometros|limite|perfeccion)\b/i.test(t));
  c('los retos y las mediciones se ven con sus tildes', sinTilde.length === 0, sinTilde.slice(0, 3).join(' | '));
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
if (fallos > 0) process.exit(1);
