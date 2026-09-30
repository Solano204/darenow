/**
 * FORJA · detalle de una rutina del catalogo
 *
 * Una rutina tiene forma: subes, trabajas, bajas. Esta pantalla la hace visible antes de
 * empezar (el perfil de la sesion y los bloques en su riel). Mismos datos, mismos bloques,
 * mismas prescripciones y mismas acciones que antes del rediseno (ver `docs/FUNCIONALIDAD.md`,
 * seccion 17); cambia como se ve y se mueve. El armazon comun con la ficha de una rutina
 * propia esta en `PlantillaRutina`.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MARGEN_PANTALLA } from '@/ui/theme';
import { Nota } from '@/ui/components';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { BloqueRevela } from '@/ui/fx/BloqueRevela';
import { Entrada } from '@/ui/fx/Entrada';
import { PlantillaRutina } from '@/components/routine-detail/PlantillaRutina';
import { MetadatosRutina } from '@/components/routine-detail/MetadatosRutina';
import { NotaEstimacion } from '@/components/routine-detail/NotaEstimacion';
import { BotonDuplicar } from '@/components/routine-detail/BotonDuplicar';
import type { BloqueVista } from '@/components/routine-detail/RielBloques';
import { porId, rutinaPorId, type BloqueRutina } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { fuente } from '@/media/registry';
import { useEstado } from '@/store/store';
import { sesionDeRutina, itemPropioPorDefecto } from '@/engine/session';
import { textoVisible } from '@/utils/presentacion';

const FRACCION_NOTA_PARA_ACTIVAR = 0.4;

type Props = NativeStackScreenProps<ParamListBase, 'Rutina'>;

/** Un bloque del dato tal como se muestra: los ejercicios con su prescripcion por defecto (los ids que no existen se omiten). */
function vistaDeBloque(b: BloqueRutina): BloqueVista {
  const items = b.items.flatMap(id => {
    const e = porId.get(id);
    if (!e) return [];
    return [{ id, series: e.default.series ?? 3, seg: e.default.seg ?? undefined, reps: e.default.seg ? undefined : e.default.reps }];
  });
  return {
    tipo: b.tipo === 'calentamiento' || b.tipo === 'enfriamiento' ? b.tipo : 'principal',
    titulo: textoVisible(b.tipo), vueltas: b.vueltas, min: b.min, items,
  };
}

export default function DetalleRutina({ route, navigation }: Props) {
  const {
    estado, ultimaVezDe, alternarFavorito, esFavorito, nuevaRutinaPropia, guardarRutinaPropia,
  } = useEstado();
  const r = rutinaPorId.get((route.params as { id: string }).id);
  const bloques = useMemo(() => (r ? r.bloques.map(vistaDeBloque).filter(b => b.items.length > 0) : []), [r]);
  if (!r) return null;

  const empezar = () => {
    const sesion = sesionDeRutina(r.id, estado.perfil, r, ultimaVezDe);
    navigation.navigate('Reproductor', { sesion });
  };

  // Las rutinas del catalogo no se editan directamente: se copian a una
  // rutina propia y esa copia sí se puede editar. `desdeCopia` solo le dice
  // al editor que cargue la barra con sus placas al abrirse.
  const duplicarYEditar = () => {
    const items = r.bloques
      .flatMap(b => b.items)
      .map(id => porId.get(id))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .map(itemPropioPorDefecto);
    const copia = nuevaRutinaPropia({ nombre: `${r.name} (copia)`, objetivo: r.goal, items, origen: r.id });
    guardarRutinaPropia(copia);
    navigation.navigate('EditorRutina', { id: copia.id, desdeCopia: true });
  };

  return (
    <PlantillaRutina
      nombre={nombreVisible(r.name)}
      foto={fuente('rutina', r.id)}
      favorito={esFavorito('rutinas', r.id)}
      onFavorito={() => alternarFavorito('rutinas', r.id)}
      onAtras={() => navigation.goBack()}
      meta={<MetadatosRutina minutos={r.min} objetivo={r.goal} nivel={r.level} silenciosa={r.modo_sin_saltos} />}
      antes={r.nota ? <Nota texto={textoVisible(r.nota)} /> : undefined}
      bloques={bloques}
      onAbrir={id => navigation.navigate('Ejercicio', { id })}
      despues={y => [
        estado.perfil.mostrarKcal ? (
          <BloqueRevela key="kcal" y={y} sinMovimiento fraccion={FRACCION_NOTA_PARA_ACTIVAR} estilo={s.nota}>
            {activo => <Entrada activo={activo}><NotaEstimacion kcal={r.kcal_aprox_70kg} /></Entrada>}
          </BloqueRevela>
        ) : null,
        <View key="acciones" style={s.acciones}>
          <BotonDuplicar texto="Duplicar y editar" onPress={duplicarYEditar} />
        </View>,
      ]}
      barraInferior={<BotonPlaca texto="Empezar esta rutina" aplauso onPress={empezar} />}
    />
  );
}

const s = StyleSheet.create({
  nota: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
  acciones: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24 },
});
