/**
 * DARENOW · acciones del estado
 *
 * Todo lo que cambia el estado del usuario. Cada accion actualiza con `setEstado(prev => ...)` y
 * pide el guardado diferido (`guardar`). Lo usa `ProveedorEstado` (store.ts), que las expone
 * por `useEstado()`.
 */

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLAVE_ESTADO as CLAVE } from '@/storage/claves';
import { ESTADO_INICIAL } from './estadoInicial';
import { hoy, calcularRacha, mesActual } from './derivados';
import type { Ctx, Estado, PerfilUsuario, MedicionGuardada, RutinaPropia, Favoritos } from './tipos';

export function useAcciones(
  estado: Estado,
  setEstado: Dispatch<SetStateAction<Estado>>,
  guardar: (e: Estado) => void,
  pendienteRef: MutableRefObject<Estado | null>,
  temporizadorRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
  const guardarPerfil = useCallback((p: Partial<PerfilUsuario>) => {
    setEstado(prev => {
      const e = { ...prev, perfil: { ...prev.perfil, ...p } };
      guardar(e);
      return e;
    });
  }, []);

  const marcarPresentacion = useCallback(() => {
    setEstado(prev => {
      const e = { ...prev, presentacionVista: true };
      guardar(e);
      return e;
    });
  }, [guardar]);

  const terminarOnboarding = useCallback((p: PerfilUsuario) => {
    setEstado(prev => {
      const e = { ...prev, perfil: p, onboardingHecho: true };
      guardar(e);
      return e;
    });
  }, []);

  const guardarSesion: Ctx['guardarSesion'] = useCallback((s) => {
    let resultado = { racha: ESTADO_INICIAL.racha, logrosNuevos: [] as string[], graciaUsada: false };

    setEstado(prev => {
      const reales = s.series.filter(x => !x.omitida);
      const cuenta = reales.length >= 1;
      const graciaAntes = prev.racha.mesGracia === mesActual() ? prev.racha.graciaUsada : 0;
      const racha = cuenta ? calcularRacha(prev.racha, s.fecha) : prev.racha;

      const sesiones = [...prev.sesiones, { ...s, id: `${Date.now()}` }];
      const logros = [...prev.logros];
      const nuevos: string[] = [];
      const otorgar = (id: string) => {
        if (!logros.some(l => l.id === id)) { logros.push({ id, fecha: hoy() }); nuevos.push(id); }
      };

      if (racha.dias >= 7) otorgar('logro_007dias');
      if (sesiones.length >= 100) otorgar('logro_100sesiones');
      if (sesiones.length >= 365) otorgar('logro_365sesiones');

      const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const diasMes = new Set(sesiones.filter(x => x.fecha >= hace30).map(x => x.fecha));
      if (diasMes.size >= 20) otorgar('logro_030dias');

      const silenciosas = sesiones.filter(x => x.estado === 'completada').length;
      if (silenciosas >= 5 && prev.perfil.modoSinSaltos) otorgar('logro_silenciosa');
      if (sesiones.length >= 1) otorgar('logro_programa1');

      resultado = {
        racha,
        logrosNuevos: nuevos,
        graciaUsada: racha.graciaUsada > graciaAntes,
      };

      const e = { ...prev, sesiones, racha, logros };
      guardar(e);
      return e;
    });

    return resultado;
  }, []);

  const guardarMedicion = useCallback((m: Omit<MedicionGuardada, 'id'>) => {
    setEstado(prev => {
      const e = { ...prev, mediciones: [...prev.mediciones, { ...m, id: `${Date.now()}` }] };
      guardar(e);
      return e;
    });
  }, []);

  const alternarVeto = useCallback((id: string) => {
    setEstado(prev => {
      const vetos = prev.perfil.vetos.includes(id)
        ? prev.perfil.vetos.filter(v => v !== id)
        : [...prev.perfil.vetos, id];
      const e = { ...prev, perfil: { ...prev.perfil, vetos } };
      guardar(e);
      return e;
    });
  }, []);

  const alternarFavorito = useCallback((tipo: keyof Favoritos, id: string) => {
    setEstado(prev => {
      const actual = prev.favoritos[tipo] ?? [];
      const nuevo = actual.includes(id) ? actual.filter(x => x !== id) : [...actual, id];
      const e = { ...prev, favoritos: { ...prev.favoritos, [tipo]: nuevo } };
      guardar(e);
      return e;
    });
  }, []);

  const esFavorito = useCallback(
    (tipo: keyof Favoritos, id: string) => (estado.favoritos[tipo] ?? []).includes(id),
    [estado.favoritos],
  );

  const marcarBienvenida = useCallback(() => {
    setEstado(prev => {
      if (prev.bienvenidaVista === hoy()) return prev;
      const e = { ...prev, bienvenidaVista: hoy() };
      guardar(e);
      return e;
    });
  }, []);

  const marcarAnuncio = useCallback(() => {
    setEstado(prev => {
      const e = { ...prev, anuncioVisto: hoy() };
      guardar(e);
      return e;
    });
  }, []);

  const aceptarAnuncios = useCallback(() => {
    setEstado(prev => {
      const e = { ...prev, anunciosAceptados: true };
      guardar(e);
      return e;
    });
  }, []);

  const registrarDescarga = useCallback((seccion: string) => {
    setEstado(prev => {
      if (prev.descargas.includes(seccion)) return prev;
      const e = { ...prev, descargas: [...prev.descargas, seccion], anunciosAceptados: true };
      guardar(e);
      return e;
    });
  }, []);

  const alternarTipGuardado = useCallback((id: string) => {
    setEstado(prev => {
      const g = prev.tipsGuardados.includes(id)
        ? prev.tipsGuardados.filter(x => x !== id)
        : [...prev.tipsGuardados, id];
      const e = { ...prev, tipsGuardados: g };
      guardar(e);
      return e;
    });
  }, []);

  const marcarTipLeido = useCallback((id: string) => {
    setEstado(prev => {
      if (prev.tipsLeidos.includes(id)) return prev;
      const e = { ...prev, tipsLeidos: [...prev.tipsLeidos, id] };
      guardar(e);
      return e;
    });
  }, []);

  const iniciarReto = useCallback((id: string) => {
    setEstado(prev => {
      const e = { ...prev, retos: { ...prev.retos, [id]: { iniciado: hoy(), progreso: 0 } } };
      guardar(e);
      return e;
    });
  }, []);

  /** Crea el borrador en memoria. No se guarda hasta que el usuario acepta. */
  const nuevaRutinaPropia = useCallback((base: Partial<RutinaPropia> = {}): RutinaPropia => ({
    id: `mi_${Date.now().toString(36)}`,
    nombre: '',
    objetivo: 'bajar_peso',
    items: [],
    creada: hoy(),
    editada: hoy(),
    // rt_001..rt_030: las 30 fotos de rutina del catalogo. Al azar para que
    // una rutina nueva se vea terminada de una vez, no con el marcador.
    imagenId: `rt_${String(Math.floor(Math.random() * 30) + 1).padStart(3, '0')}`,
    ...base,
  }), []);

  const guardarRutinaPropia = useCallback((r: RutinaPropia) => {
    setEstado(prev => {
      const existe = prev.rutinasPropias.some(x => x.id === r.id);
      const lista = existe
        ? prev.rutinasPropias.map(x => (x.id === r.id ? { ...r, editada: hoy() } : x))
        : [...prev.rutinasPropias, r];
      const e = { ...prev, rutinasPropias: lista };
      guardar(e);
      return e;
    });
  }, [guardar]);

  const borrarRutinaPropia = useCallback((id: string) => {
    setEstado(prev => {
      const e = {
        ...prev,
        rutinasPropias: prev.rutinasPropias.filter(x => x.id !== id),
        favoritos: { ...prev.favoritos, rutinas: prev.favoritos.rutinas.filter(x => x !== id) },
      };
      guardar(e);
      return e;
    });
  }, [guardar]);

  const reiniciar = useCallback(() => {
    // Sin esto, una escritura diferida que ya estaba en el temporizadorRef de
    // 350ms (ver `guardar` arriba) se dispara DESPUES del borrado y
    // resucita el progreso viejo en AsyncStorage.
    if (temporizadorRef.current) { clearTimeout(temporizadorRef.current); temporizadorRef.current = null; }
    pendienteRef.current = null;
    AsyncStorage.removeItem(CLAVE).catch(() => {});
    setEstado(ESTADO_INICIAL);
  }, []);

  const borrarMedidas = useCallback(() => {
    setEstado(prev => {
      const e = {
        ...prev,
        mediciones: [],
        perfil: { ...prev.perfil, pesoKg: undefined, pesoObjetivoKg: undefined, alturaCm: undefined },
      };
      guardar(e);
      return e;
    });
  }, [guardar]);

  /** Ultimo rendimiento registrado de un ejercicio. */
  const ultimaVezDe = useCallback((id: string) => {
    for (let i = estado.sesiones.length - 1; i >= 0; i--) {
      const s = estado.sesiones[i];
      const serie = [...s.series].reverse().find(x => x.ejercicioId === id && !x.omitida);
      if (serie) {
        return {
          reps: serie.reps ?? undefined,
          segundos: serie.segundos ?? undefined,
          pesoKg: serie.pesoKg ?? undefined,
          fecha: s.fecha,
        };
      }
    }
    return undefined;
  }, [estado.sesiones]);

  return {
    guardarPerfil, terminarOnboarding, marcarPresentacion, guardarSesion, guardarMedicion,
    alternarVeto, alternarTipGuardado, marcarTipLeido, iniciarReto, ultimaVezDe, reiniciar,
    borrarMedidas, alternarFavorito, esFavorito, marcarBienvenida, marcarAnuncio, aceptarAnuncios,
    registrarDescarga, guardarRutinaPropia, borrarRutinaPropia, nuevaRutinaPropia,
  };
}
