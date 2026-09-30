/**
 * R4 · las 11 grabaciones de re-renders (docs/perf/R4_REPORTE.md §1).
 *
 * Cada prueba monta la pantalla real con los providers de la app, graba una interacción y
 * cuenta qué componentes se ejecutaron. Con `RENDERS_SALIDA=archivo.json` guarda los números
 * (así se generaron las tablas de antes y después).
 */
import './mocks';
import fs from 'fs';
import path from 'path';
import { afterAll, afterEach, describe, expect, it } from '@jest/globals';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { grabar, detener, type Grabacion } from './contador';
import { montar, esperar, tocar, usarRelojFalso } from './montar';
import Explorar from '@/features/explorar/screens/Explorar';
import Hoy from '@/features/hoy/screens/Hoy';
import Yo from '@/features/perfil/screens/Yo';
import Aprender from '@/features/aprender/screens/Aprender';
import Ajustes from '@/features/ajustes/screens/Ajustes';
import DetalleEjercicio from '@/features/ejercicio/screens/DetalleEjercicio';
import Reproductor from '@/features/sesion/screens/Reproductor';
import { EJERCICIOS, RUTINAS } from '@/data/catalog';
import { sesionDeRutina } from '@/lib/engine/session';
import { PERFIL_INICIAL } from '@/state/estadoInicial';

/** Componentes definidos en src/ (lo demás es de React Native o de librerías). */
const DE_LA_APP = (() => {
  const nombres = new Set<string>();
  const leer = (d: string) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) leer(p);
      else if (/\.tsx?$/.test(f.name)) {
        for (const m of fs.readFileSync(p, 'utf8').matchAll(/(?:function|const)\s+([A-Z][A-Za-z0-9]*)/g)) nombres.add(m[1]);
      }
    }
  };
  leer(path.join(__dirname, '../../../src'));
  return nombres;
})();

interface Resultado extends Grabacion { app: number; topApp: Record<string, number> }
const resultados: Record<string, Resultado> = {};
function guardar(nombre: string, g: Grabacion): Resultado {
  const app = Object.entries(g.porComponente).filter(([n]) => DE_LA_APP.has(n));
  const r = { ...g, app: app.reduce((a, [, n]) => a + n, 0), topApp: Object.fromEntries(app.slice(0, 15)) };
  resultados[nombre] = r;
  return r;
}

let vivo: ReactTestRenderer | null = null;
afterEach(async () => {
  if (vivo) { const r = vivo; await act(async () => { r.unmount(); }); vivo = null; }
  usarRelojFalso(false);
});
afterAll(() => {
  const salida = process.env.RENDERS_SALIDA;
  if (salida) fs.writeFileSync(salida, JSON.stringify(resultados, null, 1) + '\n');
});

/** Id de la n-ésima fila de ejercicio que la lista ya pintó (y que no es favorito). */
const filaVisible = (r: ReactTestRenderer, n: number): string =>
  r.root.findAll(x => x.props.e?.id && typeof x.props.onFav === 'function' && x.props.favorito === false)[n].props.e.id;

