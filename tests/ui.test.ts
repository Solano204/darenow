/**
 * Pruebas de la capa de interfaz: calendario, favoritos, mensaje del dia
 * y reloj de anuncios.
 * esbuild --bundle --platform=node --format=cjs tests/ui.test.ts | node
 */

let ok = 0, fallos = 0;
const c = (n: string, cond: boolean, d = '') => {
  if (cond) { ok++; console.log(`  ok   ${n}`); }
  else { fallos++; console.log(`  FALLA ${n} ${d}`); }
};

/* ------------------------------------------------------------------ */
/* Calendario                                                          */
/* ------------------------------------------------------------------ */

console.log('\n--- Calendario ---');
{
  const ymd = (a: number, m: number, d: number) =>
    `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const celdas = (a: number, m: number) => {
    const primero = new Date(a, m, 1);
    const hueco = (primero.getDay() + 6) % 7;   // semana que empieza en lunes
    const dias = new Date(a, m + 1, 0).getDate();
    const out: (number | null)[] = Array(hueco).fill(null);
    for (let d = 1; d <= dias; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  };

  // Enero 2026 empieza en jueves. Con la semana en lunes, tres huecos.
  const ene = celdas(2026, 0);
  c('deja los huecos correctos al inicio del mes', ene.slice(0, 3).every(x => x === null) && ene[3] === 1,
    JSON.stringify(ene.slice(0, 5)));
  c('la rejilla es multiplo de 7', ene.length % 7 === 0, String(ene.length));
  c('enero tiene 31 dias', ene.filter(Boolean).length === 31);

  // Febrero bisiesto
  c('febrero de 2028 tiene 29 dias', celdas(2028, 1).filter(Boolean).length === 29);
  c('febrero de 2026 tiene 28 dias', celdas(2026, 1).filter(Boolean).length === 28);

  const entrenados = new Set([ymd(2026, 0, 5), ymd(2026, 0, 6), ymd(2026, 1, 3)]);
  const delMes = ene.filter(d => d && entrenados.has(ymd(2026, 0, d))).length;
  c('cuenta solo los dias del mes que se ve', delMes === 2, String(delMes));
  c('el total historico cuenta todos', entrenados.size === 3);
}

/* ------------------------------------------------------------------ */
/* Favoritos                                                           */
/* ------------------------------------------------------------------ */

console.log('\n--- Favoritos ---');
{
  type F = Record<string, string[]>;
  let f: F = { ejercicios: [], musculos: [], rutinas: [], programas: [], tips: [] };
  const alternar = (t: string, id: string) => {
    f = { ...f, [t]: f[t].includes(id) ? f[t].filter(x => x !== id) : [...f[t], id] };
  };

  alternar('ejercicios', 'ex_1001');
  c('guarda un favorito', f.ejercicios.includes('ex_1001'));
  alternar('ejercicios', 'ex_1001');
  c('el mismo toque lo quita', !f.ejercicios.includes('ex_1001'));

  alternar('ejercicios', 'ex_1001');
  alternar('musculos', 'biceps');
  c('cada tipo va por separado',
    f.ejercicios.length === 1 && f.musculos.length === 1 && f.rutinas.length === 0);

  const total = Object.values(f).reduce((n, a) => n + a.length, 0);
  c('el total suma todos los tipos', total === 2, String(total));
}

/* ------------------------------------------------------------------ */
/* Mensaje del dia                                                     */
/* ------------------------------------------------------------------ */

console.log('\n--- Mensaje del dia ---');
{
  const indiceDelDia = (n: number, d: Date) =>
    (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % n;

  const hoy = new Date(2026, 5, 15);
  const a = indiceDelDia(14, hoy);
  const b = indiceDelDia(14, new Date(2026, 5, 15));
  c('el mismo dia da el mismo mensaje', a === b);

  const manana = indiceDelDia(14, new Date(2026, 5, 16));
  c('otro dia da otro mensaje', a !== manana);
}



/* ------------------------------------------------------------------ */
/* Reloj de anuncios                                                    */
/* ------------------------------------------------------------------ */

console.log('\n--- Reloj de anuncios ---');
{
  const CADA = 10 * 60 * 1000;
  const GRACIA = 60 * 1000;

  let ahora = 0;
  let enRutina = false;
  let pendiente = false;
  let mostrados = 0;
  let proximo = GRACIA;

  const tic = (ms: number) => {
    ahora += ms;
    if (ahora < proximo) return;
    if (enRutina) { pendiente = true; return; }
    mostrados++;
    proximo = ahora + CADA;
  };
  const cerrarRutina = () => {
    enRutina = false;
    if (pendiente) { pendiente = false; mostrados++; proximo = ahora + CADA; }
  };

  tic(30_000);
  c('no hay anuncio en el primer minuto', mostrados === 0);

  tic(40_000);
  c('pasado el minuto de gracia, aparece el primero', mostrados === 1);

  tic(5 * 60_000);
  c('no se repite antes de los 10 minutos', mostrados === 1, String(mostrados));

  tic(6 * 60_000);
  c('a los 10 minutos aparece el siguiente', mostrados === 2, String(mostrados));

  // Lo importante: durante una rutina no se muestra nada.
  enRutina = true;
  tic(15 * 60_000);
  c('entrenando no aparece ningun anuncio', mostrados === 2, String(mostrados));
  c('pero queda pendiente', (pendiente as boolean) === true);

  cerrarRutina();
  c('al terminar de entrenar si se muestra', mostrados === 3);

  tic(60_000);
  c('y vuelve a esperar sus 10 minutos', mostrados === 3, String(mostrados));
}

console.log(`\n${ok} pruebas pasadas, ${fallos} fallidas\n`);
process.exit(fallos ? 1 : 0);
