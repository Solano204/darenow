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
import { cerrarGoogle } from './googleAuth';
import { useEstado, CLAVE as CLAVE_ESTADO } from './store';
import { CLAVE as CLAVE_VOZ } from './voz';
import { CLAVE as CLAVE_HAPTICS } from './haptics';
import { CLAVE as CLAVE_MAQUINA } from './maquina';
import { CLAVE_GUARDADO as CLAVE_SESION } from '../session/useSessionPlayer';
import { borrarRespaldosCache } from './respaldo';
import { seleccionarClavesForja } from './clavesForja';

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
  /** Borra TODOS los datos del usuario (alias de `borrarTodosLosDatos`). */
  borrarCuenta: () => Promise<void>;
  renombrar: (nombre: string) => Promise<void>;
  /**
   * Borra cuenta, progreso, rutinas, medidas y ajustes de este telefono.
   * Cumple con el requisito de Play/LFPDPPP de "borrar todos los datos":
   * barre AsyncStorage (lista conocida + barrido de "forja:"), borra los
   * respaldos que hayan quedado en cache, resetea el progreso en memoria
   * (cancelando la escritura diferida pendiente) y cierra la sesion de
   * Google. Funciona con o sin cuenta de Google (modo invitado incluido).
   */
  borrarTodosLosDatos: () => Promise<void>;
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
  // Requiere que <ProveedorCuenta> este DENTRO de <ProveedorEstado> (ver
  // App.tsx): asi borrarTodosLosDatos() puede resetear el progreso ademas
  // de la cuenta, sin que store.ts tenga que saber nada de cuentas.
  const { reiniciar: reiniciarProgreso } = useEstado();

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
    await cerrarGoogle();
    await guardar(null);
  }, [guardar]);

  const borrarTodosLosDatos = useCallback(async () => {
    const conocidas = [CLAVE, CLAVE_ESTADO, CLAVE_VOZ, CLAVE_HAPTICS, CLAVE_MAQUINA, CLAVE_SESION];
    let existentes: readonly string[] = [];
    try { existentes = await AsyncStorage.getAllKeys(); } catch {
      // si getAllKeys falla se borra igual la lista conocida, que cubre
      // los 6 stores reales de la app
    }
    await AsyncStorage.multiRemove(seleccionarClavesForja(conocidas, existentes)).catch(() => {});
    borrarRespaldosCache();
    reiniciarProgreso();
    await guardar(null);
    await cerrarGoogle();
  }, [reiniciarProgreso, guardar]);

  const borrarCuenta = useCallback(async () => {
    await borrarTodosLosDatos();
  }, [borrarTodosLosDatos]);

  const renombrar = useCallback(async (nombre: string) => {
    if (!cuenta) return;
    await guardar({ ...cuenta, nombre });
  }, [cuenta, guardar]);

  const valor = useMemo<Ctx>(() => ({
    cuenta, cargando, entrarConGoogle, entrarComoInvitado, salir, borrarCuenta,
    borrarTodosLosDatos, renombrar,
  }), [cuenta, cargando, entrarConGoogle, entrarComoInvitado, salir, borrarCuenta,
       borrarTodosLosDatos, renombrar]);

  return React.createElement(Contexto.Provider, { value: valor }, children);
}

export function useCuenta(): Ctx {
  const c = useContext(Contexto);
  if (!c) throw new Error('useCuenta fuera del proveedor');
  return c;
}