describe('re-renders por interacción', () => {
  it('1 · tocar 3 chips seguidos en Explorar → Ejercicios', async () => {
    vivo = await montar(Explorar as never);
    grabar();
    for (const c of ['Fuerza', 'Cardio', 'Movilidad']) { await tocar(vivo, p => p.texto === c); await esperar(); }
    expect(guardar('chips', detener()).total).toBeGreaterThan(0);
  });

  it('2 · escribir «sentadilla» en el buscador de Explorar', async () => {
    vivo = await montar(Explorar as never);
    const campo = () => vivo!.root.find(n => typeof n.props.onChangeText === 'function');
    grabar();
    const palabra = 'sentadilla';
    for (let i = 1; i <= palabra.length; i++) {
      await act(async () => { campo().props.onChangeText(palabra.slice(0, i)); });
    }
    await esperar(300);
    const g = guardar('buscador', detener());
    expect(g.total).toBeGreaterThan(0);
    expect(campo().props.value).toBe(palabra);
  });

  it('3 · marcar y desmarcar un favorito en la lista de Explorar', async () => {
    vivo = await montar(Explorar as never);
    const id = filaVisible(vivo, 3);
    const fila = () => vivo!.root.find(n => n.props.e?.id === id && typeof n.props.onFav === 'function');
    grabar();
    await act(async () => { fila().props.onFav(id); });
    await esperar();
    expect(fila().props.favorito).toBe(true);
    await act(async () => { fila().props.onFav(id); });
    await esperar();
    expect(fila().props.favorito).toBe(false);
    guardar('favorito', detener());
  });

  it('3b · el mismo favorito con las 4 pestañas montadas', async () => {
    const Tab = createBottomTabNavigator();
    const Pestanas = () => (
      <Tab.Navigator screenOptions={{ headerShown: false, lazy: false }}>
        <Tab.Screen name="Explorar" component={Explorar} />
        <Tab.Screen name="Hoy" component={Hoy} />
        <Tab.Screen name="Aprender" component={Aprender} />
        <Tab.Screen name="Yo" component={Yo} />
      </Tab.Navigator>
    );
    vivo = await montar(Pestanas as never);
    const id = filaVisible(vivo, 3);
    const fila = () => vivo!.root.find(n => n.props.e?.id === id && typeof n.props.onFav === 'function');
    grabar();
    await act(async () => { fila().props.onFav(id); });
    await esperar();
    await act(async () => { fila().props.onFav(id); });
    await esperar();
    guardar('favorito4pestanas', detener());
  });

  it('4 · 30 segundos del reproductor en fase Trabaja', async () => {
    usarRelojFalso(true);
    const rutina = RUTINAS.find(r => r.id === 'rt_001')!;
    const s = sesionDeRutina(rutina.id, { ...PERFIL_INICIAL, equipo: [] } as never, rutina);
    // Un ejercicio por tiempo (cuenta por segundo en Trabaja) y sin el editor previo.
    const i = Math.max(0, s.items.findIndex(x => x.segPlan != null));
    const items = [{ ...s.items[i], segPlan: 45, repsPlan: null, seriesPlan: 1 }];
    vivo = await montar(Reproductor as never, { sesion: { ...s, items, origenPropia: true } });
    // «Listo» (3 s) y Prepárate: hasta que la fase sea Trabaja.
    const fase = () => vivo!.root.findAll(n => typeof n.props.estado?.fase === 'string' && Array.isArray(n.props.items))[0]?.props.estado.fase;
    for (let k = 0; k < 40 && fase() !== 'trabajo'; k++) await esperar(1000);
    expect(fase()).toBe('trabajo');
    grabar();
    for (let k = 0; k < 30; k++) await esperar(1000);
    const g = guardar('reproductor30s', detener());
    expect(g.commits).toBeGreaterThan(0);
  }, 60000);

  it('5 · cambiar días por semana en Ajustes', async () => {
    vivo = await montar(Ajustes as never);
    const control = () => vivo!.root.find(n => n.props.sufijo === 'días' && typeof n.props.onCambio === 'function');
    grabar();
    await act(async () => { control().props.onCambio(4); });
    await esperar(400);
    guardar('ajustesDias', detener());
    expect(control().props.valor).toBe(4);
  });

  it('E1 · montar Hoy (hasta quedar quieto)', async () => {
    grabar();
    vivo = await montar(Hoy as never);
    await esperar(200);
    guardar('montarHoy', detener());
  });

  it('E3 · montar la ficha de un ejercicio', async () => {
    grabar();
    vivo = await montar(DetalleEjercicio as never, { id: EJERCICIOS[10].id });
    await esperar(200);
    guardar('montarFicha', detener());
  });

  it('E5 · Aprender → segmento Mitos', async () => {
    vivo = await montar(Aprender as never);
    grabar();
    await act(async () => { vivo!.root.find(n => Array.isArray(n.props.segmentos) && typeof n.props.onCambio === 'function').props.onCambio('mitos'); });
    await esperar(200);
    guardar('aprenderMitos', detener());
  });

  it('E6 · montar Yo', async () => {
    grabar();
    vivo = await montar(Yo as never);
    await esperar(200);
    guardar('montarYo', detener());
  });
});
