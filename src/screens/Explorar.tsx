/**
 * FORJA · Explorar
 *
 * Cambios importantes frente a la version anterior:
 * - Cada fila lleva la foto del ejercicio a la izquierda. Antes habia un
 *   cuadro con tres letras de la categoria, que no ayudaba a nadie.
 * - Fuera la insignia de evidencia en la lista. El veredicto (Comprobado,
 *   Parcial, Mito) es una conclusion que necesita su explicacion al lado;
 *   ponerla suelta junto a un nombre solo genera desconfianza sin contexto.
 *   Ahora vive dentro de la ficha, donde esta la nota que la sostiene.
 * - El muro de descarga aparece al pedir el catalogo completo sin conexion.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, peso } from '../theme';
import {
  Chip, Buscador, Vacio, Toque, Favorito, Aparece, Boton, Nota,
  useHuecoAbajo,
} from '../components/ui';
import Foto from '../components/Foto';
import { minutosPropios } from '../engine/session';
import { MuroCategoria, Intersticial } from '../components/Anuncio';
import Vidrio from '../components/Vidrio';
import {
  EJERCICIOS, RUTINAS, PROGRAMAS, MUSCULOS, CATEGORIAS, GOALS,
  nombreEquipo, nombreGoal, type Ejercicio,
} from '../data/catalog';
import { useEstado, imagenRutina } from '../store/store';

type Tab = 'ejercicios' | 'rutinas' | 'programas' | 'musculos';

const TABS: [Tab, string][] = [
  ['ejercicios', 'Ejercicios'], ['rutinas', 'Rutinas'],
  ['programas', 'Programas'], ['musculos', 'Músculos'],
];

export default function Explorar({ navigation, route }: any) {
  const abajo = useHuecoAbajo();
  const { estado, alternarFavorito, esFavorito, registrarDescarga } = useEstado();
  const [tab, setTab] = useState<Tab>(route?.params?.tab ?? 'ejercicios');

  // La pestana ya montada ignoraba el parametro nuevo, asi que "Ver todas"
  // desde programas siempre acababa en ejercicios. Ahora se escucha el
  // cambio de parametros.
  React.useEffect(() => {
    const t = route?.params?.tab as Tab | undefined;
    if (t && t !== tab) setTab(t);
  }, [route?.params?.tab]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [soloMios, setSoloMios] = useState(true);
  const [verAnuncio, setVerAnuncio] = useState(false);

  const equipoDisp = useMemo(
    () => new Set([...estado.perfil.equipo, 'ninguno', 'pared', 'silla']),
    [estado.perfil.equipo],
  );
  const contra = useMemo(() => new Set(estado.perfil.contra), [estado.perfil.contra]);
  const desbloqueada = estado.descargas.includes(tab);

  const ejercicios = useMemo(() => {
    const t = q.trim().toLowerCase();
    return EJERCICIOS.filter(e => {
      if (t && !(
        e.name.toLowerCase().includes(t) ||
        (e.name_en ?? '').toLowerCase().includes(t) ||
        (e.aliases ?? []).some(a => a.toLowerCase().includes(t))
      )) return false;
      if (cat && e.category !== cat) return false;
      if (goal && !e.goals.includes(goal)) return false;
      if (soloMios) {
        if (e.contra.some(c => contra.has(c))) return false;
        if (!e.equipment.every(x => equipoDisp.has(x))) return false;
        if (estado.perfil.modoSinSaltos && (e.impact >= 2 || e.noise >= 2)) return false;
      }
      return true;
    });
  }, [q, cat, goal, soloMios, equipoDisp, contra, estado.perfil.modoSinSaltos]);

  const rutinas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return RUTINAS.filter(r => (!t || r.name.toLowerCase().includes(t)) && (!goal || r.goal === goal));
  }, [q, goal]);

  const programas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PROGRAMAS.filter(p => (!t || p.name.toLowerCase().includes(t)) && (!goal || p.goal === goal));
  }, [q, goal]);

  const musculos = useMemo(() => {
    const t = q.trim().toLowerCase();
    return MUSCULOS.filter(m => !t || m.name.toLowerCase().includes(t) || m.group.toLowerCase().includes(t));
  }, [q]);

  const cuantos = { ejercicios: ejercicios.length, rutinas: rutinas.length,
    programas: programas.length, musculos: musculos.length }[tab];

  // Referencias estables: si no, cada tecla en el buscador crea una funcion
  // nueva por fila y invalida el memo de FilaEjercicio para las 190 filas.
  const onPressEjercicio = useCallback(
    (id: string) => navigation.navigate('Ejercicio', { id }), [navigation]);
  const onFavEjercicio = useCallback(
    (id: string) => alternarFavorito('ejercicios', id), [alternarFavorito]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top']}>
      <View style={{ paddingHorizontal: esp.md, paddingBottom: esp.sm }}>
        <Text style={[tipo.h1, { color: color.texto, marginBottom: esp.sm }]}>Explorar</Text>
        <Buscador valor={q} onCambio={setQ} placeholder="Buscar ejercicio, rutina, músculo" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: esp.xs, paddingVertical: esp.sm }}>
          {TABS.map(([id, txt]) => (
            <Chip key={id} texto={txt} activo={tab === id}
              onPress={() => setTab(id)} />
          ))}
        </ScrollView>

        {tab === 'ejercicios' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: esp.xs, paddingBottom: esp.sm }}>
            {[{ id: null, nombre: 'Todo' }, ...CATEGORIAS].map((c, i) => (
              <Chip key={i} texto={c.nombre} pequeno activo={cat === c.id}
                onPress={() => setCat(c.id as string | null)} />
            ))}
          </ScrollView>
        )}

        {tab !== 'musculos' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: esp.xs, paddingBottom: esp.sm }}>
            {[{ id: null, nombre: 'Cualquier objetivo' }, ...GOALS].map((g, i) => (
              <Chip key={i} texto={g.nombre} pequeno activo={goal === g.id}
                onPress={() => setGoal(goal === g.id ? null : (g.id as string))} />
            ))}
          </ScrollView>
        )}

        <View style={s.barraEstado}>
          <Text style={[tipo.pie, { color: color.textoSuave }]}>
            {cuantos} {tab}
          </Text>
          <View style={{ flexDirection: 'row', gap: esp.sm }}>
            {tab === 'ejercicios' && (
              <>
                <Chip texto="Lo que puedo hacer" pequeno
                  activo={soloMios} onPress={() => setSoloMios(true)} />
                <Chip texto="Catálogo completo" pequeno
                  activo={!soloMios} onPress={() => setSoloMios(false)} />
              </>
            )}
            {desbloqueada && <Chip texto="Sin conexión ✓" pequeno activo />}
          </View>
        </View>
      </View>

      {tab === 'ejercicios' && (
        <FlatList
          data={ejercicios}
          keyExtractor={e => e.id}
          contentContainerStyle={{ paddingHorizontal: esp.md, paddingBottom: abajo }}
          ListEmptyComponent={<Vacio texto="Nada con esos filtros. Prueba a quitar alguno." />}
          initialNumToRender={12}
          renderItem={({ item, index }) => (
            <Aparece retraso={Math.min(index, 8) * 25}>
              <FilaEjercicio
                e={item}
                favorito={esFavorito('ejercicios', item.id)}
                onFav={onFavEjercicio}
                onPress={onPressEjercicio}
              />
            </Aparece>
          )}
        />
      )}

      {tab === 'rutinas' && (
        <FlatList
          data={rutinas}
          keyExtractor={r => r.id}
          contentContainerStyle={{ paddingHorizontal: esp.md, paddingBottom: abajo }}
          ListEmptyComponent={<Vacio texto="Sin rutinas con ese filtro." />}
          ListHeaderComponent={
            <View style={{ marginBottom: esp.md }}>
              <Boton texto="Crear mi rutina" variante="contorno"
                onPress={() => navigation.navigate('EditorRutina')} />

              {estado.rutinasPropias.length > 0 && (
                <>
                  <Text style={[tipo.h3, { color: color.texto, marginTop: esp.md, marginBottom: esp.sm }]}>
                    Mis rutinas ({estado.rutinasPropias.length})
                  </Text>
                  {estado.rutinasPropias.map(mr => (
                    <Toque key={mr.id} onPress={() => navigation.navigate('RutinaPropia', { id: mr.id })}
                      estilo={s.filaPropia as never}>
                      <Foto tipo="rutina" id={imagenRutina(mr.id, mr.imagenId)} nombre={mr.nombre} alto={54} ancho={54} />
                      <View style={{ flex: 1 }}>
                        <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]} numberOfLines={1}>
                          {mr.nombre}
                        </Text>
                        <Text style={[tipo.pie, { color: color.textoSuave }]}>
                          {mr.items.length} ejercicios · {minutosPropios(mr.items)} min
                        </Text>
                      </View>
                      <Text style={{ color: color.textoTenue }}>›</Text>
                    </Toque>
                  ))}
                  <Text style={[tipo.h3, { color: color.texto, marginTop: esp.lg, marginBottom: esp.sm }]}>
                    Del catálogo
                  </Text>
                </>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <Aparece retraso={Math.min(index, 8) * 25}>
              <Toque onPress={() => navigation.navigate('Rutina', { id: item.id })} estilo={s.tarjetaAncha as never}>
                <Foto tipo="rutina" id={item.id} nombre={item.name} alto={170} ancho="100%" forma="tarjeta" />
                <View style={s.favSobre}>
                  <Favorito activo={esFavorito('rutinas', item.id)}
                    onPress={() => alternarFavorito('rutinas', item.id)} sobreFoto tamano={34} />
                </View>
                <View style={{ padding: esp.sm, gap: 4 }}>
                  <Text style={[tipo.h3, { color: color.texto }]}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', gap: esp.xs, flexWrap: 'wrap' }}>
                    <Chip texto={`${item.min} min`} pequeno />
                    <Chip texto={nombreGoal(item.goal)} pequeno />
                    <Chip texto={`Nivel ${item.level}`} pequeno />
                    {item.modo_sin_saltos && <Chip texto="Silenciosa" pequeno />}
                  </View>
                </View>
              </Toque>
            </Aparece>
          )}
        />
      )}

      {tab === 'programas' && (
        <FlatList
          data={programas}
          keyExtractor={p => p.id}
          contentContainerStyle={{ paddingHorizontal: esp.md, paddingBottom: abajo }}
          renderItem={({ item, index }) => (
            <Aparece retraso={Math.min(index, 8) * 25}>
              <Toque onPress={() => navigation.navigate('Programa', { id: item.id })} estilo={s.tarjetaAncha as never}>
                <Foto tipo="programa" id={item.id} nombre={item.name} alto={170} ancho="100%" forma="tarjeta" />
                <View style={s.favSobre}>
                  <Favorito activo={esFavorito('programas', item.id)}
                    onPress={() => alternarFavorito('programas', item.id)} sobreFoto tamano={34} />
                </View>
                <View style={{ padding: esp.sm, gap: 4 }}>
                  <Text style={[tipo.h3, { color: color.texto }]}>{item.name}</Text>
                  <Text style={[tipo.pie, { color: color.textoSuave }]} numberOfLines={2}>{item.desc}</Text>
                  <View style={{ flexDirection: 'row', gap: esp.xs, flexWrap: 'wrap' }}>
                    <Chip texto={`${item.semanas} semanas`} pequeno />
                    <Chip texto={`${item.dias_semana} días/sem`} pequeno />
                    <Chip texto={`${item.min_sesion} min`} pequeno />
                  </View>
                </View>
              </Toque>
            </Aparece>
          )}
        />
      )}

      {tab === 'musculos' && (
        <FlatList
          data={musculos}
          keyExtractor={m => m.id}
          numColumns={3}
          columnWrapperStyle={{ gap: esp.sm }}
          contentContainerStyle={{ paddingHorizontal: esp.md, paddingBottom: esp.xl * 2.4, gap: esp.md }}
          renderItem={({ item, index }) => (
            <Aparece retraso={Math.min(index, 9) * 25} estilo={{ flex: 1 }}>
              <Toque onPress={() => navigation.navigate('Musculo', { id: item.id })}
                estilo={{ alignItems: 'center' } as never}>
                <Foto tipo="musculo" id={item.id} nombre={item.name} alto={92} forma="circulo" />
                <Text style={[tipo.pie, { color: color.texto, textAlign: 'center', marginTop: 6 }]}
                  numberOfLines={2}>{item.name}</Text>
              </Toque>
            </Aparece>
          )}
        />
      )}
      {/* Desbloqueo por categoria: se ve la lista detras del vidrio, que es
          justo lo que motiva a abrirla, pero no se puede usar todavia. */}
      <MuroCategoria
        visible={!desbloqueada}
        categoria={TABS.find(([id]) => id === tab)![1].toLowerCase()}
        cuantos={cuantos}
        onVerAnuncio={() => setVerAnuncio(true)}
        onVolver={() => navigation.navigate('Hoy')}
      />

      <Intersticial
        visible={verAnuncio}
        motivo="desbloqueando contenido"
        onCerrar={() => { setVerAnuncio(false); registrarDescarga(tab); }}
      />
    </SafeAreaView>
  );
}

