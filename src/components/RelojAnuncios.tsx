/**
 * FORJA · reloj de anuncios
 *
 * Un solo sitio decide cuando toca anuncio, para que ninguna pantalla tenga
 * que llevar su propia cuenta.
 *
 * Reglas:
 *  1. Cada 10 minutos de uso, como maximo.
 *  2. NUNCA mientras el usuario entrena. Ni al entrar al reproductor, ni al
 *     salir de una serie, ni en el resumen. Si el temporizador vence durante
 *     una rutina, el anuncio espera a que termine.
 *  3. Nunca en el primer minuto de la primera sesion: si lo primero que ve
 *     alguien al abrir la app es publicidad, no vuelve.
 *
 * El componente <RelojAnuncios /> se monta una vez en la raiz y se encarga
 * de mostrar el intersticial cuando corresponde.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Intersticial, ANUNCIOS_ACTIVOS } from './Anuncio';

const CADA_MS = 10 * 60 * 1000;   // 10 minutos
const GRACIA_INICIAL_MS = 60 * 1000;

interface Ctx {
  /** Las pantallas de entrenamiento lo llaman para bloquear anuncios. */
  entrenando: (activo: boolean) => void;
}

const Contexto = createContext<Ctx>({ entrenando: () => {} });

export function ProveedorAnuncios({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const enRutina = useRef(false);
  const pendiente = useRef(false);
  const proximo = useRef(Date.now() + GRACIA_INICIAL_MS);

  const entrenando = useCallback((activo: boolean) => {
    enRutina.current = activo;
    // Al terminar de entrenar, si el anuncio quedo pendiente, se muestra
    // con un respiro: nadie quiere publicidad justo al soltar la ultima serie.
    if (!activo && pendiente.current) {
      pendiente.current = false;
      setTimeout(() => { if (!enRutina.current) setVisible(true); }, 4000);
    }
  }, []);

  useEffect(() => {
    if (!ANUNCIOS_ACTIVOS) return;
    const id = setInterval(() => {
      if (Date.now() < proximo.current) return;
      if (enRutina.current) { pendiente.current = true; return; }
      if (visible) return;
      setVisible(true);
    }, 5000);
    return () => clearInterval(id);
  }, [visible]);

  // El reloj no corre con la app en segundo plano: si alguien la deja
  // abierta toda la noche, no se encuentra tres anuncios en cola.
  useEffect(() => {
    const sub = AppState.addEventListener('change', e => {
      if (e === 'active') proximo.current = Math.max(proximo.current, Date.now() + 30_000);
    });
    return () => sub.remove();
  }, []);

  const cerrar = () => {
    setVisible(false);
    proximo.current = Date.now() + CADA_MS;
  };

  return (
    <Contexto.Provider value={{ entrenando }}>
      {children}
      <Intersticial visible={visible} onCerrar={cerrar} />
    </Contexto.Provider>
  );
}

function useAnuncios() {
  return useContext(Contexto);
}

/**
 * Lo usan Reproductor y Resumen: mientras esas pantallas esten montadas,
 * no se muestra ningun anuncio.
 */
export function useSinAnuncios() {
  const { entrenando } = useAnuncios();
  useEffect(() => {
    entrenando(true);
    return () => entrenando(false);
  }, [entrenando]);
}
