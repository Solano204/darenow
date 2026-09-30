import React, { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { haptico, PALABRA_FASE } from '@/ui/theme';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  useSessionPlayer, useDeSesion, useTiempoSesion, type SesionEnCurso, type TiendaSesion,
} from '@/features/sesion/hooks/useSessionPlayer';
import { esUnilateral, type EstadoPlayer, type Fase } from '@/features/sesion/utils/playerMachine';
import { usePerfil, hoy } from '@/state/store';
import { guardarSesion } from '@/state/acciones';
import { useHapticosActivos } from '@/state/haptics';
import { useVozActiva } from '@/state/voz';
import type { Sesion, ItemSesion } from '@/lib/engine/session';
import { reproducir } from '@/media/sonido';
import { prepararClip } from '@/media/players';
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

  // Cuenta final 3-2-1: mismas condiciones que disparan cuenta_3/2/1 en
  // useSessionPlayer. Aqui solo deshabilita los botones mientras dura. Se leen del store como
  // booleanos: la pantalla se re-renderiza cuando empieza o termina la cuenta, no cada segundo.
  const cuentaFinal = useDeSesion(p.tienda, e => enCuentaFinal(e, p.esPorTiempo));
  const cuentaEnDescanso = useDeSesion(p.tienda, enCuentaDeDescanso);

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

  // Cuenta final hablada: la de siempre (preparate/cambio de lado/trabajo por
  // tiempo) mas el descanso, que se anuncia igual.
  const cuentaHablada = cuentaFinal || cuentaEnDescanso;

  // En el descanso se deja listo (pausado) el clip de lo que viene: la misma serie otra vez o el
  // siguiente ejercicio, igual que decide la maquina. Asi empieza sin espera en «preparate» (R5).
  // Al salir del reproductor se suelta.
  useEffect(() => {
    if (estado.fase !== 'descanso') return;
    const it = items[estado.indice];
    prepararClip((it && estado.serieNum >= it.seriesPlan ? items[estado.indice + 1] : it)?.id);
  }, [estado.fase, estado.indice, estado.serieNum, items]);
  useEffect(() => () => prepararClip(null), []);

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
    // El estado completo, con el tiempo, tal como esta ahora (la pantalla solo lee su estructura).
    const estado = p.tienda.getState().estado;
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
  const alCambiarEstadoFase2 = useEffectEvent(() => {
    if (estado.fase !== 'fin') return;
    if (hapticosOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    finalizar(true, null);
  });
  useEffect(() => alCambiarEstadoFase2(), [estado.fase]);

  const salir = () => { p.pausar(); setSalida(true); };

  return (
    <>
      <ReproductorLayout
        tienda={p.tienda} items={items} estado={estado} ejercicio={ejercicio} esPorTiempo={p.esPorTiempo}
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
      {/* Despues del layout: sus efectos corren tras los de la atmosfera, en el orden de siempre. */}
      <SonidoDeSesion
        tienda={p.tienda} items={items} ejercicio={ejercicio} esPorTiempo={p.esPorTiempo}
        vozOn={vozOn} hablar={hablar} pausar={p.pausar} reanudar={p.reanudar}
      />
      <HojaSalida
        visible={salida}
        onElegir={motivo => { setSalida(false); finalizar(false, motivo); }}
        onCancelar={() => { setSalida(false); p.reanudar(); }}
      />
    </>
  );
}

/** Cuenta 3-2-1 de preparado, cambio de lado y trabajo por tiempo. */
function enCuentaFinal(e: EstadoPlayer, esPorTiempo: boolean): boolean {
  return (e.fase === 'preparado' || e.fase === 'cambio_lado' || (e.fase === 'trabajo' && esPorTiempo)) &&
    e.restanteS >= 1 && e.restanteS <= 3;
}
const enCuentaDeDescanso = (e: EstadoPlayer): boolean => e.fase === 'descanso' && e.restanteS >= 1 && e.restanteS <= 3;

/**
 * Lo que suena, vibra y se dice durante la sesion: los tonos de cada transicion, la cuenta 3-2-1,
 * el toque al marcar una serie, la voz de cada fase, la cuenta hablada y el tic de la espera.
 * Componente hoja (no dibuja nada): el segundo a segundo solo lo re-renderiza a el (R4). Los
 * efectos, sus disparadores y su orden son los de antes (primero los del motor, luego los de la
 * pantalla); por eso va despues de `ReproductorLayout`.
 */
