import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { paleta, familia, MARGEN_PANTALLA } from '@/theme';
import { plural } from '@/utils/plural';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Odometro } from '@/components/fx/Odometro';

const SEPARACION_SECCIONES = 40;
const AIRE_PRIMERA_SECCION = 16;
const AJUSTE_ALTURA_MS = 240;

/**
 * Una seccion de Ajustes: un titulo de Big Shoulders 700 de 22 en `magnesia` (con, a la derecha, un contador si lo
 * hay), 40 px de separacion con la anterior y su contenido debajo. Si el contenido de una seccion de arriba crece o
 * encoge (el objetivo que se despliega), las de abajo se acomodan con `LinearTransition`. `alMedir` avisa donde
 * empieza dentro del scroll, para el indice de secciones.
 */
export function SeccionAjustes({ titulo, derecha, primera, alMedir, children }: {
  titulo: string;
  derecha?: React.ReactNode;
  primera?: boolean;
  alMedir?: (arriba: number) => void;
  children: React.ReactNode;
}) {
  const reducido = useReducedMotion();
  return (
    <Animated.View
      layout={reducido ? undefined : LinearTransition.duration(AJUSTE_ALTURA_MS)}
      onLayout={alMedir ? e => alMedir(e.nativeEvent.layout.y) : undefined}
      style={{ marginTop: primera ? AIRE_PRIMERA_SECCION : SEPARACION_SECCIONES }}
    >
      <View style={s.cabecera}>
        <Text style={s.titulo} accessibilityRole="header" maxFontSizeMultiplier={1.3}>{titulo}</Text>
        {derecha}
      </View>
      {children}
    </Animated.View>
  );
}

/** «3 de 19»: la cifra rueda al cambiar (Equipo). */
export function ContadorDe({ n, de }: { n: number; de: number }) {
  return (
    <View style={s.contador} accessible accessibilityLabel={`${n} de ${de}`} accessibilityLiveRegion="polite">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Odometro valor={n} continuo estilo={s.cifra} />
      </View>
      <Text style={s.resto} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">de {de}</Text>
    </View>
  );
}

/** «2 marcadas» con el plural correcto (Lesiones). */
export function ContadorMarcadas({ n }: { n: number }) {
  const texto = plural(n, 'marcada', 'marcadas');
  return (
    <View style={s.contador} accessible accessibilityLabel={`${n} ${texto}`} accessibilityLiveRegion="polite">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Odometro valor={n} continuo estilo={s.cifra} />
      </View>
      <Text style={s.resto} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  cabecera: {
    marginHorizontal: MARGEN_PANTALLA, marginBottom: 12, flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', gap: 12,
  },
  titulo: { flexShrink: 1, fontFamily: familia.titulo, fontSize: 22, lineHeight: 26, color: paleta.magnesia },
  contador: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cifra: { fontFamily: familia.titulo, fontSize: 18, lineHeight: 22, color: paleta.magnesia },
  resto: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto },
});
