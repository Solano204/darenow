import React, { useEffect, useRef } from 'react';
import { Canvas, Group, LinearGradient, Rect, useImage, vec } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { degradado, paleta } from '@/ui/theme';
import { ImagenTratada, FOCO_ARRIBA, ANCLAS_VELO, ALTO_VELO_ARRIBA, TRATAR_FOTOS, type Foco } from '@/ui/fx/FotoTratada';

const FACTOR_FONDO = 0.3;
const FACTOR_RECORTE = 0.55;
const ESCALA_FONDO = 1.06;
const OPACIDAD_FLASH = 0.15;
const FLASH_SUBE_MS = 40;
const FLASH_BAJA_MS = 80;

interface Medidas { ancho: number; alto: number }

/**
 * Capas de foto del onboarding en un solo Canvas. `progreso` es el indice
 * continuo de la lamina (0 a n-1). El fondo se desplaza a 0.3x y con escala
 * 1.06; el recorte del atleta, si existe, a 0.55x, para que se separe del
 * fondo. Entre fotos hay un fundido con un destello de exposicion (+15 %,
 * 120 ms). Sin recorte solo hay fondo. Con `sinParallax` no hay
 * desplazamiento, solo el fundido.
 */
export function FotoParallax({ fotos, recortes, progreso, indice, ancho, alto, tratar = TRATAR_FOTOS, sinParallax, foco = FOCO_ARRIBA }: {
  fotos: (number | null)[];
  recortes?: (number | null)[];
  progreso: SharedValue<number>;
  indice: number;
  ancho: number;
  alto: number;
  tratar?: boolean;
  sinParallax?: boolean;
  foco?: Foco;
}) {
  const flash = useSharedValue(0);
  const montado = useRef(false);

  useEffect(() => {
    if (!montado.current) { montado.current = true; return; }
    if (sinParallax) return;
    flash.value = withSequence(withTiming(1, { duration: FLASH_SUBE_MS }), withTiming(0, { duration: FLASH_BAJA_MS }));
  }, [indice]);

  const opacidadFlash = useDerivedValue(() => flash.value * OPACIDAD_FLASH);
  const medidas = { ancho, alto };

  return (
    <Canvas style={{ width: ancho, height: alto }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {fotos.map((f, k) => f !== null && (
        <CapaFoto key={`f${k}`} fuente={f} k={k} progreso={progreso} medidas={medidas} tratar={tratar} foco={foco} sinParallax={!!sinParallax} />
      ))}
      {recortes?.map((r, k) => r !== null && (
        <CapaRecorte key={`r${k}`} fuente={r} k={k} progreso={progreso} medidas={medidas} foco={foco} sinParallax={!!sinParallax} />
      ))}
      <Rect x={0} y={0} width={ancho} height={alto} color={paleta.blanco} opacity={opacidadFlash} />
      <Rect x={0} y={0} width={ancho} height={alto}>
        <LinearGradient start={vec(0, 0)} end={vec(0, alto)} colors={[...degradado.velo]} positions={[...ANCLAS_VELO]} />
      </Rect>
      <Rect x={0} y={0} width={ancho} height={ALTO_VELO_ARRIBA}>
        <LinearGradient start={vec(0, 0)} end={vec(0, ALTO_VELO_ARRIBA)} colors={[...degradado.veloArriba]} />
      </Rect>
    </Canvas>
  );
}

function CapaFoto({ fuente, k, progreso, medidas, tratar, foco, sinParallax }: {
  fuente: number; k: number; progreso: SharedValue<number>; medidas: Medidas; tratar: boolean; foco: Foco; sinParallax: boolean;
}) {
  const imagen = useImage(fuente);
  const { ancho, alto } = medidas;

  // La foto de abajo se queda fija; la que entra se funde encima mientras llega desde la derecha.
  const opacidad = useDerivedValue(() => (k === 0 ? 1 : Math.min(1, Math.max(0, progreso.value - (k - 1)))));
  const transform = useDerivedValue(() => {
    const dx = sinParallax ? 0 : Math.max(0, k - progreso.value) * ancho * FACTOR_FONDO;
    return [{ translateX: dx }, { scale: ESCALA_FONDO }];
  });

  return (
    <Group opacity={opacidad} transform={transform} origin={{ x: ancho / 2, y: alto / 2 }}>
      <ImagenTratada imagen={imagen} ancho={ancho} alto={alto} tratar={tratar} foco={foco} />
    </Group>
  );
}

function CapaRecorte({ fuente, k, progreso, medidas, foco, sinParallax }: {
  fuente: number; k: number; progreso: SharedValue<number>; medidas: Medidas; foco: Foco; sinParallax: boolean;
}) {
  const imagen = useImage(fuente);
  const { ancho, alto } = medidas;

  const opacidad = useDerivedValue(() => Math.min(1, Math.max(0, 1 - Math.abs(k - progreso.value))));
  const transform = useDerivedValue(() => [{ translateX: sinParallax ? 0 : (k - progreso.value) * ancho * FACTOR_RECORTE }]);

  return (
    <Group opacity={opacidad} transform={transform}>
      <ImagenTratada imagen={imagen} ancho={ancho} alto={alto} tratar={false} foco={foco} />
    </Group>
  );
}
