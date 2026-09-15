/**
 * FORJA · fichas de detalle
 *
 * Ejercicio, musculo, rutina y programa.
 *
 * Cambios: foto de portada en todas, carrusel circular de musculos dentro
 * del ejercicio, listas de rutina y programa con la foto de cada ejercicio,
 * favorito en la cabecera, y ni un solo borde grueso a la izquierda de un
 * texto. Los bloques destacados son tarjetas con fondo tenido.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { color, tipo, esp, radio, insignia, degradado, sombra, peso } from '../theme';
import {
  Tarjeta, Chip, Insignia, Boton, Seccion, Nota, Fila, Toque, Favorito, Aparece,
  useHuecoAbajo,
} from '../components/ui';
import Foto from '../components/Foto';
import Clip from '../components/Clip';
import Carrusel from '../components/Carrusel';
import {
  porId, musculoPorId, familiaPorId, rutinaPorId, programaPorId, EJERCICIOS,
  evidenciaDe, insigniaDe, nombreEquipo, nombreGoal,
} from '../data/catalog';
import { useEstado } from '../store/store';
import { sesionDeRutina } from '../engine/session';

/* ============================================================ EJERCICIO */

export function DetalleEjercicio({ route, navigation }: any) {
  const abajo = useHuecoAbajo();
  const e = porId.get(route.params.id);
  const { estado, alternarVeto, alternarFavorito, esFavorito } = useEstado();
  if (!e) return null;

  const { mapa, nota } = evidenciaDe(e);
  const fam = familiaPorId.get(e.family);
  const vetado = estado.perfil.vetos.includes(e.id);
  const bloqueado = e.contra.some(c => estado.perfil.contra.includes(c));
  // Principales primero (el orden real: son los que mas carga el ejercicio),
  // acotado a 4 como todo carrusel de la app — sin esto, un ejercicio con
  // varios musculos secundarios desbordaba la fila sin limite ni "ver mas".
  const musculos = [...e.primary, ...e.secondary]
    .map(id => musculoPorId.get(id)).filter(Boolean).slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: abajo }} showsVerticalScrollIndicator={false}>
        {/* Portada */}
        <View>
          <Clip id={e.id} nombre={e.name} alto={230} ancho="100%" forma="tarjeta" mostrarRuta />
          <View style={s.favPortada}>
            <Favorito activo={esFavorito('ejercicios', e.id)}
              onPress={() => alternarFavorito('ejercicios', e.id)} sobreFoto tamano={44} />
          </View>
        </View>

        <View style={{ padding: esp.md }}>
          <Aparece>
            <Text style={[tipo.h1, { color: color.texto }]}>{e.name}</Text>
            {e.name_en && <Text style={[tipo.pie, { color: color.textoTenue }]}>{e.name_en}</Text>}

            <View style={{ flexDirection: 'row', gap: esp.xs, flexWrap: 'wrap', marginTop: esp.sm }}>
              <Chip texto={`Nivel ${e.level}`} pequeno />
              <Chip texto={e.category} pequeno />
              {e.unilateral && <Chip texto="Por lado" pequeno />}
              {e.impact >= 2 && <Chip texto="Impacto alto" pequeno />}
              {e.noise >= 2 && <Chip texto="Ruidoso" pequeno />}
            </View>

            {bloqueado && (
              <View style={{ marginTop: esp.md }}>
                <Nota tono="cuidado" titulo="Fuera de tu plan"
                  texto="Lo quitamos por las lesiones que declaraste. Puedes verlo, pero no te lo vamos a proponer." />
              </View>
            )}

            <Text style={[tipo.cuerpo, { color: color.texto, marginTop: esp.md }]}>{e.desc}</Text>
          </Aparece>

          {/* La evidencia va aqui, con su nota al lado. Nunca suelta en una lista. */}
          <Seccion titulo="Qué dice la evidencia">
            <Tarjeta desenfoque>
              {Object.entries(mapa).map(([claim, v]) => (
                <View key={claim} style={s.claim}>
                  <View style={[s.punto, { backgroundColor: insignia[v].fg }]} />
                  <Text style={[tipo.pie, { color: color.texto, flex: 1 }]}>
                    {claim.replace(/_/g, ' ')}
                  </Text>
                  <Text style={[tipo.micro, { color: insignia[v].fg }]}>{insignia[v].texto}</Text>
                </View>
              ))}
              {nota && <Text style={[tipo.pie, { color: color.textoSuave, marginTop: esp.xs }]}>{nota}</Text>}
            </Tarjeta>
          </Seccion>

          <Seccion titulo="Cómo se hace">
            {e.steps.map((p, i) => (
              <View key={i} style={s.paso}>
                <View style={s.numero}>
                  <Text style={[tipo.micro, { color: color.sobreOscuro }]}>{i + 1}</Text>
                </View>
                <Text style={[tipo.cuerpo, { color: color.texto, flex: 1 }]}>{p}</Text>
              </View>
            ))}
            <Nota titulo="Respiración" texto={e.breathing} />
          </Seccion>

          <Seccion titulo="Claves">
            <View style={{ flexDirection: 'row', gap: esp.xs, flexWrap: 'wrap' }}>
              {e.cues.map((c, i) => <Chip key={i} texto={c} />)}
            </View>
          </Seccion>

          <Seccion titulo="Errores comunes">
            {e.errors.map((x, i) => (
              <View key={i} style={s.error}>
                <View style={s.cruz}><Text style={{ color: color.mito, fontSize: 11 }}>✕</Text></View>
                <Text style={[tipo.cuerpo, { color: color.texto, flex: 1 }]}>{x}</Text>
              </View>
            ))}
          </Seccion>
        </View>

        {/* Musculos en carrusel circular, con nombre e imagen. */}
        <Seccion titulo="Músculos que trabaja" estilo={{ paddingLeft: esp.md }}>
          <Carrusel
            items={musculos.map(m => ({
              id: m!.id, titulo: m!.name,
              favorito: esFavorito('musculos', m!.id),
            }))}
            tipoFoto="musculo" forma="circulo" textoVerMas="Todos"
            onItem={id => navigation.push('Musculo', { id })}
            onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } })}
          />
          <View style={{ paddingRight: esp.md, marginTop: esp.sm }}>
            <Tarjeta desenfoque>
              <Fila etiqueta="Principales" valor={e.primary.map(m => musculoPorId.get(m)?.name ?? m).join(', ')} />
            </Tarjeta>
          </View>
        </Seccion>

        <View style={{ padding: esp.md }}>
          <Seccion titulo="Detalles">
            <Tarjeta desenfoque>
              <Fila etiqueta="Series por defecto" valor={
                e.default.seg ? `${e.default.series} × ${e.default.seg} s` : `${e.default.series} × ${e.default.reps}`
              } />
              <Fila etiqueta="Descanso" valor={`${e.default.rest_s} s`} />
              <Fila etiqueta="Equipo" valor={nombreEquipo(e.equipment)} />
              <Fila etiqueta="Espacio" valor={e.space} />
              <Fila etiqueta="MET" valor={String(e.met)} tenue />
              {e.risk_zones.length > 0 && <Fila etiqueta="Zonas de riesgo" valor={e.risk_zones.join(', ')} tenue />}
              {fam && <Fila etiqueta="Familia" valor={fam.name} tenue />}
            </Tarjeta>
          </Seccion>

          <Relacionados titulo="Progresiones" ids={e.progressions} navigation={navigation} />
          <Relacionados titulo="Regresiones" ids={e.regressions} navigation={navigation} />
          <Relacionados titulo="Sustitutos" ids={e.substitutes} navigation={navigation} />

          <Boton
            texto={vetado ? 'Volver a proponérmelo' : 'No me lo propongas más'}
            variante="contorno" onPress={() => alternarVeto(e.id)} estilo={{ marginTop: esp.lg }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Relacionados({ titulo, ids, navigation }: { titulo: string; ids: string[]; navigation: any }) {
  const items = ids.map(i => porId.get(i)).filter(Boolean);
  if (!items.length) return null;
  return (
    <Seccion titulo={titulo}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: esp.sm }}>
        {items.map(x => (
          <Toque key={x!.id} onPress={() => navigation.push('Ejercicio', { id: x!.id })}
            estilo={{ width: 116 } as never}>
            <Foto tipo="ejercicio" id={x!.id} nombre={x!.name} alto={84} ancho={116} />
            <Text style={[tipo.pie, { color: color.texto, marginTop: 5 }]} numberOfLines={2}>{x!.name}</Text>
          </Toque>
        ))}
      </ScrollView>
    </Seccion>
  );
}

