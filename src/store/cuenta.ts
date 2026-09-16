/**
 * FORJA · cuenta
 *
 * Identidad del usuario, guardada en el telefono. No hay backend: la
 * "cuenta" es el identificador estable que Google devuelve (`sub`) mas el
 * nombre y el correo, todo en AsyncStorage. Sirve para tres cosas:
 *
 *  1. Saber si alguien ya entro (puerta de acceso antes del onboarding).
 *  2. Prellenar el nombre sin escribirlo.
 *  3. Cumplir con Play: si la app ofrece crear cuenta, tiene que ofrecer
 *     borrarla. `borrarCuenta()` es esa salida.
 *
 * El modo invitado existe a proposito: obligar a una cuenta de Google para
 * ver una rutina es la primera razon por la que la gente desinstala.
 *
 * Ubicacion: src/store/cuenta.ts
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLAVE = 'forja:cuenta:v1';

export type Proveedor = 'google' | 'invitado';

export interface Cuenta {
  /** `sub` de Google, o un id local generado para el invitado. Estable. */
  id: string;
  proveedor: Proveedor;
  nombre: string;
  email?: string;
  foto?: string;
  /** ISO. Util para el aviso de privacidad y para soporte. */
  creada: string;
  ultimoAcceso: string;
}

interface Ctx {
  cuenta: Cuenta | null;
  cargando: boolean;
  /** Guarda la cuenta devuelta por Google. Si ya existia, conserva `creada`. */
  entrarConGoogle: (p: { id: string; nombre: string; email?: string; foto?: string }) => Promise<void>;
  /** Entra sin vincular nada. Genera un id local. */
  entrarComoInvitado: (nombre?: string) => Promise<void>;
  /** Cierra sesion. NO borra el progreso de entrenamiento. */
  salir: () => Promise<void>;
  /** Borra la cuenta. El progreso se borra aparte, desde `reiniciar()`. */
  borrarCuenta: () => Promise<void>;
  renombrar: (nombre: string) => Promise<void>;
}

const Contexto = createContext<Ctx | null>(null);

function ahora(): string {
  return new Date().toISOString();
}

function idInvitado(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ProveedorCuenta({ children }: { children: React.ReactNode }) {
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CLAVE);
        if (raw) setCuenta(JSON.parse(raw) as Cuenta);
      } catch {
        // Storage corrupto: se arranca sin cuenta en vez de tronar.
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const guardar = useCallback(async (c: Cuenta | null) => {
    setCuenta(c);
    try {
      if (c) await AsyncStorage.setItem(CLAVE, JSON.stringify(c));
      else await AsyncStorage.removeItem(CLAVE);
    } catch {
      // Si no se pudo escribir, la sesion vive solo en memoria. Mejor eso
      // que bloquear la entrada.
    }
  }, []);

  const entrarConGoogle = useCallback(async (p: { id: string; nombre: string; email?: string; foto?: string }) => {
    const previa = cuenta && cuenta.id === p.id ? cuenta : null;
    await guardar({
      id: p.id,
      proveedor: 'google',
      nombre: p.nombre,
      email: p.email,
      foto: p.foto,
      creada: previa?.creada ?? ahora(),
      ultimoAcceso: ahora(),
    });
  }, [cuenta, guardar]);

  const entrarComoInvitado = useCallback(async (nombre?: string) => {
    await guardar({
      id: idInvitado(),
      proveedor: 'invitado',
      nombre: nombre ?? '',
      creada: ahora(),
      ultimoAcceso: ahora(),
    });
  }, [guardar]);

  const salir = useCallback(async () => {
    await guardar(null);
  }, [guardar]);

  const borrarCuenta = useCallback(async () => {
    await guardar(null);
  }, [guardar]);

  const renombrar = useCallback(async (nombre: string) => {
    if (!cuenta) return;
    await guardar({ ...cuenta, nombre });
  }, [cuenta, guardar]);

  const valor = useMemo<Ctx>(() => ({
    cuenta, cargando, entrarConGoogle, entrarComoInvitado, salir, borrarCuenta, renombrar,
  }), [cuenta, cargando, entrarConGoogle, entrarComoInvitado, salir, borrarCuenta, renombrar]);

  return React.createElement(Contexto.Provider, { value: valor }, children);
}

export function useCuenta(): Ctx {
  const c = useContext(Contexto);
  if (!c) throw new Error('useCuenta fuera del proveedor');
  return c;
}