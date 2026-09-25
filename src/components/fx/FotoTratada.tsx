import React from 'react';
import { Canvas, ColorMatrix, Group, Image as SkiaImage, useImage, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

const LUMA = { r: 0.2126, g: 0.7152, b: 0.0722 };
const SATURACION = 0.65;
const EXPOSICION = 0.72;
const SOMBRA_ROJO = -0.012;
const SOMBRA_AZUL = 0.028;

/**
 * Tratamiento de respaldo para las fotos claras actuales: -35 % de saturacion,
 * menos exposicion y sombras un poco hacia azul frio. Una foto nueva, ya
 * oscura y de luz dura, se dibuja con `tratar={false}`.
 */
function matrizTratamiento(): number[] {
  const s = SATURACION;
  const e = EXPOSICION;
  const r = LUMA.r * (1 - s);
  const g = LUMA.g * (1 - s);
  const b = LUMA.b * (1 - s);
  return [
    e * (r + s), e * g, e * b, 0, SOMBRA_ROJO,
    e * r, e * (g + s), e * b, 0, 0,
    e * r, e * g, e * (b + s), 0, SOMBRA_AZUL,
    0, 0, 0, 1, 0,
  ];
}

export const MATRIZ_TRATAMIENTO = matrizTratamiento();

export interface Foco { x: number; y: number }
export const FOCO_ARRIBA: Foco = { x: 0.5, y: 0 };

/** Cubre el recuadro como `cover`, pero alineando el sobrante segun `foco` (0 a 1) en vez de centrarlo. */
function rectanguloCover(imagen: SkImage, ancho: number, alto: number, foco: Foco) {
  const escala = Math.max(ancho / imagen.width(), alto / imagen.height());
  const w = imagen.width() * escala;
  const h = imagen.height() * escala;
  return { x: (ancho - w) * foco.x, y: (alto - h) * foco.y, width: w, height: h };
}

export function ImagenTratada({ imagen, ancho, alto, tratar = true, foco = FOCO_ARRIBA, opacidad }: {
  imagen: SkImage | null;
  ancho: number;
  alto: number;
  tratar?: boolean;
  foco?: Foco;
  opacidad?: SharedValue<number>;
}) {
  if (!imagen) return null;
  const r = rectanguloCover(imagen, ancho, alto, foco);
  return (
    <SkiaImage image={imagen} x={r.x} y={r.y} width={r.width} height={r.height} fit="fill" opacity={opacidad}>
      {tratar && <ColorMatrix matrix={MATRIZ_TRATAMIENTO} />}
    </SkiaImage>
  );
}

export function FotoTratada({ fuente, ancho, alto, tratar = true, foco, escala }: {
  fuente: number;
  ancho: number;
  alto: number;
  tratar?: boolean;
  foco?: Foco;
  escala?: SharedValue<number>;
}) {
  const imagen = useImage(fuente);
  const transform = useDerivedValue(() => [{ scale: escala ? escala.value : 1 }]);

  return (
    <Canvas style={{ width: ancho, height: alto }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Group transform={transform} origin={{ x: ancho / 2, y: alto / 2 }}>
        <ImagenTratada imagen={imagen} ancho={ancho} alto={alto} tratar={tratar} foco={foco} />
      </Group>
    </Canvas>
  );
}
