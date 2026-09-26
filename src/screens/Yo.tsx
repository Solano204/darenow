import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, tipo, esp, radio, paleta, familia, MARGEN_PANTALLA } from '../theme';
import { Pantalla, Tarjeta, Chip, useHuecoAbajo, useScrollCabecera } from '../components/ui';
import { CabeceraSeccion } from '../components/ui/AccionSeccion';
import { GomaTexture } from '../components/fx/GomaTexture';
import { BloqueRevela } from '../components/fx/BloqueRevela';
import { EncabezadoPerfil } from '../components/profile/EncabezadoPerfil';
import { EstadisticasPerfil } from '../components/profile/EstadisticasPerfil';
import { SieteDias } from '../components/profile/SieteDias';
import { CalendarioHuellas } from '../components/profile/CalendarioHuellas';
import { FavoritosPerfil } from '../components/profile/FavoritosPerfil';
import { VitrinaLogros } from '../components/profile/VitrinaLogros';
import { TarjetaReto } from '../components/profile/TarjetaReto';
import { FilaHistorial } from '../components/profile/FilaHistorial';
import { FilaAjustes } from '../components/profile/FilaAjustes';
import { textoVisible } from '../utils/presentacion';
import type { TipoFavorito } from '../utils/perfil';
import {
  useEstado, estadisticas, ultimos7, minutosPorDia, diasEntrenados,
} from '../store/store';
import { LOGROS, RETOS, programaPorId, nombreGoal } from '../data/catalog';

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
export default function Yo({ navigation }: any) {
  const inset = useSafeAreaInsets();
  const abajo = useHuecoAbajo();
  const { y, onScroll } = useScrollCabecera();
  const { estado, alternarFavorito } = useEstado();
  const { perfil, sesiones, racha, logros, favoritos, retos } = estado;
  const stats = useMemo(() => estadisticas(sesiones), [sesiones]);
  const semana = useMemo(() => ultimos7(sesiones), [sesiones]);
  const entrenados = useMemo(() => diasEntrenados(sesiones), [sesiones]);
  const minutosPor = useMemo(() => minutosPorDia(sesiones), [sesiones]);
  const programa = programaPorId.get(perfil.programaId);
  const ganados = useMemo(() => new Set(logros.map(l => l.id)), [logros]);
  const recientes = useMemo(() => sesiones.slice(-SESIONES_RECIENTES).reverse(), [sesiones]);
  const abrirFavorito = useCallback((ruta: string, id: string) => navigation.navigate(ruta, { id }), [navigation]);
  const quitarFavorito = useCallback((tipo: TipoFavorito, id: string) => alternarFavorito(tipo, id), [alternarFavorito]);

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <Animated.ScrollView
        onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset.top + 24, paddingBottom: abajo + SEPARACION_SECCIONES }}
      >
        <EncabezadoPerfil
          nombre={perfil.nombre || 'Tu progreso'} objetivoId={perfil.objetivo} objetivo={textoVisible(nombreGoal(perfil.objetivo))}
          programa={programa} semanaActual={estado.semanaPrograma}
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
                favoritos={favoritos} propias={estado.rutinasPropias} activo={activo}
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

export function Logros() {
  const { estado } = useEstado();
  const ganados = new Map(estado.logros.map(l => [l.id, l.fecha]));
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
  input: {
    flex: 1, minHeight: 46, borderWidth: 1, borderColor: color.borde,
    borderRadius: radio.tarjeta, paddingHorizontal: MARGEN_PANTALLA, color: color.texto, fontSize: 16,
  },
});
