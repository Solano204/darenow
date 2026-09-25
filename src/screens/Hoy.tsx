/**
 * FORJA · Hoy
 *
 * Estructura: la sesion del dia arriba con un solo boton, y debajo
 * carruseles de descubrimiento. Cada carrusel muestra cuatro elementos con
 * foto y termina en una tarjeta que lleva a la lista completa.
 *
 * El intersticial aparece aqui como maximo una vez al dia, y nunca la
 * primera vez que alguien abre la app.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { color, tipo, esp, radio, degradado, sol } from '../theme';
import {
  Boton, Seccion, Chip, Aparece, Toque, Nota, BarrasSemana, BotonRedondo,
  useHuecoAbajo, NumeroAnimado, Resplandor, Vidrio3D,
} from '../components/ui';
import Carrusel from '../components/Carrusel';
import Foto from '../components/Foto';
import { BannerAnuncio, ANUNCIOS_ACTIVOS } from '../components/Anuncio';
import { useEstado, estadisticas, ultimos7, hoy, imagenRutina } from '../store/store';
import { armarSesion, sesionDeRutina, minutosPropios, type Perfil } from '../engine/session';
import {
  RUTINAS, PROGRAMAS, EJERCICIOS, MUSCULOS, TIPS, programaPorId,
  nombreGoal, salaPorId, insigniaDe,
} from '../data/catalog';
import { saludo } from '../data/mensajes';

export default function Hoy({ navigation }: any) {
  const abajo = useHuecoAbajo();
  const { estado, ultimaVezDe, alternarFavorito, esFavorito } = useEstado();
  const { perfil, sesiones, racha } = estado;

  const perfilMotor: Perfil = perfil;
  const stats = useMemo(() => estadisticas(sesiones), [sesiones]);
  const semana = useMemo(() => ultimos7(sesiones), [sesiones]);
  const entrenoHoy = sesiones.some(s => s.fecha === hoy());
  const programa = programaPorId.get(perfil.programaId);


  const semilla = useMemo(() => {
    let h = 2166136261; const s = hoy() + perfil.objetivo;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }, [perfil.objetivo]);

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
  const rutinas = useMemo(() => {
    const mias = estado.rutinasPropias.map(r => ({
      id: r.id, nombre: r.nombre, min: minutosPropios(r.items), mia: true,
      imagenId: imagenRutina(r.id, r.imagenId),
    }));
    const catalogo = RUTINAS
      .filter(r => (r.goal === perfil.objetivo || r.min <= 15))
      .filter(r => !perfil.modoSinSaltos || r.modo_sin_saltos)
      .map(r => ({ id: r.id, nombre: r.name, min: r.min, mia: false, imagenId: undefined as string | undefined }));
    return [...mias, ...catalogo].slice(0, 4);
  }, [estado.rutinasPropias, perfil.objetivo, perfil.modoSinSaltos]);

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

  const musculos = useMemo(() => {
    const ids = new Set(sesion.items.flatMap(i => i.primary));
    const vistos = new Set<string>();
    const orden = [...MUSCULOS.filter(m => ids.has(m.id)), ...MUSCULOS];
    return orden.filter(m => !vistos.has(m.id) && vistos.add(m.id)).slice(0, 4);
  }, [sesion]);

  const tips = useMemo(
    () => TIPS.slice(semilla % 20, (semilla % 20) + 4),
    [semilla],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} edges={['top']}>
      <Resplandor />

      <ScrollView
        contentContainerStyle={{ paddingBottom: abajo + (ANUNCIOS_ACTIVOS ? 62 : 0) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera */}
        <View style={s.cabecera}>
          <View style={{ flex: 1 }}>
            <Text style={[tipo.pie, { color: color.textoSuave }]}>{saludo(perfil.nombre || undefined)}</Text>
            <Text style={[tipo.h1, { color: color.texto, marginTop: 2 }]}>
              {entrenoHoy ? 'Ya entrenaste hoy' : 'Tu sesión de hoy'}
            </Text>
          </View>
          <BotonRedondo glifo="⌕" etiqueta="Buscar" onPress={() => navigation.navigate('Tabs', { screen: 'Explorar' })} />
        </View>

        {/*
          * Tarjeta principal.
          *
          * Es la unica de la pantalla que lleva barrido de luz y la unica
          * con elevacion alta: es lo que manda aqui. Si brillaran todas,
          * no brillaria ninguna.
          */}
        <Aparece>
          <Vidrio3D
            tono="carbon"
            brillo
            desenfoque
            elevacion="alta"
            estilo={{ marginHorizontal: esp.md }}
          >
            {/* Toda esta tarjeta va sobre degradado.carbon (azul vivo), no
                sobre el fondo claro de la pantalla: el texto usa
                color.sobreOscuro (blanco), no color.texto/textoSuave/acento.
                Medido con scripts/contraste.js — ver el comentario junto a
                degradado.carbon en theme.ts. */}
            {sinEjercicios ? (
              <>
                <Text style={[tipo.h3, { color: color.sobreOscuro }]}>Tu filtro de lesión está activo</Text>
                <Text style={[tipo.pie, { color: color.sobreOscuro, marginTop: esp.xs }]}>
                  Con las zonas que declaraste, hoy no queda ningún ejercicio seguro para
                  armar tu sesión. Las contraindicaciones nunca se relajan solas.
                </Text>
                <Toque onPress={() => navigation.navigate('Tabs', { screen: 'Yo' })}
                  estilo={{ paddingVertical: esp.sm } as never}>
                  <Text style={[tipo.dato, { color: color.sobreOscuro }]}>Revisar mis lesiones en Ajustes</Text>
                </Toque>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', gap: esp.xs, flexWrap: 'wrap' }}>
                  <Chip texto={nombreGoal(perfil.objetivo)} oscuro pequeno />
                  <Chip texto={`${sesion.minutosEstimados} min`} oscuro pequeno />
                  <Chip texto={`${sesion.items.length} ejercicios`} oscuro pequeno />
                  {perfil.modoSinSaltos && <Chip texto="Sin saltos" oscuro pequeno />}
                </View>

                {/* Vista previa con foto de los primeros ejercicios. */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: esp.sm, paddingVertical: esp.sm }}>
                  {sesion.items.slice(0, 6).map(it => (
                    <View key={it.id} style={{ width: 82 }}>
                      <Foto tipo="ejercicio" id={it.id} nombre={it.name} alto={82} ancho={82} forma="redonda" />
                      <Text style={[tipo.micro, { color: color.sobreOscuro, marginTop: 6 }]} numberOfLines={2}>
                        {it.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                {avisosSesion.map((a, n) => (
                  <Text key={n} style={[tipo.pie, { color: color.sobreOscuro }]}>{a}</Text>
                ))}

                <Boton
                  texto={entrenoHoy ? 'Entrenar otra vez' : 'Empezar'}
                  variante="acento"
                  onPress={() => navigation.navigate('Reproductor', { sesion })}
                />
                <Toque
                  onPress={() => navigation.navigate('Reproductor', {
                    sesion: sesionDeRutina('rt_030', perfilMotor,
                      RUTINAS.find(r => r.id === 'rt_030')!, ultimaVezDe),
                  })}
                  estilo={{ alignItems: 'center', paddingVertical: esp.sm } as never}
                >
                  <Text style={[tipo.pie, { color: color.sobreOscuro }]}>
                    Hoy no tengo tiempo · sesión de 5 minutos
                  </Text>
                </Toque>
              </>
            )}
          </Vidrio3D>
        </Aparece>

        {/* Tarjetas de color: mismos 4 ejercicios que "Ejercicios para ti"
            mas abajo, solo que los primeros 3 aqui arriba con mas peso
            visual. Tocar la tarjeta lleva a la misma ficha de siempre. */}
        {ejercicios.length > 0 && (
          <Aparece retraso={70}>
            <View style={{ marginTop: esp.lg }}>
              <Text style={[tipo.h2, { color: color.texto, paddingHorizontal: esp.md, marginBottom: esp.sm }]}>
                Elige tu enfoque
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: esp.sm, paddingHorizontal: esp.md }}>
                {ejercicios.slice(0, 3).map((e, i) => (
                  <TarjetaColor
                    key={e.id}
                    tono={(['acento', 'purpuraClaro', 'verdeClaro'] as const)[i % 3]}
                    titulo={e.name}
                    sub={`Nivel ${e.level}`}
                    tipoFoto="ejercicio"
                    id={e.id}
                    onPress={() => navigation.navigate('Ejercicio', { id: e.id })}
                  />
                ))}
              </ScrollView>
            </View>
          </Aparece>
        )}

        {/* Por si la sesion de arriba no convence: otras rutinas a mano,
            aqui mismo, sin bajar hasta el descubrimiento de mas abajo. */}
        <Aparece retraso={90}>
          <Seccion titulo="¿Prefieres otra rutina?" accion="Ver todas" estilo={{ paddingLeft: esp.md }}
            onAccion={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'rutinas' } })}>
            <Carrusel
              items={rutinas.map(r => ({
                id: r.id, imagenId: r.imagenId,
                titulo: r.nombre, sub: r.mia ? 'Mi rutina' : `${r.min} min`,
                etiqueta: `${r.min} min`, favorito: esFavorito('rutinas', r.id),
              }))}
              tipoFoto="rutina" forma="alta"
              onItem={id => navigation.navigate(
                id.startsWith('mi_') ? 'RutinaPropia' : 'Rutina', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'rutinas' } })}
              onFavorito={id => alternarFavorito('rutinas', id)}
            />
          </Seccion>
        </Aparece>

        {/* Racha */}
        <Aparece retraso={120}>
          <View style={{ paddingHorizontal: esp.md, marginTop: esp.lg }}>
            <DiaPicker semana={semana} />
          </View>
          <View style={s.racha}>
            <View style={{ minWidth: 72 }}>
              <NumeroAnimado valor={racha.dias} estilo={[tipo.display, { color: color.acento }]} />
              <Text style={[tipo.micro, { color: color.textoSuave }]}>
                {racha.dias === 1 ? 'Día seguido' : 'Días seguidos'}
              </Text>
            </View>
            <View style={{ flex: 1 }}><BarrasSemana datos={semana} /></View>
          </View>
          {racha.enPausa && (
            <View style={{ paddingHorizontal: esp.md }}>
              <Nota texto="Tu racha está en pausa, no perdida. Entrena hoy y sigue desde donde estaba." tono="cuidado" />
            </View>
          )}
        </Aparece>

        {/* Explorar todo */}
        <Aparece retraso={140}>
          <View style={{ paddingHorizontal: esp.md, marginTop: esp.md }}>
            <Toque onPress={() => navigation.navigate('Tabs', { screen: 'Explorar' })}>
              <Vidrio3D tono="acento" desenfoque estilo={s.explorarFilo}>
                <View style={s.explorar}>
                <View style={{ flex: 1 }}>
                  <Text style={[tipo.h3, { color: color.texto }]}>Explorar todo</Text>
                  <Text style={[tipo.pie, { color: color.textoSuave }]}>
                    190 ejercicios, 30 rutinas, 12 programas
                  </Text>
                </View>
                <View style={s.flechaExplorar}>
                  <Text style={{ color: color.sobreOscuro, fontSize: 18 }}>→</Text>
                </View>
                </View>
              </Vidrio3D>
            </Toque>
          </View>
        </Aparece>

        {/* Programa activo */}
        {programa && (
          <Aparece retraso={180}>
            <Seccion titulo="Tu programa" accion="Ver" estilo={{ paddingLeft: esp.md }}
              onAccion={() => navigation.navigate('Programa', { id: programa.id })}>
              <Toque onPress={() => navigation.navigate('Programa', { id: programa.id })}
                estilo={{ marginRight: esp.md } as never}>
                <View style={s.programaFila}>
                  <Foto tipo="programa" id={programa.id} nombre={programa.name} alto={72} ancho={72} />
                  <View style={{ flex: 1 }}>
                    <Text style={[tipo.h3, { color: color.texto }]} numberOfLines={1}>{programa.name}</Text>
                    <Text style={[tipo.pie, { color: color.textoSuave }]} numberOfLines={2}>{programa.desc}</Text>
                    <Text style={[tipo.micro, { color: color.textoTenue, marginTop: 2 }]}>
                      Semana {estado.semanaPrograma} de {programa.semanas}
                    </Text>
                  </View>
                </View>
              </Toque>
            </Seccion>
          </Aparece>
        )}

        {/* Carruseles */}
        <Aparece retraso={220}>
          <Seccion titulo="Programas" accion="Ver todos" estilo={{ paddingLeft: esp.md }}
            onAccion={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'programas' } })}>
            <Carrusel
              items={programas.map(p => ({
                id: p.id, titulo: p.name, sub: `${p.semanas} semanas`,
                etiqueta: `${p.semanas} sem`, favorito: esFavorito('programas', p.id),
              }))}
              tipoFoto="programa" forma="alta"
              onItem={id => navigation.navigate('Programa', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'programas' } })}
              onFavorito={id => alternarFavorito('programas', id)}
            />
          </Seccion>
        </Aparece>

        <Aparece retraso={280}>
          <Seccion titulo="Ejercicios para ti" accion="Ver todos" estilo={{ paddingLeft: esp.md }}
            onAccion={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'ejercicios' } })}>
            <Carrusel
              items={ejercicios.map(e => ({
                id: e.id, titulo: e.name, sub: e.category, favorito: esFavorito('ejercicios', e.id),
              }))}
              tipoFoto="ejercicio" forma="baja"
              onItem={id => navigation.navigate('Ejercicio', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'ejercicios' } })}
              onFavorito={id => alternarFavorito('ejercicios', id)}
            />
          </Seccion>
        </Aparece>

        <Aparece retraso={310}>
          <Seccion titulo="Músculos de hoy" accion="Ver todos" estilo={{ paddingLeft: esp.md }}
            onAccion={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } })}>
            <Carrusel
              items={musculos.map(m => ({ id: m.id, titulo: m.name }))}
              tipoFoto="musculo" forma="circulo" textoVerMas="Ver todos"
              onItem={id => navigation.navigate('Musculo', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Explorar', merge: true, params: { tab: 'musculos' } })}
            />
          </Seccion>
        </Aparece>

        <Aparece retraso={340}>
          <Seccion titulo="Para leer hoy" accion="Ver más" estilo={{ paddingLeft: esp.md }}
            onAccion={() => navigation.navigate('Tabs', { screen: 'Aprender' })}>
            <Carrusel
              items={tips.map(t => ({
                id: t.id, titulo: t.titulo,
                sub: salaPorId.get(t.sala)?.name,
                favorito: esFavorito('tips', t.id),
              }))}
              tipoFoto="tip" forma="alta" textoVerMas="Ver más"
              onItem={id => navigation.navigate('Tip', { id })}
              onVerMas={() => navigation.navigate('Tabs', { screen: 'Aprender' })}
              onFavorito={id => alternarFavorito('tips', id)}
            />
          </Seccion>
        </Aparece>

        {stats.total > 0 && (
          <Aparece retraso={370}>
            <View style={{ paddingHorizontal: esp.md, marginTop: esp.lg }}>
              <View style={s.stats}>
                <Stat n={String(stats.total)} t="sesiones" />
                <View style={s.sep} />
                <Stat n={String(stats.minutos)} t="minutos" />
                <View style={s.sep} />
                <Stat n={String(stats.series)} t="series" />
                <View style={s.sep} />
                <Stat n={String(racha.mejor)} t="mejor racha" />
              </View>
            </View>
          </Aparece>
        )}
      </ScrollView>

      {/* Banner fijo abajo, la unica publicidad de esta pantalla. Va sobre
          vidrio para que el contenido siga viendose al pasar por detras.
          `bottom: abajo` lo apoya justo encima de la barra de pestanas
          (ya no flotante): no una posicion fija, para no volver a tapar
          la barra si su alto cambia (inset del telefono). */}
      {ANUNCIOS_ACTIVOS && (
        <View style={[s.bannerAbajo, { bottom: abajo }]} pointerEvents="box-none">
          <BannerAnuncio flotante />
        </View>
      )}
    </SafeAreaView>
  );
}

