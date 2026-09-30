/**
 * R4 · contador de renders para las pruebas (el equivalente de «Highlight updates» de React
 * DevTools, sin teléfono).
 *
 * Se instala como `__REACT_DEVTOOLS_GLOBAL_HOOK__` ANTES de que cargue React (setupFiles). En
 * cada commit recorre el árbol de fibras y cuenta los componentes cuya función se ejecutó: la
 * misma señal que usa DevTools (`PerformedWork`). Un subárbol que React no tocó conserva sus
 * fibras con las mismas props y el mismo estado, así que no se vuelve a contar.
 */
type Fibra = {
  tag: number; type: unknown; elementType: unknown; flags: number; child: Fibra | null; sibling: Fibra | null;
  memoizedProps: unknown; memoizedState: unknown; actualDuration?: number; selfBaseDuration?: number;
};

const COMPONENTE = new Set([0, 1, 11, 14, 15]); // Function, Class, ForwardRef, Memo, SimpleMemo
const PERFORMED_WORK = 1;

let grabando = false;
let renders = new Map<string, number>();
let ms = 0;
let commits = 0;
const visto = new WeakMap<object, { p: unknown; s: unknown }>();

function nombre(f: Fibra): string {
  const t = (f.elementType ?? f.type) as { displayName?: string; name?: string; type?: { displayName?: string; name?: string }; render?: { displayName?: string; name?: string } } | null;
  if (!t) return '?';
  return t.displayName || t.name || t.type?.displayName || t.type?.name || t.render?.displayName || t.render?.name || 'Anonimo';
}

function recorrer(f: Fibra | null) {
  while (f) {
    if (COMPONENTE.has(f.tag) && (f.flags & PERFORMED_WORK)) {
      const antes = visto.get(f);
      if (!antes || antes.p !== f.memoizedProps || antes.s !== f.memoizedState) {
        visto.set(f, { p: f.memoizedProps, s: f.memoizedState });
        if (grabando) {
          const n = nombre(f);
          renders.set(n, (renders.get(n) ?? 0) + 1);
          ms += f.selfBaseDuration ?? 0;
        }
      }
    }
    recorrer(f.child);
    f = f.sibling;
  }
}

(globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  supportsFiber: true,
  isDisabled: false,
  renderers: new Map(),
  inject: () => 1,
  checkDCE: () => {},
  onScheduleFiberRoot: () => {},
  onCommitFiberUnmount: () => {},
  onPostCommitFiberRoot: () => {},
  onCommitFiberRoot: (_id: number, root: { current: Fibra }) => {
    if (grabando) commits++;
    recorrer(root.current);
  },
};

export interface Grabacion { commits: number; total: number; ms: number; porComponente: Record<string, number> }

/** Empieza a contar (lo de antes, como el montaje, no cuenta). */
export function grabar() { grabando = true; renders = new Map(); ms = 0; commits = 0; }

/** Deja de contar y devuelve lo grabado. */
export function detener(): Grabacion {
  grabando = false;
  const porComponente = Object.fromEntries([...renders].sort((a, b) => b[1] - a[1]));
  const total = [...renders.values()].reduce((a, b) => a + b, 0);
  return { commits, total, ms: Math.round(ms * 10) / 10, porComponente };
}
