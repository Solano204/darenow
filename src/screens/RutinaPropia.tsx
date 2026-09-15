/**
 * FORJA · ficha de rutina propia
 *
 * Igual que la de una rutina del catalogo, pero con los numeros que puso el
 * usuario y con editar, duplicar y borrar.
 *
 * Los avisos aparecen arriba y no bloquean: la rutina es suya.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, peso } from '../theme';
import {
  Boton, Chip, Toque, Nota, Favorito, Aparece, useHuecoAbajo,
} from '../components/ui';
import Foto from '../components/Foto';
import { useEstado, imagenRutina } from '../store/store';
import { sesionDePropia, minutosPropios, revisarPropia } from '../engine/session';
import { porId, nombreGoal } from '../data/catalog';

export default function RutinaPropia({ route, navigation }: any) {
  const abajo = useHuecoAbajo();
  const {
    estado, ultimaVezDe, borrarRutinaPropia, guardarRutinaPropia,
    nuevaRutinaPropia, alternarFavorito, esFavorito,
  } = useEstado();

  const r = estado.rutinasPropias.find(x => x.id === route.params.id);
  const minutos = useMemo(() => (r ? minutosPropios(r.items) : 0), [r]);
  const avisos = useMemo(
    () => (r ? revisarPropia(r.items, estado.perfil) : []),
    [r, estado.perfil],
  );

  if (!r) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
        <View style={{ padding: esp.md }}>
          <Text style={[tipo.cuerpo, { color: color.textoSuave }]}>
            Esta rutina ya no existe.
          </Text>
        </View>
      </SafeAreaView>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: abajo + 70 }}
        showsVerticalScrollIndicator={false}>
        <View>
          <Foto tipo="rutina" id={imagenRutina(r.id, r.imagenId)} nombre={r.nombre} alto={200} ancho="100%" forma="tarjeta" />
          <View style={s.favPortada}>
            <Favorito activo={esFavorito('rutinas', r.id)}
              onPress={() => alternarFavorito('rutinas', r.id)} tamano={44} sobreFoto />
          </View>
          <View style={s.etiquetaMia}>
            <Text style={[tipo.micro, { color: color.sobreOscuro }]}>MÍA</Text>
          </View>
        </View>

        <View style={{ padding: esp.md }}>
          <Text style={[tipo.h1, { color: color.texto }]}>{r.nombre}</Text>
          <View style={{ flexDirection: 'row', gap: esp.xs, flexWrap: 'wrap', marginTop: esp.sm }}>
            <Chip texto={nombreGoal(r.objetivo)} activo pequeno />
            <Chip texto={`${minutos} min`} pequeno />
            <Chip texto={`${r.items.length} ejercicios`} pequeno />
            <Chip texto={`${series} series`} pequeno />
          </View>
          <Text style={[tipo.pie, { color: color.textoTenue, marginTop: esp.xs }]}>
            Creada el {r.creada}
            {r.editada !== r.creada ? ` · editada el ${r.editada}` : ''}
          </Text>

          {avisos.map((a, i) => (
            <View key={i} style={{ marginTop: esp.md }}>
              <Nota texto={a} tono="cuidado" titulo={i === 0 ? 'Revisa' : undefined} />
            </View>
          ))}

          <Text style={[tipo.h2, { color: color.texto, marginTop: esp.lg, marginBottom: esp.sm }]}>
            Ejercicios
          </Text>

          {r.items.map((it, i) => {
            const e = porId.get(it.ejercicioId);
            if (!e) return null;
            const porLado = e.unilateral || e.measure === 'reps_por_lado';
            return (
              <Aparece key={`${it.ejercicioId}-${i}`} retraso={Math.min(i, 6) * 25}>
                <Toque onPress={() => navigation.navigate('Ejercicio', { id: e.id })}
                  estilo={s.fila as never}>
                  <Text style={[tipo.micro, { color: color.textoTenue, width: 18 }]}>{i + 1}</Text>
                  <Foto tipo="ejercicio" id={e.id} nombre={e.name} alto={52} ancho={52} />
                  <View style={{ flex: 1 }}>
                    <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text style={[tipo.pie, { color: color.textoSuave }]}>
                      {it.series} × {it.seg ? `${it.seg} s` : it.reps}
                      {porLado ? ' por lado' : ''} · {it.descansoS} s de descanso
                    </Text>
                  </View>
                  <Text style={{ color: color.textoTenue }}>›</Text>
                </Toque>
              </Aparece>
            );
          })}

          <View style={{ flexDirection: 'row', gap: esp.sm, marginTop: esp.lg }}>
            <Boton texto="Editar" variante="contorno" estilo={{ flex: 1 }}
              onPress={() => navigation.navigate('EditorRutina', { id: r.id })} />
            <Boton texto="Duplicar" variante="contorno" estilo={{ flex: 1 }} onPress={duplicar} />
          </View>
          <Boton texto="Borrar rutina" variante="texto" onPress={borrar} />
        </View>
      </ScrollView>

      <View style={[s.barra, { paddingBottom: Math.max(esp.md, abajo - 60) }]}>
        <Boton texto="Empezar" onPress={empezar} estilo={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  favPortada: { position: 'absolute', top: esp.md, right: esp.md },
  etiquetaMia: {
    position: 'absolute', top: esp.md, left: esp.md,
    backgroundColor: color.carbon, borderRadius: radio.pastilla,
    paddingVertical: 5, paddingHorizontal: 11,
  },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm,
    paddingVertical: esp.sm, borderBottomWidth: 1, borderBottomColor: color.borde,
  },
  barra: {
    flexDirection: 'row', padding: esp.md,
    borderTopWidth: 1, borderTopColor: color.borde, backgroundColor: color.fondo,
  },
});
