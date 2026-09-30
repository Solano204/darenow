import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, tipo, esp, paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { Pantalla, Tarjeta, Chip, useHuecoAbajo, useScrollCabecera } from '@/ui/components';
import { CabeceraSeccion } from '@/ui/components/AccionSeccion';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { BloqueRevela } from '@/ui/fx/BloqueRevela';
import { EncabezadoPerfil } from '@/features/perfil/components/EncabezadoPerfil';
import { EstadisticasPerfil } from '@/features/perfil/components/EstadisticasPerfil';
import { SieteDias } from '@/ui/components/SieteDias';
import { CalendarioHuellas } from '@/features/perfil/components/CalendarioHuellas';
import { FavoritosPerfil } from '@/features/perfil/components/FavoritosPerfil';
import { VitrinaLogros } from '@/features/perfil/components/VitrinaLogros';
import { TarjetaReto } from '@/features/perfil/components/TarjetaReto';
import { FilaHistorial } from '@/features/perfil/components/FilaHistorial';
import { FilaAjustes } from '@/features/perfil/components/FilaAjustes';
import { textoVisible } from '@/lib/presentacion';
import type { TipoFavorito } from '@/lib/perfil';
import {
  useEstadoSel, usePerfil, useSesiones, useRutinasPropias, estadisticas, ultimos7, minutosPorDia, diasEntrenados,
} from '@/state/store';
import { alternarFavorito } from '@/state/acciones';
import { programaPorId, nombreGoal } from '@/data/catalog';
import { LOGROS, RETOS } from '@/data/logros';
import type { ParamListBase } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/* ==================================================================== YO */

const SEPARACION_SECCIONES = 40;
const SESIONES_RECIENTES = 3;
const LOGROS_VISIBLES = 8;
const RETOS_VISIBLES = 3;

/**
 * Yo: tu libreta de entrenamiento. Lo que cargaste, cuando apareciste y lo que llevas ganado, sin castigar lo
 * que falta (ver `docs/FUNCIONALIDAD.md` §21). Los datos, los calculos y las rutas son los de siempre; cambia
 * como se ven: cada seccion es un bloque que se revela una vez al entrar en pantalla y todas sus acciones
 * («Ver todos», «Todos», «Ver», «Registrar», «Ver todo») son el mismo enlace de texto.
 */
