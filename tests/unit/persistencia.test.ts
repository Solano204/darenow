/**
 * R4 · el estado pasó de un contexto a un store (Zustand). Lo guardado en el teléfono no cambia:
 * misma clave (`forja:v1`), mismo JSON de `Estado` (sin el envoltorio `{ state, version }` de
 * `persist`), la misma lectura con sus rellenos y el mismo guardado agrupado.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLAVE_ESTADO } from '@/storage/claves';
import { ESTADO_INICIAL, PERFIL_INICIAL } from '@/state/estadoInicial';
import { revisarPausa } from '@/state/derivados';
import { useTienda, cargarEstado, escribirPendiente } from '@/state/tienda';
import * as acciones from '@/state/acciones';

/** Un estado guardado por una versión anterior: perfil sin campos nuevos, sin `tipsGuardados`. */
const GUARDADO_VIEJO = {
  presentacionVista: true,
  onboardingHecho: true,
  bienvenidaVista: '2026-09-01',
  anuncioVisto: null,
  anunciosAceptados: false,
  descargas: ['ejercicios'],
  favoritos: { ejercicios: ['ex_1001'], musculos: [], rutinas: ['rt_002'], programas: [], tips: [] },
  rutinasPropias: [{ id: 'mi_1', nombre: 'Mía', objetivo: 'musculo', items: [{ ejercicioId: 'ex_1001', series: 3, reps: 10, descansoS: 60 }], creada: '2026-08-01', editada: '2026-08-02' }],
  perfil: { nombre: 'Ana', objetivo: 'musculo', nivel: 2, diasPorSemana: 4, minPorSesion: 30, modoSinSaltos: true, espacio: 'amplio', equipo: ['mancuernas'], contra: [], vetos: ['ex_1002'], programaId: 'pg_003' },
  sesiones: [{ id: '1', fecha: '2026-08-30', iniciada: '2026-08-30T10:00:00Z', duracionS: 1200, rutinaId: 'rt_002', programaId: 'pg_003', estado: 'completada', kcal: 90, rpe: null, motivoAbandono: null, series: [{ ejercicioId: 'ex_1001', serieNum: 1, lado: null, reps: 12, segundos: null, pesoKg: 8, omitida: false }] }],
  mediciones: [],
  racha: { dias: 3, mejor: 5, ultimoDia: '2026-08-30', graciaUsada: 0, mesGracia: '2026-08', enPausa: false },
  logros: [{ id: 'logro_programa1', fecha: '2026-08-01' }],
  retos: {},
  tipsLeidos: ['nut_001'],
  semanaPrograma: 2,
};

/** La lectura de antes de R4 (store.ts con contexto), copiada tal cual. */
function lecturaDeAntes(raw: string) {
  const cargado = { ...ESTADO_INICIAL, ...JSON.parse(raw) };
  cargado.perfil = { ...PERFIL_INICIAL, ...cargado.perfil };
  cargado.racha = revisarPausa(cargado.racha);
  return cargado;
}

