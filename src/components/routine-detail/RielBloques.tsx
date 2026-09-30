import React, { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { paleta } from '@/theme';
import type { TipoTramo } from '@/utils/estimarTramos';
import { EncabezadoBloque } from './EncabezadoBloque';
import { FilaEjercicioRutina, type ItemVista } from './FilaEjercicioRutina';
import { RielVertical, type SegmentoRiel } from './RielVertical';

/** Un bloque de la lista: su nombre en la vista, sus vueltas si las tiene y sus ejercicios en orden. */
export interface BloqueVista {
  tipo: TipoTramo;
  titulo: string;
  vueltas?: number;
  /** Minutos del bloque en el dato, para repartir el ancho del perfil. */
  min?: number;
  items: ItemVista[];
}

/**
 * Los bloques de la rutina en su riel (`RielVertical`). Calentamiento y enfriamiento llevan el
 * nodo en `magnesia3` y el principal en `placaAzul`; el bloque que se repite lleva el riel
 * grueso y la flecha de regreso. Debe ser hijo directo del contenido del scroll. `zonas`
 * recibe los limites de cada bloque para que el perfil sepa cual esta en pantalla.
 */
export function RielBloques({ bloques, y, zonas, onAbrir }: {
  bloques: BloqueVista[];
  y: SharedValue<number>;
  zonas: SharedValue<number[]>;
  onAbrir: (id: string) => void;
}) {
  const segmentos = useMemo<SegmentoRiel[]>(() => {
    let acumulado = 0;
    return bloques.map((b, i) => {
      const primera = acumulado;
      acumulado += b.items.length;
      return {
        clave: `${b.tipo}-${i}`,
        color: b.tipo === 'principal' || b.tipo === 'plano' ? paleta.placaAzul : paleta.magnesia3,
        repite: (b.vueltas ?? 0) > 1,
        encabezado: () => <EncabezadoBloque titulo={b.titulo} vueltas={b.vueltas} />,
        contenido: () => (
          <>
            {b.items.map((it, j) => (
              <FilaEjercicioRutina
                key={`${it.id}-${j}`} item={it} indice={primera + j} ultima={j === b.items.length - 1} onPress={onAbrir}
              />
            ))}
          </>
        ),
      };
    });
  }, [bloques, onAbrir]);

  return <RielVertical segmentos={segmentos} y={y} zonas={zonas} />;
}
