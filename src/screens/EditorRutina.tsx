/**
 * FORJA · editor de rutinas
 *
 * El usuario arma su propia rutina: elige ejercicios del catalogo y define
 * series, repeticiones o segundos y descanso de cada uno.
 *
 * Dos decisiones:
 *
 * 1. Los avisos no bloquean. Si mete un ejercicio que carga una lesion que
 *    el mismo declaro, se lo decimos, pero la rutina es suya y decide el.
 *    Distinto de las sesiones que genera la app, donde el filtro es duro:
 *    ahi elegimos nosotros, aqui elige el.
 *
 * 2. Se guarda solo al tocar Guardar. Un editor que persiste cada tecla
 *    deja rutinas a medias por todos lados cuando alguien entra a mirar.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Modal, FlatList, Alert, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, TOQUE, peso } from '../theme';
import {
  Boton, Chip, Toque, Nota, Buscador, Vacio, Aparece, useHuecoAbajo,
} from '../components/ui';
import Foto from '../components/Foto';
import { useEstado, type RutinaPropia, type ItemPropio } from '../store/store';
import {
  itemPropioPorDefecto, minutosPropios, revisarPropia,
} from '../engine/session';
import {
  EJERCICIOS, porId, GOALS, CATEGORIAS, nombreEquipo, nombreGoal, type Ejercicio,
} from '../data/catalog';

export default function EditorRutina({ route, navigation }: any) {
  const abajo = useHuecoAbajo();
  const { estado, guardarRutinaPropia, nuevaRutinaPropia } = useEstado();

  const original = route.params?.id
    ? estado.rutinasPropias.find(r => r.id === route.params.id)
    : undefined;

  const [r, setR] = useState<RutinaPropia>(
    () => original ?? nuevaRutinaPropia({ objetivo: estado.perfil.objetivo }),
  );
  // Foto fija del arranque (crear en blanco o editar lo cargado), para
  // saber si hubo cambios reales antes de dejar salir sin avisar.
  const inicial = useRef(r).current;
  const guardadoRef = useRef(false);
  const [selector, setSelector] = useState(false);

  const minutos = useMemo(() => minutosPropios(r.items), [r.items]);
  const avisos = useMemo(() => revisarPropia(r.items, estado.perfil), [r.items, estado.perfil]);
  const hayCambios = useMemo(() => JSON.stringify(r) !== JSON.stringify(inicial), [r, inicial]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (guardadoRef.current || !hayCambios) return;
      e.preventDefault();
      Alert.alert(
        'Descartar cambios',
        'Tienes cambios sin guardar en esta rutina. Si sales ahora se pierden.',
        [
          { text: 'Seguir editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, hayCambios]);

  const set = (cambio: Partial<RutinaPropia>) => setR(prev => ({ ...prev, ...cambio }));

  const cambiarItem = (i: number, cambio: Partial<ItemPropio>) =>
    setR(prev => ({
      ...prev,
      items: prev.items.map((x, n) => (n === i ? { ...x, ...cambio } : x)),
    }));

  const mover = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= r.items.length) return;
    const copia = [...r.items];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    set({ items: copia });
  };

  const quitar = (i: number) =>
    set({ items: r.items.filter((_, n) => n !== i) });

  const anadir = (e: Ejercicio) => {
    setSelector(false);
    if (r.items.some(it => it.ejercicioId === e.id)) return;
    set({ items: [...r.items, itemPropioPorDefecto(e)] });
  };

  const guardar = () => {
    if (!r.nombre.trim()) return Alert.alert('Ponle nombre', 'Así la reconoces después en tu lista.');
    if (r.items.length === 0) return Alert.alert('Falta contenido', 'Agrega al menos un ejercicio.');
    guardadoRef.current = true;
    guardarRutinaPropia({ ...r, nombre: r.nombre.trim() });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ padding: esp.md, paddingBottom: abajo + 70 }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Text style={[tipo.h1, { color: color.texto }]}>
          {original ? 'Editar rutina' : 'Crear rutina'}
        </Text>

        <TextInput
          value={r.nombre}
          onChangeText={t => set({ nombre: t })}
          placeholder="Nombre de la rutina"
          placeholderTextColor={color.textoTenue}
          style={s.nombre}
          maxLength={48}
        />

        <Text style={[tipo.dato, { color: color.textoSuave, marginTop: esp.md }]}>Objetivo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: esp.xs, paddingVertical: esp.sm }}>
          {GOALS.map(g => (
            <Chip key={g.id} texto={g.nombre} activo={r.objetivo === g.id}
              onPress={() => set({ objetivo: g.id })} />
          ))}
        </ScrollView>

        <View style={s.resumen}>
          <Dato n={String(r.items.length)} t="ejercicios" />
          <View style={s.sep} />
          <Dato n={String(r.items.reduce((a, x) => a + x.series, 0))} t="series" />
          <View style={s.sep} />
          <Dato n={`${minutos}`} t="minutos" />
        </View>

        {avisos.map((a, i) => (
          <Nota key={i} texto={a} tono="cuidado" titulo={i === 0 ? 'Revisa' : undefined} />
        ))}

        <Text style={[tipo.h2, { color: color.texto, marginTop: esp.lg, marginBottom: esp.sm }]}>
          Ejercicios
        </Text>

        {r.items.length === 0 && (
          <Vacio texto="Todavía no hay ninguno. Toca el botón de abajo para agregar el primero." />
        )}

        {r.items.map((it, i) => {
          const e = porId.get(it.ejercicioId);
          if (!e) return null;
          const porTiempo = it.seg != null;
          return (
            <Aparece key={`${it.ejercicioId}-${i}`} retraso={Math.min(i, 6) * 25}>
              <View style={s.tarjeta}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: esp.sm }}>
                  <Foto tipo="ejercicio" id={e.id} nombre={e.name} alto={52} ancho={52} />
                  <Toque onPress={() => navigation.navigate('Ejercicio', { id: e.id })}
                    estilo={{ flex: 1 } as never}>
                    <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text style={[tipo.pie, { color: color.textoSuave }]} numberOfLines={1}>
                      {nombreEquipo(e.equipment)}
                      {e.unilateral || e.measure === 'reps_por_lado' ? ' · por lado' : ''}
                    </Text>
                  </Toque>
                  <View style={{ gap: 2 }}>
                    <Mini glifo="↑" etiqueta="Mover arriba" onPress={() => mover(i, -1)} />
                    <Mini glifo="↓" etiqueta="Mover abajo" onPress={() => mover(i, 1)} />
                  </View>
                </View>

                <View style={s.controles}>
                  <Ajuste
                    etiqueta="Series" valor={it.series} min={1} max={10}
                    onCambio={v => cambiarItem(i, { series: v })}
                  />
                  {porTiempo ? (
                    <Ajuste
                      etiqueta="Segundos" valor={it.seg ?? 30} min={5} max={300} paso={5}
                      onCambio={v => cambiarItem(i, { seg: v })}
                    />
                  ) : (
                    <Ajuste
                      etiqueta="Reps" valor={it.reps ?? 10} min={1} max={50}
                      onCambio={v => cambiarItem(i, { reps: v })}
                    />
                  )}
                  <Ajuste
                    etiqueta="Descanso" valor={it.descansoS} min={0} max={240} paso={5}
                    onCambio={v => cambiarItem(i, { descansoS: v })}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: esp.sm, alignItems: 'center' }}>
                  {/* Cambiar la unidad: hay ejercicios que funcionan igual
                      por repeticiones que por tiempo, y quien arma la rutina
                      sabe cual prefiere. */}
                  <Chip
                    texto={porTiempo ? 'Medir por reps' : 'Medir por tiempo'}
                    pequeno
                    onPress={() => cambiarItem(i, porTiempo
                      ? { seg: undefined, reps: e.default.reps ?? 10 }
                      : { reps: undefined, seg: e.default.seg ?? 30 })}
                  />
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={() => quitar(i)} hitSlop={8}
                    accessibilityRole="button" accessibilityLabel={`Quitar ${e.name}`}>
                    <Text style={[tipo.pie, { color: color.peligro }]}>Quitar</Text>
                  </Pressable>
                </View>
              </View>
            </Aparece>
          );
        })}

        <Boton texto="Agregar ejercicio" variante="contorno"
          onPress={() => setSelector(true)} estilo={{ marginTop: esp.sm }} />
      </ScrollView>

      <View style={[s.barra, { paddingBottom: Math.max(esp.md, abajo - 60) }]}>
        <Boton texto="Cancelar" variante="texto" onPress={() => navigation.goBack()} />
        <Boton texto={original ? 'Guardar cambios' : 'Crear rutina'} onPress={guardar} estilo={{ flex: 1 }} />
      </View>
      </KeyboardAvoidingView>

      <SelectorEjercicio
        visible={selector}
        yaPuestos={r.items.map(x => x.ejercicioId)}
        onElegir={anadir}
        onCerrar={() => setSelector(false)}
      />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */

