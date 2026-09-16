/**
 * FORJA · acceso con Google
 *
 * Reemplaza la version anterior, que solo leia el nombre. Ahora devuelve
 * tambien `id` (el campo `sub` de Google), que es lo que convierte esto en
 * una cuenta de verdad: es estable, no cambia si el usuario se cambia el
 * nombre, y es el identificador que se guarda en el telefono.
 *
 * Sigue sin haber backend. No hay sincronizacion entre dispositivos. Si el
 * usuario cambia de telefono, entra con el mismo Google pero su historial
 * de entrenamientos no viaja: eso requiere servidor y es otra fase.
 *
 * Flujo: navegador del sistema (no webview embebido, que Google bloquea).
 * Requiere un build de desarrollo o de produccion; en Expo Go el redirect
 * con esquema propio no resuelve.
 *
 * Ubicacion: src/store/googleAuth.ts
 */
import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// Google exige que los clientes Android/iOS usen el package/bundle id como
// esquema de retorno, no el "scheme" corto de app.json. Se pasa explicito
// en vez de dejar que expo-auth-session lo infiera: la inferencia automatica
// (Application.applicationId) es la que estaba devolviendo "forja:/..." en
// vez de esto y Google lo rechazaba con "Error 400: invalid_request".
const REDIRECT_URI = makeRedirectUri({ native: 'app.forja.fitness:/oauthredirect' });
// TODO quitar antes de produccion
console.log('[googleAuth] redirectUri:', REDIRECT_URI);

const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const googleDisponible = !!(IOS_CLIENT_ID || ANDROID_CLIENT_ID || WEB_CLIENT_ID);

export interface PerfilGoogle {
  /** `sub`: identificador estable de la cuenta de Google. */
  id: string;
  nombre: string;
  email?: string;
  foto?: string;
}

export type ErrorGoogle = null | 'cancelado' | 'sin_token' | 'red' | 'perfil';

export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID || 'sin-configurar',
    androidClientId: ANDROID_CLIENT_ID || 'sin-configurar',
    webClientId: WEB_CLIENT_ID || 'sin-configurar',
    scopes: ['openid', 'profile', 'email'],
    redirectUri: REDIRECT_URI,
  });

  const [cargando, setCargando] = useState(false);
  const [perfil, setPerfil] = useState<PerfilGoogle | null>(null);
  const [error, setError] = useState<ErrorGoogle>(null);

  useEffect(() => {
    if (!response) return;

    if (response.type === 'dismiss' || response.type === 'cancel') {
      setCargando(false);
      setError('cancelado');
      return;
    }
    if (response.type !== 'success') {
      setCargando(false);
      setError('red');
      return;
    }

    const token = response.authentication?.accessToken;
    if (!token) {
      setCargando(false);
      setError('sin_token');
      return;
    }

    fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then(p => {
        const id = String(p.sub || '').trim();
        const nombre = String(p.given_name || p.name || '').trim();
        // Sin `sub` no hay cuenta: es el unico campo que Google garantiza
        // estable. El nombre puede venir vacio y no pasa nada, se pide
        // despues en el onboarding.
        if (!id) { setError('perfil'); return; }
        setPerfil({ id, nombre, email: p.email, foto: p.picture });
      })
      .catch(() => setError('red'))
      .finally(() => setCargando(false));
  }, [response]);

  const iniciar = () => {
    setError(null);
    setCargando(true);
    promptAsync().catch(() => { setError('red'); setCargando(false); });
  };

  const limpiar = () => { setPerfil(null); setError(null); };

  return {
    disponible: googleDisponible && !!request,
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
    case 'red': return 'No hay conexión o Google no respondió. Puedes entrar sin cuenta.';
  }
}