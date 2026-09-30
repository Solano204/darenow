/**
 * FORJA · editor de rutinas
 *
 * El usuario arma su propia rutina: elige ejercicios del catalogo y define
 * series, repeticiones o segundos y descanso de cada uno.
 *
 * Tres decisiones:
 *
 * 1. Los avisos no bloquean. Si mete un ejercicio que carga una lesion que
 *    el mismo declaro, se lo decimos, pero la rutina es suya y decide el.
 *    Distinto de las sesiones que genera la app, donde el filtro es duro:
 *    ahi elegimos nosotros, aqui elige el.
 *
 * 2. Se guarda solo al tocar Guardar. Un editor que persiste cada tecla
 *    deja rutinas a medias por todos lados cuando alguien entra a mirar.
 *
 * 3. Armar una rutina es cargar una barra: cada ejercicio es una placa
 *    (`BarraRutina`). La barra y el resumen se quedan pegados arriba al bajar.
 *    Toda la logica es la de siempre (`docs/FUNCIONALIDAD.md` §16); lo nuevo es la
 *    presentacion, los errores en linea (antes eran alertas) y la hoja de descartar.
 */

import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tipo, paleta, familia, conAlfa, MARGEN_PANTALLA, haptico } from '@/ui/theme';
import { Nota } from '@/ui/components';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { porId, GOALS } from '@/data/catalog';
import { ChipFiltro } from '@/ui/components/ChipFiltro';
import { FilaChips } from '@/ui/components/EncabezadoFiltrosColapsable';
import { FilaCrear } from '@/ui/components/FilaCrear';
import { BarraRutina } from '@/ui/components/BarraRutina';
import { ResumenRutina } from '@/features/rutinas/components/ResumenRutina';
import { CampoTitulo, TextoError } from '@/features/rutinas/components/CampoTitulo';
import { TarjetaEjercicioRutina } from '@/features/rutinas/components/TarjetaEjercicioRutina';
import { HojaDescartar } from '@/features/rutinas/components/HojaDescartar';
import { SelectorEjercicio } from '@/features/rutinas/components/SelectorEjercicio';
import {
  useEditorRutina, ALTO_PEGAJOSO, PADDING_PEGAJOSO, type PropsEditorRutina,
} from '@/features/rutinas/hooks/useEditorRutina';

const ALTO_FILA_OBJETIVO = 36;


