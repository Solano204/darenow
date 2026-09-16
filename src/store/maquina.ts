/**
 * FORJA · ajuste de maquina por ejercicio
 *
 * Nota libre ("asiento 4, respaldo 2, pin 8") para no redescubrir la
 * posicion cada vez que toca un ejercicio de maquina. Vive en su propia
 * clave de AsyncStorage, separada de PerfilUsuario y del historial de
 * sesiones (store.ts, protegido): un mapa simple ejercicioId -> texto.
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLAVE = 'forja:ajustes_maquina';

export function useAjustesMaquina(): [Record<string, string>, (ejercicioId: string, valor: string) => void] {
  const [ajustes, setAjustes] = useState<Record<string, string>>({});

  useEffect(() => {
    AsyncStorage.getItem(CLAVE).then(v => {
      if (!v) return;
      try { setAjustes(JSON.parse(v)); } catch { /* dato corrupto, se ignora */ }
    }).catch(() => {});
  }, []);

  const guardar = useCallback((ejercicioId: string, valor: string) => {
    setAjustes(prev => {
      const next = { ...prev, [ejercicioId]: valor };
      AsyncStorage.setItem(CLAVE, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return [ajustes, guardar];
}
