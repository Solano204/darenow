import React, { useState } from 'react';
import { Alert } from 'react-native';
import { haptico } from '@/ui/theme';
import { useEstado } from '@/state/store';
import { useHapticosActivos } from '@/state/haptics';
import { useVozActiva } from '@/state/voz';
import { useCuenta } from '@/state/cuenta';
import { useConsentimientoMedidas, pedirConsentimientoMedidas } from '@/state/consentimientoMedidas';
import { exportarProgreso, elegirRespaldo, aplicarRespaldo } from '@/storage/respaldo';
import { EQUIPO } from '@/data/catalog';
import { LESIONES, equipoElegible, contarMarcados } from '@/features/ajustes/utils/ajustes';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { type AccionHoja } from '@/features/ajustes/components/HojaConfirmacion';

/** Las secciones que llevan un chip en el indice, en el orden en que aparecen. */
export const INDICE = [
  'Tu plan', 'Dónde entrenas', 'Equipo', 'Lesiones', 'Sesión', 'Qué ver', 'Peso y medidas', 'Catálogo', 'Cuenta', 'Datos', 'Legal',
] as const;
interface Confirmacion {
  titulo: string;
  texto: string;
  acciones: AccionHoja[];
}

/** La logica de `Ajustes`: estado, datos derivados y manejadores. La pantalla solo dibuja. */
export function useAjustes() {
  const reducido = useReducedMotion();
  const { estado, guardarPerfil, borrarMedidas } = useEstado();
  const { cuenta, salir, borrarTodosLosDatos } = useCuenta();
  const p = estado.perfil;
  const [objetivoAbierto, setObjetivoAbierto] = useState(false);
  const [hapticosOn, setHapticosOn] = useHapticosActivos();
  const [vozOn, setVozOn] = useVozActiva();
  const [consentimientoMedidas, cambiarConsentimientoMedidas] = useConsentimientoMedidas();
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [hoja, setHoja] = useState<Confirmacion | null>(null);
  const [arriba, setArriba] = useState<number[]>(() => INDICE.map(() => Number.POSITIVE_INFINITY));

  const medir = (i: number) => (y: number) => setArriba(previas => (previas[i] === y ? previas : previas.map((v, k) => (k === i ? y : v))));

  const equipoOnb = equipoElegible(EQUIPO);
  const equipoMarcado = contarMarcados(p.equipo, equipoOnb.map(e => e.id));
  const lesionesMarcadas = contarMarcados(p.contra, LESIONES.map(([id]) => id));
  const anima = !reducido;

  // Revocar = dejar de tratar el dato: se borran peso, altura, peso
  // objetivo y mediciones, no solo la bandera de consentimiento.
  const retirarConsentimientoMedidas = () => setHoja({
    titulo: 'Retirar consentimiento',
    texto: 'Al retirar tu consentimiento se borrarán tu peso, altura y medidas guardados. ¿Continuar?',
    acciones: [{
      texto: 'Continuar', tipo: 'peligro',
      onPress: () => { borrarMedidas(); cambiarConsentimientoMedidas(false); },
    }],
  });

  const exportar = async () => {
    setExportando(true);
    const r = await exportarProgreso();
    setExportando(false);
    if (!r.ok) { haptico.error(); Alert.alert('No se pudo exportar', r.motivo); }
  };

  // Mismo dialogo para "Eliminar mi cuenta" y "Borrar todos mis datos": las
  // dos disparan el mismo borrado completo (borrarTodosLosDatos), asi que
  // no puede haber un texto que prometa conservar el historial y otro que
  // no. "Exportar respaldo primero" no borra nada: solo abre el compartir
  // y deja el borrado para cuando el usuario confirme de nuevo.
  const confirmarBorrarTodo = () => setHoja({
    titulo: 'Borrar mis datos',
    texto: 'Se borrarán tu cuenta, tu progreso, rutinas, medidas y ajustes de este teléfono. No se puede deshacer.',
    acciones: [
      { texto: 'Exportar respaldo primero', onPress: exportar },
      { texto: 'Borrar todo', tipo: 'peligro', onPress: () => { borrarTodosLosDatos(); } },
    ],
  });

  const confirmarCerrarSesion = () => setHoja({
    titulo: 'Cerrar sesión',
    texto: 'Tu historial de entrenamiento se queda en este teléfono.',
    acciones: [{ texto: 'Cerrar sesión', onPress: () => { salir(); } }],
  });

  // Elegir y validar el archivo primero; recien si es valido se pide
  // confirmacion (reemplaza todo, no se puede deshacer) antes de escribir.
  const importar = async () => {
    setImportando(true);
    const elegido = await elegirRespaldo();
    setImportando(false);
    if (elegido.ok === 'cancelado') return;
    if (!elegido.ok) { haptico.error(); Alert.alert('Archivo no válido', elegido.motivo); return; }

    setHoja({
      titulo: 'Importar progreso',
      texto: 'Esto reemplaza tu progreso actual. No se puede deshacer.',
      acciones: [{
        texto: 'Importar', tipo: 'peligro',
        onPress: async () => {
          try {
            await aplicarRespaldo(elegido.respaldo);
            haptico.exito();
            Alert.alert(
              'Progreso importado',
              'Cierra la app por completo y vuelve a abrirla para verlo reflejado.',
            );
          } catch {
            haptico.error();
            Alert.alert(
              'No se pudo importar',
              'Algo falló al escribir el progreso. Tus datos actuales no deberían haber cambiado; intenta otra vez.',
            );
          }
        },
      }],
    });
  };

  const guardarMedida = (campo: 'pesoKg' | 'pesoObjetivoKg' | 'alturaCm') => (v: number) =>
    pedirConsentimientoMedidas(consentimientoMedidas, cambiarConsentimientoMedidas, () => guardarPerfil({ [campo]: v }));

  const cambiarVibracion = (v: boolean) => {
    setHapticosOn(v);
    if (v) haptico.placa();
  };

  const alternarEquipo = (id: string) => guardarPerfil({
    equipo: p.equipo.includes(id) ? p.equipo.filter(x => x !== id) : [...p.equipo, id],
  });
  const alternarLesion = (id: string) => guardarPerfil({
    contra: p.contra.includes(id) ? p.contra.filter(x => x !== id) : [...p.contra, id],
  });


  return {
    guardarPerfil, cuenta, p, objetivoAbierto, setObjetivoAbierto, hapticosOn, vozOn, setVozOn,
    consentimientoMedidas, cambiarConsentimientoMedidas, exportando, importando, hoja, setHoja,
    arriba, medir, equipoOnb, equipoMarcado, lesionesMarcadas, anima, retirarConsentimientoMedidas,
    exportar, confirmarBorrarTodo, confirmarCerrarSesion, importar, guardarMedida, cambiarVibracion,
    alternarEquipo, alternarLesion,
  };
}
