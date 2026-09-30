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

import { CLAVE_HAPTICS as CLAVE } from '@/storage/claves';
import { leerAlArrancar } from '@/storage/lecturaInicial';

// Lectura sincrona para los golpes que se disparan fuera de React (theme/haptics.ts).
let activos = true;
leerAlArrancar(CLAVE).then(v => { if (v != null) activos = v === '1'; }).catch(() => {});
export const hapticosActivos = () => activos;

export function useHapticosActivos(): [boolean, (v: boolean) => void] {
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE).then(v => {
      if (v == null) return;
      activos = v === '1';
      setActivo(activos);
    }).catch(() => {});
  }, []);

  const cambiar = useCallback((v: boolean) => {
    activos = v;
    setActivo(v);
    AsyncStorage.setItem(CLAVE, v ? '1' : '0').catch(() => {});
  }, []);

  return [activo, cambiar];
}