function Stat({ n, t }: { n: string; t: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[tipo.h2, { color: color.texto }]}>{n}</Text>
      <Text style={[tipo.micro, { color: color.textoSuave }]}>{t}</Text>
    </View>
  );
}

/**
 * Tarjeta de categoria: degradado claro, foto y una pastilla "Inicio"
 * decorativa (el toque de la tarjeta entera ya lleva a la ficha, igual
 * que el resto de tarjetas de esta pantalla).
 *
 * Fondos claros a proposito (pedido explicito) + texto oscuro: los tonos
 * vivos (degradado.carbon/purpura/verde) los usa la tarjeta principal de
 * arriba con texto BLANCO, y aclararlos ahi rompe ese contraste. Estas
 * versiones "Claro" son tokens aparte en theme.ts, no un aclarado local.
 */
function TarjetaColor({ tono, titulo, sub, tipoFoto, id, onPress }: {
  tono: 'acento' | 'purpuraClaro' | 'verdeClaro';
  titulo: string; sub: string;
  tipoFoto: 'ejercicio' | 'rutina'; id: string;
  onPress: () => void;
}) {
  return (
    <Toque onPress={onPress} estilo={{ width: 400 } }>
      <LinearGradient colors={degradado[tono]} start={sol.start} end={sol.end} style={s.tarjetaColor}>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View style={{ paddingRight: esp.sm }}>
            <Text style={[tipo.h3, { color: color.texto }]} numberOfLines={3}>{titulo}</Text>
            <Text style={[tipo.pie, { color: color.texto, marginTop: esp.xs }]}>{sub}</Text>
          </View>
          <View style={s.pildoraInicio}>
            <Text style={[tipo.dato, { color: color.sobreOscuro }]}>Inicio</Text>
          </View>
        </View>
        <Foto tipo={tipoFoto} id={id} nombre={titulo} alto={190} ancho={160} forma="tarjeta"
          estilo={{ position: 'absolute', right: 0, bottom: 0 }} />
      </LinearGradient>
    </Toque>
  );
}

