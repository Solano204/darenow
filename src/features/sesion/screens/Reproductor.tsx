import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, useWindowDimensions } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { paleta, haptico, PALABRA_FASE } from '@/ui/theme';
import {
  useSessionPlayer, leerSesionGuardada, borrarSesionGuardada, type SesionEnCurso,
} from '@/features/sesion/hooks/useSessionPlayer';
import { esUnilateral } from '@/features/sesion/utils/playerMachine';
import { useEstado, hoy } from '@/state/store';
import { useHapticosActivos } from '@/state/haptics';
import { useVozActiva } from '@/state/voz';
import type { Sesion, ItemSesion } from '@/lib/engine/session';
import { prepararSonido, soltarSonido, reproducir } from '@/media/sonido';
import { fuenteVoz, type TipoVoz } from '@/media/voz';
import { useSinAnuncios } from '@/ui/components/RelojAnuncios';
import { useMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { PantallaListo } from '@/features/sesion/components/PantallaListo';
import { EditorAntesDeEmpezar } from '@/features/sesion/components/EditorAntesDeEmpezar';
import { ReproductorLayout } from '@/features/sesion/components/ReproductorLayout';
import { HojaSalida } from '@/features/sesion/components/HojaSalida';

/**
 * Reproductor.
 *
 * Aqui vive la logica de la sesion (guardado, voz, sonido, vibracion, pantalla
 * encendida) y el paso de una pantalla a otra; lo que se ve esta en
 * `components/session`. El fondo es siempre `goma`: la fase se lee por el color
 * de su placa (ver DESIGN.md, «Modo sesion»).
 */

const DURACION_LISTO_MS = 3000;
const CENTRO_LISTO = 0.46;

type Props = NativeStackScreenProps<ParamListBase, 'Reproductor'>;

/**
 * Antes de montar el reproductor de verdad, revisa si quedo una sesion sin
 * terminar (la app se cerro o se fue a segundo plano en el camino). Si
 * hay una, pregunta; si no, o si el usuario prefiere empezar de nuevo, el
 * reproductor arranca con la sesion que llego por navegacion.
 */
export default function Reproductor({ route, navigation }: Props) {
  const sesionInicial = (route.params as { sesion: Sesion }).sesion;
  const [listo, setListo] = useState(false);
  const [restaurar, setRestaurar] = useState<SesionEnCurso | null>(null);
  const [mostrarListo, setMostrarListo] = useState(true);
  const [itemsConfirmados, setItemsConfirmados] = useState<ItemSesion[] | null>(null);
  const magnesia = useMagnesia();
  const { width: anchoVentana, height: altoVentana } = useWindowDimensions();

  // Se prepara aqui, no en useSessionPlayer: entre esta pantalla y el primer
  // "preparado" de verdad pasan la pantalla "Listo?" y, si aplica, el editor
  // previo. Ese margen es lo que evita que el primer tin de la cuenta 3-2-1
  // suene mudo por llegar antes de que el player termine de cargar.
  useEffect(() => {
    prepararSonido();
    return soltarSonido;
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const guardada = await leerSesionGuardada();
      if (!vivo) return;
      if (!guardada || guardada.items.length === 0) { setListo(true); return; }
      const minutos = Math.max(1, Math.round((Date.now() - guardada.guardadoEn) / 60000));
      Alert.alert(
        'Sesión sin terminar',
        `Tienes una sesión de hace ${minutos} minuto${minutos === 1 ? '' : 's'} sin cerrar. ¿La continúas donde te quedaste?`,
        [
          {
            text: 'Empezar de nuevo', style: 'cancel',
            onPress: () => { borrarSesionGuardada(); setListo(true); },
          },
          { text: 'Continuar', onPress: () => { setRestaurar(guardada); setListo(true); } },
        ],
      );
    })();
    return () => { vivo = false; };
  }, []);

  // Pantalla "listo para empezar", 3 segundos. Solo en un arranque de
  // verdad: si se esta continuando una sesion interrumpida, ya se estaba
  // entrenando, no hace falta el aviso. Al vencer, el aplauso de magnesia
  // cubre el paso a lo siguiente.
  useEffect(() => {
    if (!listo) return;
    if (restaurar) { setMostrarListo(false); return; }
    const id = setTimeout(() => {
      haptico.aplauso();
      magnesia.aplaudir(anchoVentana / 2, altoVentana * CENTRO_LISTO);
      setMostrarListo(false);
    }, DURACION_LISTO_MS);
    return () => clearTimeout(id);
  }, [listo, restaurar]);

  if (!listo) return <View style={{ flex: 1, backgroundColor: paleta.goma }} />;

  if (mostrarListo) return <PantallaListo duracionMs={DURACION_LISTO_MS} />;

  // Revisar y ajustar series, repeticiones/tiempo y descanso de cada
  // ejercicio antes de arrancar. Solo en un arranque de verdad: al
  // continuar una sesion interrumpida ya se habia decidido todo eso.
  // Not for a rutina propia either: those numbers were already fixed when
  // the user built it, asking again would be the same step twice.
  if (!restaurar && !itemsConfirmados && !sesionInicial.origenPropia) {
    return <EditorAntesDeEmpezar items={sesionInicial.items} onConfirmar={setItemsConfirmados} />;
  }

  const sesionFinal: Sesion = itemsConfirmados ? { ...sesionInicial, items: itemsConfirmados } : sesionInicial;
  return <ReproductorActivo sesionInicial={sesionFinal} restaurar={restaurar} navigation={navigation} />;
}

