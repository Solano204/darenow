/**
 * Pruebas de las rutinas creadas por el usuario.
 * esbuild --bundle --platform=node --format=cjs tests/rutinas.test.ts | node
 */
import {
  itemPropioPorDefecto, minutosPropios, revisarPropia, sesionDePropia,
  type RutinaPropia, type Perfil,
} from '../src/engine/session';
import { porId, EJERCICIOS } from '../src/data/catalog';

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};

const base: Perfil = {
  objetivo: 'musculo', nivel: 2, minPorSesion: 30, modoSinSaltos: false,
  espacio: 'colchoneta', equipo: [], contra: [], vetos: [],
};

const rutina = (items: RutinaPropia['items']): RutinaPropia => ({
  id: 'mi_test', nombre: 'Mi rutina', objetivo: 'musculo',
  items, creada: '2026-01-01', editada: '2026-01-01',
});

console.log('\n--- Valores por defecto al agregar ---');
{
  const porReps = porId.get('ex_1001')!;      // sentadilla, 3x15
  const d = itemPropioPorDefecto(porReps);
  c('toma las series del catalogo', d.series === porReps.default.series);
  c('toma las repeticiones', d.reps === porReps.default.reps);
  c('no pone segundos si se mide por reps', d.seg === undefined);
  c('toma el descanso', d.descansoS === porReps.default.rest_s);

  const porTiempo = porId.get('ex_4001')!;    // plancha, por segundos
  const t = itemPropioPorDefecto(porTiempo);
  c('en los de tiempo pone segundos', t.seg === porTiempo.default.seg);
  c('y deja las reps vacias', t.reps === undefined);
}

console.log('\n--- Duracion ---');
{
  // 3 series x 10 reps (30 s) + 60 s de descanso = 90 s por serie = 270 s
  const r = rutina([{ ejercicioId: 'ex_1001', series: 3, reps: 10, descansoS: 60 }]);
  c('calcula los minutos', minutosPropios(r.items) === 5, String(minutosPropios(r.items)));

  // Unilateral: cuenta los dos lados
  const uni = EJERCICIOS.find(e => e.unilateral || e.measure === 'reps_por_lado')!;
  const a = minutosPropios([{ ejercicioId: uni.id, series: 3, reps: 10, descansoS: 60 }]);
  const bi = minutosPropios([{ ejercicioId: 'ex_1001', series: 3, reps: 10, descansoS: 60 }]);
  c('un unilateral dura mas que un bilateral igual', a > bi, `${a} vs ${bi}`);

  c('una rutina vacia dura 1 minuto, no cero', minutosPropios([]) === 1);
}

console.log('\n--- Avisos, que no bloquean ---');
{
  // Un ejercicio contraindicado por la lesion declarada.
  const conRodilla = EJERCICIOS.find(e => e.contra.includes('lesion_rodilla'))!;
  const p = { ...base, contra: ['lesion_rodilla'] };
  const avisos = revisarPropia([{ ejercicioId: conRodilla.id, series: 3, reps: 10, descansoS: 60 }], p);
  c('avisa si un ejercicio carga una lesion declarada',
    avisos.some(a => a.includes('lesionada')), avisos.join(' | '));

  // Pero la sesion se arma igual: la rutina es del usuario.
  const s = sesionDePropia(rutina([{ ejercicioId: conRodilla.id, series: 3, reps: 10, descansoS: 60 }]), p);
  c('aun asi la sesion se arma, no se bloquea', s.items.length === 1);
  c('y el aviso viaja con ella', s.avisos.length > 0);

  // Equipo que no tiene
  const conBarra = EJERCICIOS.find(e => e.equipment.includes('barra'))!;
  const av2 = revisarPropia([{ ejercicioId: conBarra.id, series: 3, reps: 5, descansoS: 120 }], base);
  c('avisa del equipo que falta', av2.some(a => a.includes('equipo')), av2.join(' | '));

  // Modo sin saltos
  const ruidoso = EJERCICIOS.find(e => e.impact >= 2 || e.noise >= 2)!;
  const av3 = revisarPropia(
    [{ ejercicioId: ruidoso.id, series: 3, reps: 10, descansoS: 45 }],
    { ...base, modoSinSaltos: true },
  );
  c('avisa si hay impacto con el modo silencioso puesto',
    av3.some(a => a.includes('impacto')), av3.join(' | '));

  // Sin avisos cuando todo cuadra. El gato-vaca pide colchoneta, asi que
  // el perfil tiene que declararla: el aviso de equipo es correcto y salta
  // igual que en el resto del motor.
  const conColchoneta = { ...base, equipo: ['colchoneta'] };
  const limpio = revisarPropia([
    { ejercicioId: 'ex_1001', series: 3, reps: 12, descansoS: 45 },
    { ejercicioId: 'ex_7001', series: 1, seg: 40, descansoS: 10 },
  ], conColchoneta);
  c('sin avisos cuando todo encaja', limpio.length === 0, limpio.join(' | '));

  // Y el aviso de equipo si salta cuando de verdad falta.
  const faltaEquipo = revisarPropia([
    { ejercicioId: 'ex_7001', series: 1, seg: 40, descansoS: 10 },
  ], base);
  c('avisa de la colchoneta si no la declaro', faltaEquipo.length === 1);
}

console.log('\n--- Conversion a sesion ---');
{
  const r = rutina([
    { ejercicioId: 'ex_7001', series: 1, seg: 40, descansoS: 10 },   // movilidad
    { ejercicioId: 'ex_1001', series: 4, reps: 12, descansoS: 75 },  // fuerza
    { ejercicioId: 'ex_8010', series: 1, seg: 45, descansoS: 5 },    // estiramiento
  ]);
  const s = sesionDePropia(r, base);

  c('respeta el numero de ejercicios', s.items.length === 3);
  c('respeta las series que puso el usuario', s.items[1].seriesPlan === 4);
  c('respeta las repeticiones', s.items[1].repsPlan === 12);
  c('respeta el descanso', s.items[1].descansoPlan === 75);
  c('la movilidad entra como calentamiento', s.items[0].bloque === 'calentamiento');
  c('el estiramiento como enfriamiento', s.items[2].bloque === 'enfriamiento');
  c('lo demas como principal', s.items[1].bloque === 'principal');
  c('conserva el nombre de la rutina', s.nombre === 'Mi rutina');
  c('el id de la sesion es el de la rutina propia', s.rutinaId === 'mi_test');
  c('calcula los minutos', s.minutosEstimados > 0);

  const conPeso = sesionDePropia(r, { ...base, pesoKg: 78 });
  c('estima kcal si hay peso', (conPeso.kcalEstimadas ?? 0) > 0);
  c('y no las estima si no lo hay', s.kcalEstimadas === null);
}

console.log('\n--- Robustez ---');
{
  // Un id que ya no existe en el catalogo no debe romper nada.
  const s = sesionDePropia(rutina([
    { ejercicioId: 'ex_9999', series: 3, reps: 10, descansoS: 60 },
    { ejercicioId: 'ex_1001', series: 3, reps: 10, descansoS: 60 },
  ]), base);
  c('ignora ejercicios que ya no existen', s.items.length === 1);
  c('sin reventar el calculo de minutos', s.minutosEstimados > 0);

  const vacia = sesionDePropia(rutina([]), base);
  c('una rutina vacia da una sesion vacia sin error', vacia.items.length === 0);
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
process.exit(fallos ? 1 : 0);
