/**
 * FORJA · Hoy
 *
 * La sesion del dia arriba con un solo boton azul, y debajo el descubrimiento:
 * enfoque, otras rutinas, la semana, el programa y cuatro filas de contenido.
 * Todos los datos, filtros y saltos de navegacion son los de antes del
 * rediseno (ver `docs/FUNCIONALIDAD.md`, seccion 12); aqui solo cambia como se
 * ven y se mueven.
 *
 * El intersticial aparece aqui como maximo una vez al dia, y nunca la primera
 * vez que alguien abre la app.
 */

import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { paleta, esp } from '@/ui/theme';
import { HeaderColapsable, ALTO_HEADER } from '@/ui/fx/HeaderColapsable';
import { CabeceraSeccion } from '@/ui/components/AccionSeccion';
import { BannerAnuncio, ANUNCIOS_ACTIVOS } from '@/ui/components/Anuncio';
import { TarjetaSesionHoy, TarjetaSesionVacia } from '@/ui/components/TarjetaSesionHoy';
import { TarjetaEnfoque, ANCHO_ENFOQUE, ALTO_ENFOQUE, CABEZA_ENFOQUE } from '@/ui/components/TarjetaEnfoque';
import { CarruselProfundidad } from '@/ui/fx/CarruselProfundidad';
import { CarruselHoy, TarjetaVerMas } from '@/ui/components/CarruselHoy';
import { TarjetaRutina, ANCHO_TARJETA_RUTINA, ALTO_FOTO_RUTINA } from '@/features/hoy/components/TarjetaRutina';
import { NubeRefresco } from '@/features/hoy/components/NubeRefresco';
import { FilaSemana } from '@/ui/components/FilaSemana';
import { BloqueRevela } from '@/ui/fx/BloqueRevela';
import { TuSemana } from '@/features/hoy/components/TuSemana';
import { FilaExplorar } from '@/features/hoy/components/FilaExplorar';
import { TuPrograma } from '@/features/hoy/components/TuPrograma';
import { TarjetaPrograma, ANCHO_TARJETA_PROGRAMA, ALTO_FOTO_PROGRAMA } from '@/features/hoy/components/TarjetaPrograma';
import {
  TarjetaEjercicioMini, FichaMusculo, TarjetaArticulo,
  ANCHO_EJERCICIO_MINI, ALTO_EJERCICIO_MINI, LADO_MUSCULO, ANCHO_ARTICULO, ALTO_ARTICULO,
} from '@/features/hoy/components/TarjetasHoy';
import { EstadisticasHoy } from '@/features/hoy/components/EstadisticasHoy';
import { nombreGoal } from '@/data/catalog';
import { saludo } from '@/data/mensajes';
import { useHoy } from '@/features/hoy/hooks/useHoy';

const SEPARACION_MODULOS = 48;
const SEPARACION_BLOQUES = 32;
const AIRE_FINAL = 32;
const SEPARACION_CARRUSEL = 16;
const ALTO_CARRUSEL_ENFOQUE = ALTO_ENFOQUE + CABEZA_ENFOQUE;
const ALTO_CARRUSEL_RUTINAS = 236;

