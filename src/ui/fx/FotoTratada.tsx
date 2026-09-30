import React from 'react';
import { Canvas, ColorMatrix, Group, Image as SkiaImage, LinearGradient, Rect, vec, type SkImage } from '@shopify/react-native-skia';
import { degradado } from '@/ui/theme';
import { useImagenSkia } from './imagenesSkia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

const LUMA = { r: 0.2126, g: 0.7152, b: 0.0722 };
const SATURACION = 0.65;
const EXPOSICION = 0.72;
const SOMBRA_ROJO = -0.012;
const SOMBRA_AZUL = 0.028;
/** Los mitos se ven como «lo que se cree»: la saturacion del tratamiento baja otro 20 %. */
const DESATURACION_EXTRA = 0.8;

/**
 * Tratamiento de respaldo para las fotos claras actuales: -35 % de saturacion,
 * menos exposicion y sombras un poco hacia azul frio. Una foto nueva, ya
 * oscura y de luz dura, se dibuja con `tratar={false}`.
 */
function matrizTratamiento(saturacion: number = SATURACION): number[] {
  const s = saturacion;
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

const MATRIZ_TRATAMIENTO = matrizTratamiento();
export const MATRIZ_DESATURADA = matrizTratamiento(SATURACION * DESATURACION_EXTRA);

/** Anclas del degradado foto a goma y alto del scrim superior. Comunes a toda foto a sangre. */
export const ANCLAS_VELO = [0.2, 0.5, 0.78, 1] as const;
export const ALTO_VELO_ARRIBA = 120;

/** Poner en false cuando las fotos nuevas (oscuras, de luz dura) reemplacen a las actuales. */
export const TRATAR_FOTOS = true;

export interface Foco { x: number; y: number }
export const FOCO_ARRIBA: Foco = { x: 0.5, y: 0 };

/** Cubre el recuadro como `cover`, pero alineando el sobrante segun `foco` (0 a 1) en vez de centrarlo. */
function rectanguloCover(imagen: SkImage, ancho: number, alto: number, foco: Foco) {
  const escala = Math.max(ancho / imagen.width(), alto / imagen.height());
  const w = imagen.width() * escala;
  const h = imagen.height() * escala;
  return { x: (ancho - w) * foco.x, y: (alto - h) * foco.y, width: w, height: h };
}

export function ImagenTratada({ imagen, ancho, alto, tratar = TRATAR_FOTOS, matriz = MATRIZ_TRATAMIENTO, foco = FOCO_ARRIBA, opacidad }: {
  imagen: SkImage | null;
  ancho: number;
  alto: number;
  tratar?: boolean;
  /** El tratamiento de color; por defecto el de siempre (`matrizTratamiento()`). */
  matriz?: number[];
  foco?: Foco;
  opacidad?: SharedValue<number>;
}) {
  if (!imagen) return null;
  const r = rectanguloCover(imagen, ancho, alto, foco);
  return (
    <SkiaImage image={imagen} x={r.x} y={r.y} width={r.width} height={r.height} fit="fill" opacity={opacidad}>
      {tratar && <ColorMatrix matrix={matriz} />}
    </SkiaImage>
  );
}

/**
 * Una foto a sangre con el tratamiento de color, en su propio `Canvas`. Con `velo`, el degradado
 * foto a goma (el mismo `degradado.velo` con `ANCLAS_VELO`) se pinta en el mismo lienzo, y
 * `children` (elementos de Skia, como el polvo de magnesia) va encima de todo: una pantalla con
 * foto, velo y particulas usa un solo `Canvas` (R6).
 */
export function FotoTratada({ fuente, ancho, alto, tratar = TRATAR_FOTOS, matriz, foco, escala, velo = false, children }: {
  fuente: number;
  ancho: number;
  alto: number;
  tratar?: boolean;
  matriz?: number[];
  foco?: Foco;
  escala?: SharedValue<number>;
  velo?: boolean;
  children?: React.ReactNode;
}) {
  const imagen = useImagenSkia(fuente);
  const transform = useDerivedValue(() => [{ scale: escala ? escala.value : 1 }]);

  return (
    <Canvas style={{ width: ancho, height: alto }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Group transform={transform} origin={{ x: ancho / 2, y: alto / 2 }}>
        <ImagenTratada imagen={imagen} ancho={ancho} alto={alto} tratar={tratar} matriz={matriz} foco={foco} />
      </Group>
      {velo && (
        <Rect x={0} y={0} width={ancho} height={alto}>
          <LinearGradient start={vec(0, 0)} end={vec(0, alto)} colors={[...degradado.velo]} positions={[...ANCLAS_VELO]} />
        </Rect>
      )}
      {children}
    </Canvas>
  );
}
