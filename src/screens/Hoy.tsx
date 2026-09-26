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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { paleta, esp, haptico } from '../theme';
import { useHuecoAbajo, useScrollCabecera } from '../components/ui';
import { HeaderColapsable, ALTO_HEADER } from '../components/ui/HeaderColapsable';
import { CabeceraSeccion } from '../components/ui/AccionSeccion';
import { BannerAnuncio, ANUNCIOS_ACTIVOS } from '../components/Anuncio';
import { useMagnesia } from '../components/fx/MagnesiaOverlay';
import { TarjetaSesionHoy, TarjetaSesionVacia } from '../components/hoy/TarjetaSesionHoy';
import { TarjetaEnfoque, ANCHO_ENFOQUE, ALTO_ENFOQUE, CABEZA_ENFOQUE } from '../components/hoy/TarjetaEnfoque';
import { CarruselProfundidad } from '../components/hoy/CarruselProfundidad';
import { CarruselHoy } from '../components/hoy/CarruselHoy';
import { TarjetaRutina, ANCHO_TARJETA_RUTINA, type RutinaHoy } from '../components/hoy/TarjetaRutina';
import { FilaSemana } from '../components/hoy/FilaSemana';
import { BloqueRevela } from '../components/hoy/BloqueRevela';
import { TuSemana } from '../components/hoy/TuSemana';
import { FilaExplorar } from '../components/hoy/FilaExplorar';
import { TuPrograma } from '../components/hoy/TuPrograma';
import { PilaProgramas } from '../components/hoy/PilaProgramas';
import {
  TarjetaEjercicioMini, FichaMusculo, TarjetaArticulo,
  ANCHO_EJERCICIO_MINI, ALTO_EJERCICIO_MINI, ANCHO_MUSCULO, ALTO_MUSCULO, ANCHO_ARTICULO, ALTO_ARTICULO,
} from '../components/hoy/TarjetasHoy';
import { EstadisticasHoy } from '../components/hoy/EstadisticasHoy';
import { useEstado, estadisticas, ultimos7, hoy, imagenRutina } from '../store/store';
import { armarSesion, sesionDeRutina, minutosPropios, type Perfil } from '../engine/session';
import {
  RUTINAS, PROGRAMAS, EJERCICIOS, MUSCULOS, TIPS, programaPorId, nombreGoal, salaPorId,
} from '../data/catalog';
import { saludo } from '../data/mensajes';

const SEPARACION_MODULOS = 48;
const ALTO_CARRUSEL_ENFOQUE = ALTO_ENFOQUE + CABEZA_ENFOQUE;
const DURACION_REFRESCO_MS = 700;
const ID_RUTINA_CINCO_MIN = 'rt_030';

