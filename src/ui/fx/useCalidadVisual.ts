/**
 * Nivel de calidad visual adaptativo (R6). Ver DESIGN.md, «Niveles de calidad».
 *
 * - `alta`: todo exactamente como el diseno aprobado.
 * - `media`: particulas ambientales al 60 %; las animaciones de respuesta al usuario, intactas.
 * - `baja`: sin loops ambientales (polvo flotante, resplandores que respiran, pulsos de
 *   invitacion), aplauso al 40 % de particulas y sin parallax en listas. Se conserva todo lo que
 *   informa o responde al usuario: odometros, anillo del temporizador, guia de respiracion,
 *   estados de botones, sellos y haptica.
 *
 * El punto de partida sale del telefono (memoria total y clase por año, `expo-device`), una vez por
 * arranque. El ahorro de bateria (`expo-battery`) y reducir movimiento bajan un nivel cada uno.
 * Para probar en el telefono: `EXPO_PUBLIC_CALIDAD=alta|media|baja` fuerza el nivel.
 */
import * as Device from 'expo-device';
import { useLowPowerMode } from 'expo-battery';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';

export type CalidadVisual = 'alta' | 'media' | 'baja';

const GB = 1024 * 1024 * 1024;
/** Umbrales (DESIGN.md): menos de 3 GB o un telefono de antes de 2016 es gama baja. */
const UMBRALES_CALIDAD = {
  baja: { memoriaGB: 3, año: 2016 },
  media: { memoriaGB: 6, año: 2019 },
} as const;

const NIVELES: CalidadVisual[] = ['baja', 'media', 'alta'];
const FORZADA = process.env.EXPO_PUBLIC_CALIDAD as CalidadVisual | undefined;

/** El nivel que da el hardware (memoria y año). Sin datos, `alta`: no se castiga lo que no se sabe. */
export function calidadDelTelefono(memoria: number | null, año: number | null): CalidadVisual {
  const gb = memoria == null ? null : memoria / GB;
  const menos = (u: { memoriaGB: number; año: number }) => (gb != null && gb < u.memoriaGB) || (año != null && año < u.año);
  if (menos(UMBRALES_CALIDAD.baja)) return 'baja';
  if (menos(UMBRALES_CALIDAD.media)) return 'media';
  return 'alta';
}

/** Un nivel menos por cada condicion (ahorro de bateria, reducir movimiento). */
export function bajar(base: CalidadVisual, pasos: number): CalidadVisual {
  return NIVELES[Math.max(0, NIVELES.indexOf(base) - pasos)];
}

const BASE = calidadDelTelefono(Device.totalMemory ?? null, Device.deviceYearClass ?? null);

export function useCalidadVisual(): CalidadVisual {
  const ahorro = useLowPowerMode();
  const reducido = useReducedMotion();
  if (FORZADA && NIVELES.includes(FORZADA)) return FORZADA;
  return bajar(BASE, (ahorro ? 1 : 0) + (reducido ? 1 : 0));
}

/** Cuantas particulas ambientales dibujar de `n` (100 %, 60 % o ninguna). */
export function particulasAmbiente(n: number, calidad: CalidadVisual): number {
  if (calidad === 'baja') return 0;
  return calidad === 'media' ? Math.round(n * 0.6) : n;
}

/** Fraccion de particulas del aplauso (40 % en baja). */
export const fraccionAplauso = (calidad: CalidadVisual) => (calidad === 'baja' ? 0.4 : 1);
