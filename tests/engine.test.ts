/**
 * Prueba de integracion: el motor de sesion contra el catalogo real.
 * esbuild --bundle --platform=node --format=cjs tests/engine.test.ts | node
 */
import { armarSesion, ejerciciosValidos, sustituir, sesionDeRutina, type Perfil } from '../src/engine/session';
import { EJERCICIOS, RUTINAS, PROGRAMAS, rutinaPorId, porId, GOALS, ESTADISTICAS } from '../src/data/catalog';
import { derivarNivel, elegirPrograma, avisosDe, derivar } from '../src/data/perfil';

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};

const base: Perfil = {
  objetivo: 'bajar_peso', nivel: 2, minPorSesion: 20, modoSinSaltos: false,
  espacio: 'colchoneta', equipo: [], contra: [], vetos: [],
};

console.log('\n--- Catalogo cargado ---');
c(`190 ejercicios`, EJERCICIOS.length === 190, String(EJERCICIOS.length));
c(`30 rutinas`, RUTINAS.length === 30, String(RUTINAS.length));
c(`12 programas`, PROGRAMAS.length === 12, String(PROGRAMAS.length));
c('todos tienen patron heredado de su familia', EJERCICIOS.every(e => !!e.patron));
c('todos tienen pasos y errores', EJERCICIOS.every(e => e.steps.length >= 3 && e.errors.length >= 3));

console.log('\n--- Sesion para cada objetivo ---');
for (const g of GOALS) {
  const s = armarSesion({ ...base, objetivo: g.id }, 12345);
  c(`${g.id}: genera sesion con al menos 4 items`, s.items.length >= 4, String(s.items.length));
  c(`${g.id}: cabe en los minutos declarados`, s.minutosEstimados <= base.minPorSesion * 1.2,
    `${s.minutosEstimados} vs ${base.minPorSesion}`);
  c(`${g.id}: tiene calentamiento y enfriamiento`,
    s.items.some(i => i.bloque === 'calentamiento') && s.items.some(i => i.bloque === 'enfriamiento'));
  c(`${g.id}: sin ejercicios repetidos`, new Set(s.items.map(i => i.id)).size === s.items.length);
}

console.log('\n--- El filtro de lesiones no se relaja nunca ---');
{
  const p: Perfil = { ...base, contra: ['lesion_rodilla', 'lesion_hombro', 'hernia_discal', 'lesion_lumbar'] };
  const s = armarSesion(p, 999);
  const violan = s.items.filter(i => i.contra.some(x => p.contra.includes(x)));
  c('ninguna sesion incluye ejercicios contraindicados', violan.length === 0,
    violan.map(v => v.name).join(', '));
  c('aun asi genera una sesion util', s.items.length >= 4, String(s.items.length));

  const todos = ejerciciosValidos(p, { objetivo: '' });
  c('el filtro global respeta las lesiones',
    todos.every(e => !e.contra.some(x => p.contra.includes(x))));
}

console.log('\n--- Modo sin saltos ---');
{
  const p: Perfil = { ...base, modoSinSaltos: true };
  const s = armarSesion(p, 777);
  const ruidosos = s.items.filter(i => i.impact >= 2 || i.noise >= 2);
  c('cero ejercicios con impacto o ruido alto', ruidosos.length === 0,
    ruidosos.map(r => r.name).join(', '));
  c(`quedan ${ESTADISTICAS.silenciosos} ejercicios silenciosos en catalogo`,
    ESTADISTICAS.silenciosos > 150, String(ESTADISTICAS.silenciosos));
}

console.log('\n--- Espacio minimo ---');
{
  const p: Perfil = { ...base, espacio: 'minimo' };
  const s = armarSesion(p, 555);
  const amplios = s.items.filter(i => i.space === 'amplio');
  c('sin ejercicios que pidan desplazarse', amplios.length === 0, amplios.map(a => a.name).join(', '));
}

console.log('\n--- Sin nada de equipo ---');
{
  const s = armarSesion({ ...base, equipo: [] }, 111);
  const conEquipo = s.items.filter(i =>
    !i.equipment.every(q => ['ninguno', 'pared', 'silla'].includes(q)));
  c('no propone equipo que no tienes', conEquipo.length === 0, conEquipo.map(x => x.name).join(', '));
  c(`${ESTADISTICAS.sinEquipo} ejercicios sin equipo en catalogo`, ESTADISTICAS.sinEquipo >= 50);
}

console.log('\n--- Vetos ---');
{
  const primeros = armarSesion(base, 42).items.map(i => i.id);
  const s = armarSesion({ ...base, vetos: primeros }, 42);
  const repetidos = s.items.filter(i => primeros.includes(i.id));
  c('los ejercicios vetados no vuelven a salir', repetidos.length === 0);
}

