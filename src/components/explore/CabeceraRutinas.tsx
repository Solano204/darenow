import React from 'react';
import { View } from 'react-native';
import type { RutinaPropia } from '@/store/store';
import { FilaCrear } from './FilaCrear';
import { EncabezadoGrupo } from './EncabezadoGrupo';
import { FilaMiRutina } from './FilaMiRutina';

const AIRE_SIN_GRUPOS = 16;

/**
 * Lo que va antes de las tarjetas del catalogo en el segmento Rutinas: «Crear mi
 * rutina» y, si ya hay rutinas propias, el grupo «Mis rutinas» (una fila por rutina, en
 * el orden de siempre) y el titulo «Del catalogo». Sin rutinas propias solo esta la fila
 * de crear. `conteo` es el numero que se ve junto al titulo del grupo (rueda al cambiar).
 */
export function CabeceraRutinas({ propias, conteo, destacadas, onCrear, onAbrir, onEditar }: {
  propias: RutinaPropia[];
  conteo: number;
  destacadas: Record<string, number>;
  onCrear: () => void;
  onAbrir: (id: string) => void;
  onEditar: (id: string) => void;
}) {
  return (
    <View>
      <FilaCrear onPress={onCrear} />
      {propias.length > 0 ? (
        <>
          <EncabezadoGrupo titulo="Mis rutinas" cuantos={conteo} />
          {propias.map(r => (
            <FilaMiRutina
              key={r.id} r={r} destacar={destacadas[r.id] ?? 0}
              onPress={() => onAbrir(r.id)} onEditar={() => onEditar(r.id)}
            />
          ))}
          <EncabezadoGrupo titulo="Del catálogo" />
        </>
      ) : (
        <View style={{ height: AIRE_SIN_GRUPOS }} />
      )}
    </View>
  );
}