/**
 * Fila de ejercicio: foto, nombre, equipo y favorito.
 * Sin insignia de evidencia: esa va en la ficha, junto a su explicacion.
 *
 * Memoizada: con 190 filas, cada tecla en el buscador re-renderiza
 * `Explorar`, y sin esto React tendria que reconciliar las 190 aunque
 * ninguna haya cambiado. `onFav`/`onPress` son referencias estables desde
 * el padre (toman el id como argumento) para que el memo sirva de algo.
 */
const FilaEjercicio = React.memo(function FilaEjercicio({ e, favorito, onFav, onPress }: {
  e: Ejercicio; favorito: boolean; onFav: (id: string) => void; onPress: (id: string) => void;
}) {
  return (
    <View style={s.fila}>
      <Toque onPress={() => onPress(e.id)} estilo={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: esp.sm } as never}>
        <Foto tipo="ejercicio" id={e.id} nombre={e.name} alto={58} ancho={58} />
        <View style={{ flex: 1 }}>
          <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]} numberOfLines={1}>
            {e.name}
          </Text>
          <Text style={[tipo.pie, { color: color.textoSuave }]} numberOfLines={1}>
            {nombreEquipo(e.equipment)} · nivel {e.level}
          </Text>
        </View>
      </Toque>
      <Favorito activo={favorito} onPress={() => onFav(e.id)} tamano={34} />
    </View>
  );
});

const s = StyleSheet.create({
  barraEstado: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: esp.xs,
  },
  fila: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm,
    paddingVertical: esp.sm, borderBottomWidth: 1, borderBottomColor: color.borde,
  },
  tarjetaAncha: {
    backgroundColor: color.fondo, borderRadius: radio.tarjeta,
    borderWidth: 1, borderColor: color.borde, overflow: 'hidden', marginBottom: esp.sm,
  },
  favSobre: { position: 'absolute', top: esp.sm, right: esp.sm },
  filaPropia: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm, paddingVertical: esp.sm,
    borderBottomWidth: 1, borderBottomColor: color.borde,
  },
});
