import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, peso } from '@/ui/theme';
import { Boton, Chip, Toque, Buscador, Vacio } from '@/ui/components';
import Foto from '@/ui/components/Foto';
import { useEstadoSel } from '@/state/store';
import { EJERCICIOS, CATEGORIAS, nombreEquipo, type EjercicioIndice } from '@/data/catalog';

/** El modal «Agregar ejercicio» del editor de rutinas: busqueda, categoria y filtro de equipo. */
export function SelectorEjercicio({ visible, yaPuestos, onElegir, onCerrar }: {
  visible: boolean; yaPuestos: string[];
  onElegir: (e: EjercicioIndice) => void; onCerrar: () => void;
}) {
  const equipoPerfil = useEstadoSel(e => e.perfil.equipo);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [soloMios, setSoloMios] = useState(true);

  const equipo = useMemo(
    () => new Set([...equipoPerfil, 'ninguno', 'pared', 'silla']),
    [equipoPerfil],
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

  const renderItem = useCallback(({ item }: ListRenderItemInfo<EjercicioIndice>) => (
    <FilaSelector item={item} puesto={yaPuestos.includes(item.id)} onElegir={onElegir} />
  ), [yaPuestos, onElegir]);

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
            {[{ id: null, nombre: 'Todo' }, ...CATEGORIAS].map(c => (
              <Chip key={c.id ?? 'todo'} texto={c.nombre} pequeno activo={cat === c.id}
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

        <FlashList
          data={lista}
          extraData={yaPuestos}
          keyExtractor={e => e.id}
          contentContainerStyle={s.contenidoLista}
          ListEmptyComponent={soloMios ? (
            <View style={{ alignItems: 'center', gap: esp.sm }}>
              <Vacio texto="Nada con tu equipo actual." />
              <Boton texto="Ver catálogo completo" variante="contorno" onPress={() => setSoloMios(false)} />
            </View>
          ) : <Vacio texto="Nada con esa búsqueda." />}
          renderItem={renderItem}
        />
      </SafeAreaView>
    </Modal>
  );
}

/** Memoizada: la busqueda re-renderiza el selector en cada tecla sobre las
 *  190 filas posibles; `onElegir` llega estable desde el padre. */
const FilaSelector = React.memo(function FilaSelector({ item, puesto, onElegir }: {
  item: EjercicioIndice; puesto: boolean; onElegir: (e: EjercicioIndice) => void;
}) {
  return (
    <Toque onPress={puesto ? undefined : () => onElegir(item)} estilo={s.filaSelector as never}>
      <Foto tipo="ejercicio" id={item.id} nombre={item.name} alto={50} ancho={50} />
      <View style={puesto ? s.infoPuesta : s.info}>
        <Text style={s.nombreFila} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={s.equipoFila} numberOfLines={1}>
          {nombreEquipo(item.equipment)} · nivel {item.level}
        </Text>
      </View>
      {puesto
        ? <Text style={s.yaEsta}>ya está</Text>
        : <Text style={s.mas}>+</Text>}
    </Toque>
  );
});

const s = StyleSheet.create({
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
  contenidoLista: { paddingHorizontal: esp.md, paddingBottom: esp.xl },
  info: { flex: 1 },
  infoPuesta: { flex: 1, opacity: 0.5 },
  nombreFila: { ...tipo.cuerpo, color: color.texto, fontFamily: peso.semibold },
  equipoFila: { ...tipo.pie, color: color.textoSuave },
  yaEsta: { ...tipo.micro, color: color.textoTenue },
  mas: { color: color.acento, fontSize: 20 },
});
