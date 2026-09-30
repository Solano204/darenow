import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { paleta, tipo, MARGEN_PANTALLA, esp } from '@/ui/theme';
import { sustituir, aItem, duracion, type ItemSesion } from '@/lib/engine/session';
import { useEstado } from '@/state/store';
import { useAjustesMaquina } from '@/state/maquina';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { TituloMascara } from '@/ui/fx/TituloMascara';
import { Entrada } from '@/ui/fx/Entrada';
import { TarjetaAjusteEjercicio } from './TarjetaAjusteEjercicio';
import { TotalPegajoso } from './TotalPegajoso';

const ESCALONADO_MS = 50;
const TARJETAS_ANIMADAS = 4;
const INDICE_TOTAL = 1;

function esMaquina(e: ItemSesion): boolean {
  return e.equipment.some(q =>
    ['polea', 'maquina_jalon', 'prensa', 'maquina_pecho', 'maquina_femoral', 'remo_maquina'].includes(q));
}

/**
 * Revisar y ajustar la rutina antes de empezar.
 *
 * Series, repeticiones (o tiempo si el ejercicio es por tiempo) y
 * descanso quedan fijos aqui, una sola vez: el reproductor ya no pregunta
 * nada de esto durante la sesion, asi que la vista de cada ejercicio se
 * queda solo con el nombre, el numero y el video.
 */
export function EditorAntesDeEmpezar({ items, onConfirmar }: {
  items: ItemSesion[]; onConfirmar: (items: ItemSesion[]) => void;
}) {
  const [lista, setLista] = useState<ItemSesion[]>(items);
  const [ajustesMaquina, guardarAjusteMaquina] = useAjustesMaquina();
  const { estado: app } = useEstado();

  const actualizar = (i: number, cambio: Partial<ItemSesion>) =>
    setLista(prev => prev.map((it, n) => (n === i ? { ...it, ...cambio } : it)));

  // Cambiar de ejercicio va aqui, antes de arrancar, no durante la sesion:
  // es la unica pantalla donde el usuario ya esta ajustando numeros, tiene
  // sentido que tambien decida aqui que ejercicio hace. Solo afecta a esta
  // sesion, igual que los ajustes de series/reps/descanso de aqui arriba.
  const cambiarEjercicio = (i: number) => {
    const it = lista[i];
    const nuevo = sustituir(app.perfil, it.id, lista.map(x => x.id));
    if (!nuevo) { Alert.alert('Sin alternativa', 'No encontramos otro ejercicio que sirva aquí.'); return; }
    setLista(prev => prev.map((x, n) => (n === i ? { ...aItem(nuevo, x.bloque), seriesPlan: x.seriesPlan } : x)));
  };

  // Se recalcula con cada ajuste: el usuario ve de inmediato como cambia
  // la duracion total al mover series, tiempo/reps o descanso.
  const minutos = useMemo(
    () => Math.max(1, Math.round(lista.reduce((s, it) => s + duracion(it), 0) / 60)),
    [lista],
  );

  return (
    <SafeAreaView style={s.raiz}>
      <GomaTexture />
      <KeyboardAvoidingView style={s.raiz} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={s.raiz} contentContainerStyle={s.contenido}
          stickyHeaderIndices={[INDICE_TOTAL]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        >
          <View style={s.cabeza}>
            <TituloMascara texto="Tu rutina de hoy" estilo={s.titulo} activo />
            <Entrada activo retraso={200} y={8}>
              <Text style={s.subtitulo}>
                Ajusta series, {items.some(i => i.segPlan != null) ? 'tiempo' : 'repeticiones'} y descanso
                de cada ejercicio antes de empezar.
              </Text>
            </Entrada>
          </View>

          <TotalPegajoso minutos={minutos} />

          <View style={s.tarjetas}>
            {lista.map((it, i) => (
              <TarjetaAjusteEjercicio
                key={`${it.id}_${i}`} item={it} indice={i}
                animar={i < TARJETAS_ANIMADAS} retraso={i * ESCALONADO_MS}
                onCambiar={() => cambiarEjercicio(i)}
                onAjuste={cambio => actualizar(i, cambio)}
                maquina={esMaquina(it)
                  ? { valor: ajustesMaquina[it.id] ?? '', onGuardar: t => guardarAjusteMaquina(it.id, t) }
                  : undefined}
              />
            ))}
          </View>
        </ScrollView>

        <View style={s.pie}>
          <BotonPlaca texto="Empezar rutina" onPress={() => onConfirmar(lista)} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  contenido: { paddingBottom: esp.lg },
  cabeza: { paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.md, paddingBottom: esp.sm, backgroundColor: paleta.goma },
  titulo: { ...tipo.display, fontSize: 40, lineHeight: 40, color: paleta.magnesia },
  subtitulo: { ...tipo.cuerpo, color: paleta.magnesia2, marginTop: esp.sm },
  tarjetas: { paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.md, gap: 12 },
  pie: {
    paddingHorizontal: MARGEN_PANTALLA, paddingTop: 12, paddingBottom: 12,
    backgroundColor: paleta.goma, borderTopWidth: 1, borderTopColor: paleta.gomaBorde,
  },
});
