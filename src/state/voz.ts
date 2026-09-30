/**
 * FORJA · preferencia de voz
 *
 * Mismo patron que `haptics.ts`: clave propia de AsyncStorage, separada de
 * `perfil.sonido` en store.ts para no tocar ese esquema.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CLAVE_VOZ as CLAVE } from '@/storage/claves';

export function useVozActiva(): [boolean, (v: boolean) => void] {
  const [activa, setActiva] = useState(true);
  // Si el usuario cambia el ajuste antes de que llegue la lectura, la lectura vieja no lo pisa; y
  // nada se escribe tras desmontar (R6).
  const tocado = useRef(false);

  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(CLAVE).then(v => { if (vivo && !tocado.current && v != null) setActiva(v === '1'); }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  const cambiar = useCallback((v: boolean) => {
    tocado.current = true;
    setActiva(v);
    AsyncStorage.setItem(CLAVE, v ? '1' : '0').catch(() => {});
  }, []);

  return [activa, cambiar];
}
