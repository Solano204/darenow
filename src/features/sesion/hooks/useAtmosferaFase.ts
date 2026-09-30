import { useEffect, useEffectEvent, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  Easing, cancelAnimation, interpolateColor, useDerivedValue,
  useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { easing, resortePlaca, haptico, COLOR_FASE, ORDEN_FASE, PALABRA_FASE, type FaseId, type FaseVisual } from '@/ui/theme';
import { useDeSesion, useTiempoSesion, type TiendaSesion } from '@/features/sesion/hooks/useSessionPlayer';
import { segundosHablados } from '@/features/sesion/utils/reproductor';

const RESPIRO_MS = 8000;
const RESPIRO_ESCALA = 0.08;
const BARRIDO_SUBE_MS = 380;
const BARRIDO_BAJA_MS = 300;
const GOLPE_ESCALA = 1.15;
const ANUNCIO_CADA_S = 10;

/**
 * La atmosfera del reproductor: el color de la fase, la respiracion del descanso, el latido del
 * trabajo y el barrido al cambiar de fase. Todo reacciona a la estructura del estado (fase,
 * ejercicio, serie). Lo que va segundo a segundo (el anillo que se vacia, el golpe de los ultimos
 * 3 segundos, el destello de la mitad y los anuncios) esta en `RelojAtmosfera`, un componente
 * hoja: asi el reloj no re-renderiza la pantalla (R4).
 */
export function useAtmosferaFase({
  reducido, visual, enTrabajo, enDescanso, corriendo,
}: {
  reducido: boolean;
  visual: FaseVisual;
  corriendo: boolean;
  enTrabajo: boolean;
  enDescanso: boolean;
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

  const escalaAnillo = useDerivedValue(() => {
    const r = respiro.value;
    const tri = r < 0.5 ? r * 2 : 2 - r * 2;
    return 1 + RESPIRO_ESCALA * (tri * tri * (3 - 2 * tri));
  });
  const brillo = useDerivedValue(() => (enTrabajo ? 0.12 + 0.04 * latido.value : 0.14), [enTrabajo]);

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
  }, [visual, reducido, idxFase, expande, desvanece]);

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
  }, [enDescanso, corriendo, reducido, respiro]);

  useEffect(() => {
    if (reducido || !enTrabajo || !corriendo) { cancelAnimation(latido); return; }
    latido.set(withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [enTrabajo, corriendo, reducido, latido]);

  return { colorFase, progreso, escalaAnillo, brillo, destello, golpe, expande, desvanece, respiro };
}

/**
 * Lo que la atmosfera hace cada segundo, con los mismos efectos y disparadores de siempre: el
 * anillo que se vacia a partir de `restanteS`, el golpe y la haptica de los ultimos 3 segundos,
 * el destello de la mitad y los anuncios del lector de pantalla. No dibuja nada.
 */
export function RelojAtmosfera({
  tienda, progreso, golpe, destello, esPorTiempo, reducido, faseEf, corriendo, conTiempo, conMarca, totalBase, claveFase,
}: {
  tienda: TiendaSesion;
  progreso: SharedValue<number>;
  golpe: SharedValue<number>;
  destello: SharedValue<number>;
  esPorTiempo: boolean;
  reducido: boolean;
  faseEf: FaseId;
  corriendo: boolean;
  conTiempo: boolean;
  conMarca: boolean;
  /** Lo que dura la fase segun el plan; con «mas descanso» el total real puede ser mayor. */
  totalBase: number | null;
  claveFase: string;
}) {
  const restanteS = useTiempoSesion(tienda);
  const fase = useDeSesion(tienda, e => e.fase);
  const estado = { restanteS, fase };
  const total = totalBase == null ? null : Math.max(totalBase, restanteS);

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
  }, [estado.restanteS, total, corriendo, claveFase, conTiempo, reducido, progreso]);

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
  }, [estado.restanteS, cuentaVisual, claveFase, reducido, golpe]);

  /* --- La mitad del trabajo: la marca del anillo destella, sin haptica --- */

  const ultimaMitad = useRef('');
  const alCambiarEstadoRestanteS = useEffectEvent(() => {
    if (!conMarca || reducido || total == null || estado.restanteS !== Math.floor(total / 2)) return;
    if (ultimaMitad.current === claveFase) return;
    ultimaMitad.current = claveFase;
    destello.set(withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 300 })));
  });
  useEffect(() => alCambiarEstadoRestanteS(), [estado.restanteS, conMarca, claveFase, reducido]);

  /* --- Un lector de pantalla oye la fase al cambiar y el tiempo cada 10 s, no cada segundo --- */

  const faseAnunciada = useRef<string | null>(null);
  const alCambiarEstadoRestanteS2 = useEffectEvent(() => {
    if (estado.fase === 'pausa' || estado.fase === 'fin') return;
    const fraseTiempo = conTiempo ? `, ${segundosHablados(estado.restanteS)}` : '';
    if (faseAnunciada.current !== claveFase) {
      faseAnunciada.current = claveFase;
      AccessibilityInfo.announceForAccessibility(`${PALABRA_FASE[faseEf]}${fraseTiempo}`);
    } else if (conTiempo && estado.restanteS > 0 && estado.restanteS % ANUNCIO_CADA_S === 0) {
      AccessibilityInfo.announceForAccessibility(segundosHablados(estado.restanteS));
    }
  });
  useEffect(() => alCambiarEstadoRestanteS2(), [estado.restanteS, claveFase]);


  return null;
}
