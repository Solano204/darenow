/**
 * FORJA · Aprender
 *
 * Tips, mitos, alimentacion y glosario. Todo con imagen.
 *
 * El bloque "lo que se dice" de un mito ya no lleva la barra gruesa a la
 * izquierda: ahora es una tarjeta con fondo tenido, que se distingue igual
 * y no rompe el margen de la pagina.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, insignia, peso, MARGEN_PANTALLA } from '../theme';
import {
  Tarjeta, Chip, Insignia, Buscador, Seccion, Nota, Vacio, Boton,
  Toque, Favorito, Aparece,
  useHuecoAbajo,
} from '../components/ui';
import Foto from '../components/Foto';
import { MuroCategoria, Intersticial } from '../components/Anuncio';
import {
  TIPS, SALAS, salaPorId, MITOS, ERRORES, NUTRICION, GLOSARIO, FAQ, porId,
  type Ejercicio,
} from '../data/catalog';
import { useEstado } from '../store/store';

type Tab = 'tips' | 'mitos' | 'nutricion' | 'glosario';
const TABS: [Tab, string][] = [
  ['tips', 'Tips'], ['mitos', 'Mitos'], ['nutricion', 'Alimentación'], ['glosario', 'Glosario'],
];

export default function Aprender({ navigation }: any) {
  const abajo = useHuecoAbajo();
  const { estado, alternarFavorito, esFavorito, registrarDescarga } = useEstado();
  const [tab, setTab] = useState<Tab>('tips');
  const [sala, setSala] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [verAnuncio, setVerAnuncio] = useState(false);

  const desbloqueada = estado.descargas.includes('aprender');

  const tips = useMemo(() => {
    const t = q.trim().toLowerCase();
    return TIPS.filter(x =>
      (!sala || x.sala === sala) &&
      (!t || x.titulo.toLowerCase().includes(t) || x.cuerpo.toLowerCase().includes(t)));
  }, [sala, q]);

  const mitos = useMemo(() => {
    const t = q.trim().toLowerCase();
    return MITOS.filter(m => !t || m.titulo.toLowerCase().includes(t));
  }, [q]);

  const glosario = useMemo(() => {
    const t = q.trim().toLowerCase();
    return GLOSARIO.filter(g => !t || g.termino.toLowerCase().includes(t) || g.def.toLowerCase().includes(t));
  }, [q]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top']}>
      <View style={{ paddingHorizontal: MARGEN_PANTALLA, paddingBottom: esp.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[tipo.h1, { color: color.texto, marginBottom: esp.sm }]}>Aprender</Text>
          {desbloqueada && <Chip texto="Sin conexión ✓" pequeno activo />}
        </View>
        <Buscador valor={q} onCambio={setQ} placeholder="Buscar" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: esp.xs, paddingVertical: esp.sm }}>
          {TABS.map(([id, txt]) => (
            <Chip key={id} texto={txt} activo={tab === id} onPress={() => setTab(id)} />
          ))}
        </ScrollView>
      </View>

      {tab === 'tips' && (
        <FlatList
          data={tips}
          keyExtractor={t => t.id}
          contentContainerStyle={{ paddingHorizontal: MARGEN_PANTALLA, paddingBottom: abajo }}
          ListHeaderComponent={
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: esp.xs, paddingBottom: esp.sm }}>
              {[{ id: null, name: 'Todas' }, ...SALAS].map((x, i) => (
                <Chip key={i} texto={x.name} pequeno activo={sala === x.id}
                  onPress={() => setSala(sala === x.id ? null : (x.id as string))} />
              ))}
            </ScrollView>
          }
          ListEmptyComponent={<Vacio texto="Nada con esa búsqueda." />}
          renderItem={({ item, index }) => (
            <Aparece retraso={Math.min(index, 8) * 25}>
              <Toque onPress={() => navigation.navigate('Tip', { id: item.id })} estilo={s.tarjetaTip as never}>
                <Foto tipo="tip" id={item.id} nombre={item.titulo} alto={160} ancho="100%" forma="tarjeta" />
                <View style={s.favSobre}>
                  <Favorito activo={esFavorito('tips', item.id)}
                    onPress={() => alternarFavorito('tips', item.id)} sobreFoto tamano={34} />
                </View>
                <View style={{ padding: esp.sm, gap: 4 }}>
                  <Text style={[tipo.micro, { color: color.textoSuave }]}>
                    {salaPorId.get(item.sala)?.name}
                  </Text>
                  <Text style={[tipo.h3, { color: color.texto }]}>{item.titulo}</Text>
                  <Text style={[tipo.pie, { color: color.textoSuave }]} numberOfLines={2}>{item.cuerpo}</Text>
                </View>
              </Toque>
            </Aparece>
          )}
        />
      )}

      {tab === 'mitos' && (
        <FlatList
          data={mitos}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingHorizontal: MARGEN_PANTALLA, paddingBottom: abajo }}
          ListHeaderComponent={
            <Nota texto="Saber qué no funciona vale tanto como saber qué sí. Cada afirmación lleva su veredicto." />
          }
          ListFooterComponent={
            <Seccion titulo="Errores de ejecución más frecuentes">
              {ERRORES.map(e => (
                <Tarjeta key={e.id}>
                  <Text style={[tipo.h3, { color: color.texto }]}>{e.error}</Text>
                  <Text style={[tipo.pie, { color: color.textoSuave }]}>{e.por_que_importa}</Text>
                  <Nota titulo="Corrección" texto={e.correccion} tono="bueno" />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: esp.sm }}>
                    {e.ejercicios.map(id => {
                      const ex = porId.get(id);
                      if (!ex) return null;
                      return (
                        <Toque key={id} onPress={() => navigation.navigate('Ejercicio', { id })}
                          estilo={{ width: 100 } as never}>
                          <Foto tipo="ejercicio" id={id} nombre={ex.name} alto={68} ancho={100} />
                          <Text style={[tipo.micro, { color: color.texto, marginTop: 4 }]} numberOfLines={2}>
                            {ex.name}
                          </Text>
                        </Toque>
                      );
                    })}
                  </ScrollView>
                </Tarjeta>
              ))}
            </Seccion>
          }
          renderItem={({ item, index }) => (
            <Aparece retraso={Math.min(index, 8) * 25}>
              <Toque onPress={() => navigation.navigate('Mito', { id: item.id })} estilo={s.filaMito as never}>
                <Foto tipo="mito" id={item.id} nombre={item.titulo} alto={70} ancho={70} />
                <View style={{ flex: 1, gap: 3 }}>
                  {/* Solo se etiqueta lo que NO es mito: dentro de la
                      seccion de mitos, poner "Mito" en cada fila es ruido. */}
                  {item.veredicto !== 'mito' && <Insignia tipo={item.veredicto} pequena />}
                  <Text style={[tipo.h3, { color: color.texto }]} numberOfLines={2}>{item.titulo}</Text>
                  <Text style={[tipo.pie, { color: color.textoSuave }]} numberOfLines={2}>{item.explicacion}</Text>
                </View>
              </Toque>
            </Aparece>
          )}
        />
      )}

      {tab === 'nutricion' && (
        <ScrollView contentContainerStyle={{ padding: esp.md, paddingBottom: abajo }}
          showsVerticalScrollIndicator={false}>
          <Nota titulo="Cómo funciona aquí" texto={NUTRICION.principio_de_diseno} />
          <Seccion titulo="Lo que esta app no hace">
            <Tarjeta desenfoque>
              {NUTRICION.lo_que_la_app_no_hace.map((x, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: esp.sm, alignItems: 'flex-start' }}>
                  <Text style={{ color: color.textoTenue, marginTop: 2 }}>·</Text>
                  <Text style={[tipo.pie, { color: color.texto, flex: 1 }]}>{x}</Text>
                </View>
              ))}
            </Tarjeta>
          </Seccion>
          <Seccion titulo="Información general">
            {NUTRICION.conceptos.map((c, i) => (
              <Aparece key={c.id} retraso={i * 30}>
                <Tarjeta>
                  <View style={{ flexDirection: 'row', gap: esp.sm, alignItems: 'center' }}>
                    <Foto tipo="tip" id={c.id} nombre={c.titulo} alto={52} ancho={52} />
                    <Text style={[tipo.h3, { color: color.texto, flex: 1 }]}>{c.titulo}</Text>
                  </View>
                  <Text style={[tipo.cuerpo, { color: color.textoSuave }]}>{c.cuerpo}</Text>
                  {c.implicacion && <Nota texto={c.implicacion} tono="bueno" />}
                </Tarjeta>
              </Aparece>
            ))}
          </Seccion>
          <Text style={[tipo.pie, { color: color.textoTenue, marginTop: esp.md }]}>{NUTRICION.aviso}</Text>
        </ScrollView>
      )}

      {tab === 'glosario' && (
        <FlatList
          data={glosario}
          keyExtractor={g => g.termino}
          contentContainerStyle={{ paddingHorizontal: MARGEN_PANTALLA, paddingBottom: abajo }}
          ListFooterComponent={
            <Seccion titulo="Preguntas frecuentes">
              {FAQ.map((f, i) => <Pregunta key={i} p={f.p} r={f.r} />)}
            </Seccion>
          }
          renderItem={({ item }) => (
            <View style={s.termino}>
              <Text style={[tipo.dato, { color: color.texto }]}>{item.termino}</Text>
              <Text style={[tipo.pie, { color: color.textoSuave }]}>{item.def}</Text>
            </View>
          )}
        />
      )}
      <MuroCategoria
        visible={!desbloqueada}
        categoria="todo el contenido"
        cuantos={TIPS.length + MITOS.length}
        onVerAnuncio={() => setVerAnuncio(true)}
        onVolver={() => navigation.navigate('Hoy')}
      />
      <Intersticial
        visible={verAnuncio}
        motivo="desbloqueando contenido"
        onCerrar={() => { setVerAnuncio(false); registrarDescarga('aprender'); }}
      />
    </SafeAreaView>
  );
}

