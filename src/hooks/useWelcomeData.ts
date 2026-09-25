import { useMemo } from 'react';
import { useEstado, estadisticas, hoy } from '../store/store';
import { saludo, mensajeDelDia, type Mensaje } from '../data/mensajes';

const MS_POR_DIA = 86400000;

export interface WelcomeData {
  fecha: string;
  saludo: string;
  msg: Mensaje;
  racha: number;
  sesiones: number;
  diasEntrenados: number;
  entrar: () => void;
}

export function useWelcomeData(navigation: { replace: (ruta: string) => void }): WelcomeData {
  const { estado, marcarBienvenida } = useEstado();
  const { perfil, sesiones, racha } = estado;

  const stats = useMemo(() => estadisticas(sesiones), [sesiones]);

  const diasSin = useMemo(() => {
    if (!racha.ultimoDia) return 0;
    const a = new Date(racha.ultimoDia + 'T00:00:00').getTime();
    const b = new Date(hoy() + 'T00:00:00').getTime();
    return Math.round((b - a) / MS_POR_DIA);
  }, [racha.ultimoDia]);

  const msg = useMemo(
    () => mensajeDelDia({ sesiones: stats.total, diasRacha: racha.dias, diasSinEntrenar: diasSin }),
    [stats.total, racha.dias, diasSin],
  );

  const entrar = () => {
    marcarBienvenida();
    navigation.replace('Tabs');
  };

  return {
    fecha: new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
    saludo: saludo(perfil.nombre || undefined),
    msg,
    racha: racha.dias,
    sesiones: stats.total,
    diasEntrenados: stats.dias,
    entrar,
  };
}
