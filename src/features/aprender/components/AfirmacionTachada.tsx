import React, { useEffect, useState } from 'react';
import { View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  cancelAnimation, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';
import { paleta } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { TituloMascara } from '@/ui/fx/TituloMascara';
import { Tachon, type Linea } from '@/ui/fx/TachadoMito';

/** Lo que tarda el tachon en recorrer cada linea de la afirmacion. */
const TACHON_LINEA_MS = 220;
const COLOR_MS = 180;

/** Dice cuantas lineas tiene el titulo (lo sabe `TituloMascara` al pintar, no antes) sin tocar el estado del padre durante el render. */
function AvisaTotal({ indice, total, onTotal, children }: {
  indice: number; total: number; onTotal: (n: number) => void; children: React.ReactNode;
}) {
  useEffect(() => { if (indice === 0) onTotal(total); }, [indice, total, onTotal]);
  return <>{children}</>;
}

/**
 * La afirmacion de un mito. Si `tachar` (el veredicto es «Mito»), una linea `placaRoja` de 2 px la
 * recorre de izquierda a derecha, linea por linea (220 ms cada una, empezando tras `retraso`), y la
 * afirmacion baja de `magnesia` a `magnesia2` cuando queda tachada. Sin `tachar` se ve tal cual.
 * Con `mascara` (el titulo del detalle) las lineas ademas suben desde una mascara al abrir; sin ella
 * (las filas de la lista) es un texto de hasta `lineasMax` lineas. Con movimiento reducido, o con
 * `animar` en falso, aparece ya tachada.
 */
export function AfirmacionTachada({ texto, estilo, tachar, activo, animar = true, retraso = 0, mascara = false, lineasMax = 3 }: {
  texto: string;
  estilo: StyleProp<TextStyle>;
  tachar: boolean;
  activo: boolean;
  animar?: boolean;
  retraso?: number;
  mascara?: boolean;
  lineasMax?: number;
}) {
  const reducido = useReducedMotion();
  const estatico = reducido || !animar;
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [total, setTotal] = useState(0);
  const baja = useSharedValue(tachar && estatico ? 1 : 0);

  useEffect(() => {
    if (!tachar) { baja.set(0); return; }
    if (estatico) { baja.set(1); return; }
    if (!activo || total === 0) { baja.set(0); return; }
    baja.set(withDelay(retraso + total * TACHON_LINEA_MS, withTiming(1, { duration: COLOR_MS })));
    return () => cancelAnimation(baja);
  }, [tachar, estatico, activo, total, retraso, baja]);

  const color = useAnimatedStyle(() => ({ color: interpolateColor(baja.value, [0, 1], [paleta.magnesia, paleta.magnesia2]) }));

  const tachon = (linea: Linea, n: number) => (
    <Tachon
      key={n} linea={linea} activo={activo} estatico={estatico}
      duracion={TACHON_LINEA_MS} espera={retraso + n * TACHON_LINEA_MS}
    />
  );

  if (mascara) {
    return (
      <TituloMascara
        texto={texto} estilo={estilo} activo={activo} animar={animar} estiloTexto={color}
        decorarLinea={l => (
          <AvisaTotal indice={l.indice} total={l.total} onTotal={setTotal}>
            {tachar ? tachon({ x: l.x, y: 0, width: l.ancho, height: l.alto }, l.indice) : null}
          </AvisaTotal>
        )}
      />
    );
  }

  return (
    <View>
      <Animated.Text
        style={[estilo, color]} numberOfLines={lineasMax} maxFontSizeMultiplier={1.3}
        onTextLayout={e => {
          const medidas = e.nativeEvent.lines.slice(0, lineasMax).map(l => ({ x: l.x, y: l.y, width: l.width, height: l.height }));
          setLineas(medidas);
          setTotal(medidas.length);
        }}
      >
        {texto}
      </Animated.Text>
      {tachar && lineas.map(tachon)}
    </View>
  );
}
