/**
 * DARENOW · marcas de rendimiento (SOLO DESARROLLO / MEDICION)
 *
 * Serie de rendimiento R1. Mide el arranque en JS con `performance.now()`:
 *   js-start -> catalog-ready -> app-render -> providers-montados -> fonts-ready -> storage-ready
 *   -> primer-layout (se oculta el splash) -> hoy-interactive
 *
 * `app-render` es el primer render de App: todo lo que va antes es evaluar modulos.
 *
 * Solo hace algo si la build se genero con `EXPO_PUBLIC_PERF=1`. Expo sustituye
 * `process.env.EXPO_PUBLIC_*` por su valor al empaquetar, asi que sin esa
 * variable `ACTIVO` es la constante `false`, el minificador elimina los cuerpos
 * y en produccion estas funciones no hacen nada.
 *
 * Lectura: al marcar `hoy-interactive` se imprime una linea `[perf]` con todas
 * las marcas. En un build de release se ve con
 *   adb logcat -s ReactNativeJS | grep "\[perf\]"
 *
 * Para quitar toda la instrumentacion: ver scripts/perf/README.md (seccion
 * "Quitar la instrumentacion").
 */

const ACTIVO = process.env.EXPO_PUBLIC_PERF === '1';

type Marca =
  | 'js-start' | 'catalog-ready' | 'app-render' | 'providers-montados' | 'fonts-ready' | 'storage-ready'
  | 'primer-layout' | 'hoy-interactive' | (string & {});

const marcas = new Map<string, number>();
const medidas: { nombre: string; ms: number }[] = [];

const ahora = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();

/** Registra el instante `nombre`. Solo la primera vez cuenta (arranque en frio). */
export function mark(nombre: Marca): void {
  if (!ACTIVO) return;
  if (marcas.has(nombre)) return;
  marcas.set(nombre, ahora());
  if (nombre === 'hoy-interactive') reportar();
}

/** Mide de `desde` a `hasta` (por defecto, ahora). Devuelve ms o `undefined` si falta una marca. @public */
export function measure(nombre: string, desde: Marca, hasta?: Marca): number | undefined {
  if (!ACTIVO) return undefined;
  const a = marcas.get(desde);
  const b = hasta ? marcas.get(hasta) : ahora();
  if (a === undefined || b === undefined) return undefined;
  const ms = b - a;
  medidas.push({ nombre, ms });
  return ms;
}

/** Todas las marcas relativas a `js-start`, en ms. Vacio si la instrumentacion esta apagada. @public */
export function resumen(): Record<string, number> {
  if (!ACTIVO) return {};
  const base = marcas.get('js-start') ?? 0;
  const out: Record<string, number> = {};
  marcas.forEach((t, k) => { out[k] = Math.round(t - base); });
  for (const m of medidas) out[`measure:${m.nombre}`] = Math.round(m.ms);
  return out;
}

function reportar(): void {
  // `__BUNDLE_START_TIME__` lo define el preludio de Metro antes de evaluar
  // cualquier modulo: da el costo de evaluar el bundle hasta `js-start`.
  const g = globalThis as { __BUNDLE_START_TIME__?: number };
  const inicioBundle = g.__BUNDLE_START_TIME__;
  const jsStart = marcas.get('js-start');
  const extra = inicioBundle !== undefined && jsStart !== undefined
    ? { 'bundle-start->js-start': Math.round(jsStart - inicioBundle) }
    : {};
  // eslint-disable-next-line no-console
  console.log(`[perf] ${JSON.stringify({ ...extra, ...resumen() })}`);
}

/**
 * R6 · bloqueos del hilo JS. Con la instrumentacion activa, un reloj de 100 ms mide cuanto tarda
 * de verdad cada vuelta: si llega mas de 50 ms tarde, el hilo JS estuvo ocupado ese tiempo y se
 * imprime `[bloqueo-js] N ms`. Se ve con `adb logcat -s ReactNativeJS | grep bloqueo-js`.
 */
const VUELTA_MS = 100;
const BLOQUEO_MS = 50;
function vigilarBloqueos(): void {
  let anterior = ahora();
  setInterval(() => {
    const t = ahora();
    const tarde = t - anterior - VUELTA_MS;
    anterior = t;
    // eslint-disable-next-line no-console
    if (tarde > BLOQUEO_MS) console.log(`[bloqueo-js] ${Math.round(tarde)} ms`);
  }, VUELTA_MS);
}

// Este modulo es el primer import de index.ts: evaluarlo ES el inicio del JS.
mark('js-start');
if (ACTIVO) vigilarBloqueos();
