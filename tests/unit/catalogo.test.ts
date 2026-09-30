import { describe, expect, it } from '@jest/globals';
import * as viejo from './fixtures/catalogoViejo';
import * as nuevo from '@/data/catalog';
import * as aprender from '@/data/aprender';
import * as logros from '@/data/logros';
import { aItem, sesionDePropia, sesionDeRutina, type Perfil } from '@/lib/engine/session';

/**
 * R3: el catalogo nuevo (indice ligero + detalle bajo demanda) contra el de antes, congelado en
 * fixtures/catalogoViejo.ts. Todo debe dar exactamente lo mismo, en valores y en orden de claves.
 */
const exacto = (x: unknown) => JSON.stringify(x);
const TEXTOS_EJ = ['desc', 'steps', 'cues', 'errors', 'breathing', 'progressions', 'regressions'];
/** Lo que trae el indice: el objeto de antes sin sus textos largos (quedan en null, en su lugar). */
const sinTextos = (o: object, campos: string[]) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, campos.includes(k) ? null : v]));

describe('catalogo: nuevo == viejo', () => {
  it('getEjercicio(id) da el ejercicio de antes, con su orden de claves y el patron de su familia', () => {
    expect(nuevo.EJERCICIOS).toHaveLength(190);
    expect(nuevo.EJERCICIOS.map(e => e.id)).toEqual(viejo.EJERCICIOS.map(e => e.id));
    for (const v of viejo.EJERCICIOS) {
      const e = nuevo.getEjercicio(v.id);
      expect(exacto(e)).toBe(exacto(v));
      expect(e?.patron).toBe(v.patron);
    }
    // memorizado: la segunda vez es el mismo objeto
    expect(nuevo.getEjercicio('flexion_estandar')).toBe(nuevo.getEjercicio('flexion_estandar'));
    expect(nuevo.getEjercicio('no_existe')).toBeUndefined();
  });

  it('el indice es el ejercicio de antes sin sus textos', () => {
    nuevo.EJERCICIOS.forEach((e, i) => {
      expect(exacto(e)).toBe(exacto(sinTextos(viejo.EJERCICIOS[i], TEXTOS_EJ)));
    });
    expect(exacto([...nuevo.porId.keys()])).toBe(exacto([...viejo.porId.keys()]));
  });

  it('musculos y tips: indice sin textos, getX completo; salas identicas', () => {
    nuevo.MUSCULOS.forEach((m, i) => {
      const v = viejo.MUSCULOS[i];
      expect(exacto(m)).toBe(exacto(sinTextos(v, ['funcion', 'dolor_comun'])));
      expect(exacto(nuevo.getMusculo(m.id))).toBe(exacto(v));
    });
    nuevo.TIPS.forEach((t, i) => {
      const v = viejo.TIPS[i];
      expect(exacto(t)).toBe(exacto(sinTextos(v, ['cuerpo'])));
      expect(exacto(nuevo.getTip(t.id))).toBe(exacto(v));
    });
    expect(exacto(nuevo.tipsCompletos())).toBe(exacto(viejo.TIPS));
    expect(nuevo.MUSCULOS).toHaveLength(viejo.MUSCULOS.length);
    expect(nuevo.TIPS).toHaveLength(viejo.TIPS.length);
    expect(exacto(nuevo.SALAS)).toBe(exacto(viejo.SALAS));
  });

  it('equipo, rutinas, programas y conteos identicos', () => {
    expect(exacto(nuevo.EQUIPO)).toBe(exacto(viejo.EQUIPO));
    expect(exacto(nuevo.RUTINAS)).toBe(exacto(viejo.RUTINAS));
    expect(exacto(nuevo.PROGRAMAS)).toBe(exacto(viejo.PROGRAMAS));
    expect(exacto(nuevo.ESTADISTICAS)).toBe(exacto(viejo.ESTADISTICAS));
  });

  it('datos de Aprender y de logros identicos (ahora en aprender.ts y logros.ts)', () => {
    expect(exacto(aprender.MITOS)).toBe(exacto(viejo.MITOS));
    expect(exacto(aprender.ERRORES)).toBe(exacto(viejo.ERRORES));
    expect(exacto(aprender.NUTRICION)).toBe(exacto(viejo.NUTRICION));
    expect(exacto(aprender.GLOSARIO)).toBe(exacto(viejo.GLOSARIO));
    expect(exacto(aprender.FAQ)).toBe(exacto(viejo.FAQ));
    expect(exacto(logros.RETOS)).toBe(exacto(viejo.RETOS));
    expect(exacto(logros.LOGROS)).toBe(exacto(viejo.LOGROS));
    expect(exacto(logros.MEDICIONES)).toBe(exacto(viejo.MEDICIONES));
    expect(exacto([...logros.logroPorId])).toBe(exacto([...viejo.logroPorId]));
  });

  it('indices por id con las mismas claves', () => {
    const pares: [Map<string, unknown>, Map<string, unknown>][] = [
      [nuevo.familiaPorId, viejo.familiaPorId], [nuevo.equipoPorId, viejo.equipoPorId],
      [nuevo.rutinaPorId, viejo.rutinaPorId], [nuevo.programaPorId, viejo.programaPorId],
      [nuevo.salaPorId, viejo.salaPorId],
    ];
    for (const [n, v] of pares) expect(exacto([...n])).toBe(exacto([...v]));
    expect([...nuevo.musculoPorId.keys()]).toEqual([...viejo.musculoPorId.keys()]);
  });

  it('funciones de acceso: mismo resultado para todos', () => {
    nuevo.EJERCICIOS.forEach((e, i) => {
      const v = viejo.EJERCICIOS[i];
      expect(nuevo.evidenciaDe(e)).toEqual(viejo.evidenciaDe(v));
      expect(nuevo.nombreEquipo(e.equipment)).toBe(viejo.nombreEquipo(v.equipment));
    });
    for (const g of viejo.GOALS) expect(nuevo.nombreGoal(g.id)).toBe(viejo.nombreGoal(g.id));
    expect(nuevo.nombreGoal('desconocido')).toBe(viejo.nombreGoal('desconocido'));
    expect(nuevo.GOALS).toEqual(viejo.GOALS);
    expect(nuevo.CATEGORIAS).toEqual(viejo.CATEGORIAS);
  });

  it('lo que se guarda en forja:sesion_en_curso serializa igual (aItem, rutina, rutina propia)', () => {
    // aItem tal como era antes de R3, sobre el ejercicio del catalogo viejo
    const TOPE = { calentamiento: 45, principal: 90, enfriamiento: 45 } as const;
    const aItemViejo = (e: viejo.Ejercicio, bloque: keyof typeof TOPE) => {
      const seg = e.default.seg ?? null;
      return {
        ...e, bloque, seriesPlan: e.default.series ?? 3, repsPlan: e.default.reps ?? null,
        segPlan: seg == null ? null : Math.min(seg, TOPE[bloque]),
        descansoPlan: Math.min(e.default.rest_s ?? 45, bloque === 'principal' ? 90 : 15),
      };
    };
    nuevo.EJERCICIOS.forEach((e, i) => {
      for (const b of ['calentamiento', 'principal', 'enfriamiento'] as const) {
        expect(exacto(aItem(e, b))).toBe(exacto(aItemViejo(viejo.EJERCICIOS[i], b)));
      }
    });
    const p: Perfil = { objetivo: 'musculo', nivel: 2, minPorSesion: 30, modoSinSaltos: false, espacio: 'amplio', equipo: [], contra: [], vetos: [] };
    for (const r of nuevo.RUTINAS) {
      const s = sesionDeRutina(r.id, p, r);
      s.items.forEach(it => expect(exacto(Object.entries(it).slice(0, -5))).toBe(exacto(Object.entries(viejo.porId.get(it.id)!))));
    }
    const propia = sesionDePropia({ id: 'x', nombre: 'x', items: nuevo.EJERCICIOS.slice(0, 5).map(e => ({ ejercicioId: e.id, series: 3, descansoS: 30 })) } as never, p);
    propia.items.forEach(it => expect(exacto(Object.entries(it).slice(0, -5))).toBe(exacto(Object.entries(viejo.porId.get(it.id)!))));
  });
});