function ReproductorActivo({ sesionInicial, restaurar, navigation }: {
  sesionInicial: Sesion; restaurar: SesionEnCurso | null; navigation: Props['navigation'];
}) {
  useKeepAwake();
  useSinAnuncios();   // mientras se entrena no aparece ni un anuncio
  const { estado: app, guardarSesion } = useEstado();

  const [items] = useState<ItemSesion[]>(restaurar?.items ?? sesionInicial.items);
  const [salida, setSalida] = useState(false);

  const p = useSessionPlayer(items, app.perfil.sonido, restaurar);
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
  const [hablando, setHablando] = useState(false);

  // Un solo player reutilizable para los 198 audios de voz: crearlo al
  // momento de hablar (no 198 de golpe al montar) cuesta 50-200ms una vez,
  // y de ahi en adelante cada frase solo hace replace()+play() sobre el
  // mismo player. Perezoso: si la voz esta apagada nunca se crea.
  const reproductorVozRef = useRef<AudioPlayer | null>(null);
  const suscripcionVozRef = useRef<ReturnType<AudioPlayer['addListener']> | null>(null);

  function obtenerReproductorVoz(): AudioPlayer {
    if (!reproductorVozRef.current) reproductorVozRef.current = createAudioPlayer(null);
    return reproductorVozRef.current;
  }

  // Cada llamada corta la anterior y arranca una nueva. Con expo-speech el
  // aviso tardio de la que se corta ("onStopped") podia llegar DESPUES de
  // que la nueva ya arranco; con el player de archivos el equivalente es
  // un "playbackStatusUpdate" viejo llegando tarde. Por eso cada llamada
  // vuelve a registrar su propio listener (quitando el anterior) con su
  // propio id: solo el aviso de la llamada mas reciente apaga `hablando`.
  const hablaIdRef = useRef(0);
  function hablar(fuente: { tipo: TipoVoz; id: string; texto: string }, alTerminar?: () => void) {
    if (!vozOn) { alTerminar?.(); return; }
    const id = ++hablaIdRef.current;
    // Idempotente: ademas del guard de id, protege contra un doble disparo
    // (el listener y el catch de mas abajo podrian, en teoria, llamarlo los dos).
    let terminado = false;
    const terminar = () => {
      if (terminado || hablaIdRef.current !== id) return;
      terminado = true;
      setHablando(false);
      alTerminar?.();
    };

    const audio = fuenteVoz(fuente.tipo, fuente.id);
    if (audio != null) {
      try {
        setHablando(true);
        const player = obtenerReproductorVoz();
        suscripcionVozRef.current?.remove();
        suscripcionVozRef.current = player.addListener('playbackStatusUpdate', status => {
          if (status.didJustFinish) { suscripcionVozRef.current?.remove(); terminar(); }
        });
        player.replace(audio);
        player.play();
        return;
      } catch {
        // el archivo fallo al cargar o reproducir: no dejar la sesion
        // colgada esperando un "termino" que ya nunca va a llegar.
        terminar();
        return;
      }
    }

    // Respaldo: el mp3 todavia no existe en el registro (ver src/media/voz.ts).
    if (!fuente.texto) { alTerminar?.(); return; }
    Speech.stop();
    setHablando(true);
    Speech.speak(fuente.texto, {
      language: 'es-MX',
      pitch: 0.85,
      onDone: terminar,
      onStopped: terminar,
      onError: terminar,
    });
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
  useEffect(() => () => {
    Speech.stop();
    suscripcionVozRef.current?.remove();
    try { reproductorVozRef.current?.remove(); } catch { /* ya liberado */ }
  }, []);

  // El clip se ve mientras hay un ejercicio delante del usuario, y sigue
  // visible congelado si pausa desde ahi. En descanso no: ahi la pantalla
  // es el reloj y el nombre del que viene.
  const enEjercicio =
    estado.fase === 'trabajo' || estado.fase === 'preparado' || estado.fase === 'cambio_lado';
  const verClip = enEjercicio ||
    (estado.fase === 'pausa' && estado.faseAnterior !== 'descanso' && estado.faseAnterior !== null);
  const clipActivo = enEjercicio;

  // Al terminar, guarda y pasa al resumen.
  useEffect(() => {
    if (estado.fase !== 'fin') return;
    if (hapticosOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    finalizar(true, null);
  }, [estado.fase]);

  function finalizar(completada: boolean, motivo: string | null) {
    p.limpiarGuardado();   // completa o abandonada, ya no hay nada que continuar
    const kcal = app.perfil.pesoKg
      ? Math.round(sesionInicial.kcalEstimadas ?? 0)
      : null;
    const res = guardarSesion({
      fecha: hoy(),
      iniciada: new Date().toISOString(),
      duracionS: estado.transcurridoS,
      rutinaId: sesionInicial.rutinaId,
      programaId: app.perfil.programaId,
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
