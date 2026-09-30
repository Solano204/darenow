import React, { useEffect, useEffectEvent, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, conAlfa, resortePlaca, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { useMiniMagnesia } from '@/ui/fx/MiniMagnesia';
import { useEsFavorito, type Favoritos } from '@/state/store';
import { alternarFavorito } from '@/state/acciones';

const LADO = 40;
const SOBREIMPULSO = 1.2;
const ENCOGE_AL_QUITAR = 0.85;
const TAMANO_ICONO = 20;
const SALIDA_MS = 140;

type PropsEstrella = {
  activo: boolean;
  onPress: () => void;
  nombre: string;
  /** Diametro del boton (40 por defecto; 44 en la ficha del ejercicio). */
  lado?: number;
  /** Opacidad del fondo circular (0 a 1). Sin ella el fondo siempre se ve. */
  fondo?: SharedValue<number>;
  /** En una lista (no sobre una foto): sin el disco oscuro. */
  sinFondo?: boolean;
  /** Tamano del glifo (20 por defecto; 22 en las filas de Explorar). */
  tamanoIcono?: number;
  /** Color del contorno cuando no esta marcada (el relleno siempre es `magnesia`). */
  contorno?: string;
};

/**
 * La estrella de un elemento del catalogo: lee y cambia SU favorito en la tienda. Al marcarlo solo
 * se re-renderiza esta estrella; la fila, la lista y la pantalla no se enteran (R4).
 */
export const EstrellaDe = React.memo(function EstrellaDe({ tipo, id, ...resto }: {
  tipo: keyof Favoritos; id: string;
} & Omit<PropsEstrella, 'activo' | 'onPress'>) {
  const activo = useEsFavorito(tipo, id);
  // `key`: si la fila se recicla para otro elemento, la estrella empieza de cero (sin animar el
  // cambio de favorito como si lo hubieran tocado).
  return <EstrellaFavorito key={`${tipo}/${id}`} {...resto} activo={activo} onPress={() => alternarFavorito(tipo, id)} />;
});

/**
 * Estrella de favorito sobre una foto (40 px, `goma` al 70 %). El contorno
 * siempre esta; al marcarla se llena (escala 0 a 1.2 a 1 con `resortePlaca`) y
 * suelta una nube pequena de magnesia. Al quitarla se vacia (1 a 0.85 a 1) sin
 * particulas. El estado y el efecto sobre los datos son los de siempre:
 * `onPress` alterna el favorito y `activo` viene del almacen.
 */
export function EstrellaFavorito({ activo, onPress, nombre, lado = LADO, fondo, sinFondo, tamanoIcono = TAMANO_ICONO, contorno = paleta.magnesia }: PropsEstrella) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const { ref: magnesiaRef, disparar: dispararMagnesia } = useMiniMagnesia();
  const t = useSharedValue(activo ? 1 : 0);
  const icono = useSharedValue(1);
  const primera = useRef(true);

  const alCambiarActivo = useEffectEvent(() => {
    if (primera.current) { primera.current = false; return; }
    if (reducido) { t.set(activo ? 1 : 0); return; }
    if (activo) {
      t.set(0);
      t.set(withSequence(withTiming(SOBREIMPULSO, { duration: 120 }), withSpring(1, resortePlaca)));
      dispararMagnesia();
    } else {
      t.set(withTiming(0, { duration: SALIDA_MS }));
      icono.set(withSequence(withTiming(ENCOGE_AL_QUITAR, { duration: SALIDA_MS / 2 }), withTiming(1, { duration: SALIDA_MS / 2 })));
    }
  });
  useEffect(() => alCambiarActivo(), [activo, reducido]);

  const relleno = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ scale: reducido ? 1 : t.value }],
  }), [reducido, tick]);
  const disco = useAnimatedStyle(() => ({ transform: [{ scale: reducido ? 1 : icono.value }] }), [reducido, tick]);
  const capaFondo = useAnimatedStyle(() => ({ opacity: fondo ? fondo.value : 1 }), [tick]);

  return (
    <Pressable
      onPress={() => { haptico.toque(); onPress(); }}
      hitSlop={2}
      accessibilityRole="button"
      accessibilityLabel={activo ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
      accessibilityState={{ selected: activo }}
    >
      <View ref={magnesiaRef} collapsable={false}>
        <Animated.View style={[s.disco, { width: lado, height: lado, borderRadius: lado / 2 }, disco]}>
          {!sinFondo && <Animated.View style={[s.fondo, { borderRadius: lado / 2 }, capaFondo]} />}
          <Ionicons name="star-outline" size={tamanoIcono} color={contorno} />
          <Animated.View style={[s.relleno, relleno]} pointerEvents="none">
            <Ionicons name="star" size={tamanoIcono} color={paleta.magnesia} />
          </Animated.View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  disco: {
    width: LADO, height: LADO, borderRadius: LADO / 2, alignItems: 'center', justifyContent: 'center',
  },
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: conAlfa(paleta.goma, 0.7) },
  relleno: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