describe('persistencia del estado (misma clave, mismo formato)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useTienda.setState({ estado: ESTADO_INICIAL, cargando: true });
  });
  afterEach(() => { jest.useRealTimers(); });

  it('lee un estado guardado con el formato actual igual que antes', async () => {
    const raw = JSON.stringify(GUARDADO_VIEJO);
    await AsyncStorage.setItem(CLAVE_ESTADO, raw);
    await cargarEstado();
    const { estado, cargando } = useTienda.getState();
    expect(cargando).toBe(false);
    expect(estado).toEqual(lecturaDeAntes(raw));
    expect(JSON.stringify(estado)).toBe(JSON.stringify(lecturaDeAntes(raw)));
  });

  it('sin nada guardado, o con algo corrupto, arranca limpio', async () => {
    await cargarEstado();
    expect(useTienda.getState().estado).toBe(ESTADO_INICIAL);
    useTienda.setState({ cargando: true });
    await AsyncStorage.setItem(CLAVE_ESTADO, '{roto');
    await cargarEstado();
    expect(useTienda.getState()).toEqual({ estado: ESTADO_INICIAL, cargando: false });
  });

  it('guarda en la misma clave el JSON de Estado, sin envoltorio, agrupado a 350 ms', async () => {
    jest.useFakeTimers();
    const raw = JSON.stringify(GUARDADO_VIEJO);
    await AsyncStorage.setItem(CLAVE_ESTADO, raw);
    await cargarEstado();
    acciones.alternarFavorito('ejercicios', 'ex_1003');
    acciones.marcarTipLeido('nut_002');
    expect(await AsyncStorage.getItem(CLAVE_ESTADO)).toBe(raw); // todavía no
    jest.advanceTimersByTime(350);
    const escrito = await AsyncStorage.getItem(CLAVE_ESTADO);
    const esperado = lecturaDeAntes(raw);
    esperado.favoritos = { ...esperado.favoritos, ejercicios: ['ex_1001', 'ex_1003'] };
    esperado.tipsLeidos = ['nut_001', 'nut_002'];
    expect(escrito).toBe(JSON.stringify(esperado));
    expect(Object.keys(JSON.parse(escrito!))).toEqual(Object.keys(esperado));
    expect(await AsyncStorage.getAllKeys()).toEqual([CLAVE_ESTADO]);
  });

  it('una acción que no cambia nada no escribe', async () => {
    jest.useFakeTimers();
    await AsyncStorage.setItem(CLAVE_ESTADO, JSON.stringify(GUARDADO_VIEJO));
    await cargarEstado();
    const antes = useTienda.getState().estado;
    acciones.marcarTipLeido('nut_001');
    expect(useTienda.getState().estado).toBe(antes);
    jest.advanceTimersByTime(1000);
    expect(await AsyncStorage.getItem(CLAVE_ESTADO)).toBe(JSON.stringify(GUARDADO_VIEJO));
  });

  it('al ir a segundo plano escribe lo pendiente de inmediato', async () => {
    jest.useFakeTimers();
    await cargarEstado();
    acciones.guardarPerfil({ nombre: 'Luis' });
    escribirPendiente();
    expect(JSON.parse((await AsyncStorage.getItem(CLAVE_ESTADO))!).perfil.nombre).toBe('Luis');
  });

  it('reiniciar borra lo guardado y una escritura pendiente no lo resucita', async () => {
    jest.useFakeTimers();
    await AsyncStorage.setItem(CLAVE_ESTADO, JSON.stringify(GUARDADO_VIEJO));
    await cargarEstado();
    acciones.alternarFavorito('ejercicios', 'ex_1004');
    acciones.reiniciar();
    jest.advanceTimersByTime(1000);
    expect(await AsyncStorage.getItem(CLAVE_ESTADO)).toBeNull();
    expect(useTienda.getState().estado).toBe(ESTADO_INICIAL);
  });

  it('guardarSesion devuelve racha y logros y guarda la sesión', async () => {
    jest.useFakeTimers();
    await AsyncStorage.setItem(CLAVE_ESTADO, JSON.stringify(GUARDADO_VIEJO));
    await cargarEstado();
    const r = acciones.guardarSesion({
      fecha: '2026-08-31', iniciada: '2026-08-31T10:00:00Z', duracionS: 900, rutinaId: null, programaId: 'pg_003',
      estado: 'completada', kcal: null, rpe: null, motivoAbandono: null,
      series: [{ ejercicioId: 'ex_1001', serieNum: 1, lado: null, reps: 10, segundos: null, pesoKg: null, omitida: false }],
    });
    expect(r.racha.dias).toBe(4);
    expect(r.logrosNuevos).toEqual([]);
    expect(useTienda.getState().estado.sesiones).toHaveLength(2);
    expect(acciones.ultimaVezDe('ex_1001')).toEqual({ reps: 10, segundos: undefined, pesoKg: undefined, fecha: '2026-08-31' });
    jest.advanceTimersByTime(350);
    expect(JSON.parse((await AsyncStorage.getItem(CLAVE_ESTADO))!).sesiones).toHaveLength(2);
  });
});
