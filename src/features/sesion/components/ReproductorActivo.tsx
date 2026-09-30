import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { haptico, PALABRA_FASE } from '@/ui/theme';
import { useSessionPlayer, type SesionEnCurso } from '@/features/sesion/hooks/useSessionPlayer';
import { esUnilateral } from '@/features/sesion/utils/playerMachine';
import { usePerfil, hoy } from '@/state/store';
import { guardarSesion } from '@/state/acciones';
import { useHapticosActivos } from '@/state/haptics';
import { useVozActiva } from '@/state/voz';
import type { Sesion, ItemSesion } from '@/lib/engine/session';
import { reproducir } from '@/media/sonido';
import { useSinAnuncios } from '@/ui/components/RelojAnuncios';
import { ReproductorLayout } from '@/features/sesion/components/ReproductorLayout';
import { HojaSalida } from '@/features/sesion/components/HojaSalida';
import { crearControladorVoz, type FuenteVoz } from '@/features/sesion/utils/controladorVoz';

type Props = NativeStackScreenProps<ParamListBase, 'Reproductor'>;

/**
 * El reproductor ya en marcha: maquina de la sesion, voz, sonido, vibracion, pantalla encendida,
 * guardado y salida a Resumen. Lo monta `Reproductor` cuando ya sabe con que items empezar.
 */
