/**
 * FORJA · estado del usuario
 *
 * AsyncStorage en vez de SQLite para esta build de prueba: corre en Expo Go
 * sin pasos extra y el volumen de datos lo aguanta de sobra (unos 90 KB por
 * semestre de uso). El esquema SQL sigue en db/user_schema.sql para cuando
 * pases a build nativa; los campos son los mismos.
 *
 * Regla del producto: nada se pierde. Una sesion abandonada se guarda igual
 * y cuenta para la racha si hubo al menos una serie real.
 */

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PERFIL_INICIAL, ESTADO_INICIAL } from './estadoInicial';
import { mark as perfMark } from '@/dev/perfMarks'; // perf:R1
import { CLAVE_ESTADO as CLAVE } from '@/storage/claves';
import { revisarPausa } from './derivados';
import { useAcciones } from './acciones';
import type {
  Ctx, SesionGuardada, MedicionGuardada, PerfilUsuario, Racha, ItemPropio, RutinaPropia, Favoritos, Estado,
} from './tipos';

export type { SesionGuardada, MedicionGuardada, PerfilUsuario, Racha, ItemPropio, RutinaPropia, Favoritos, Estado };
export {
  hoy, imagenRutina, calcularRacha, revisarPausa, estadisticas, ultimos7, minutosPorDia, diasEntrenados,
} from './derivados';

/* ------------------------------------------------------------------ */
/* Contexto                                                            */
/* ------------------------------------------------------------------ */

const Contexto = createContext<Ctx | null>(null);

export function ProveedorEstado({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(ESTADO_INICIAL);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    perfMark('providers-montados'); // perf:R1
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CLAVE);
        if (raw) {
          const cargado = { ...ESTADO_INICIAL, ...JSON.parse(raw) } as Estado;
          // El merge de arriba es superficial: un perfil guardado antes de
          // que existiera un campo nuevo lo dejaria en undefined. Se rellena
          // con los valores iniciales para que anadir ajustes no rompa a
          // quien ya venia usando la app.
          cargado.perfil = { ...PERFIL_INICIAL, ...cargado.perfil };
          cargado.racha = revisarPausa(cargado.racha);
          setEstado(cargado);
        }
      } catch { /* arranca limpio */ }
      perfMark('storage-ready'); // perf:R1
      setCargando(false);
    })();
  }, []);

  /**
   * Guardado diferido.
   *
   * Antes cada cambio serializaba el estado completo dentro del setState, y
   * tocar "cambiar programa" congelaba la pantalla medio segundo. Ahora la
   * interfaz responde de inmediato y el guardado se agrupa: si llegan varios
   * cambios seguidos, se escribe una sola vez.
   */
  const pendiente = useRef<Estado | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guardar = useCallback((e: Estado) => {
    pendiente.current = e;
    if (temporizador.current) return;
    temporizador.current = setTimeout(() => {
      temporizador.current = null;
      const x = pendiente.current;
      pendiente.current = null;
      if (x) AsyncStorage.setItem(CLAVE, JSON.stringify(x)).catch(() => {});
    }, 350);
  }, []);

  // Si la app se va a segundo plano, se escribe ya lo que quede pendiente.
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      if (st !== 'active' && pendiente.current) {
        AsyncStorage.setItem(CLAVE, JSON.stringify(pendiente.current)).catch(() => {});
        pendiente.current = null;
      }
    });
    return () => sub.remove();
  }, []);

  const {
    guardarPerfil, terminarOnboarding, marcarPresentacion, guardarSesion, guardarMedicion,
    alternarVeto, alternarTipGuardado, marcarTipLeido, iniciarReto, ultimaVezDe, reiniciar,
    borrarMedidas, alternarFavorito, esFavorito, marcarBienvenida, marcarAnuncio, aceptarAnuncios,
    registrarDescarga, guardarRutinaPropia, borrarRutinaPropia, nuevaRutinaPropia,
  } = useAcciones(estado, setEstado, guardar, pendiente, temporizador);

  const valor = useMemo<Ctx>(() => ({
    estado, cargando, guardarPerfil, terminarOnboarding, marcarPresentacion, guardarSesion,
    guardarMedicion, alternarVeto, alternarTipGuardado, marcarTipLeido,
    iniciarReto, ultimaVezDe, reiniciar, borrarMedidas,
    alternarFavorito, esFavorito, marcarBienvenida, marcarAnuncio,
    aceptarAnuncios, registrarDescarga,
    guardarRutinaPropia, borrarRutinaPropia, nuevaRutinaPropia,
  }), [estado, cargando, guardarPerfil, terminarOnboarding, marcarPresentacion, guardarSesion,
       guardarMedicion, alternarVeto, alternarTipGuardado, marcarTipLeido,
       iniciarReto, ultimaVezDe, reiniciar, borrarMedidas,
       alternarFavorito, esFavorito, marcarBienvenida, marcarAnuncio,
       aceptarAnuncios, registrarDescarga,
       guardarRutinaPropia, borrarRutinaPropia, nuevaRutinaPropia]);

  return React.createElement(Contexto.Provider, { value: valor }, children);
}

export function useEstado(): Ctx {
  const c = useContext(Contexto);
  if (!c) throw new Error('useEstado fuera del proveedor');
  return c;
}
