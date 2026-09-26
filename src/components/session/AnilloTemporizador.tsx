import React from 'react';
import { BlurMask, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type DerivedValue, type SharedValue } from 'react-native-reanimated';
import { paleta } from '../../theme';

const GROSOR_ANILLO = 8;
const RADIO_MARCA = 3;
const CRECE_MARCA = 5;

/**
 * Anillo del temporizador y su resplandor, como hijos del unico `Canvas` del
 * reproductor. Pista `gomaBorde`, progreso en el color de la fase con extremos
 * redondeados. `progreso` (1 = lleno, 0 = vacio) lo mueve el reproductor a
 * partir del tiempo restante del estado: aqui no hay reloj propio. `escala`
 * hace respirar el anillo en el descanso; `brillo` es la opacidad del
 * resplandor radial (14 % por defecto); `destello` agranda la marca de la
 * mitad del tiempo cuando el trazo la cruza. Sin trazo (`sinProgreso`) el anillo
 * queda lleno: trabajo por repeticiones, que no tiene final previsible.
 */
export function AnilloTemporizador({
  lienzo, diametro, progreso, color, escala, brillo, destello, conMarca,
}: {
  lienzo: number;
  diametro: number;
  progreso: SharedValue<number>;
  color: DerivedValue<string>;
  escala: DerivedValue<number>;
  brillo: DerivedValue<number>;
  destello: SharedValue<number>;
  conMarca: boolean;
}) {
  const c = lienzo / 2;
  const radio = diametro / 2 - GROSOR_ANILLO / 2;
  const pista = React.useMemo(() => Skia.PathBuilder.Make().addCircle(c, c, radio).detach(), [c, radio]);

  const transformacion = useDerivedValue(() => [{ scale: escala.value }]);
  const opacidadTrazo = useDerivedValue(() => (progreso.value > 0.002 ? 1 : 0));
  const radioMarca = useDerivedValue(() => RADIO_MARCA + CRECE_MARCA * destello.value);

  return (
    <>
      <Circle cx={c} cy={c} r={diametro * 0.6} color={color} opacity={brillo}>
        <BlurMask blur={diametro * 0.16} style="normal" />
      </Circle>
      <Group transform={transformacion} origin={{ x: c, y: c }}>
        <Path path={pista} style="stroke" strokeWidth={GROSOR_ANILLO} color={paleta.gomaBorde} />
        <Group transform={[{ rotate: -Math.PI / 2 }]} origin={{ x: c, y: c }}>
          <Path
            path={pista} style="stroke" strokeWidth={GROSOR_ANILLO} strokeCap="round"
            color={color} start={0} end={progreso} opacity={opacidadTrazo}
          />
        </Group>
        {conMarca && <Circle cx={c} cy={c + radio} r={radioMarca} color={paleta.magnesia} opacity={0.8} />}
      </Group>
    </>
  );
}
