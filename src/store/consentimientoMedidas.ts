/**
 * FORJA · consentimiento de medidas
 *
 * Peso, altura y mediciones son datos de salud: el aviso de privacidad
 * promete pedir consentimiento expreso antes de guardarlos. Mismo patron
 * que voz.ts/haptics.ts: clave propia de AsyncStorage, sin tocar el
 * esquema de perfil en store.ts. Por defecto false: sin consentimiento no
 * se guarda nada, nunca se asume (a diferencia de voz/haptics, que si
 * arrancan en `true`).
 *
 * Ubicacion: src/store/consentimientoMedidas.ts
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { URL_PRIVACIDAD } from '../legal';

export const CLAVE = 'forja:consentimiento_medidas';

export function useConsentimientoMedidas(): [boolean, (v: boolean) => void] {
  const [dado, setDado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE).then(v => { if (v === '1') setDado(true); }).catch(() => {});
  }, []);

  const cambiar = useCallback((v: boolean) => {
    setDado(v);
    if (v) AsyncStorage.setItem(CLAVE, '1').catch(() => {});
    else AsyncStorage.removeItem(CLAVE).catch(() => {});
  }, []);

  return [dado, cambiar];
}

/**
 * Punto unico por el que pasa cualquier primer registro de peso, altura o
 * una medicion. Si ya hay consentimiento, ejecuta `continuar` de una vez.
 * Si no, pide consentimiento expreso con un dialogo con enlace al aviso de
 * privacidad; solo si el usuario acepta se da el consentimiento Y se
 * ejecuta `continuar`. Cancelar, o solo ir a leer el aviso, no guarda nada.
 */
export function pedirConsentimientoMedidas(
  dado: boolean,
  dar: (v: boolean) => void,
  continuar: () => void,
): void {
  if (dado) { continuar(); return; }
  Alert.alert(
    'Guardar peso y medidas',
    'DARENOW va a guardar este dato en este teléfono, según el aviso de privacidad. Puedes retirar el permiso cuando quieras desde Ajustes.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Ver aviso de privacidad', onPress: () => { Linking.openURL(URL_PRIVACIDAD); } },
      { text: 'Acepto y guardar', onPress: () => { dar(true); continuar(); } },
    ],
  );
}