function Pregunta({ p, r }: { p: string; r: string }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <Pressable onPress={() => setAbierta(!abierta)} style={s.termino}
      accessibilityRole="button" accessibilityLabel={p} accessibilityState={{ expanded: abierta }}>
      <View style={{ flexDirection: 'row', gap: esp.sm }}>
        <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold, flex: 1 }]}>{p}</Text>
        <Text style={{ color: color.textoTenue }}>{abierta ? '−' : '+'}</Text>
      </View>
      {abierta && <Text style={[tipo.pie, { color: color.textoSuave, marginTop: esp.xs }]}>{r}</Text>}
    </Pressable>
  );
}

/* ================================================================= TIP */

export function DetalleTip({ route, navigation }: any) {
  const abajo = useHuecoAbajo();
  const t = TIPS.find(x => x.id === route.params.id);
  const { alternarFavorito, esFavorito, marcarTipLeido } = useEstado();
  React.useEffect(() => { if (t) marcarTipLeido(t.id); }, [t?.id]);
  if (!t) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: abajo }} showsVerticalScrollIndicator={false}>
        <View>
          <Foto tipo="tip" id={t.id} nombre={t.titulo} alto={200} ancho="100%" forma="tarjeta" mostrarRuta />
          <View style={s.favPortada}>
            <Favorito activo={esFavorito('tips', t.id)}
              onPress={() => alternarFavorito('tips', t.id)} sobreFoto tamano={44} />
          </View>
        </View>

        <View style={{ padding: esp.md }}>
          <Text style={[tipo.micro, { color: color.textoSuave }]}>
            {salaPorId.get(t.sala)?.name}
          </Text>
          <Text style={[tipo.h1, { color: color.texto, marginTop: esp.xs }]}>{t.titulo}</Text>
          <Text style={[tipo.cuerpo, { color: color.texto, marginTop: esp.md, lineHeight: 25 }]}>
            {t.cuerpo}
          </Text>

          {t.relacionado.length > 0 && (
            <Seccion titulo="Relacionado">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: esp.sm }}>
                {t.relacionado.map(id => {
                  const e = porId.get(id);
                  if (e) return (
                    <Toque key={id} onPress={() => navigation.navigate('Ejercicio', { id })}
                      estilo={{ width: 116 } as never}>
                      <Foto tipo="ejercicio" id={id} nombre={e.name} alto={84} ancho={116} />
                      <Text style={[tipo.pie, { color: color.texto, marginTop: 5 }]} numberOfLines={2}>{e.name}</Text>
                    </Toque>
                  );
                  if (id.startsWith('rt_')) return (
                    <Toque key={id} onPress={() => navigation.navigate('Rutina', { id })}
                      estilo={{ width: 116 } as never}>
                      <Foto tipo="rutina" id={id} nombre="Rutina" alto={84} ancho={116} />
                      <Text style={[tipo.pie, { color: color.texto, marginTop: 5 }]}>Ver rutina</Text>
                    </Toque>
                  );
                  if (id.startsWith('pg_')) return (
                    <Toque key={id} onPress={() => navigation.navigate('Programa', { id })}
                      estilo={{ width: 116 } as never}>
                      <Foto tipo="programa" id={id} nombre="Programa" alto={84} ancho={116} />
                      <Text style={[tipo.pie, { color: color.texto, marginTop: 5 }]}>Ver programa</Text>
                    </Toque>
                  );
                  return null;
                })}
              </ScrollView>
            </Seccion>
          )}

          <View style={{ flexDirection: 'row', gap: esp.xs, flexWrap: 'wrap', marginTop: esp.md }}>
            {t.tags.map(x => <Chip key={x} texto={x} pequeno />)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================================ MITO */

export function DetalleMito({ route, navigation }: any) {
  const abajo = useHuecoAbajo();
  const m = MITOS.find(x => x.id === route.params.id);
  if (!m) return null;
  // Algunos relacionados son ids de familia (fam_...), no de ejercicio: no
  // tienen foto. Se filtran aqui, no con un chip de respaldo mostrando el
  // id crudo.
  const relacionados = m.relacionado.map(id => porId.get(id)).filter((e): e is Ejercicio => !!e);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: abajo }} showsVerticalScrollIndicator={false}>
        <Foto tipo="mito" id={m.id} nombre={m.titulo} alto={200} ancho="100%" forma="tarjeta" mostrarRuta />

        <View style={{ padding: esp.md }}>
          {m.veredicto !== 'mito' && <Insignia tipo={m.veredicto} />}
          <Text style={[tipo.h1, { color: color.texto, marginTop: esp.sm }]}>{m.titulo}</Text>

          {/* Antes esto era un texto con una barra vertical gruesa. Ahora es
              una tarjeta: se distingue igual y no parte el margen. */}
          <View style={{ marginTop: esp.md }}>
            <Nota titulo="Lo que se dice" texto={m.afirmacion_popular} />
          </View>

          <Seccion titulo="Por qué">
            <Text style={[tipo.cuerpo, { color: color.texto }]}>{m.explicacion}</Text>
          </Seccion>

          <Seccion titulo="Qué hacer en su lugar">
            <Nota texto={m.que_hacer} tono="bueno" />
          </Seccion>

          {relacionados.length > 0 && (
            <Seccion titulo="Relacionado">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: esp.sm }}>
                {relacionados.map(e => (
                  <Toque key={e.id} onPress={() => navigation.navigate('Ejercicio', { id: e.id })}
                    estilo={{ width: 116 } as never}>
                    <Foto tipo="ejercicio" id={e.id} nombre={e.name} alto={84} ancho={116} />
                    <Text style={[tipo.pie, { color: color.texto, marginTop: 5 }]} numberOfLines={2}>{e.name}</Text>
                  </Toque>
                ))}
              </ScrollView>
            </Seccion>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tarjetaTip: {
    backgroundColor: color.lienzo, borderRadius: radio.tarjeta,
    borderWidth: 1, borderColor: color.borde, overflow: 'hidden', marginBottom: esp.sm,
  },
  filaMito: {
    flexDirection: 'row', gap: esp.sm, alignItems: 'center',
    paddingVertical: esp.sm, borderBottomWidth: 1, borderBottomColor: color.borde,
  },
  favSobre: { position: 'absolute', top: esp.sm, right: esp.sm },
  favPortada: { position: 'absolute', top: esp.md, right: esp.md },
  termino: { paddingVertical: esp.sm, borderBottomWidth: 1, borderBottomColor: color.borde },
});