export function ReproductorActivo({ sesionInicial, restaurar, navigation }: {
  sesionInicial: Sesion; restaurar: SesionEnCurso | null; navigation: Props['navigation'];
}) {
  useKeepAwake();
  useSinAnuncios();   // mientras se entrena no aparece ni un anuncio
  const perfil = usePerfil();

  const [items] = useState<ItemSesion[]>(restaurar?.items ?? sesionInicial.items);
  const [salida, setSalida] = useState(false);

  const p = useSessionPlayer(items, perfil.sonido, restaurar);
  const { estado, ejercicio } = p;
  const [hapticosOn] = useHapticosActivos();

  // Un toque corto cuando se registra una serie de verdad (no una omitida); si
  // esa serie cierra el ejercicio, un golpe medio: el «clank» de la placa.
  useEffect(() => {
    const ultima = estado.hechas[estado.hechas.length - 1];
    if (!ultima || ultima.omitida) return;
    const it = items[ultima.orden];
    const huecos = it ? it.seriesPlan * (esUnilateral(it) ? 2 : 1) : Infinity;
    const hechas = estado.hechas.filter(h => h.orden === ultima.orden).length;
    if (hechas >= huecos) haptico.placa(); else haptico.toque();
  }, [estado.hechas.length]);

  // Cuenta final 3-2-1: mismas condiciones que disparan cuenta_3/2/1 en
  // useSessionPlayer. Aqui solo deshabilita los botones mientras dura.
  const cuentaFinal =
    (estado.fase === 'preparado' || estado.fase === 'cambio_lado' || (estado.fase === 'trabajo' && p.esPorTiempo)) &&
    estado.restanteS >= 1 && estado.restanteS <= 3;

  /* ---------------------------------------------------------------- */
  /* Voz                                                               */
  /* ---------------------------------------------------------------- */

  const [vozOn] = useVozActiva();
  const [voz] = useState(crearControladorVoz);
  const hablando = useSyncExternalStore(voz.suscribir, voz.estaHablando);
  function hablar(fuente: FuenteVoz, alTerminar?: () => void) {
    if (!vozOn) { alTerminar?.(); return; }
    voz.hablar(fuente, alTerminar);
  }

  // Nombre del ejercicio y sus claves cada vez que se entra a "preparate"
  // (serie nueva o ejercicio nuevo, siempre igual). Cambios de fase (menos
  // pausa, que es accion del usuario) se anuncian con su etiqueta.
  //
  // Primero se dice todo, despues arranca la cuenta: se pausa la sesion
  // mientras habla (el reloj no corre en pausa) y se reanuda cuando
  // termina de leer el nombre y las claves. No hay boton para saltarse
  // esta fase: el avance a "trabajo" siempre llega solo, cuando termina
  // la cuenta.
  const faseVozRef = useRef<typeof estado.fase | null>(null);
  useEffect(() => {
    const antFase = faseVozRef.current;
    faseVozRef.current = estado.fase;
    if (!vozOn || antFase === null || antFase === estado.fase) return;
    if (antFase === 'pausa' || estado.fase === 'pausa') return;

    if (estado.fase === 'preparado') {
      const claves = ejercicio.cues?.length ? ` ${ejercicio.cues.join('. ')}` : '';
      p.pausar();
      hablar({ tipo: 'ejercicio', id: ejercicio.id, texto: `${ejercicio.name}.${claves}` }, () => p.reanudar());
      return;
    }
    hablar({ tipo: 'fase', id: estado.fase, texto: PALABRA_FASE[estado.fase] });
  }, [estado.fase, vozOn]);

  // Cuenta final hablada: la de siempre (preparate/cambio de lado/trabajo por
  // tiempo) mas el descanso, que se anuncia igual.
  const cuentaHablada = cuentaFinal ||
    (estado.fase === 'descanso' && estado.restanteS >= 1 && estado.restanteS <= 3);
  useEffect(() => {
    if (!cuentaHablada) return;
    const n = String(estado.restanteS);
    hablar({ tipo: 'numero', id: n, texto: n });
  }, [estado.restanteS, estado.fase, vozOn]);

  // Tic por segundo durante la espera: preparate, cambio de lado,
  // descanso y trabajo por tiempo (plancha, cardio...). Trabajo por
  // repeticiones no tiene reloj, asi que no aplica. Reusa el sonido
  // "toque" que ya existe, sin archivo nuevo.
  useEffect(() => {
    const enEspera = estado.fase === 'preparado' || estado.fase === 'cambio_lado' || estado.fase === 'descanso' ||
      (estado.fase === 'trabajo' && p.esPorTiempo);
    if (!enEspera) return;
    reproducir('toque');
  }, [estado.restanteS, estado.fase, p.esPorTiempo]);

  // Si se sale de la pantalla con la voz a mitad de frase, se corta:
  // nadie quiere seguir oyendo instrucciones de un ejercicio que ya dejo.
  // Libera tambien el player de voz (si llego a crearse) y su listener.
  useEffect(() => voz.soltar, [voz]);

  // El clip se ve mientras hay un ejercicio delante del usuario, y sigue
  // visible congelado si pausa desde ahi. En descanso no: ahi la pantalla
  // es el reloj y el nombre del que viene.
  const enEjercicio =
    estado.fase === 'trabajo' || estado.fase === 'preparado' || estado.fase === 'cambio_lado';
  const verClip = enEjercicio ||
    (estado.fase === 'pausa' && estado.faseAnterior !== 'descanso' && estado.faseAnterior !== null);
  const clipActivo = enEjercicio;

  function finalizar(completada: boolean, motivo: string | null) {
    p.limpiarGuardado();   // completa o abandonada, ya no hay nada que continuar
    const kcal = perfil.pesoKg
      ? Math.round(sesionInicial.kcalEstimadas ?? 0)
      : null;
    const res = guardarSesion({
      fecha: hoy(),
      iniciada: new Date().toISOString(),
      duracionS: estado.transcurridoS,
      rutinaId: sesionInicial.rutinaId,
      programaId: perfil.programaId,
      estado: completada ? 'completada' : 'abandonada',
      kcal, rpe: null, motivoAbandono: motivo,
      series: estado.hechas.map(h => ({
        ejercicioId: h.ejercicioId, serieNum: h.serieNum, lado: h.lado,
        reps: h.reps, segundos: h.segundos, pesoKg: h.pesoKg, omitida: h.omitida,
      })),
    });
    navigation.replace('Resumen', {
      estado, items, resultado: res, completada, kcal,
    });
  }

  // Al terminar, guarda y pasa al resumen.
  useEffect(() => {
    if (estado.fase !== 'fin') return;
    if (hapticosOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    finalizar(true, null);
  }, [estado.fase]);

  const salir = () => { p.pausar(); setSalida(true); };

  return (
    <>
      <ReproductorLayout
        items={items} estado={estado} ejercicio={ejercicio} esPorTiempo={p.esPorTiempo}
        puedeDeshacer={p.puedeDeshacer} hablando={hablando}
        cuentaFinal={cuentaFinal} cuentaHablada={cuentaHablada}
        verClip={verClip} clipActivo={clipActivo} salidaAbierta={salida}
        onSalir={salir}
        onPausa={() => {
          if (estado.fase === 'pausa') { if (!hablando) p.reanudar(); return; }
          p.pausar();
        }}
        onReanudar={() => { if (!hablando) p.reanudar(); }}
        onAvanzar={p.avanzar}
        onListo={() => p.registrar(ejercicio.repsPlan ?? undefined)}
        onOmitir={() => { if (!hablando) p.omitir(); }}
        onDeshacer={p.deshacer}
      />
      <HojaSalida
        visible={salida}
        onElegir={motivo => { setSalida(false); finalizar(false, motivo); }}
        onCancelar={() => { setSalida(false); p.reanudar(); }}
      />
    </>
  );
}