function SelectorEjercicio({ visible, yaPuestos, onElegir, onCerrar }: {
  visible: boolean; yaPuestos: string[];
  onElegir: (e: Ejercicio) => void; onCerrar: () => void;
}) {
  const { estado } = useEstado();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [soloMios, setSoloMios] = useState(true);

  const equipo = useMemo(
    () => new Set([...estado.perfil.equipo, 'ninguno', 'pared', 'silla']),
    [estado.perfil.equipo],
  );

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return EJERCICIOS.filter(e => {
      if (t && !(e.name.toLowerCase().includes(t) || (e.name_en ?? '').toLowerCase().includes(t))) return false;
      if (cat && e.category !== cat) return false;
      if (soloMios && !e.equipment.every(x => equipo.has(x))) return false;
      return true;
    });
  }, [q, cat, soloMios, equipo]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
        <View style={{ padding: esp.md, gap: esp.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[tipo.h2, { color: color.texto, flex: 1 }]}>Agregar ejercicio</Text>
            <Pressable onPress={onCerrar} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Text style={[tipo.dato, { color: color.textoSuave }]}>Cerrar</Text>
            </Pressable>
          </View>
          <Buscador valor={q} onCambio={setQ} placeholder="Buscar entre 190 ejercicios" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: esp.xs }}>
            {[{ id: null, nombre: 'Todo' }, ...CATEGORIAS].map((c, i) => (
              <Chip key={i} texto={c.nombre} pequeno activo={cat === c.id}
                onPress={() => setCat(c.id as string | null)} />
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: esp.xs }}>
            <Pressable
              onPress={() => setSoloMios(true)}
              accessibilityRole="radio"
              accessibilityState={{ selected: soloMios }}
              accessibilityLabel="Solo con mi equipo"
              style={[s.segmento, soloMios && s.segmentoActivo]}
            >
              <Text style={[tipo.micro, {
                fontFamily: soloMios ? peso.bold : peso.semibold,
                color: soloMios ? color.sobreOscuro : color.textoSuave,
              }]}>Solo con mi equipo</Text>
            </Pressable>
            <Pressable
              onPress={() => setSoloMios(false)}
              accessibilityRole="radio"
              accessibilityState={{ selected: !soloMios }}
              accessibilityLabel="Catálogo completo"
              style={[s.segmento, !soloMios && s.segmentoActivo]}
            >
              <Text style={[tipo.micro, {
                fontFamily: !soloMios ? peso.bold : peso.semibold,
                color: !soloMios ? color.sobreOscuro : color.textoSuave,
              }]}>Catálogo completo</Text>
            </Pressable>
          </View>
          <Text style={[tipo.pie, { color: color.textoSuave }]}>
            Mostrando {lista.length} {lista.length === 1 ? 'ejercicio' : 'ejercicios'}
            {soloMios ? ' para tu equipo' : ''}
          </Text>
        </View>

        <FlatList
          data={lista}
          keyExtractor={e => e.id}
          contentContainerStyle={{ paddingHorizontal: esp.md, paddingBottom: esp.xl }}
          initialNumToRender={14}
          ListEmptyComponent={soloMios ? (
            <View style={{ alignItems: 'center', gap: esp.sm }}>
              <Vacio texto="Nada con tu equipo actual." />
              <Boton texto="Ver catálogo completo" variante="contorno" onPress={() => setSoloMios(false)} />
            </View>
          ) : <Vacio texto="Nada con esa búsqueda." />}
          renderItem={({ item }) => (
            <FilaSelector item={item} puesto={yaPuestos.includes(item.id)} onElegir={onElegir} />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

/** Memoizada: la busqueda re-renderiza el selector en cada tecla sobre las
 *  190 filas posibles; `onElegir` llega estable desde el padre. */
const FilaSelector = React.memo(function FilaSelector({ item, puesto, onElegir }: {
  item: Ejercicio; puesto: boolean; onElegir: (e: Ejercicio) => void;
}) {
  return (
    <Toque onPress={puesto ? undefined : () => onElegir(item)} estilo={s.filaSelector as never}>
      <Foto tipo="ejercicio" id={item.id} nombre={item.name} alto={50} ancho={50} />
      <View style={{ flex: 1, opacity: puesto ? 0.5 : 1 }}>
        <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[tipo.pie, { color: color.textoSuave }]} numberOfLines={1}>
          {nombreEquipo(item.equipment)} · nivel {item.level}
        </Text>
      </View>
      {puesto
        ? <Text style={[tipo.micro, { color: color.textoTenue }]}>ya está</Text>
        : <Text style={{ color: color.acento, fontSize: 20 }}>+</Text>}
    </Toque>
  );
});

/* ------------------------------------------------------------------ */

function Ajuste({ etiqueta, valor, min, max, paso = 1, onCambio }: {
  etiqueta: string; valor: number; min: number; max: number; paso?: number;
  onCambio: (n: number) => void;
}) {
  const [texto, setTexto] = useState(String(valor));
  React.useEffect(() => { setTexto(String(valor)); }, [valor]);

  // Escribir el numero gana a apretar +/- muchas veces (ej. descanso de 20 a 70).
  const confirmar = () => {
    const n = parseInt(texto, 10);
    const limpio = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : valor;
    setTexto(String(limpio));
    if (limpio !== valor) onCambio(limpio);
  };

  return (
    <View style={s.ajuste}>
      <Text style={[tipo.micro, { color: color.textoSuave }]}>{etiqueta}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Mini glifo="−" etiqueta={`Restar ${etiqueta}`} onPress={() => onCambio(Math.max(min, valor - paso))} />
        <TextInput
          value={texto} onChangeText={t => setTexto(t.replace(/[^0-9]/g, ''))}
          onEndEditing={confirmar} onSubmitEditing={confirmar}
          keyboardType="number-pad" returnKeyType="done"
          style={[tipo.dato, { color: color.texto, minWidth: 30, textAlign: 'center', padding: 0 }]}
          accessibilityLabel={`Escribir ${etiqueta.toLowerCase()}`}
        />
        <Mini glifo="+" etiqueta={`Sumar ${etiqueta}`} onPress={() => onCambio(Math.min(max, valor + paso))} />
      </View>
    </View>
  );
}

function Mini({ glifo, etiqueta, onPress }: { glifo: string; etiqueta: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={s.mini}
      accessibilityRole="button" accessibilityLabel={etiqueta}>
      <Text style={{ color: color.texto, fontSize: 15 }}>{glifo}</Text>
    </Pressable>
  );
}

function Dato({ n, t }: { n: string; t: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[tipo.h2, { color: color.texto }]}>{n}</Text>
      <Text style={[tipo.micro, { color: color.textoSuave }]}>{t}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  nombre: {
    minHeight: TOQUE, borderWidth: 1, borderColor: color.borde,
    borderRadius: radio.tarjeta, paddingHorizontal: esp.md,
    color: color.texto, fontSize: 17, marginTop: esp.md,
  },
  resumen: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: color.lienzo,
    borderRadius: radio.tarjeta, paddingVertical: esp.md, marginBottom: esp.sm,
  },
  sep: { width: 1, height: 26, backgroundColor: color.borde },
  tarjeta: {
    borderWidth: 1, borderColor: color.borde, borderRadius: radio.tarjeta,
    padding: esp.sm, gap: esp.sm, marginBottom: esp.sm, backgroundColor: color.lienzo,
  },
  controles: { flexDirection: 'row', gap: esp.xs },
  ajuste: {
    flex: 1, alignItems: 'center', gap: 4, backgroundColor: color.lienzo,
    borderRadius: radio.chip, paddingVertical: esp.sm,
  },
  mini: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: color.fondo,
    borderWidth: 1, borderColor: color.borde,
    alignItems: 'center', justifyContent: 'center',
  },
  barra: {
    flexDirection: 'row', gap: esp.sm, padding: esp.md,
    borderTopWidth: 1, borderTopColor: color.borde, backgroundColor: color.fondo,
  },
  filaSelector: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm, paddingVertical: esp.sm,
    borderBottomWidth: 1, borderBottomColor: color.borde,
  },
  segmento: {
    minHeight: 24, justifyContent: 'center', paddingHorizontal: esp.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: color.borde, backgroundColor: color.velo,
    borderRadius: radio.pastilla,
  },
  segmentoActivo: { backgroundColor: color.carbon, borderColor: color.carbon },
});