/* ============================================================== MUSCULO */

export function DetalleMusculo({ route, navigation }: any) {
  const abajo = useHuecoAbajo();
  const m = musculoPorId.get(route.params.id);
  const { alternarFavorito, esFavorito } = useEstado();
  if (!m) return null;

  const trabajan = EJERCICIOS.filter(e => e.primary.includes(m.id));
  const secundario = EJERCICIOS.filter(e => e.secondary.includes(m.id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: abajo }} showsVerticalScrollIndicator={false}>
        <View style={s.cabeceraMusculo}>
          <Foto tipo="musculo" id={m.id} nombre={m.name} alto={128} forma="circulo" mostrarRuta />
          <Text style={[tipo.h1, { color: color.texto, marginTop: esp.md, textAlign: 'center' }]}>{m.name}</Text>
          {m.name_en && <Text style={[tipo.pie, { color: color.textoTenue }]}>{m.name_en}</Text>}
          <View style={{ flexDirection: 'row', gap: esp.xs, marginTop: esp.sm }}>
            <Chip texto={m.group} pequeno />
            <Chip texto={m.region} pequeno />
          </View>
          <View style={{ marginTop: esp.sm }}>
            <Favorito activo={esFavorito('musculos', m.id)}
              onPress={() => alternarFavorito('musculos', m.id)} tamano={40} />
          </View>
        </View>

        <View style={{ padding: esp.md }}>
          <Text style={[tipo.cuerpo, { color: color.texto }]}>{m.funcion}</Text>
          {m.dolor_comun && (
            <View style={{ marginTop: esp.md }}>
              <Nota titulo="Lo que suele pasar" texto={m.dolor_comun} tono="cuidado" />
            </View>
          )}
        </View>

        {!!m.trabaja_con?.length && (
          <Seccion titulo="Trabaja junto a" estilo={{ paddingLeft: esp.md }}>
            <Carrusel
              items={m.trabaja_con.map(x => ({ id: x, titulo: musculoPorId.get(x)?.name ?? x }))}
              tipoFoto="musculo" forma="circulo" textoVerMas="Todos"
              onItem={id => navigation.push('Musculo', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } })}
            />
          </Seccion>
        )}

        {!!m.antagonista?.length && (
          <Seccion titulo="Antagonistas" estilo={{ paddingLeft: esp.md }}>
            <Carrusel
              items={m.antagonista.map(x => ({ id: x, titulo: musculoPorId.get(x)?.name ?? x }))}
              tipoFoto="musculo" forma="circulo" textoVerMas="Todos"
              onItem={id => navigation.push('Musculo', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } })}
            />
          </Seccion>
        )}

        <Seccion titulo={`Lo trabajan como principal (${trabajan.length})`} estilo={{ paddingHorizontal: esp.md }}>
          {trabajan.map(e => (
            <Toque key={e.id} onPress={() => navigation.push('Ejercicio', { id: e.id })} estilo={s.filaEj as never}>
              <Foto tipo="ejercicio" id={e.id} nombre={e.name} alto={54} ancho={54} />
              <View style={{ flex: 1 }}>
                <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]}>{e.name}</Text>
                <Text style={[tipo.pie, { color: color.textoSuave }]}>{nombreEquipo(e.equipment)}</Text>
              </View>
              <Text style={{ color: color.textoTenue }}>›</Text>
            </Toque>
          ))}
        </Seccion>

        {secundario.length > 0 && (
          <Seccion titulo={`Como secundario (${secundario.length})`} estilo={{ paddingLeft: esp.md }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: esp.sm, paddingRight: esp.md }}>
              {secundario.map(e => (
                <Toque key={e.id} onPress={() => navigation.push('Ejercicio', { id: e.id })}
                  estilo={{ width: 116 } as never}>
                  <Foto tipo="ejercicio" id={e.id} nombre={e.name} alto={84} ancho={116} />
                  <Text style={[tipo.pie, { color: color.texto, marginTop: 5 }]} numberOfLines={2}>{e.name}</Text>
                </Toque>
              ))}
            </ScrollView>
          </Seccion>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* =============================================================== RUTINA */

export function DetalleRutina({ route, navigation }: any) {
  const abajo = useHuecoAbajo();
  const r = rutinaPorId.get(route.params.id);
  const { estado, ultimaVezDe, alternarFavorito, esFavorito } = useEstado();
  if (!r) return null;

  const empezar = () => {
    const sesion = sesionDeRutina(r.id, estado.perfil, r, ultimaVezDe);
    navigation.navigate('Reproductor', { sesion });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: abajo + 62 }} showsVerticalScrollIndicator={false}>
        <View>
          <Foto tipo="rutina" id={r.id} nombre={r.name} alto={220} ancho="100%" forma="tarjeta" mostrarRuta />
          <View style={s.favPortada}>
            <Favorito activo={esFavorito('rutinas', r.id)}
              onPress={() => alternarFavorito('rutinas', r.id)} sobreFoto tamano={44} />
          </View>
        </View>

        <View style={{ padding: esp.md }}>
          <Text style={[tipo.h1, { color: color.texto }]}>{r.name}</Text>
          <View style={{ flexDirection: 'row', gap: esp.xs, flexWrap: 'wrap', marginTop: esp.sm }}>
            <Chip texto={nombreGoal(r.goal)} activo pequeno />
            <Chip texto={`${r.min} min`} pequeno />
            <Chip texto={`Nivel ${r.level}`} pequeno />
            {r.modo_sin_saltos && <Chip texto="Silenciosa" pequeno />}
          </View>

          {r.nota && <View style={{ marginTop: esp.md }}><Nota texto={r.nota} /></View>}

          {r.bloques.map((b, i) => (
            <Seccion key={i} titulo={`${b.tipo}${b.vueltas ? ` · ${b.vueltas} vueltas` : ''}`}>
              {b.items.map(id => {
                const e = porId.get(id);
                if (!e) return null;
                return (
                  <Toque key={id} onPress={() => navigation.navigate('Ejercicio', { id })} estilo={s.filaEj as never}>
                    <Foto tipo="ejercicio" id={e.id} nombre={e.name} alto={54} ancho={54} />
                    <View style={{ flex: 1 }}>
                      <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]} numberOfLines={1}>
                        {e.name}
                      </Text>
                      <Text style={[tipo.pie, { color: color.textoSuave }]}>
                        {e.default.seg ? `${e.default.series} × ${e.default.seg} s` : `${e.default.series} × ${e.default.reps}`}
                      </Text>
                    </View>
                    <Text style={{ color: color.textoTenue }}>›</Text>
                  </Toque>
                );
              })}
            </Seccion>
          ))}

          {estado.perfil.mostrarKcal && (
            <View style={{ marginTop: esp.md }}>
              <Nota texto={`Gasto aproximado para 70 kg: ~${r.kcal_aprox_70kg} kcal. Es una estimación poblacional, no una medida de tu cuerpo.`} />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={s.barraInferior}>
        <Boton texto="Empezar esta rutina" onPress={empezar} estilo={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
}

/* ============================================================= PROGRAMA */

export function DetallePrograma({ route, navigation }: any) {
  const abajo = useHuecoAbajo();
  const p = programaPorId.get(route.params.id);
  const { estado, guardarPerfil, alternarFavorito, esFavorito } = useEstado();
  if (!p) return null;
  const activo = estado.perfil.programaId === p.id;
  const actual = programaPorId.get(estado.perfil.programaId);

  // Solo se sigue un programa a la vez: "cambiar" es en realidad dejar el
  // actual y unirse al nuevo. Si ya hay uno (siempre lo hay), se avisa
  // antes de reemplazarlo en vez de pisarlo en silencio.
  function elegirPrograma() {
    const cambiar = () => { guardarPerfil({ programaId: p!.id, objetivo: p!.goal }); navigation.goBack(); };
    if (!actual || actual.id === p!.id) { cambiar(); return; }
    Alert.alert(
      'Cambiar de programa',
      `Ahora sigues "${actual.name}". Solo se puede seguir un programa a la vez: para unirte a "${p!.name}" hay que dejarlo primero.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Dejarlo y cambiar', onPress: cambiar },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: abajo + 62 }} showsVerticalScrollIndicator={false}>
        <View>
          <Foto tipo="programa" id={p.id} nombre={p.name} alto={220} ancho="100%" forma="tarjeta" mostrarRuta />
          <View style={s.favPortada}>
            <Favorito activo={esFavorito('programas', p.id)}
              onPress={() => alternarFavorito('programas', p.id)} sobreFoto tamano={44} />
          </View>
        </View>

        <View style={{ padding: esp.md }}>
          <Text style={[tipo.h1, { color: color.texto }]}>{p.name}</Text>
          <View style={{ flexDirection: 'row', gap: esp.xs, flexWrap: 'wrap', marginTop: esp.sm }}>
            <Chip texto={`${p.semanas} semanas`} pequeno />
            <Chip texto={`${p.dias_semana} días/semana`} pequeno />
            <Chip texto={`${p.min_sesion} min`} pequeno />
            <Chip texto={nombreGoal(p.goal)} pequeno />
          </View>

          <Text style={[tipo.cuerpo, { color: color.texto, marginTop: esp.md }]}>{p.desc}</Text>

          {p.honestidad && (
            <View style={{ marginTop: esp.md }}>
              <Nota titulo="Lo que sí y lo que no" texto={p.honestidad} tono="cuidado" />
            </View>
          )}

          <Seccion titulo="Fases">
            {p.fases.map((f, i) => (
              <Tarjeta key={i}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[tipo.dato, { color: color.texto }]}>Semanas {f.semanas}</Text>
                  <Text style={[tipo.pie, { color: color.textoSuave }]}>{f.foco}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: esp.sm }}>
                  {[...new Set(f.rutinas)].map(rid => {
                    const rt = rutinaPorId.get(rid);
                    return (
                      <Toque key={rid} onPress={() => navigation.navigate('Rutina', { id: rid })}
                        estilo={{ width: 108 } as never}>
                        <Foto tipo="rutina" id={rid} nombre={rt?.name ?? rid} alto={72} ancho={108} />
                        <Text style={[tipo.micro, { color: color.texto, marginTop: 5 }]} numberOfLines={2}>
                          {rt?.name ?? rid}
                        </Text>
                      </Toque>
                    );
                  })}
                </ScrollView>
                {f.nota && <Text style={[tipo.pie, { color: color.textoSuave }]}>{f.nota}</Text>}
              </Tarjeta>
            ))}
          </Seccion>

          {p.medicion && (
            <Seccion titulo="Cómo se mide">
              <Text style={[tipo.cuerpo, { color: color.textoSuave }]}>{p.medicion}</Text>
            </Seccion>
          )}

          <Seccion titulo="Qué esperar">
            <Text style={[tipo.cuerpo, { color: color.textoSuave }]}>{p.resultado_esperado}</Text>
          </Seccion>
        </View>
      </ScrollView>

      <View style={s.barraInferior}>
        {activo ? (
          <Boton
            texto="Cambiar de programa" variante="contorno" estilo={{ flex: 1 }}
            onPress={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'programas' } })}
          />
        ) : (
          <Boton texto="Cambiar a este programa" estilo={{ flex: 1 }} onPress={elegirPrograma} />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  favPortada: { position: 'absolute', top: esp.md, right: esp.md },
  cabeceraMusculo: { alignItems: 'center', paddingTop: esp.lg, paddingHorizontal: esp.md },
  claim: { flexDirection: 'row', alignItems: 'center', gap: esp.sm },
  punto: { width: 7, height: 7, borderRadius: 4 },
  paso: { flexDirection: 'row', gap: esp.sm, marginBottom: esp.sm, alignItems: 'flex-start' },
  numero: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: color.carbon,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  error: { flexDirection: 'row', gap: esp.sm, marginBottom: esp.sm, alignItems: 'flex-start' },
  cruz: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: color.mitoFondo,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  filaEj: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm,
    paddingVertical: esp.sm, borderBottomWidth: 1, borderBottomColor: color.borde,
  },
  barraInferior: {
    flexDirection: 'row', padding: esp.md, gap: esp.sm,
    borderTopWidth: 1, borderTopColor: color.borde, backgroundColor: color.fondo,
  },
});