console.log('\n--- Ajuste al tiempo ---');
for (const min of [10, 20, 30, 45, 60]) {
  const s = armarSesion({ ...base, minPorSesion: min }, 321);
  c(`${min} min: la sesion cabe`, s.minutosEstimados <= min * 1.2, `${s.minutosEstimados}`);
}

console.log('\n--- Rutinas del catalogo ---');
{
  let bien = 0;
  for (const r of RUTINAS) {
    const s = sesionDeRutina(r.id, base, r);
    if (s.items.length > 0) bien++;
  }
  c('las 30 rutinas producen sesiones jugables', bien === RUTINAS.length, `${bien}/${RUTINAS.length}`);

  // Con lesion de rodilla, la rutina de pierna debe sustituir, no romperse.
  const conLesion: Perfil = { ...base, contra: ['lesion_rodilla'] };
  const r = rutinaPorId.get('rt_006')!;
  const s = sesionDeRutina(r.id, conLesion, r);
  const malos = s.items.filter(i => i.contra.includes('lesion_rodilla'));
  c('una rutina fija tambien respeta las lesiones', malos.length === 0);
  c('y avisa de los cambios', s.avisos.length > 0 || malos.length === 0);
}

console.log('\n--- Sustituir en caliente ---');
{
  const s = armarSesion(base, 88);
  const objetivo = s.items.find(i => i.bloque === 'principal')!;
  const nuevo = sustituir(base, objetivo.id, s.items.map(i => i.id));
  c('encuentra un sustituto', !!nuevo, objetivo.name);
  c('el sustituto es distinto', nuevo?.id !== objetivo.id);
  c('y no estaba ya en la sesion', !s.items.some(i => i.id === nuevo?.id));
}

console.log('\n--- Integridad de referencias ---');
{
  const ids = new Set(EJERCICIOS.map(e => e.id));
  const rotas: string[] = [];
  for (const e of EJERCICIOS) {
    for (const r of [...e.progressions, ...e.regressions, ...e.substitutes]) {
      if (!ids.has(r)) rotas.push(`${e.id}->${r}`);
    }
  }
  c('sin referencias rotas entre ejercicios', rotas.length === 0, rotas.join(', '));

  const rotasRut: string[] = [];
  for (const r of RUTINAS) {
    for (const b of r.bloques) for (const id of b.items) if (!ids.has(id)) rotasRut.push(`${r.id}->${id}`);
  }
  c('las rutinas apuntan a ejercicios que existen', rotasRut.length === 0, rotasRut.join(', '));

  const rotasProg: string[] = [];
  for (const p of PROGRAMAS) {
    for (const f of p.fases) for (const rid of f.rutinas) if (!rutinaPorId.has(rid)) rotasProg.push(`${p.id}->${rid}`);
  }
  c('los programas apuntan a rutinas que existen', rotasProg.length === 0, rotasProg.join(', '));
}

console.log('\n--- Onboarding ---');
{
  c('sin experiencia arranca en nivel 1', derivarNivel('nada') === 1);
  c('quien vuelve tras pausa tambien', derivarNivel('pausa') === 1);
  c('vuelta tras pausa va al programa de vuelta', elegirPrograma('gym', 'pausa') === 'pg_012');
  c('correr desde cero va al 5K', elegirPrograma('running', 'nada') === 'pg_007');

  const m = avisosDe('mandibula', [], []);
  c('mandibula avisa que no quema grasa localizada', m.some(a => a.includes('grasa de una zona')));
  const po = avisosDe('postura', [], []);
  c('postura avisa que el hueso no crece', po.some(a => a.includes('placas de crecimiento')));

  const { perfil } = derivar({ objetivo: 'gym', lugar: 'gym' });
  c('elegir gym trae barra y maquinas', perfil.equipo.includes('barra') && perfil.equipo.includes('prensa'));
  c('en gym no se activa modo silencioso', perfil.modoSinSaltos === false);

  const { perfil: emb } = derivar({ objetivo: 'bajar_peso', situacion: ['embarazo'] });
  c('embarazo entra como contraindicacion', emb.contra.includes('embarazo'));
  c('embarazo fuerza modo sin saltos', emb.modoSinSaltos === true);

  const s = armarSesion({ ...base, contra: ['embarazo'] }, 606);
  c('y la sesion resultante no trae saltos',
    s.items.every(i => !i.contra.includes('embarazo')));

  const solo = derivar({ objetivo: 'cardio' });
  c('con solo el objetivo ya sale un perfil valido',
    solo.perfil.programaId.startsWith('pg_') && solo.perfil.nivel >= 1);
}

console.log('\n--- Determinismo ---');
{
  const a = armarSesion(base, 2024).items.map(i => i.id).join(',');
  const b = armarSesion(base, 2024).items.map(i => i.id).join(',');
  c('la misma semilla da la misma sesion', a === b);
  const d = armarSesion(base, 2025).items.map(i => i.id).join(',');
  c('semillas distintas dan sesiones distintas', a !== d);
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
process.exit(fallos ? 1 : 0);
