/**
 * FORJA · Explorar
 *
 * Los datos, los filtros, el contador y las rutas son los de siempre (ver
 * `docs/FUNCIONALIDAD.md` §15). Lo que cambia es la presentacion:
 * - La cabecera (titulo, buscador, segmentos, filtros y contador) es opaca y fija, fuera
 *   de la FlatList y en el flujo normal del layout: no flota ni cambia de alto. Con el
 *   scroll solo el titulo encoge (`scale`). Las listas van justo debajo, con un aire fijo
 *   de 16 px antes de la primera fila (sin relleno calculado).
 * - En Ejercicios, las filas de categoria y objetivo quedan siempre visibles (no se pliegan).
 * - Cada segmento monta su propia lista; al cambiar, la vieja sale y la nueva entra
 *   desde el lado del segmento elegido.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import { type ParamListBase } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { paleta, MARGEN_PANTALLA } from '@/ui/theme';
import { Intersticial } from '@/ui/components/Anuncio';
import { SegmentosIndicador } from '@/ui/components/SegmentosIndicador';
import {
  BuscadorExplorar, ChipsCategoria, ChipsObjetivo, ContadorExplorar, MuroExplorar,
} from '@/features/explorar/components/FiltrosExplorar';
import { useResultadosExplorar } from '@/features/explorar/hooks/filtrosExplorar';
import { FilaChips, ALTO_FILA_CATEGORIA, ALTO_FILA_OBJETIVO, SEPARACION_FILAS } from '@/ui/components/EncabezadoFiltrosColapsable';
import { EncabezadoExplorar, SEP_SEGMENTOS, SEP_CONTADOR, type SegmentoExplorar } from '@/ui/components/EncabezadoExplorar';
import { RejillaMusculos } from '@/features/explorar/components/RejillaMusculos';
import { ListaEjercicios, ListaRutinas, ListaProgramas } from '@/features/explorar/components/listas';
import { useExplorar, SEGMENTOS } from '@/features/explorar/hooks/useExplorar';
import type { PropsLista } from '@/ui/components/listaBase';

// El interruptor comparte linea con el contador y en 360 px no caben las frases enteras:
// se ve la version corta y el lector de pantalla oye la completa.
export default function Explorar({ navigation, route }: BottomTabScreenProps<ParamListBase, 'Explorar'>) {
  const {
    registrarDescarga, tab, verAnuncio, setVerAnuncio, y,
    foco, esEjercicios, irATab, desbloqueada,
    onPressEjercicio, onPressRutina, onPressPrograma, entradaSegmento, salidaSegmento, propsLista,
    sinConexion, derecha, cabeceraRutinas,
  } = useExplorar({ navigation, route });
  const onPressMusculo = useCallback((id: string) => navigation.navigate('Musculo', { id }), [navigation]);
  return (
    <View style={s.raiz}>
      <EncabezadoExplorar y={y} foco={foco}>
        <View style={s.margen}>
          <BuscadorExplorar foco={foco} />
        </View>
        <View style={{ marginTop: SEP_SEGMENTOS }}>
          <SegmentosIndicador segmentos={SEGMENTOS} activo={tab} onCambio={irATab} />
        </View>
        {esEjercicios ? (
          <View style={{ paddingTop: SEPARACION_FILAS, gap: SEPARACION_FILAS }}>
            <FilaChips alto={ALTO_FILA_CATEGORIA}><ChipsCategoria /></FilaChips>
            <FilaChips alto={ALTO_FILA_OBJETIVO}><ChipsObjetivo /></FilaChips>
          </View>
        ) : tab !== 'musculos' ? (
          <View style={{ paddingTop: SEPARACION_FILAS }}>
            <FilaChips alto={ALTO_FILA_OBJETIVO}><ChipsObjetivo /></FilaChips>
          </View>
        ) : null}
        <View style={[s.margen, { marginTop: SEP_CONTADOR }]}>
          <ContadorExplorar tab={tab} junto={esEjercicios ? sinConexion : undefined} derecha={derecha} />
        </View>
      </EncabezadoExplorar>

      <View style={s.contenido}>
        <Animated.View key={tab} style={s.pantalla} entering={entradaSegmento} exiting={salidaSegmento}>
          <ResultadosSegmento
            tab={tab} propsLista={propsLista} y={y} cabeceraRutinas={cabeceraRutinas}
            onPressEjercicio={onPressEjercicio} onPressRutina={onPressRutina}
            onPressPrograma={onPressPrograma} onPressMusculo={onPressMusculo}
          />
        </Animated.View>
      </View>

      {/* Desbloqueo por categoria: se ve la lista detras del vidrio, que es
          justo lo que motiva a abrirla, pero no se puede usar todavia. */}
      <MuroExplorar
        tab={tab}
        visible={!desbloqueada}
        categoria={SEGMENTOS.find(x => x.id === tab)!.texto.toLowerCase()}
        onVerAnuncio={() => setVerAnuncio(true)}
        onVolver={() => navigation.navigate('Hoy')}
      />

      <Intersticial
        visible={verAnuncio}
        motivo="desbloqueando contenido"
        onCerrar={() => { setVerAnuncio(false); registrarDescarga(tab); }}
      />
    </View>
  );
}

/** La lista del segmento, con el resultado (diferido) de los filtros. */
function ResultadosSegmento({
  tab, propsLista, y, cabeceraRutinas, onPressEjercicio, onPressRutina, onPressPrograma, onPressMusculo,
}: {
  tab: SegmentoExplorar;
  propsLista: PropsLista;
  y: SharedValue<number>;
  cabeceraRutinas: React.ReactElement;
  onPressEjercicio: (id: string) => void;
  onPressRutina: (id: string) => void;
  onPressPrograma: (id: string) => void;
  onPressMusculo: (id: string) => void;
}) {
  const { ejercicios, rutinas, programas, musculos } = useResultadosExplorar();
  if (tab === 'ejercicios') return <ListaEjercicios ejercicios={ejercicios} propsLista={propsLista} onPress={onPressEjercicio} />;
  if (tab === 'rutinas') {
    return <ListaRutinas rutinas={rutinas} cabecera={cabeceraRutinas} propsLista={propsLista} scrollY={y} onPress={onPressRutina} />;
  }
  if (tab === 'programas') return <ListaProgramas programas={programas} propsLista={propsLista} onPress={onPressPrograma} />;
  return <RejillaMusculos musculos={musculos} propsLista={propsLista} scrollY={y} onPress={onPressMusculo} />;
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  contenido: { flex: 1 },
  pantalla: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  margen: { marginHorizontal: MARGEN_PANTALLA },
});