export default function Yo({ navigation }: BottomTabScreenProps<ParamListBase, 'Yo'>) {
  const inset = useSafeAreaInsets();
  const abajo = useHuecoAbajo();
  const { y, onScroll } = useScrollCabecera();
  const perfil = usePerfil();
  const sesiones = useSesiones();
  const racha = useEstadoSel(e => e.racha);
  const logros = useEstadoSel(e => e.logros);
  const favoritos = useEstadoSel(e => e.favoritos);
  const retos = useEstadoSel(e => e.retos);
  const semanaPrograma = useEstadoSel(e => e.semanaPrograma);
  const rutinasPropias = useRutinasPropias();
  const stats = useMemo(() => estadisticas(sesiones), [sesiones]);
  const semana = useMemo(() => ultimos7(sesiones), [sesiones]);
  const entrenados = useMemo(() => diasEntrenados(sesiones), [sesiones]);
  const minutosPor = useMemo(() => minutosPorDia(sesiones), [sesiones]);
  const programa = programaPorId.get(perfil.programaId);
  const ganados = useMemo(() => new Set(logros.map(l => l.id)), [logros]);
  const recientes = useMemo(() => sesiones.slice(-SESIONES_RECIENTES).reverse(), [sesiones]);
  const abrirFavorito = useCallback((ruta: string, id: string) => navigation.navigate(ruta, { id }), [navigation]);
  const quitarFavorito = useCallback((tipo: TipoFavorito, id: string) => alternarFavorito(tipo, id), []);

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <Animated.ScrollView
        onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset.top + 24, paddingBottom: abajo + SEPARACION_SECCIONES }}
      >
        <EncabezadoPerfil
          nombre={perfil.nombre || 'Tu progreso'} objetivoId={perfil.objetivo} objetivo={textoVisible(nombreGoal(perfil.objetivo))}
          programa={programa} semanaActual={semanaPrograma}
        />

        <BloqueRevela y={y} sinMovimiento estilo={s.seccion}>
          {activo => (
            <EstadisticasPerfil racha={racha.dias} sesiones={stats.total} minutos={stats.minutos} series={stats.series} activo={activo} />
          )}
        </BloqueRevela>

        <BloqueRevela y={y} sinMovimiento estilo={s.seccion}>
          {activo => (
            <>
              <CabeceraSeccion titulo="Últimos 7 días" />
              {stats.total > 0
                ? <SieteDias semana={semana} activo={activo} />
                : <Text style={s.suave}>Cuando entrenes, aquí vas a ver tu semana.</Text>}
            </>
          )}
        </BloqueRevela>

        <BloqueRevela y={y} sinMovimiento fraccion={0.3} estilo={s.seccion}>
          {activo => (
            <>
              <CabeceraSeccion titulo="Tu calendario" />
              <CalendarioHuellas entrenados={entrenados} minutosPor={minutosPor} activo={activo} />
            </>
          )}
        </BloqueRevela>

        <BloqueRevela y={y} sinMovimiento estilo={s.seccion}>
          {activo => (
            <>
              <CabeceraSeccion titulo="Favoritos" accion="Ver todos" onAccion={() => navigation.navigate('Favoritos')} />
              <FavoritosPerfil
                favoritos={favoritos} propias={rutinasPropias} activo={activo}
                onAbrir={abrirFavorito} onQuitar={quitarFavorito}
              />
            </>
          )}
        </BloqueRevela>

        <BloqueRevela y={y} sinMovimiento fraccion={0.3} estilo={s.seccion}>
          {activo => (
            <>
              <CabeceraSeccion titulo="Logros" accion="Todos" onAccion={() => navigation.navigate('Logros')} />
              <VitrinaLogros logros={LOGROS.slice(0, LOGROS_VISIBLES)} ganados={ganados} total={LOGROS.length} activo={activo} />
            </>
          )}
        </BloqueRevela>

        <BloqueRevela y={y} sinMovimiento estilo={s.seccion}>
          {activo => (
            <>
              <CabeceraSeccion titulo="Retos" accion="Ver" onAccion={() => navigation.navigate('Retos')} />
              {RETOS.slice(0, RETOS_VISIBLES).map((r, i) => (
                <TarjetaReto
                  key={r.id} reto={r} progreso={retos[r.id]?.progreso} indice={i} activo={activo}
                  onPress={() => navigation.navigate('Retos')}
                />
              ))}
            </>
          )}
        </BloqueRevela>

        <View style={s.seccion}>
          <CabeceraSeccion titulo="Mediciones" accion="Registrar" onAccion={() => navigation.navigate('Mediciones')} />
          <Text style={s.suave}>
            Protocolos repetibles para que las comparaciones signifiquen algo. Todas son opcionales.
          </Text>
        </View>

        <View style={s.seccion}>
          <CabeceraSeccion titulo="Historial" accion="Ver todo" onAccion={() => navigation.navigate('Historial')} />
          {recientes.map(x => <FilaHistorial key={x.id} sesion={x} />)}
          {sesiones.length === 0 && <Text style={s.suave}>Aún no hay sesiones.</Text>}
        </View>

        <View style={s.seccion}>
          <FilaAjustes onPress={() => navigation.navigate('Ajustes')} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}


/* =============================================================== LOGROS */

/** @public Pantalla del Stack: App.tsx la carga con getComponent (require), que knip no sigue. */
export function Logros() {
  const logros = useEstadoSel(e => e.logros);
  const ganados = new Map(logros.map(l => [l.id, l.fecha]));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['bottom']}>
      <Pantalla>
        <Text style={[tipo.h1, { color: color.texto }]}>Logros</Text>
        <Text style={[tipo.pie, { color: color.textoSuave, marginBottom: esp.md }]}>
          {ganados.size} de {LOGROS.length}. Ninguno depende del peso ni de una medida
          corporal: se premia aparecer, sostener y mejorar.
        </Text>
        {LOGROS.map(l => {
          const g = ganados.has(l.id);
          return (
            <Tarjeta key={l.id} estilo={!g ? { opacity: 0.5 } : undefined}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: esp.sm }}>
                <Text style={[tipo.h3, { color: color.texto, flex: 1 }]}>{l.name}</Text>
                {g && <Text style={[tipo.micro, { color: color.carbon }]}>{ganados.get(l.id)}</Text>}
              </View>
              <Text style={[tipo.pie, { color: color.textoSuave }]}>{l.desc}</Text>
              <Chip texto={l.categoria} pequeno />
            </Tarjeta>
          );
        })}
      </Pantalla>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  seccion: { marginTop: SEPARACION_SECCIONES },
  suave: { marginHorizontal: MARGEN_PANTALLA, fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2 },
});
