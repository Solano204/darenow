/**
 * FORJA · preferencia de vibracion
 *
 * Aparte de `perfil.sonido` (en store.ts) a proposito: sumar un campo ahi
 * es tocar el esquema de PerfilUsuario, y eso queda fuera de esta fase.
 * Vive en su propia clave de AsyncStorage, con el mismo patron de
 * "activo por defecto, se recuerda una vez que lo tocas".
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLAVE = 'forja:haptics';

export function useHapticosActivos(): [boolean, (v: boolean) => void] {
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE).then(v => { if (v != null) setActivo(v === '1'); }).catch(() => {});
  }, []);

  const cambiar = useCallback((v: boolean) => {
    setActivo(v);
    AsyncStorage.setItem(CLAVE, v ? '1' : '0').catch(() => {});
  }, []);

  return [activo, cambiar];
}
