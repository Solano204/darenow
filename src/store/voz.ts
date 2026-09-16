/**
 * FORJA · preferencia de voz
 *
 * Mismo patron que `haptics.ts`: clave propia de AsyncStorage, separada de
 * `perfil.sonido` en store.ts para no tocar ese esquema.
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLAVE = 'forja:voz';

export function useVozActiva(): [boolean, (v: boolean) => void] {
  const [activa, setActiva] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE).then(v => { if (v != null) setActiva(v === '1'); }).catch(() => {});
  }, []);

  const cambiar = useCallback((v: boolean) => {
    setActiva(v);
    AsyncStorage.setItem(CLAVE, v ? '1' : '0').catch(() => {});
  }, []);

  return [activa, cambiar];
}