function SonidoDeSesion({ tienda, items, ejercicio, esPorTiempo, vozOn, hablar, pausar, reanudar }: {
  tienda: TiendaSesion; items: ItemSesion[]; ejercicio: ItemSesion; esPorTiempo: boolean; vozOn: boolean;
  hablar: (fuente: FuenteVoz, alTerminar?: () => void) => void;
  pausar: () => void; reanudar: () => void;
}) {
  const restanteS = useTiempoSesion(tienda);
  const { fase, indice, serieNum, lado, hechas } = useStore(tienda, useShallow(s => ({
    fase: s.estado.fase, indice: s.estado.indice, serieNum: s.estado.serieNum, lado: s.estado.lado,
    hechas: s.estado.hechas,
  })));
  const it = items[indice];
  const cuentaHablada = useDeSesion(tienda, e => enCuentaFinal(e, esPorTiempo) || enCuentaDeDescanso(e));

  // Transiciones.
  const faseAnterior = useRef<Fase | null>(null);
  useEffect(() => {
    const ant = faseAnterior.current;
    faseAnterior.current = fase;
    if (ant === null || ant === fase) return;
    // Entrar o salir de pausa no suena: es una accion del usuario, ya sabe
    // que la hizo.
    if (ant === 'pausa' || fase === 'pausa') return;

    switch (fase) {
      case 'trabajo':     reproducir('inicio_serie'); break;
      case 'cambio_lado': reproducir('cambio_lado'); break;
      case 'descanso':    reproducir('fin_serie'); break;
      case 'preparado':   if (ant === 'descanso') reproducir('fin_descanso'); break;
      case 'fin':         reproducir('fin_sesion'); break;
    }
  }, [fase]);

  // Cuenta atras. Solo en fases que cuentan hacia abajo: el trabajo por
  // repeticiones cuenta hacia arriba y no tiene final previsible.
  const ultimaCuenta = useRef<string>('');
  useEffect(() => {
    const cuenta =
      fase === 'preparado' ||
      fase === 'cambio_lado' ||
      (fase === 'trabajo' && it?.segPlan != null);
    if (!cuenta) return;

    const s = restanteS;
    if (s < 1 || s > 3) return;

    // Una sola vez por segundo y por serie: sin esto, pausar y reanudar en
    // el segundo 2 vuelve a disparar el mismo tin.
    const clave = `${fase}:${indice}:${serieNum}:${lado}:${s}`;
    if (ultimaCuenta.current === clave) return;
    ultimaCuenta.current = clave;

    reproducir(s === 3 ? 'cuenta_3' : s === 2 ? 'cuenta_2' : 'cuenta_1');
  }, [restanteS, fase, indice, serieNum, lado, it]);

  // Un toque corto cuando se registra una serie de verdad (no una omitida); si
  // esa serie cierra el ejercicio, un golpe medio: el «clank» de la placa.
  const alCambiarHechas = useEffectEvent(() => {
    const ultima = hechas[hechas.length - 1];
    if (!ultima || ultima.omitida) return;
    const item = items[ultima.orden];
    const huecos = item ? item.seriesPlan * (esUnilateral(item) ? 2 : 1) : Infinity;
    const delEjercicio = hechas.filter(h => h.orden === ultima.orden).length;
    if (delEjercicio >= huecos) haptico.placa(); else haptico.toque();
  });
  useEffect(() => alCambiarHechas(), [hechas.length]);

  // Nombre del ejercicio y sus claves cada vez que se entra a "preparate"
  // (serie nueva o ejercicio nuevo, siempre igual). Cambios de fase (menos
  // pausa, que es accion del usuario) se anuncian con su etiqueta.
  //
  // Primero se dice todo, despues arranca la cuenta: se pausa la sesion
  // mientras habla (el reloj no corre en pausa) y se reanuda cuando
  // termina de leer el nombre y las claves. No hay boton para saltarse
  // esta fase: el avance a "trabajo" siempre llega solo, cuando termina
  // la cuenta.
  const faseVozRef = useRef<Fase | null>(null);
  const alCambiarFase = useEffectEvent(() => {
    const antFase = faseVozRef.current;
    faseVozRef.current = fase;
    if (!vozOn || antFase === null || antFase === fase) return;
    if (antFase === 'pausa' || fase === 'pausa') return;

    if (fase === 'preparado') {
      const claves = ejercicio.cues?.length ? ` ${ejercicio.cues.join('. ')}` : '';
      pausar();
      hablar({ tipo: 'ejercicio', id: ejercicio.id, texto: `${ejercicio.name}.${claves}` }, () => reanudar());
      return;
    }
    hablar({ tipo: 'fase', id: fase, texto: PALABRA_FASE[fase] });
  });
  useEffect(() => alCambiarFase(), [fase, vozOn]);

  // Cuenta final hablada: la de siempre (preparate/cambio de lado/trabajo por
  // tiempo) mas el descanso, que se anuncia igual.
  const alCambiarRestanteS = useEffectEvent(() => {
    if (!cuentaHablada) return;
    const n = String(restanteS);
    hablar({ tipo: 'numero', id: n, texto: n });
  });
  useEffect(() => alCambiarRestanteS(), [restanteS, fase, vozOn]);

  // Tic por segundo durante la espera: preparate, cambio de lado,
  // descanso y trabajo por tiempo (plancha, cardio...). Trabajo por
  // repeticiones no tiene reloj, asi que no aplica. Reusa el sonido
  // "toque" que ya existe, sin archivo nuevo.
  useEffect(() => {
    const enEspera = fase === 'preparado' || fase === 'cambio_lado' || fase === 'descanso' ||
      (fase === 'trabajo' && esPorTiempo);
    if (!enEspera) return;
    reproducir('toque');
  }, [restanteS, fase, esPorTiempo]);

  return null;
}