/** Fila de los ultimos 7 dias: el de hoy resaltado, un punto bajo el dia
 *  que si tuvo sesion. Mismos datos que ya alimentan BarrasSemana, solo
 *  presentados como calendario en vez de barras. */
function DiaPicker({ semana }: { semana: { fecha: string; min: number }[] }) {
  const hoyStr = hoy();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {semana.map(d => {
        const esHoy = d.fecha === hoyStr;
        const entreno = d.min > 0;
        const numero = parseInt(d.fecha.slice(8, 10), 10);
        return (
          <View key={d.fecha} style={{ alignItems: 'center', gap: 5 }}>
            <View style={[s.diaCirculo, esHoy && s.diaCirculoActivo]}>
              <Text style={[tipo.dato, { color: esHoy ? color.sobreOscuro : color.textoTenue }]}>
                {numero}
              </Text>
            </View>
            <View style={[s.diaPunto, entreno && { backgroundColor: color.acento }]} />
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  cabecera: {
    flexDirection: 'row', alignItems: 'center', gap: esp.sm,
    paddingHorizontal: esp.md, paddingTop: esp.sm, paddingBottom: esp.md,
  },

  racha: {
    flexDirection: 'row', alignItems: 'center', gap: esp.md,
    paddingHorizontal: esp.md, marginTop: esp.lg,
  },
  explorarFilo: { marginBottom: 0 },
  explorar: { flexDirection: 'row', alignItems: 'center', gap: esp.md },
  flechaExplorar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: color.carbon,
    alignItems: 'center', justifyContent: 'center',
  },
  programaFila: {
    flexDirection: 'row', alignItems: 'center', gap: esp.md,
    backgroundColor: color.lienzo, borderRadius: radio.tarjeta, padding: esp.sm,
    borderWidth: 1, borderColor: color.borde,
  },
  stats: {
    flexDirection: 'row', backgroundColor: color.lienzo,
    borderRadius: radio.tarjeta, paddingVertical: esp.md, alignItems: 'center',
    borderWidth: 1, borderColor: color.borde,
  },
  sep: { width: 1, height: 28, backgroundColor: color.borde },
  bannerAbajo: { position: 'absolute', left: esp.md, right: esp.md },
  diaCirculo: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: color.cremaHonda,
    alignItems: 'center', justifyContent: 'center',
  },
  diaCirculoActivo: { backgroundColor: color.texto },
  diaPunto: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'transparent' },
  tarjetaColor: {
    height: 190, borderRadius: radio.tarjeta, padding: esp.md,
    overflow: 'hidden',
  },
  pildoraInicio: {
    alignSelf: 'flex-start', backgroundColor: color.carbon,
    borderRadius: radio.pastilla, paddingVertical: esp.xs, paddingHorizontal: esp.md,
  },
});