export default function EditorRutina({ route, navigation }: PropsEditorRutina) {
  const {
    original, r, set, errores, setErrores, claves, frase, levantar, series, minutos, avisos, vacia,
    posicionesRef, umbral, scroll, alDesplazar, pegajoso, montada, movida, recien, cambiarItem, mover, quitar, alMedir,
    selector, setSelector, anadir, botonCrear, guardar, accionPendiente, setAccionPendiente, descartar,
  } = useEditorRutina(route, navigation);
  return (
    <View style={s.raiz}>
      <GomaTexture />
      <SafeAreaView style={s.llena} edges={['bottom']}>
        <KeyboardAvoidingView style={s.llena} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.ScrollView
            ref={scroll} onScroll={alDesplazar} scrollEventThrottle={16}
            onLayout={(e: LayoutChangeEvent) => { posicionesRef.current.vista = e.nativeEvent.layout.height; }}
            contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          >
            <View style={s.margen}>
              <Text style={s.etiquetaPantalla} accessibilityRole="header">
                {original ? 'Editar rutina' : 'Crear rutina'}
              </Text>
              <View style={s.campo}>
                <CampoTitulo
                  valor={r.nombre}
                  onCambio={t => { set({ nombre: t }); if (errores.nombre) setErrores(x => ({ ...x, nombre: undefined })); }}
                />
              </View>
              {errores.nombre ? <TextoError key={errores.intento} texto={errores.nombre} /> : null}
            </View>

            <Text style={[s.etiqueta, s.margen, s.separaObjetivo]}>Objetivo</Text>
            <View style={s.filaObjetivo}>
              <FilaChips alto={ALTO_FILA_OBJETIVO}>
                {GOALS.map(g => (
                  <ChipFiltro
                    key={g.id} texto={g.nombre} icono={ICONOS_OBJETIVO[g.id]} activo={r.objetivo === g.id}
                    onPress={() => set({ objetivo: g.id })}
                  />
                ))}
              </FilaChips>
            </View>

            <View
              style={[s.margen, s.bloqueBarra]}
              onLayout={(e: LayoutChangeEvent) => {
                umbral.set(e.nativeEvent.layout.y + e.nativeEvent.layout.height - ALTO_PEGAJOSO);
              }}
            >
              <BarraRutina ids={claves} etiqueta={`Rutina: ${frase}`} levantar={levantar} cargaInicial={!!route.params?.desdeCopia} />
              <View style={s.resumen}>
                <ResumenRutina ejercicios={r.items.length} series={series} minutos={minutos} />
              </View>
            </View>

            {avisos.length > 0 && (
              <View style={[s.margen, s.avisos]}>
                {avisos.map((a, i) => (
                  <Nota key={a} texto={a} tono="cuidado" titulo={i === 0 ? 'Revisa' : undefined} />
                ))}
              </View>
            )}

            <View
              style={[s.margen, s.tituloEjercicios]}
              onLayout={(e: LayoutChangeEvent) => { posicionesRef.current.ejercicios = e.nativeEvent.layout.y; }}
            >
              <Text style={s.titulo} accessibilityRole="header">Ejercicios</Text>
              {vacia && (
                <Text style={s.vacio}>Todavía no hay ninguno. Toca el botón de abajo para agregar el primero.</Text>
              )}
              {errores.items ? <TextoError key={errores.intento} texto={errores.items} /> : null}
            </View>

            <View
              style={[s.margen, s.lista]}
              onLayout={(e: LayoutChangeEvent) => { posicionesRef.current.lista = e.nativeEvent.layout.y; }}
            >
              {r.items.map((it, i) => {
                const e = porId.get(it.ejercicioId);
                if (!e) return null;
                const clave = claves[i];
                return (
                  <TarjetaEjercicioRutina
                    key={clave} item={it} ejercicio={e} indice={i} animarEntrada={montada.current}
                    impulso={movida.id === clave ? movida.n : 0} brillo={recien.id === clave ? recien.n : 0}
                    onCambio={cambio => cambiarItem(i, cambio)}
                    onMover={dir => mover(i, dir)}
                    onQuitar={() => quitar(i)}
                    onAbrir={() => navigation.navigate('Ejercicio', { id: e.id })}
                    alMedir={alMedir(clave)}
                  />
                );
              })}
            </View>

            <View style={[s.margen, s.agregar]}>
              <FilaCrear texto="Agregar ejercicio" pulsar={vacia} onPress={() => setSelector(true)} />
            </View>
          </Animated.ScrollView>

          <View style={s.pie}>
            <Pressable
              onPress={() => { haptico.toque(); navigation.goBack(); }}
              accessibilityRole="button" accessibilityLabel="Cancelar" style={s.cancelar}
            >
              <Text style={s.cancelarTexto} maxFontSizeMultiplier={1.15}>Cancelar</Text>
            </Pressable>
            <View ref={botonCrear} collapsable={false} style={s.crear}>
              <BotonPlaca texto={original ? 'Guardar cambios' : 'Crear rutina'} onPress={guardar} />
            </View>
          </View>
        </KeyboardAvoidingView>

        <Animated.View
          style={[s.pegajoso, pegajoso]} pointerEvents="none"
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        >
          <BarraRutina ids={claves} etiqueta={frase} compacta silenciosa />
          <View style={s.resumenPegajoso}>
            <ResumenRutina ejercicios={r.items.length} series={series} minutos={minutos} compacto />
          </View>
        </Animated.View>
      </SafeAreaView>

      <SelectorEjercicio
        visible={selector}
        yaPuestos={r.items.map(x => x.ejercicioId)}
        onElegir={anadir}
        onCerrar={() => setSelector(false)}
      />
      <HojaDescartar
        visible={accionPendiente !== null}
        onDescartar={descartar}
        onSeguir={() => setAccionPendiente(null)}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  llena: { flex: 1 },
  contenido: { paddingTop: 8, paddingBottom: 24 },
  margen: { marginHorizontal: MARGEN_PANTALLA },
  etiquetaPantalla: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
  campo: { marginTop: 4 },
  etiqueta: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  separaObjetivo: { marginTop: 24 },
  filaObjetivo: { marginTop: 8 },
  bloqueBarra: { marginTop: 24 },
  resumen: { marginTop: 12 },
  avisos: { marginTop: 16 },
  tituloEjercicios: { marginTop: 32 },
  titulo: { ...tipo.h1, color: paleta.magnesia },
  vacio: { ...tipo.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2, marginTop: 8 },
  lista: { marginTop: 12, gap: 12 },
  agregar: { marginTop: 12 },
  pie: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: MARGEN_PANTALLA, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: paleta.gomaBorde, backgroundColor: paleta.goma,
  },
  cancelar: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  cancelarTexto: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia2 },
  crear: { flex: 1 },
  pegajoso: {
    position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: MARGEN_PANTALLA, paddingVertical: PADDING_PEGAJOSO,
    backgroundColor: conAlfa(paleta.goma, 0.92), borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde,
  },
  resumenPegajoso: { marginTop: 4 },
});
