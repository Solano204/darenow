import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta } from '@/ui/theme';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { HeaderColapsable, ALTO_HEADER, RECORRIDO_PX } from '@/ui/fx/HeaderColapsable';

const AIRE_BAJO_TITULO = 16;

/** Lo que la pantalla necesita saber de su marco para poner su contenido y lo que se pega a la cabecera. */
export interface ContextoPantalla {
  y: SharedValue<number>;
  scroll: React.RefObject<Animated.ScrollView | null>;
  /** Donde termina la cabecera desplegada (con el inset): ahi se pega un encabezado de grupo. */
  altoCabecera: number;
  /** El relleno con el que el contenido deja pasar la cabecera y un poco de aire. */
  relleno: number;
  /** El alto de la barra ya colapsada (con el inset): hasta ahi sube un elemento que se muestra bajo ella. */
  altoBarra: number;
}

/**
 * El marco de las pantallas que se abren desde otra (Retos, Mediciones, Historial): fondo `goma` con su textura,
 * un scroll y el titulo grande de Big Shoulders 800 de 40 que colapsa a la barra superior con el scroll
 * (`HeaderColapsable`). Mientras el titulo grande esta a la vista la barra solo lleva la flecha de atras; el
 * titulo no se repite, es el mismo que se encoge junto a la flecha. `contenido` va dentro del scroll y
 * `superposicion` encima de el (un encabezado pegajoso).
 */
export function PantallaColapsable({ titulo, onAtras, contenido, superposicion }: {
  titulo: string;
  onAtras: () => void;
  contenido: (c: ContextoPantalla) => React.ReactNode;
  superposicion?: (c: ContextoPantalla) => React.ReactNode;
}) {
  const inset = useSafeAreaInsets();
  const y = useSharedValue(0);
  const scroll = useRef<Animated.ScrollView>(null);
  const onScroll = useAnimatedScrollHandler(e => { y.value = e.contentOffset.y; });
  const altoCabecera = inset.top + ALTO_HEADER;
  const contexto: ContextoPantalla = {
    y, scroll, altoCabecera, relleno: altoCabecera + AIRE_BAJO_TITULO, altoBarra: altoCabecera - RECORRIDO_PX,
  };

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <Animated.ScrollView
        ref={scroll} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: contexto.relleno, paddingBottom: inset.bottom + 40 }}
      >
        {contenido(contexto)}
      </Animated.ScrollView>
      {superposicion?.(contexto)}
      <HeaderColapsable y={y} titulo={titulo} onAtras={onAtras} />
    </View>
  );
}

const s = StyleSheet.create({ raiz: { flex: 1, backgroundColor: paleta.goma } });
