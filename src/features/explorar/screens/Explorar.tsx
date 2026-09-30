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

import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { type ParamListBase } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { paleta, MARGEN_PANTALLA } from '@/ui/theme';
import { MuroCategoria, Intersticial } from '@/ui/components/Anuncio';
import { CATEGORIAS } from '@/data/catalog';
import { BuscadorVivo } from '@/ui/components/BuscadorVivo';
import { SegmentosIndicador } from '@/ui/components/SegmentosIndicador';
import { ChipCategoria } from '@/ui/components/ChipCategoria';
import { ContadorResultados } from '@/features/explorar/components/ContadorResultados';
import { FilaChips, ALTO_FILA_CATEGORIA, ALTO_FILA_OBJETIVO, SEPARACION_FILAS } from '@/ui/components/EncabezadoFiltrosColapsable';
import { EncabezadoExplorar, SEP_SEGMENTOS, SEP_CONTADOR, type SegmentoExplorar } from '@/ui/components/EncabezadoExplorar';
import { RejillaMusculos } from '@/features/explorar/components/RejillaMusculos';
import { ListaEjercicios, ListaRutinas, ListaProgramas } from '@/features/explorar/components/listas';
import { useExplorar, SEGMENTOS } from '@/features/explorar/hooks/useExplorar';

const UNIDADES: Record<SegmentoExplorar, [singular: string, plural: string]> = {
  ejercicios: ['ejercicio', 'ejercicios'], rutinas: ['rutina', 'rutinas'],
  programas: ['programa', 'programas'], musculos: ['músculo', 'músculos'],
};
// El interruptor comparte linea con el contador y en 360 px no caben las frases enteras:
// se ve la version corta y el lector de pantalla oye la completa.
export default function Explorar({ navigation, route }: BottomTabScreenProps<ParamListBase, 'Explorar'>) {
  const {
    alternarFavorito, registrarDescarga, tab, q, setQ, cat, setCat, verAnuncio, setVerAnuncio, y,
    foco, esEjercicios, irATab, desbloqueada, ejercicios, rutinas, programas, musculos, cuantos,
    onPressEjercicio, onFavEjercicio, favorito, entradaSegmento, salidaSegmento, propsLista,
    chipsObjetivo, sinConexion, derecha, cabeceraRutinas,
  } = useExplorar({ navigation, route });
  return (
    <View style={s.raiz}>
      <EncabezadoExplorar y={y} foco={foco}>
        <View style={s.margen}>
          <BuscadorVivo valor={q} onCambio={setQ} foco={foco} />
        </View>
        <View style={{ marginTop: SEP_SEGMENTOS }}>
          <SegmentosIndicador segmentos={SEGMENTOS} activo={tab} onCambio={irATab} />
        </View>
        {esEjercicios ? (
          <View style={{ paddingTop: SEPARACION_FILAS, gap: SEPARACION_FILAS }}>
            <FilaChips alto={ALTO_FILA_CATEGORIA}>
              {[{ id: null, nombre: 'Todo' }, ...CATEGORIAS].map(c => (
                <ChipCategoria
                  key={c.id ?? 'todo'} texto={c.nombre} activo={cat === c.id} onPress={() => setCat(c.id)}
                />
              ))}
            </FilaChips>
            <FilaChips alto={ALTO_FILA_OBJETIVO}>{chipsObjetivo}</FilaChips>
          </View>
        ) : tab !== 'musculos' ? (
          <View style={{ paddingTop: SEPARACION_FILAS }}>
            <FilaChips alto={ALTO_FILA_OBJETIVO}>{chipsObjetivo}</FilaChips>
          </View>
        ) : null}
        <View style={[s.margen, { marginTop: SEP_CONTADOR }]}>
          <ContadorResultados
            cuantos={cuantos} singular={UNIDADES[tab][0]} plural={UNIDADES[tab][1]}
            junto={esEjercicios ? sinConexion : undefined} derecha={derecha}
          />
        </View>
      </EncabezadoExplorar>

      <View style={s.contenido}>
        <Animated.View key={tab} style={s.pantalla} entering={entradaSegmento} exiting={salidaSegmento}>
          {tab === 'ejercicios' && (
            <ListaEjercicios
              ejercicios={ejercicios} propsLista={propsLista} favorito={favorito('ejercicios')}
              onFav={onFavEjercicio} onPress={onPressEjercicio}
            />
          )}
          {tab === 'rutinas' && (
            <ListaRutinas
              rutinas={rutinas} cabecera={cabeceraRutinas} propsLista={propsLista} scrollY={y} favorito={favorito('rutinas')}
              onFav={id => alternarFavorito('rutinas', id)} onPress={id => navigation.navigate('Rutina', { id })}
            />
          )}
          {tab === 'programas' && (
            <ListaProgramas
              programas={programas} propsLista={propsLista} favorito={favorito('programas')}
              onFav={id => alternarFavorito('programas', id)} onPress={id => navigation.navigate('Programa', { id })}
            />
          )}
          {tab === 'musculos' && (
            <RejillaMusculos
              musculos={musculos} propsLista={propsLista} scrollY={y}
              onPress={id => navigation.navigate('Musculo', { id })}
            />
          )}
        </Animated.View>
      </View>

      {/* Desbloqueo por categoria: se ve la lista detras del vidrio, que es
          justo lo que motiva a abrirla, pero no se puede usar todavia. */}
      <MuroCategoria
        visible={!desbloqueada}
        categoria={SEGMENTOS.find(x => x.id === tab)!.texto.toLowerCase()}
        cuantos={cuantos}
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

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  contenido: { flex: 1 },
  pantalla: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  margen: { marginHorizontal: MARGEN_PANTALLA },
});
