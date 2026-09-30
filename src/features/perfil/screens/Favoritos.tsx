/**
 * FORJA · favoritos
 *
 * Todo lo que el usuario guardo, en un solo sitio y por tipo. Cada bloque
 * es un carrusel; si un tipo esta vacio, ni siquiera aparece. Nada de
 * secciones que dicen "aun no tienes nada aqui" cinco veces seguidas.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, tipo, esp } from '@/ui/theme';
import { Seccion, Boton, useHuecoAbajo } from '@/ui/components';
import Carrusel from '@/features/perfil/components/Carrusel';
import { useEstado, imagenRutina } from '@/state/store';
import {
  porId, musculoPorId, rutinaPorId, programaPorId, TIPS, salaPorId,
} from '@/data/catalog';

export default function Favoritos({ navigation }: any) {
  const abajo = useHuecoAbajo();
  const { estado, alternarFavorito } = useEstado();
  const f = estado.favoritos;
  const total = Object.values(f).reduce((n, a) => n + a.length, 0);

  const tipPorId = useMemo(() => new Map(TIPS.map(t => [t.id, t])), []);

  if (total === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
        <View style={{ padding: esp.md, flex: 1, justifyContent: 'center' }}>
          <Text style={[tipo.h1, { color: color.texto, textAlign: 'center' }]}>Sin favoritos</Text>
          <Text style={[tipo.cuerpo, { color: color.textoSuave, textAlign: 'center', marginTop: esp.sm }]}>
            Toca la estrella en cualquier ejercicio, músculo, rutina, programa o tip
            y aparece aquí.
          </Text>
          <Boton texto="Ir a explorar" onPress={() => navigation.navigate('Tabs', { screen: 'Explorar' })}
            estilo={{ marginTop: esp.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: abajo }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: esp.md, paddingTop: esp.md }}>
          <Text style={[tipo.h1, { color: color.texto }]}>Favoritos</Text>
          <Text style={[tipo.pie, { color: color.textoSuave }]}>{total} guardados</Text>
        </View>

        {f.ejercicios.length > 0 && (
          <Seccion titulo="Ejercicios" estilo={{ paddingLeft: esp.md }}>
            <Carrusel
              items={f.ejercicios.map(id => ({
                id, titulo: porId.get(id)?.name ?? id,
                sub: porId.get(id)?.category, favorito: true,
              }))}
              tipoFoto="ejercicio" forma="baja" textoVerMas="Explorar"
              onItem={id => navigation.navigate('Ejercicio', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'ejercicios' } })}
              onFavorito={id => alternarFavorito('ejercicios', id)}
            />
          </Seccion>
        )}

        {f.musculos.length > 0 && (
          <Seccion titulo="Músculos" estilo={{ paddingLeft: esp.md }}>
            <Carrusel
              items={f.musculos.map(id => ({ id, titulo: musculoPorId.get(id)?.name ?? id }))}
              tipoFoto="musculo" forma="circulo" textoVerMas="Explorar"
              onItem={id => navigation.navigate('Musculo', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } })}
            />
          </Seccion>
        )}

        {f.rutinas.length > 0 && (
          <Seccion titulo="Rutinas" estilo={{ paddingLeft: esp.md }}>
            <Carrusel
              items={f.rutinas.map(id => {
                const mia = estado.rutinasPropias.find(x => x.id === id);
                return {
                  id,
                  imagenId: mia ? imagenRutina(mia.id, mia.imagenId) : undefined,
                  titulo: mia?.nombre ?? rutinaPorId.get(id)?.name ?? id,
                  sub: mia ? 'Mi rutina' : `${rutinaPorId.get(id)?.min ?? ''} min`,
                  favorito: true,
                };
              })}
              tipoFoto="rutina" forma="alta" textoVerMas="Explorar"
              onItem={id => navigation.navigate(
                id.startsWith('mi_') ? 'RutinaPropia' : 'Rutina', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'rutinas' } })}
              onFavorito={id => alternarFavorito('rutinas', id)}
            />
          </Seccion>
        )}

        {f.programas.length > 0 && (
          <Seccion titulo="Programas" estilo={{ paddingLeft: esp.md }}>
            <Carrusel
              items={f.programas.map(id => ({
                id, titulo: programaPorId.get(id)?.name ?? id,
                sub: `${programaPorId.get(id)?.semanas ?? ''} semanas`, favorito: true,
              }))}
              tipoFoto="programa" forma="alta" textoVerMas="Explorar"
              onItem={id => navigation.navigate('Programa', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'programas' } })}
              onFavorito={id => alternarFavorito('programas', id)}
            />
          </Seccion>
        )}

        {f.tips.length > 0 && (
          <Seccion titulo="Para leer" estilo={{ paddingLeft: esp.md }}>
            <Carrusel
              items={f.tips.map(id => ({
                id, titulo: tipPorId.get(id)?.titulo ?? id,
                sub: salaPorId.get(tipPorId.get(id)?.sala ?? '')?.name, favorito: true,
              }))}
              tipoFoto="tip" forma="alta" textoVerMas="Aprender"
              onItem={id => navigation.navigate('Tip', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Aprender' })}
              onFavorito={id => alternarFavorito('tips', id)}
            />
          </Seccion>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