export default function Hoy({ navigation }: { navigation: NavigationProp<ParamListBase> }) {
  const {
    abajo, inset, y, onScroll, semanaPrograma, perfil, racha, refrescando,
    stats, semana, entrenoHoy, programa, sesion, avisosSesion, sinEjercicios, rutinas, programas,
    ejercicios, musculosDeHoy, musculos, tips, sello, refrescar, irAExplorar, irAAprender, empezar,
    cincoMinutos, abrirRutina, abrirPrograma, abrirEjercicio, abrirMusculo, abrirTip,
  } = useHoy({ navigation });
  return (
    <View style={s.raiz}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: inset.top + ALTO_HEADER + esp.sm,
          paddingBottom: abajo + AIRE_FINAL + (ANUNCIOS_ACTIVOS ? 62 : 0),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refrescando} onRefresh={refrescar}
            tintColor="transparent" colors={[paleta.placaAzul]} progressBackgroundColor={paleta.gomaAlta}
            progressViewOffset={inset.top + ALTO_HEADER}
          />
        )}
      >
        {sinEjercicios ? (
          <TarjetaSesionVacia onRevisar={() => navigation.navigate('Tabs', { screen: 'Yo' })} />
        ) : (
          <TarjetaSesionHoy
            sesion={sesion} avisos={avisosSesion} objetivo={nombreGoal(perfil.objetivo)}
            sinSaltos={perfil.modoSinSaltos} entrenoHoy={entrenoHoy} sello={sello} y={y}
            onEmpezar={empezar} onCincoMinutos={cincoMinutos}
          />
        )}

        {ejercicios.length > 0 && (
          <View style={s.bloque}>
            <CabeceraSeccion titulo="Elige tu enfoque" grande />
            <CarruselProfundidad
              data={ejercicios.slice(0, 3)}
              keyExtractor={e => e.id}
              ancho={ANCHO_ENFOQUE} alto={ALTO_CARRUSEL_ENFOQUE}
              renderItem={(e, _, progreso) => (
                <TarjetaEnfoque
                  ejercicio={e} progreso={progreso}
                  onPress={() => navigation.navigate('Ejercicio', { id: e.id })}
                />
              )}
            />
          </View>
        )}

        <View style={s.bloque}>
          <CabeceraSeccion titulo="¿Prefieres otra rutina?" accion="Ver todas" onAccion={() => irAExplorar('rutinas')} grande />
          <CarruselProfundidad
            data={rutinas} keyExtractor={r => r.id}
            ancho={ANCHO_TARJETA_RUTINA} alto={ALTO_CARRUSEL_RUTINAS} suave
            renderItem={(r, _, progreso) => (
              <TarjetaRutina r={r} progreso={progreso} onPress={abrirRutina} />
            )}
            pie={<TarjetaVerMas ancho={ANCHO_TARJETA_RUTINA} texto="Ver todas" alto={ALTO_FOTO_RUTINA} onPress={() => irAExplorar('rutinas')} />}
          />
        </View>

        <BloqueRevela y={y} estilo={s.modulo}>
          {activo => (
            <>
              <CabeceraSeccion titulo="Tu semana" />
              <FilaSemana semana={semana} sello={sello} />
              <View style={s.entreFilas} />
              <TuSemana dias={racha.dias} enPausa={racha.enPausa} semana={semana} activo={activo} />
            </>
          )}
        </BloqueRevela>

        <BloqueRevela y={y} estilo={s.modulo}>
          {activo => <FilaExplorar activo={activo} onPress={() => irAExplorar()} />}
        </BloqueRevela>

        {programa && (
          <BloqueRevela y={y} estilo={s.modulo}>
            {() => (
              <>
                <CabeceraSeccion
                  titulo="Tu programa" accion="Ver"
                  onAccion={() => navigation.navigate('Programa', { id: programa.id })}
                />
                <TuPrograma
                  programa={programa} semanaActual={semanaPrograma}
                  onPress={() => navigation.navigate('Programa', { id: programa.id })}
                />
              </>
            )}
          </BloqueRevela>
        )}

        <View style={s.modulo}>
          <CabeceraSeccion titulo="Programas" accion="Ver todos" onAccion={() => irAExplorar('programas')} />
          <CarruselHoy
            data={programas} keyExtractor={p => p.id} ancho={ANCHO_TARJETA_PROGRAMA} separacion={SEPARACION_CARRUSEL}
            renderItem={p => (
              <TarjetaPrograma p={p} onPress={abrirPrograma} />
            )}
            verMas={{ texto: 'Ver todos', onPress: () => irAExplorar('programas'), alto: ALTO_FOTO_PROGRAMA }}
          />
        </View>

        <View style={s.modulo}>
          <CabeceraSeccion titulo="Ejercicios para ti" accion="Ver todos" onAccion={() => irAExplorar('ejercicios')} />
          <CarruselHoy
            data={ejercicios} keyExtractor={e => e.id} ancho={ANCHO_EJERCICIO_MINI}
            renderItem={e => (
              <TarjetaEjercicioMini e={e} onPress={abrirEjercicio} />
            )}
            verMas={{ texto: 'Ver todos', onPress: () => irAExplorar('ejercicios'), alto: ALTO_EJERCICIO_MINI }}
          />
        </View>

        <View style={s.modulo}>
          <CabeceraSeccion titulo="Músculos de hoy" accion="Ver todos" onAccion={() => irAExplorar('musculos')} />
          <CarruselHoy
            data={musculos} keyExtractor={m => m.id} ancho={LADO_MUSCULO}
            renderItem={m => (
              <FichaMusculo m={m} trabajaHoy={musculosDeHoy.has(m.id)} onPress={abrirMusculo} />
            )}
            verMas={{ texto: 'Ver todos', onPress: () => irAExplorar('musculos'), alto: LADO_MUSCULO, radioEsquina: 24 }}
          />
        </View>

        <View style={s.modulo}>
          <CabeceraSeccion titulo="Para leer hoy" accion="Ver más" onAccion={irAAprender} />
          <CarruselHoy
            data={tips} keyExtractor={t => t.id} ancho={ANCHO_ARTICULO} separacion={SEPARACION_CARRUSEL}
            renderItem={t => (
              <TarjetaArticulo t={t} onPress={abrirTip} />
            )}
            verMas={{ texto: 'Ver más', onPress: irAAprender, alto: ALTO_ARTICULO }}
          />
        </View>

        {stats.total > 0 && (
          <BloqueRevela y={y} estilo={s.modulo} sinMovimiento>
            {activo => (
              <>
                <CabeceraSeccion titulo="Tu progreso" />
                <EstadisticasHoy
                  sesiones={stats.total} minutos={stats.minutos} series={stats.series} mejorRacha={racha.mejor}
                  activo={activo}
                />
              </>
            )}
          </BloqueRevela>
        )}
      </Animated.ScrollView>

      <NubeRefresco y={y} arriba={inset.top + ALTO_HEADER} />

      <HeaderColapsable
        y={y}
        saludo={saludo(perfil.nombre || undefined)}
        titulo={entrenoHoy ? 'Ya entrenaste hoy' : 'Tu sesión de hoy'}
        accion={{ icono: 'search', etiqueta: 'Buscar', onPress: () => irAExplorar() }}
      />

      {/* Banner fijo abajo, la unica publicidad de esta pantalla. `bottom: abajo` lo
          apoya justo encima de la barra de pestanas flotante: no una posicion fija,
          para no volver a tapar la barra si su alto cambia (inset del telefono). */}
      {ANUNCIOS_ACTIVOS && (
        <View style={[s.bannerAbajo, { bottom: abajo }]} pointerEvents="box-none">
          <BannerAnuncio flotante />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  modulo: { marginTop: SEPARACION_MODULOS },
  bloque: { marginTop: SEPARACION_BLOQUES },
  entreFilas: { height: esp.md },
  bannerAbajo: { position: 'absolute', left: 24, right: 24 },
});
