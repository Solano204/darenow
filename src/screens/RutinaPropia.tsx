/**
 * FORJA · ficha de rutina propia
 *
 * Igual que la de una rutina del catalogo (misma plantilla: `PlantillaRutina`), pero con los
 * numeros que puso el usuario y con editar, duplicar y borrar. Una rutina propia no tiene
 * bloques: es un solo bloque plano, y su perfil es una meseta.
 *
 * Los avisos aparecen arriba y no bloquean: la rutina es suya.
 */

import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paleta, familia, haptico, MARGEN_PANTALLA } from '@/theme';
import { Nota } from '@/components/ui';
import { BotonPlaca } from '@/components/ui/BotonPlaca';
import { BotonSecundario } from '@/components/ui/BotonSecundario';
import { PlantillaRutina } from '@/components/routine-detail/PlantillaRutina';
import { MetadatosRutina } from '@/components/routine-detail/MetadatosRutina';
import { BotonDuplicar } from '@/components/routine-detail/BotonDuplicar';
import type { BloqueVista } from '@/components/routine-detail/RielBloques';
import { useEstado, imagenRutina, type RutinaPropia as Propia } from '@/store/store';
import { sesionDePropia, minutosPropios, revisarPropia } from '@/engine/session';
import { porId } from '@/data/catalog';
import { fuente } from '@/media/registry';

type Props = NativeStackScreenProps<ParamListBase, 'RutinaPropia'>;

/** La rutina propia como un solo bloque plano; los ejercicios que ya no existen en el catalogo se omiten. */
function vistaDePropia(r: Propia, minutos: number): BloqueVista {
  const items = r.items.flatMap(it => {
    const e = porId.get(it.ejercicioId);
    if (!e) return [];
    return [{
      id: e.id, series: it.series, seg: it.seg, reps: it.seg ? undefined : it.reps,
      porLado: !!(e.unilateral || e.measure === 'reps_por_lado'), descansoS: it.descansoS,
    }];
  });
  return { tipo: 'plano', titulo: 'Ejercicios', min: minutos, items };
}

export default function RutinaPropia({ route, navigation }: Props) {
  const inset = useSafeAreaInsets();
  const {
    estado, ultimaVezDe, borrarRutinaPropia, guardarRutinaPropia,
    nuevaRutinaPropia, alternarFavorito, esFavorito,
  } = useEstado();

  const r = estado.rutinasPropias.find(x => x.id === (route.params as { id: string }).id);
  const minutos = useMemo(() => (r ? minutosPropios(r.items) : 0), [r]);
  const avisos = useMemo(
    () => (r ? revisarPropia(r.items, estado.perfil) : []),
    [r, estado.perfil],
  );
  const bloques = useMemo(() => (r ? [vistaDePropia(r, minutos)] : []), [r, minutos]);

  if (!r) {
    return (
      <View style={[s.vacio, { paddingTop: inset.top + 24 }]}>
        <Text style={s.vacioTexto}>Esta rutina ya no existe.</Text>
        <BotonSecundario texto="Volver" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const empezar = () =>
    navigation.navigate('Reproductor', {
      sesion: sesionDePropia(r, estado.perfil, ultimaVezDe),
    });

  const duplicar = () => {
    const copia = nuevaRutinaPropia({
      nombre: `${r.nombre} (copia)`,
      objetivo: r.objetivo,
      items: r.items,
      origen: r.id,
    });
    guardarRutinaPropia(copia);
    navigation.replace('RutinaPropia', { id: copia.id });
  };

  const borrar = () =>
    Alert.alert('Borrar rutina', `Se elimina "${r.nombre}". No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar', style: 'destructive',
        onPress: () => { borrarRutinaPropia(r.id); navigation.goBack(); },
      },
    ]);

  const series = r.items.reduce((a, x) => a + x.series, 0);

  return (
    <PlantillaRutina
      nombre={r.nombre}
      foto={fuente('rutina', imagenRutina(r.id, r.imagenId))}
      favorito={esFavorito('rutinas', r.id)}
      onFavorito={() => alternarFavorito('rutinas', r.id)}
      onAtras={() => navigation.goBack()}
      junto={(
        <Pressable
          onPress={() => { haptico.toque(); navigation.navigate('EditorRutina', { id: r.id }); }}
          accessibilityRole="button" accessibilityLabel="Editar rutina" hitSlop={4} style={s.lapiz}
        >
          <Ionicons name="pencil-outline" size={20} color={paleta.magnesia2} />
        </Pressable>
      )}
      meta={(
        <View style={s.meta}>
          <MetadatosRutina propia minutos={minutos} objetivo={r.objetivo} ejercicios={r.items.length} series={series} />
          <Text style={s.fecha}>
            Creada el {r.creada}
            {r.editada !== r.creada ? ` · editada el ${r.editada}` : ''}
          </Text>
        </View>
      )}
      antes={avisos.length > 0 ? avisos.map((a, i) => (
        <Nota key={i} texto={a} tono="cuidado" titulo={i === 0 ? 'Revisa' : undefined} />
      )) : undefined}
      bloques={bloques}
      onAbrir={id => navigation.navigate('Ejercicio', { id })}
      despues={() => (
        <View style={s.acciones}>
          <BotonDuplicar texto="Duplicar" onPress={duplicar} />
          <Pressable
            onPress={() => { haptico.toque(); borrar(); }}
            accessibilityRole="button" accessibilityLabel="Borrar rutina" style={s.borrar}
          >
            <Text style={s.borrarTexto} maxFontSizeMultiplier={1.15}>Borrar rutina</Text>
          </Pressable>
        </View>
      )}
      barraInferior={<BotonPlaca texto="Empezar" aplauso onPress={empezar} />}
    />
  );
}

const s = StyleSheet.create({
  vacio: { flex: 1, backgroundColor: paleta.goma, paddingHorizontal: MARGEN_PANTALLA, gap: 24 },
  vacioTexto: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 24, color: paleta.magnesia2 },
  lapiz: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  meta: { gap: 8 },
  fecha: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto },
  acciones: { marginHorizontal: MARGEN_PANTALLA, marginTop: 24, gap: 8 },
  borrar: { height: 44, alignItems: 'center', justifyContent: 'center' },
  borrarTexto: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.placaRojaTexto },
});
