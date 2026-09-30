import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { paleta, resortePlaca } from '@/ui/theme';
import type { VistaPreviaReto } from '@/lib/perfil';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { Huella } from '@/ui/fx/Huella';

const TRAMOS = 10;
const ESCALONADO_MS = 20;
const APARECE_MS = 220;
const LADO_CIRCULO = 20;
const LADO_CELDA = 10;
const CELDAS_POR_FILA = 15;
const ESCALA_SELLO = 1.3;

/**
 * La meta de un reto dibujada de antemano, con lo que la app ya sabe del reto: siete circulos de 20 px en
 * contorno para los dias seguidos; una rejilla de celdas de 10 x 10 (radio 3, en filas de 15) con una marca
 * fina bajo la celda donde esta la meta («20 sesiones en 30 dias»); o una barra de 6 px en 10 tramos para un
 * total («100 sesiones»). Si el reto ya tiene progreso guardado (`hechos`), lo hecho se rellena de `magnesia`
 * (con una huella en los circulos); si no, se ve vacia. Al entrar en pantalla (`activo`) los elementos aparecen
 * escalonados 20 ms. Cuando `sello` sube (se acaba de empezar el reto) el primer elemento recibe una huella que
 * se estampa (1.3 a 1). Con movimiento reducido esta completa desde el inicio.
 */
export function VistaPreviaMeta({ vista, hechos, activo, sello }: {
  vista: VistaPreviaReto;
  hechos: number;
  activo: boolean;
  sello: number;
}) {
  const reducido = useReducedMotion();
  const cuantos = vista.tipo === 'tramos' ? TRAMOS : vista.total;
  const duracion = cuantos * ESCALONADO_MS + APARECE_MS;
  const tiempo = useSharedValue(reducido ? duracion : 0);
  const [sellado, setSellado] = useState(false);
  const previo = useRef(sello);

  useEffect(() => {
    if (reducido) { tiempo.set(duracion); return; }
    if (!activo) return;
    tiempo.set(withTiming(duracion, { duration: duracion, easing: Easing.linear }));
    return () => cancelAnimation(tiempo);
  }, [activo, reducido, duracion]);

  useEffect(() => {
    if (sello === previo.current) return;
    previo.current = sello;
    setSellado(true);
  }, [sello]);

  if (vista.tipo === 'circulos') {
    return (
      <View style={s.circulos}>
        {Array.from({ length: vista.total }, (_, i) => {
          const hecho = i < hechos;
          return (
            <Elemento key={i} i={i} tiempo={tiempo} estilo={[s.circulo, hecho && s.circuloHecho]}>
              {hecho || (i === 0 && sellado) ? <HuellaPuesta estampar={i === 0 && sellado && hechos === 0} /> : null}
            </Elemento>
          );
        })}
      </View>
    );
  }

  if (vista.tipo === 'rejilla') {
    const filas = Array.from({ length: Math.ceil(vista.total / CELDAS_POR_FILA) }, (_, f) => f);
    return (
      <View style={s.rejilla}>
        {filas.map(f => (
          <View key={f} style={s.filaCeldas}>
            {Array.from({ length: Math.min(CELDAS_POR_FILA, vista.total - f * CELDAS_POR_FILA) }, (_, c) => {
              const i = f * CELDAS_POR_FILA + c;
              const hecha = i < hechos || (i === 0 && sellado);
              return (
                <View key={c} style={s.columnaCelda}>
                  <Elemento i={i} tiempo={tiempo} estilo={[s.celda, hecha && s.celdaHecha]} />
                  <View style={[s.marca, i === (vista.meta ?? 0) - 1 && s.marcaMeta]} />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  const tramos = Math.floor(hechos / (vista.total / TRAMOS));
  return (
    <View style={s.tramos}>
      {Array.from({ length: TRAMOS }, (_, i) => (
        <Elemento key={i} i={i} tiempo={tiempo} estilo={[s.tramo, (i < tramos || (i === 0 && sellado)) && s.tramoHecho]} />
      ))}
    </View>
  );
}

/** Un elemento de la vista previa: aparece (fundido y de 0.6 a 1) cuando `tiempo` pasa de su turno. */
function Elemento({ i, tiempo, estilo, children }: {
  i: number; tiempo: SharedValue<number>; estilo: React.ComponentProps<typeof Animated.View>['style']; children?: React.ReactNode;
}) {
  const tick = useTick();
  const animado = useAnimatedStyle(() => {
    const u = Math.min(1, Math.max(0, (tiempo.value - i * ESCALONADO_MS) / APARECE_MS));
    return { opacity: u, transform: [{ scale: 0.6 + 0.4 * u }] };
  }, [tick]);
  return <Animated.View style={[estilo, animado]}>{children}</Animated.View>;
}

/** La huella dentro de un circulo; con `estampar`, entra con escala 1.3 a 1 (`resortePlaca`). */
function HuellaPuesta({ estampar }: { estampar: boolean }) {
  const reducido = useReducedMotion();
  const t = useSharedValue(estampar && !reducido ? 0 : 1);
  useEffect(() => {
    if (!estampar || reducido) return;
    t.set(0);
    t.set(withSpring(1, resortePlaca));
  }, [estampar, reducido]);
  const estilo = useAnimatedStyle(() => ({ opacity: Math.min(1, t.value * 3), transform: [{ scale: ESCALA_SELLO - (ESCALA_SELLO - 1) * t.value }] }));
  return <Animated.View style={estilo}><Huella lado={12} opacidad={1} /></Animated.View>;
}

const s = StyleSheet.create({
  circulos: { flexDirection: 'row', gap: 8 },
  circulo: {
    width: LADO_CIRCULO, height: LADO_CIRCULO, borderRadius: LADO_CIRCULO / 2, borderWidth: 1.5, borderColor: paleta.gomaBorde,
    alignItems: 'center', justifyContent: 'center',
  },
  circuloHecho: { borderColor: paleta.magnesia },
  rejilla: { gap: 2 },
  filaCeldas: { flexDirection: 'row', gap: 4 },
  columnaCelda: { alignItems: 'center', gap: 2 },
  celda: { width: LADO_CELDA, height: LADO_CELDA, borderRadius: 3, backgroundColor: paleta.gomaBorde },
  celdaHecha: { backgroundColor: paleta.magnesia },
  marca: { width: 2, height: 4, backgroundColor: 'transparent' },
  marcaMeta: { backgroundColor: paleta.magnesia3 },
  tramos: { flexDirection: 'row', gap: 2 },
  tramo: { flex: 1, height: 6, borderRadius: 2, backgroundColor: paleta.gomaBorde },
  tramoHecho: { backgroundColor: paleta.magnesia },
});
