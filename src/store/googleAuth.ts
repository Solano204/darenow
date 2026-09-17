/**
 * FORJA · acceso con Google
 *
 * Antes usaba expo-auth-session (navegador del sistema + redirect con
 * esquema propio). Google bloquea ese flujo en Android con "Error 400:
 * invalid_request" en cuanto el proyecto tiene un cliente Android real
 * registrado: no es un problema de configuracion, es politica de Google
 * para ese caso, y pide el SDK nativo. Este archivo migra a
 * @react-native-google-signin/google-signin, que entra por Play Services
 * en vez de abrir un navegador.
 *
 * Sigue sin haber backend. No hay sincronizacion entre dispositivos. Si el
 * usuario cambia de telefono, entra con el mismo Google pero su historial
 * de entrenamientos no viaja: eso requiere servidor y es otra fase.
 *
 * Requiere build de desarrollo o de produccion: Play Services nativo no
 * esta disponible en Expo Go para este modulo.
 *
 * Ubicacion: src/store/googleAuth.ts
 */
import { useState } from 'react';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const googleDisponible = !!WEB_CLIENT_ID;

// Sin Web Client ID no hay nada que configurar: la app sigue funcionando
// en modo invitado, sin boton de Google (ver Acceso.tsx).
if (WEB_CLIENT_ID) {
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
}

export interface PerfilGoogle {
  /** id de Google: el mismo `sub` de antes, asi las cuentas ya guardadas siguen compatibles. */
  id: string;
  nombre: string;
  email?: string;
}

export type ErrorGoogle = null | 'cancelado' | 'sin_token' | 'red' | 'perfil' | 'servicios';

export function useGoogleSignIn() {
  const [cargando, setCargando] = useState(false);
  const [perfil, setPerfil] = useState<PerfilGoogle | null>(null);
  const [error, setError] = useState<ErrorGoogle>(null);

  const iniciar = async () => {
    setError(null);
    setCargando(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        setError('cancelado');
        return;
      }

      const { user } = response.data;
      const id = String(user.id || '').trim();
      const nombre = String(user.givenName || user.name || '').trim();
      // Sin id no hay cuenta: es el unico campo que Google garantiza
      // estable. El nombre puede venir vacio y no pasa nada, se pide
      // despues en el onboarding.
      if (!id) { setError('perfil'); return; }
      // No se guarda la foto de Google: no se usa en ningun lado de la app.
      setPerfil({ id, nombre, email: user.email });
    } catch (e) {
      if (isErrorWithCode(e)) {
        if (e.code === statusCodes.IN_PROGRESS) {
          // ya hay un intento en curso: no es un error que haya que avisar
        } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError('servicios');
        } else {
          setError('red');
        }
      } else {
        setError('red');
      }
    } finally {
      setCargando(false);
    }
  };

  const limpiar = () => { setPerfil(null); setError(null); };

  return {
    disponible: googleDisponible,
    cargando,
    perfil,
    error,
    iniciar,
    limpiar,
  };
}

/** Texto para el usuario. Nunca mostrar el codigo crudo. */
export function mensajeError(e: ErrorGoogle): string | null {
  switch (e) {
    case null: return null;
    case 'cancelado': return 'Cancelaste el acceso.';
    case 'sin_token': return 'Google no devolvió la sesión. Intenta otra vez.';
    case 'perfil': return 'No pudimos leer tu perfil de Google.';
    case 'servicios': return 'Tu teléfono no tiene Google Play Services actualizado.';
    case 'red': return 'No hay conexión o Google no respondió. Puedes entrar sin cuenta.';
  }
}

/** Cierra la sesion nativa de Google. Silencioso: un fallo aqui no debe bloquear salir() ni borrarCuenta(). */
export async function cerrarGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // no hay nada que el usuario pueda hacer con esto: se sigue con el logout local igual
  }
}
