import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta, conAlfa, familia, MARGEN_PANTALLA } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { estimarTramos, resumenDeTramos } from '../../utils/estimarTramos';
import { GomaTexture } from '../fx/GomaTexture';
import { BarraInferiorFija, ALTO_BARRA_INFERIOR } from '../ui/BarraInferiorFija';
import { BarraSuperiorColapsable } from '../exercise/BarraSuperiorColapsable';
import { BarraRutina, ALTO_BARRA } from '../routine-builder/BarraRutina';
import { HeroRutina } from './HeroRutina';
import { PerfilRutina, ALTO_PERFIL_COMPACTO } from './PerfilRutina';
import { RielBloques, type BloqueVista } from './RielBloques';

const ALTO_BARRA_SUPERIOR = 52;
const FRACCION_HERO = 0.38;
const AIRE_PEGAJOSO_PX = 8;
const APARICION_PEGAJOSO_PX = 24;
const AIRE_AL_IR_A_BLOQUE_PX = 32;

/**
 * Lo que comparten la ficha de una rutina del catalogo y la de una propia: la foto (o, sin
 * foto, la barra de placas en grande), el nombre y sus metadatos, el perfil de la sesion, los
 * bloques en su riel y la barra fija de abajo. Cada pantalla pone sus datos y lo que es solo
 * suyo (`junto`, `antes`, `despues`).
 *
 * Con el scroll, el hero se desvanece y aparece la barra superior con el nombre; el perfil
 * grande, al salir por arriba, deja una copia compacta pegajosa bajo esa barra para que el
 * punto que recorre la curva se siga viendo mientras se baja por los bloques. Tocar el
 * nombre de un tramo del perfil lleva hasta su bloque.
 */
export function PlantillaRutina({
  nombre, foto, favorito, onFavorito, onAtras, meta, junto, antes, bloques, onAbrir, despues, barraInferior,
}: {
  nombre: string;
  /** La foto de la rutina (la fuente de la imagen) o `null`. */
  foto: number | null;
  favorito: boolean;
  onFavorito: () => void;
  onAtras: () => void;
  meta: React.ReactNode;
  /** Va a la derecha del nombre (el lapiz de editar de una rutina propia). */
  junto?: React.ReactNode;
  /** Lo que va entre el nombre y el perfil: la nota de la rutina, los avisos. */
  antes?: React.ReactNode;
  bloques: BloqueVista[];
  onAbrir: (id: string) => void;
  /**
   * Lo que va despues de los bloques (la nota de calorias, los botones secundarios). Cada
   * elemento es hijo directo del contenido del scroll, con su propio margen, para que
   * `BloqueRevela` mida bien su posicion; recibe el scroll.
   */
  despues?: (y: SharedValue<number>) => React.ReactNode;
  barraInferior: React.ReactNode;
}) {
  const inset = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const tick = useTick();
  const { height: ventana } = useWindowDimensions();
  const scroll = useRef<Animated.ScrollView>(null);
  const y = useSharedValue(0);
  const zonas = useSharedValue<number[]>([]);
  const perfilFin = useSharedValue(1e6);
  const onScroll = useAnimatedScrollHandler(e => { y.value = e.contentOffset.y; });

  const tramos = useMemo(() => estimarTramos(bloques.map(b => ({
    tipo: b.tipo, peso: b.min ?? 0, vueltas: b.vueltas, ejercicios: b.items.length,
  }))), [bloques]);
  const resumen = useMemo(() => resumenDeTramos(tramos), [tramos]);
  // Una clave por ejercicio de la barra: si una rutina lo trae dos veces, la segunda lleva «#n».
  const claves = useMemo(() => {
    const vistos = new Map<string, number>();
    return bloques.flatMap(b => b.items).map(it => {
      const n = vistos.get(it.id) ?? 0;
      vistos.set(it.id, n + 1);
      return n ? `${it.id}#${n}` : it.id;
    });
  }, [bloques]);

  const barraTop = inset.top + ALTO_BARRA_SUPERIOR;
  const conFoto = foto !== null;
  const alturaHero = conFoto ? Math.round(ventana * FRACCION_HERO) : barraTop + ALTO_BARRA + 16;

  const pegajoso = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [perfilFin.value - barraTop - APARICION_PEGAJOSO_PX, perfilFin.value - barraTop], [0, 1], Extrapolation.CLAMP),
  }), [barraTop, tick]);

  const irABloque = (i: number) => {
    const arriba = zonas.value[2 * i];
    if (arriba === undefined) return;
    scroll.current?.scrollTo({
      y: Math.max(0, arriba - (barraTop + ALTO_PERFIL_COMPACTO + 2 * AIRE_PEGAJOSO_PX + AIRE_AL_IR_A_BLOQUE_PX)),
      animated: !reducido,
    });
  };

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <Animated.ScrollView
        ref={scroll} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: inset.bottom + ALTO_BARRA_INFERIOR + 32 }}
      >
        {conFoto ? (
          <HeroRutina fuente={foto} y={y} alto={alturaHero} />
        ) : (
          <View style={[s.barraGrande, { paddingTop: barraTop + 12 }]}>
            <BarraRutina ids={claves} etiqueta={`Rutina de ${claves.length} ejercicios`} silenciosa />
          </View>
        )}

        <View style={s.cabecera}>
          <View style={s.filaNombre}>
            <Text style={s.nombre} accessibilityRole="header">{nombre}</Text>
            {junto}
          </View>
          <View style={s.meta}>{meta}</View>
        </View>

        {antes ? <View style={s.antes}>{antes}</View> : null}

        <View
          style={s.perfil}
          onLayout={e => { perfilFin.value = e.nativeEvent.layout.y + e.nativeEvent.layout.height; }}
        >
          <PerfilRutina tramos={tramos} resumen={resumen} y={y} zonas={zonas} onTramo={irABloque} />
        </View>

        <RielBloques bloques={bloques} y={y} zonas={zonas} onAbrir={onAbrir} />

        {despues?.(y)}
      </Animated.ScrollView>

      {!reducido && (
        <Animated.View
          style={[s.pegajoso, { top: barraTop }, pegajoso]} pointerEvents="none"
          importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
        >
          <PerfilRutina compacto tramos={tramos} resumen={resumen} y={y} zonas={zonas} />
        </Animated.View>
      )}

      <BarraSuperiorColapsable
        y={y} alturaHero={alturaHero} nombre={nombre} favorito={favorito} onFavorito={onFavorito} onAtras={onAtras}
      />

      <BarraInferiorFija>{barraInferior}</BarraInferiorFija>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  barraGrande: { marginHorizontal: MARGEN_PANTALLA },
  cabecera: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
  filaNombre: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nombre: {
    flex: 1, fontFamily: familia.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.5, color: paleta.magnesia,
  },
  meta: { marginTop: 12 },
  antes: { marginHorizontal: MARGEN_PANTALLA, marginTop: 16, gap: 12 },
  perfil: { marginHorizontal: MARGEN_PANTALLA, marginTop: 32 },
  pegajoso: {
    position: 'absolute', left: 0, right: 0, zIndex: 15, paddingVertical: AIRE_PEGAJOSO_PX, paddingHorizontal: MARGEN_PANTALLA,
    backgroundColor: conAlfa(paleta.goma, 0.92), borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde,
  },
});
