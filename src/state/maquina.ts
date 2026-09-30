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

import { CLAVE_MAQUINA as CLAVE } from '@/storage/claves';

export function useAjustesMaquina(): [Record<string, string>, (ejercicioId: string, valor: string) => void] {
  const [ajustes, setAjustes] = useState<Record<string, string>>({});

  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(CLAVE).then(v => {
      if (!vivo || !v) return;
      // Lo leido va debajo de lo que el usuario ya haya guardado mientras llegaba (R6: antes la
      // lectura vieja borraba la nota recien escrita).
      try {
        const leido = JSON.parse(v) as Record<string, string>;
        setAjustes(prev => ({ ...leido, ...prev }));
      } catch { /* dato corrupto, se ignora */ }
    }).catch(() => {});
    return () => { vivo = false; };
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
