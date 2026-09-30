/**
 * R5 · reciclado de FlashList. Scroll rapido por los 190 ejercicios de Explorar mientras se marcan
 * y desmarcan favoritos: ninguna fila puede mostrar la foto, el favorito ni el estado de otra.
 * En Jest cada fila mide 100 y la ventana 900 (ver `flashlist.ts`): la lista monta unas pocas
 * celdas y las reusa al bajar, igual que en el telefono.
 */
import { playersVideo } from './mocks';
import { afterEach, describe, expect, it } from '@jest/globals';
import { act, type ReactTestRenderer, type ReactTestInstance } from 'react-test-renderer';
import { montar, esperar } from './montar';
import { useTienda } from '@/state/tienda';
import Explorar from '@/features/explorar/screens/Explorar';
import { EJERCICIOS } from '@/data/catalog';
import { filtros } from '@/features/explorar/hooks/filtrosExplorar';

let vivo: ReactTestRenderer | null = null;
afterEach(async () => {
  if (vivo) { const r = vivo; await act(async () => { r.unmount(); }); vivo = null; }
  filtros.setSoloMios(true);
});

const esFavorito = (id: string) => useTienda.getState().estado.favoritos.ejercicios.includes(id);

/** Las filas de ejercicio montadas ahora, con lo que muestra cada una. */
function filas(r: ReactTestRenderer) {
  return r.root.findAll(x => x.props.e?.id && typeof x.props.onPress === 'function' && typeof x.type !== 'string')
    .filter((x, i, todas) => todas.findIndex(y => y.props.e === x.props.e) === i)
    .map(fila => {
      const id = fila.props.e.id as string;
      const foto = fila.findAll(x => x.props.tipo === 'ejercicio' && typeof x.props.id === 'string' && 'mini' in x.props)[0];
      const estrella = fila.findAll(x => typeof x.props.activo === 'boolean' && typeof x.props.nombre === 'string')[0];
      return { id, foto: foto?.props.id, recycling: foto?.props.recyclingKey ?? foto?.props.id, activo: estrella?.props.activo };
    });
}

/** El ScrollView de la lista de ejercicios. */
const scroll = (r: ReactTestRenderer): ReactTestInstance =>
  r.root.findAll(x => typeof x.props.onScroll === 'function' && x.props.scrollEventThrottle === 16)
    .filter(x => x.findAll(y => y.props.e?.id).length > 0).pop()!;

describe('reciclado de filas', () => {
  it('scroll rapido por 190 ejercicios marcando favoritos: cada fila muestra lo suyo', async () => {
    vivo = await montar(Explorar as never);
    await esperar(300);
    expect(playersVideo()).toHaveLength(0);   // en listas no se monta ningun player
    const vistos = new Set<string>();
    // El catalogo completo (sin el filtro «lo que puedo hacer con mi equipo»).
    await act(async () => { filtros.setSoloMios(false); });
    await esperar(300);
    const datos = vivo.root.findAll(x => Array.isArray(x.props.data) && x.props.data[0]?.equipment)[0].props.data as unknown[];
    expect(datos).toHaveLength(EJERCICIOS.length);
    const alto = EJERCICIOS.length * 100;
    let maxMontadas = 0;
    for (let paso = 0, y = 0; y <= alto; paso++, y += 450) {
      await act(async () => {
        scroll(vivo!).props.onScroll({
          nativeEvent: {
            contentOffset: { x: 0, y }, layoutMeasurement: { width: 400, height: 900 },
            contentSize: { width: 400, height: alto }, zoomScale: 1,
          },
        });
      });
      await esperar(50);
      const ahora = filas(vivo!);
      expect(ahora.length).toBeGreaterThan(0);
      // Cada paso marca o desmarca el favorito de una fila visible.
      const blanco = ahora[paso % ahora.length];
      const estrella = vivo!.root.findAll(x => x.props.tipo === 'ejercicios' && x.props.id === blanco.id)[0]
        .find(x => typeof x.props.onPress === 'function' && typeof x.props.activo === 'boolean');
      await act(async () => { estrella.props.onPress(); });
      maxMontadas = Math.max(maxMontadas, filas(vivo!).length);
      for (const f of filas(vivo!)) {
        vistos.add(f.id);
        expect(f.foto).toBe(f.id);
        expect(f.recycling).toBe(f.id);
        expect(f.activo).toBe(esFavorito(f.id));
      }
    }
    // La lista si se recorrio (y virtualizada: nunca las 190 montadas a la vez).
    expect(vistos.size).toBe(EJERCICIOS.length);
    expect(maxMontadas).toBeLessThan(40);
  }, 60000);
});
