import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  Easing, cancelAnimation, interpolateColor, runOnJS, useAnimatedReaction, useDerivedValue,
  useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { easing, resortePlaca, haptico, COLOR_FASE, ORDEN_FASE, PALABRA_FASE, type FaseId, type FaseVisual } from '@/ui/theme';
import type { EstadoPlayer } from '@/features/sesion/utils/playerMachine';
import { segundosHablados } from '@/features/sesion/utils/reproductor';

const RESPIRO_MS = 8000;
const RESPIRO_ESCALA = 0.08;
const BARRIDO_SUBE_MS = 380;
const BARRIDO_BAJA_MS = 300;
const GOLPE_ESCALA = 1.15;
const ANUNCIO_CADA_S = 10;

/**
 * La atmosfera del reproductor: el color de la fase, el anillo que se vacia, la respiracion
 * del descanso, el latido del trabajo, el golpe de los ultimos 3 segundos, el destello de la
 * mitad y los anuncios para el lector de pantalla. Todo reacciona al estado de la maquina.
 */
export function useAtmosferaFase({
  estado, esPorTiempo, reducido, visual, faseEf, corriendo, enTrabajo, enDescanso, conTiempo, total, claveFase,
}: {
  estado: EstadoPlayer;
  esPorTiempo: boolean;
  reducido: boolean;
  visual: FaseVisual;
  faseEf: FaseId;
  corriendo: boolean;
  enTrabajo: boolean;
  enDescanso: boolean;
  conTiempo: boolean;
  total: number | null;
  claveFase: string;
}) {
  /* --- Color de la fase, compartido por el anillo, el resplandor, el barrido y la barra --- */

  const idxFase = useSharedValue(ORDEN_FASE.indexOf(visual));
  const colorFase = useDerivedValue(() => interpolateColor(
    idxFase.value, [0, 1, 2], [COLOR_FASE.preparado, COLOR_FASE.trabajo, COLOR_FASE.descanso],
  ));

  const progreso = useSharedValue(1);
  const respiro = useSharedValue(0);
  const latido = useSharedValue(0);
  const destello = useSharedValue(0);
  const golpe = useSharedValue(1);
  const expande = useSharedValue(0);
  const desvanece = useSharedValue(0);
  const [inhala, setInhala] = useState(true);

  const escalaAnillo = useDerivedValue(() => {
    const r = respiro.value;
    const tri = r < 0.5 ? r * 2 : 2 - r * 2;
    return 1 + RESPIRO_ESCALA * (tri * tri * (3 - 2 * tri));
  });
  const brillo = useDerivedValue(() => (enTrabajo ? 0.12 + 0.04 * latido.value : 0.14), [enTrabajo]);

  useAnimatedReaction(() => respiro.value < 0.5, (v, previo) => {
    if (v !== previo) runOnJS(setInhala)(v);
  });

  /* --- Cambio de atmosfera: color, barrido, haptica --- */

  const visualPrevio = useRef(visual);
  useEffect(() => {
    const cambio = visualPrevio.current !== visual;
    visualPrevio.current = visual;
    idxFase.set(withTiming(ORDEN_FASE.indexOf(visual), { duration: reducido ? 150 : BARRIDO_SUBE_MS }));
    if (!cambio) return;
    if (visual === 'trabajo') haptico.golpe();
    else if (visual === 'descanso') haptico.suave();
    else haptico.placa();
    if (reducido) return;
    expande.set(0);
    desvanece.set(0);
    expande.set(withTiming(1, { duration: BARRIDO_SUBE_MS, easing: easing.salida }));
    desvanece.set(withDelay(BARRIDO_SUBE_MS, withTiming(1, { duration: BARRIDO_BAJA_MS })));
  }, [visual, reducido]);

  /* --- Anillo: se vacia de forma continua a partir de `restanteS` --- */

  const clavePrevia = useRef(claveFase);
  useEffect(() => {
    const nueva = clavePrevia.current !== claveFase;
    clavePrevia.current = claveFase;
    if (total == null || total <= 0 || !conTiempo) { progreso.set(1); return; }
    const ahora = Math.min(1, estado.restanteS / total);
    const siguiente = Math.max(0, (estado.restanteS - 1) / total);
    cancelAnimation(progreso);
    if (!corriendo) { progreso.set(ahora); return; }
    if (nueva && !reducido) {
      progreso.set(withSequence(
        withTiming(ahora, { duration: 240 }),
        withTiming(siguiente, { duration: 760, easing: Easing.linear }),
      ));
    } else {
      progreso.set(ahora);
      progreso.set(withTiming(siguiente, { duration: 1000, easing: Easing.linear }));
    }
  }, [estado.restanteS, total, corriendo, claveFase, conTiempo, reducido]);

  /* --- Respiracion del descanso y pulso del resplandor de trabajo --- */

  useEffect(() => {
    if (reducido || !enDescanso) {
      cancelAnimation(respiro);
      respiro.set(withTiming(0, { duration: 200 }));
      return;
    }
    if (!corriendo) { cancelAnimation(respiro); return; }
    respiro.set(withRepeat(
      withTiming(1, { duration: RESPIRO_MS, easing: Easing.linear }), -1, false,
    ));
  }, [enDescanso, corriendo, reducido]);

  useEffect(() => {
    if (reducido || !enTrabajo || !corriendo) { cancelAnimation(latido); return; }
    latido.set(withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [enTrabajo, corriendo, reducido]);

  /* --- Los ultimos 3 segundos: golpe y haptica Rigid --- */

  const cuentaVisual = corriendo && conTiempo && faseEf !== 'fin' && estado.restanteS >= 1 && estado.restanteS <= 3
    && (faseEf !== 'trabajo' || esPorTiempo);
  const ultimaCuenta = useRef('');
  useEffect(() => {
    if (!cuentaVisual) return;
    const clave = `${claveFase}:${estado.restanteS}`;
    if (ultimaCuenta.current === clave) return;
    ultimaCuenta.current = clave;
    haptico.sello();
    if (reducido) return;
    golpe.set(withSequence(withTiming(GOLPE_ESCALA, { duration: 80 }), withSpring(1, resortePlaca)));
  }, [estado.restanteS, cuentaVisual, claveFase, reducido]);

  /* --- La mitad del trabajo: la marca del anillo destella, sin haptica --- */

  const conMarca = faseEf === 'trabajo' && esPorTiempo && (total ?? 0) >= 6;
  const ultimaMitad = useRef('');
  useEffect(() => {
    if (!conMarca || reducido || total == null || estado.restanteS !== Math.floor(total / 2)) return;
    if (ultimaMitad.current === claveFase) return;
    ultimaMitad.current = claveFase;
    destello.set(withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 300 })));
  }, [estado.restanteS, conMarca, claveFase, reducido]);

  /* --- Un lector de pantalla oye la fase al cambiar y el tiempo cada 10 s, no cada segundo --- */

  const faseAnunciada = useRef<string | null>(null);
  useEffect(() => {
    if (estado.fase === 'pausa' || estado.fase === 'fin') return;
    const fraseTiempo = conTiempo ? `, ${segundosHablados(estado.restanteS)}` : '';
    if (faseAnunciada.current !== claveFase) {
      faseAnunciada.current = claveFase;
      AccessibilityInfo.announceForAccessibility(`${PALABRA_FASE[faseEf]}${fraseTiempo}`);
    } else if (conTiempo && estado.restanteS > 0 && estado.restanteS % ANUNCIO_CADA_S === 0) {
      AccessibilityInfo.announceForAccessibility(segundosHablados(estado.restanteS));
    }
  }, [estado.restanteS, claveFase]);


  return { colorFase, progreso, escalaAnillo, brillo, destello, golpe, expande, desvanece, inhala, conMarca };
}