export default function Hoy({ navigation }: { navigation: NavigationProp<ParamListBase> }) {
  const abajo = useHuecoAbajo();
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const magnesia = useMagnesia();
  const { y, onScroll } = useScrollCabecera();
  const { estado, ultimaVezDe, alternarFavorito, esFavorito } = useEstado();
  const { perfil, sesiones, racha } = estado;

  const [fecha, setFecha] = useState(hoy());
  const [refrescando, setRefrescando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  const perfilMotor: Perfil = perfil;
  const stats = useMemo(() => estadisticas(sesiones), [sesiones]);
  const semana = useMemo(() => ultimos7(sesiones), [sesiones]);
  const sesionesHoy = sesiones.filter(s => s.fecha === hoy()).length;
  const entrenoHoy = sesionesHoy > 0;
  const programa = programaPorId.get(perfil.programaId);

  const semilla = useMemo(() => {
    let h = 2166136261; const s = fecha + perfil.objetivo;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }, [perfil.objetivo, fecha]);

  const sesion = useMemo(
    () => armarSesion(perfilMotor, semilla, ultimaVezDe),
    [perfilMotor, semilla, ultimaVezDe],
  );

  // Avisos derivados en la pantalla, sin tocar el motor: si el resultado
  // quedo mas corto de lo pedido, se dice en una linea; nunca se ofrece
  // una sesion mas larga de lo que el usuario declaro que tiene.
  const avisosSesion = useMemo(() => {
    const out = [...sesion.avisos];
    if (sesion.minutosEstimados < perfil.minPorSesion - 1) {
      out.push(`Ajustamos tu sesión a los ${sesion.minutosEstimados} minutos que tienes.`);
    }
    return out;
  }, [sesion, perfil.minPorSesion]);

  const sinEjercicios = sesion.items.length === 0;

  // Las rutinas propias van primero: si el usuario se tomo el trabajo de
  // armarlas, son lo que mas probablemente quiere abrir.
  const rutinas = useMemo<RutinaHoy[]>(() => {
    const mias = estado.rutinasPropias.map(r => ({
      id: r.id, nombre: r.nombre, min: minutosPropios(r.items), mia: true,
      imagenId: imagenRutina(r.id, r.imagenId), ejercicios: r.items.length,
      hecha: sesiones.some(s => s.rutinaId === r.id),
    }));
    const catalogo = RUTINAS
      .filter(r => (r.goal === perfil.objetivo || r.min <= 15))
      .filter(r => !perfil.modoSinSaltos || r.modo_sin_saltos)
      .map(r => ({ id: r.id, nombre: r.name, min: r.min, mia: false }));
    return [...mias, ...catalogo].slice(0, 4);
  }, [estado.rutinasPropias, sesiones, perfil.objetivo, perfil.modoSinSaltos]);

  // Primero los del objetivo activo, luego el resto, sin repetir ninguno.
  const programas = useMemo(() => {
    const vistos = new Set<string>();
    const orden = [
      ...PROGRAMAS.filter(p => p.goal === perfil.objetivo),
      ...PROGRAMAS.filter(p => p.goal !== perfil.objetivo),
    ];
    return orden.filter(p => !vistos.has(p.id) && vistos.add(p.id)).slice(0, 4);
  }, [perfil.objetivo]);

  const ejercicios = useMemo(() => {
    const equipo = new Set([...perfil.equipo, 'ninguno', 'pared', 'silla']);
    return EJERCICIOS
      .filter(e => e.goals.includes(perfil.objetivo))
      .filter(e => e.equipment.every(q => equipo.has(q)))
      .filter(e => !e.contra.some(c => perfil.contra.includes(c)))
      .slice(semilla % 8, (semilla % 8) + 4);
  }, [perfil.objetivo, perfil.equipo, perfil.contra, semilla]);

  const musculosDeHoy = useMemo(() => new Set(sesion.items.flatMap(i => i.primary)), [sesion]);
  const musculos = useMemo(() => {
    const vistos = new Set<string>();
    const orden = [...MUSCULOS.filter(m => musculosDeHoy.has(m.id)), ...MUSCULOS];
    return orden.filter(m => !vistos.has(m.id) && vistos.add(m.id)).slice(0, 4);
  }, [musculosDeHoy]);

  const tips = useMemo(() => TIPS.slice(semilla % 20, (semilla % 20) + 4), [semilla]);

  // La huella se estampa al volver a Hoy con una sesion nueva terminada hoy.
  const sesionesVistas = useRef(sesionesHoy);
  const [sello, setSello] = useState(0);
  useFocusEffect(useCallback(() => {
    if (sesionesHoy <= sesionesVistas.current) return;
    sesionesVistas.current = sesionesHoy;
    setSello(n => n + 1);
  }, [sesionesHoy]));

  // Los datos son locales: refrescar solo vuelve a leer la fecha (mismo dia, misma sesion).
  const refrescar = useCallback(() => {
    setRefrescando(true);
    haptico.toque();
    magnesia.mini(width / 2, inset.top + ALTO_HEADER);
    setFecha(hoy());
    temporizador.current = setTimeout(() => setRefrescando(false), DURACION_REFRESCO_MS);
  }, [magnesia, width, inset.top]);

  const irAExplorar = (tab?: 'rutinas' | 'programas' | 'ejercicios' | 'musculos') => navigation.navigate(
    'Tabs', tab ? { screen: 'Explorar', merge: true, params: { tab } } : { screen: 'Explorar' },
  );
  const irAAprender = () => navigation.navigate('Tabs', { screen: 'Aprender' });

  const empezar = () => navigation.navigate('Reproductor', { sesion });
  const cincoMinutos = () => navigation.navigate('Reproductor', {
    sesion: sesionDeRutina(
      ID_RUTINA_CINCO_MIN, perfilMotor, RUTINAS.find(r => r.id === ID_RUTINA_CINCO_MIN)!, ultimaVezDe,
    ),
  });

  return (
    <View style={s.raiz}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: inset.top + ALTO_HEADER + esp.sm,
          paddingBottom: abajo + (ANUNCIOS_ACTIVOS ? 62 : 0),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refrescando} onRefresh={refrescar}
            tintColor={paleta.magnesia} colors={[paleta.placaAzul]} progressBackgroundColor={paleta.gomaAlta}
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
          <View style={s.modulo}>
            <CabeceraSeccion titulo="Elige tu enfoque" />
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

        <View style={s.modulo}>
          <CabeceraSeccion titulo="¿Prefieres otra rutina?" accion="Ver todas" onAccion={() => irAExplorar('rutinas')} />
          <CarruselHoy
            data={rutinas} keyExtractor={r => r.id} ancho={ANCHO_TARJETA_RUTINA}
            renderItem={r => (
              <TarjetaRutina
                r={r} favorito={esFavorito('rutinas', r.id)}
                onPress={() => navigation.navigate(r.id.startsWith('mi_') ? 'RutinaPropia' : 'Rutina', { id: r.id })}
                onFavorito={() => alternarFavorito('rutinas', r.id)}
              />
            )}
            verMas={{ texto: 'Ver todas', onPress: () => irAExplorar('rutinas'), alto: 150 }}
          />
        </View>

        <BloqueRevela y={y} estilo={s.modulo}>
          {activo => (
            <>
              <CabeceraSeccion titulo="Tu semana" />
              <FilaSemana semana={semana} />
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
            {activo => (
              <>
                <CabeceraSeccion
                  titulo="Tu programa" accion="Ver"
                  onAccion={() => navigation.navigate('Programa', { id: programa.id })}
                />
                <TuPrograma
                  programa={programa} semanaActual={estado.semanaPrograma} activo={activo}
                  onPress={() => navigation.navigate('Programa', { id: programa.id })}
                />
              </>
            )}
          </BloqueRevela>
        )}

        <View style={s.modulo}>
          <CabeceraSeccion titulo="Programas" accion="Ver todos" onAccion={() => irAExplorar('programas')} />
          <PilaProgramas
            items={programas.map(p => ({
              id: p.id, nombre: p.name, semanas: p.semanas, favorito: esFavorito('programas', p.id),
            }))}
            onPress={id => navigation.navigate('Programa', { id })}
            onFavorito={id => alternarFavorito('programas', id)}
            onVerMas={() => irAExplorar('programas')} textoVerMas="Ver todos"
          />
        </View>

        <View style={s.modulo}>
          <CabeceraSeccion titulo="Ejercicios para ti" accion="Ver todos" onAccion={() => irAExplorar('ejercicios')} />
          <CarruselHoy
            data={ejercicios} keyExtractor={e => e.id} ancho={ANCHO_EJERCICIO_MINI}
            renderItem={e => (
              <TarjetaEjercicioMini
                e={e} favorito={esFavorito('ejercicios', e.id)}
                onPress={() => navigation.navigate('Ejercicio', { id: e.id })}
                onFavorito={() => alternarFavorito('ejercicios', e.id)}
              />
            )}
            verMas={{ texto: 'Ver todos', onPress: () => irAExplorar('ejercicios'), alto: ALTO_EJERCICIO_MINI }}
          />
        </View>

        <View style={s.modulo}>
          <CabeceraSeccion titulo="Músculos de hoy" accion="Ver todos" onAccion={() => irAExplorar('musculos')} />
          <CarruselHoy
            data={musculos} keyExtractor={m => m.id} ancho={ANCHO_MUSCULO}
            renderItem={m => (
              <FichaMusculo
                m={m} trabajaHoy={musculosDeHoy.has(m.id)}
                onPress={() => navigation.navigate('Musculo', { id: m.id })}
              />
            )}
            verMas={{ texto: 'Ver todos', onPress: () => irAExplorar('musculos'), alto: ALTO_MUSCULO }}
          />
        </View>

        <View style={s.modulo}>
          <CabeceraSeccion titulo="Para leer hoy" accion="Ver más" onAccion={irAAprender} />
          <CarruselHoy
            data={tips} keyExtractor={t => t.id} ancho={ANCHO_ARTICULO}
            renderItem={t => (
              <TarjetaArticulo
                t={t} sala={salaPorId.get(t.sala)?.name} favorito={esFavorito('tips', t.id)}
                onPress={() => navigation.navigate('Tip', { id: t.id })}
                onFavorito={() => alternarFavorito('tips', t.id)}
              />
            )}
            verMas={{ texto: 'Ver más', onPress: irAAprender, alto: ALTO_ARTICULO }}
          />
        </View>

        {stats.total > 0 && (
          <View style={s.modulo}>
            <CabeceraSeccion titulo="Tu progreso" />
            <EstadisticasHoy
              sesiones={stats.total} minutos={stats.minutos} series={stats.series} mejorRacha={racha.mejor}
            />
          </View>
        )}
      </Animated.ScrollView>

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
  entreFilas: { height: esp.md },
  bannerAbajo: { position: 'absolute', left: 24, right: 24 },
});
