import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, conAlfa, familia, resortePlaca, resorteTap, haptico } from '@/ui/theme';
import { imagenRutina, type RutinaPropia } from '@/state/store';
import { minutosPropios } from '@/lib/engine/session';
import { plural } from '@/lib/plural';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { FotoOscura } from '@/ui/components/FotoOscura';
import { DatoNumerico } from '@/ui/components/DatoNumerico';
import { MiniBarraRutina } from '@/ui/components/BarraRutinaTarjeta';

const LADO_MINIATURA = 64;
const ESCALA_PRESIONADA = 0.02;
const GIRO_LAPIZ = -20;
const AREA_LAPIZ = 44;
const DISCO_LAPIZ = 36;
/** Espera antes de la entrada de una rutina recien guardada: deja terminar la transicion del editor. */
const ESPERA_ENTRADA_MS = 300;
const DESDE_ARRIBA_PX = 28;
const BRILLO_SUBE_MS = 200;
const BRILLO_BAJA_MS = 400;
const OPACIDAD_BRILLO = 0.4;

/**
 * Fila de una rutina propia: una barra que cargaste tu, no una foto de catalogo.
 * Miniatura de 64, nombre tal como lo escribiste (2 lineas), la mini barra con una
 * placa por ejercicio en cada manga y los datos con plural correcto («1 ejercicio»,
 * «5 min»). El lapiz abre la edicion y el resto de la fila abre la rutina, como siempre.
 *
 * `destacar` sube cada vez que la rutina acaba de crearse o editarse: la fila entra desde
 * arriba con `resortePlaca`, las placas de la mini barra entran una por una con un solo
 * golpe al final y el borde brilla una vez en `magnesia` al 40 % (600 ms).
 */
export function FilaMiRutina({ r, destacar, onPress, onEditar }: {
  r: RutinaPropia;
  destacar: number;
  onPress: () => void;
  onEditar: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const presion = useSharedValue(0);
  const entrada = useSharedValue(1);
  const brillo = useSharedValue(0);
  const lapiz = useSharedValue(0);
  const ejercicios = r.items.length;
  const minutos = minutosPropios(r.items);

  useEffect(() => {
    if (!destacar || reducido) return;
    entrada.set(0);
    entrada.set(withDelay(ESPERA_ENTRADA_MS, withSpring(1, resortePlaca)));
    brillo.set(0);
    brillo.set(withDelay(ESPERA_ENTRADA_MS + 150, withSequence(
      withTiming(1, { duration: BRILLO_SUBE_MS }), withTiming(0, { duration: BRILLO_BAJA_MS }),
    )));
    return () => { cancelAnimation(entrada); cancelAnimation(brillo); };
  }, [brillo, destacar, entrada, reducido]);

  const caja = useAnimatedStyle(() => ({
    opacity: Math.min(1, entrada.value * 3),
    transform: [{ translateY: -DESDE_ARRIBA_PX * (1 - entrada.value) }],
  }), [tick]);
  const fondo = useAnimatedStyle(() => ({ opacity: presion.value }), [tick]);
  const hundida = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 1 - ESCALA_PRESIONADA * presion.value }],
  }), [reducido, tick]);
  const halo = useAnimatedStyle(() => ({ opacity: brillo.value }), [tick]);
  const giro = useAnimatedStyle(() => ({
    transform: [{ rotate: `${reducido ? 0 : lapiz.value}deg` }],
  }), [reducido, tick]);

  const editar = () => {
    haptico.toque();
    lapiz.set(withSequence(withSpring(GIRO_LAPIZ, resorteTap), withSpring(0, resorteTap)));
    onEditar();
  };

  const etiqueta = `${r.nombre}, ${ejercicios} ${plural(ejercicios, 'ejercicio')}, ${minutos} minutos, rutina propia`;

  const abrir = () => { presion.set(withSpring(1, resorteTap)); haptico.toque(); };
  const soltar = () => { presion.set(withSpring(0, resorteTap)); };

  return (
    <Animated.View style={[s.caja, caja]}>
      <Animated.View style={[s.fila, hundida]}>
        <Animated.View style={[s.fondo, fondo]} pointerEvents="none" />
        <Pressable
          style={s.cuerpo} onPressIn={abrir} onPressOut={soltar} onPress={onPress}
          accessibilityRole="button" accessibilityLabel={etiqueta}
        >
          <FotoOscura
            tipo="rutina" id={imagenRutina(r.id, r.imagenId)} ancho={LADO_MINIATURA} alto={LADO_MINIATURA}
            radioEsquina={14} velo={false}
          />
          <View style={s.centro}>
            <Text style={s.nombre} numberOfLines={2}>{r.nombre}</Text>
            <View style={s.datos}>
              {ejercicios > 0 && <MiniBarraRutina pasos={ejercicios} animar={destacar} retraso={ESPERA_ENTRADA_MS} />}
              <Text style={s.linea}>
                <DatoNumerico numero={ejercicios} unidad={plural(ejercicios, 'ejercicio')} />
                <Text style={s.punto}>  ·  </Text>
                <DatoNumerico numero={minutos} unidad="min" />
              </Text>
            </View>
          </View>
        </Pressable>
        <Pressable onPress={editar} accessibilityRole="button" accessibilityLabel="Editar rutina" style={s.areaLapiz}>
          <Animated.View style={[s.disco, giro]}>
            <Ionicons name="pencil-outline" size={20} color={paleta.magnesia2} />
          </Animated.View>
        </Pressable>
        <Pressable
          onPressIn={abrir} onPressOut={soltar} onPress={onPress} accessible={false} style={s.chevron}
        >
          <Ionicons name="chevron-forward" size={16} color={paleta.magnesia3Texto} />
        </Pressable>
      </Animated.View>
      <Animated.View style={[s.halo, halo]} pointerEvents="none" />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  caja: { marginBottom: 8 },
  fila: {
    minHeight: 88, padding: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  cuerpo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fondo: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, backgroundColor: conAlfa(paleta.gomaBorde, 0.4),
  },
  centro: { flex: 1, gap: 6 },
  nombre: { fontFamily: familia.enfasis, fontSize: 17, lineHeight: 22, color: paleta.magnesia },
  datos: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 },
  linea: { lineHeight: 20 },
  punto: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 20, color: paleta.magnesia3Texto },
  chevron: { width: 24, height: AREA_LAPIZ, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  areaLapiz: { width: AREA_LAPIZ, height: AREA_LAPIZ, alignItems: 'center', justifyContent: 'center' },
  disco: {
    width: DISCO_LAPIZ, height: DISCO_LAPIZ, borderRadius: DISCO_LAPIZ / 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: paleta.goma,
  },
  halo: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20,
    borderWidth: 1.5, borderColor: conAlfa(paleta.magnesia, OPACIDAD_BRILLO),
  },
});
