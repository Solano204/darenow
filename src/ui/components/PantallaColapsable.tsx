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
  /** Lleva el scroll a `y` (para un indice de secciones). */
  desplazarA: (y: number, animado: boolean) => void;
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
  // Excluida del React Compiler (R4): `contenido` y `superposicion` son funciones que se llaman al
  // dibujar y reciben `desplazarA`, que usa la ref del scroll. Solo la llaman manejadores (tocar un
  // indice, abrir una fila), nunca el render, pero el compilador no puede saberlo. Es un marco sin
  // estado propio: no memorizarlo no cuesta renders.
  'use no memo';
  const inset = useSafeAreaInsets();
  const y = useSharedValue(0);
  const scroll = useRef<Animated.ScrollView>(null);
  const onScroll = useAnimatedScrollHandler(e => { y.set(e.contentOffset.y); });
  const altoCabecera = inset.top + ALTO_HEADER;
  const desplazarA = (destino: number, animado: boolean) => { scroll.current?.scrollTo({ y: destino, animated: animado }); };
  const contexto: ContextoPantalla = {
    y, desplazarA, altoCabecera, relleno: altoCabecera + AIRE_BAJO_TITULO, altoBarra: altoCabecera - RECORRIDO_PX,
  };

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <Animated.ScrollView
        ref={scroll} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: contexto.relleno, paddingBottom: inset.bottom + 40 }}
      >
        {/* eslint-disable-next-line react-hooks/refs -- ver 'use no memo' arriba */}
        {contenido(contexto)}
      </Animated.ScrollView>
      {/* eslint-disable-next-line react-hooks/refs -- ver 'use no memo' arriba */}
      {superposicion?.(contexto)}
      <HeaderColapsable y={y} titulo={titulo} onAtras={onAtras} />
    </View>
  );
}

const s = StyleSheet.create({ raiz: { flex: 1, backgroundColor: paleta.goma } });
