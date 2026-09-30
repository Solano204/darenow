/**
 * FORJA · ajustes
 *
 * Los mismos ajustes, con los mismos limites, el mismo guardado (todo al instante) y las mismas confirmaciones de
 * siempre (ver `docs/FUNCIONALIDAD.md`, seccion 23); cambia como se ven: un indice de secciones pegajoso, listas
 * agrupadas en lugar de una tarjeta por fila, los controles del cuestionario donde se elegian y las acciones que
 * borran como filas rojas con su confirmacion en una hoja inferior.
 */

import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, familia, haptico, MARGEN_PANTALLA } from '@/ui/theme';
import { useEstado } from '@/state/store';
import { useHapticosActivos } from '@/state/haptics';
import { useVozActiva } from '@/state/voz';
import { useCuenta } from '@/state/cuenta';
import { useConsentimientoMedidas, pedirConsentimientoMedidas } from '@/state/consentimientoMedidas';
import { exportarProgreso, elegirRespaldo, aplicarRespaldo } from '@/storage/respaldo';
import { URL_PRIVACIDAD, URL_TERMINOS, URL_BORRAR_CUENTA } from '@/lib/legal';
import { EQUIPO, GOALS, porId, nombreGoal } from '@/data/catalog';
import { textoVisible } from '@/lib/presentacion';
import { ESPACIOS, ETIQUETAS_ESPACIO, LESIONES, indiceDeEspacio, equipoElegible, contarMarcados } from '@/features/ajustes/utils/ajustes';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { PantallaColapsable } from '@/ui/components/PantallaColapsable';
import { ContadorPlacas } from '@/ui/components/ContadorPlacas';
import { NotaEntrenador, estiloNota } from '@/ui/components/NotaEntrenador';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';
import { DialTiempo } from '@/ui/fx/DialTiempo';
import { IconoTrazo } from '@/ui/fx/IconoTrazo';
import { TarjetaLoQueSuelePasar } from '@/ui/components/TarjetaLoQueSuelePasar';
import { ChipCategoria } from '@/ui/components/ChipCategoria';
import { IndiceSecciones, ALTO_INDICE } from '@/features/ajustes/components/IndiceSecciones';
import { SeccionAjustes, ContadorDe, ContadorMarcadas } from '@/features/ajustes/components/SeccionAjustes';
import { GrupoFilas } from '@/features/ajustes/components/GrupoFilas';
import { FilaAjuste, BloqueControl, ChevronGiratorio, SANGRIA_CON_ICONO } from '@/features/ajustes/components/FilaAjuste';
import { SelectorNivel } from '@/features/ajustes/components/SelectorNivel';
import { SegmentadoTres } from '@/features/ajustes/components/SegmentadoTres';
import { FilaEquipo } from '@/features/ajustes/components/FilaEquipo';
import { FilaLesion } from '@/features/ajustes/components/FilaLesion';
import { ContadorEstatura } from '@/features/ajustes/components/ContadorEstatura';
import { RejillaCatalogo } from '@/features/ajustes/components/RejillaCatalogo';
import { FilaCuenta } from '@/features/ajustes/components/FilaCuenta';
import { FilaDestructiva } from '@/features/ajustes/components/FilaDestructiva';
import { HojaConfirmacion, type AccionHoja } from '@/features/ajustes/components/HojaConfirmacion';

/** Las secciones que llevan un chip en el indice, en el orden en que aparecen. */
const INDICE = [
  'Tu plan', 'Dónde entrenas', 'Equipo', 'Lesiones', 'Sesión', 'Qué ver', 'Peso y medidas', 'Catálogo', 'Cuenta', 'Datos', 'Legal',
] as const;
const SEC = {
  plan: 0, donde: 1, equipo: 2, lesiones: 3, sesion: 4, ver: 5, medidas: 6, catalogo: 7, cuenta: 8, datos: 9, legal: 10,
} as const;

const MINUTOS = { min: 5, max: 90 } as const;
const PESO = { min: 30, max: 200, defecto: 70 } as const;
const ESTATURA_DEFECTO = 170;
const TAMANO_DIAL = 120;
const ENTRADA_PESO_MS = 240;
const SALIDA_PESO_MS = 160;
const ENTRADA_OBJETIVOS_MS = 180;
const SALIDA_OBJETIVOS_MS = 120;
const AJUSTE_ALTURA_MS = 240;

interface Confirmacion {
  titulo: string;
  texto: string;
  acciones: AccionHoja[];
}

export default function Ajustes({ navigation }: any) {
  const reducido = useReducedMotion();
  const { estado, guardarPerfil, borrarMedidas } = useEstado();
  const { cuenta, salir, borrarTodosLosDatos } = useCuenta();
  const p = estado.perfil;
  const [objetivoAbierto, setObjetivoAbierto] = useState(false);
  const [hapticosOn, setHapticosOn] = useHapticosActivos();
  const [vozOn, setVozOn] = useVozActiva();
  const [consentimientoMedidas, cambiarConsentimientoMedidas] = useConsentimientoMedidas();
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [hoja, setHoja] = useState<Confirmacion | null>(null);
  const [arriba, setArriba] = useState<number[]>(() => INDICE.map(() => Number.POSITIVE_INFINITY));

  const medir = (i: number) => (y: number) => setArriba(previas => (previas[i] === y ? previas : previas.map((v, k) => (k === i ? y : v))));

  const equipoOnb = equipoElegible(EQUIPO);
  const equipoMarcado = contarMarcados(p.equipo, equipoOnb.map(e => e.id));
  const lesionesMarcadas = contarMarcados(p.contra, LESIONES.map(([id]) => id));
  const anima = !reducido;

  // Revocar = dejar de tratar el dato: se borran peso, altura, peso
  // objetivo y mediciones, no solo la bandera de consentimiento.
  const retirarConsentimientoMedidas = () => setHoja({
    titulo: 'Retirar consentimiento',
    texto: 'Al retirar tu consentimiento se borrarán tu peso, altura y medidas guardados. ¿Continuar?',
    acciones: [{
      texto: 'Continuar', tipo: 'peligro',
      onPress: () => { borrarMedidas(); cambiarConsentimientoMedidas(false); },
    }],
  });

  const exportar = async () => {
    setExportando(true);
    const r = await exportarProgreso();
    setExportando(false);
    if (!r.ok) { haptico.error(); Alert.alert('No se pudo exportar', r.motivo); }
  };

  // Mismo dialogo para "Eliminar mi cuenta" y "Borrar todos mis datos": las
  // dos disparan el mismo borrado completo (borrarTodosLosDatos), asi que
  // no puede haber un texto que prometa conservar el historial y otro que
  // no. "Exportar respaldo primero" no borra nada: solo abre el compartir
  // y deja el borrado para cuando el usuario confirme de nuevo.
  const confirmarBorrarTodo = () => setHoja({
    titulo: 'Borrar mis datos',
    texto: 'Se borrarán tu cuenta, tu progreso, rutinas, medidas y ajustes de este teléfono. No se puede deshacer.',
    acciones: [
      { texto: 'Exportar respaldo primero', onPress: exportar },
      { texto: 'Borrar todo', tipo: 'peligro', onPress: () => { borrarTodosLosDatos(); } },
    ],
  });

  const confirmarCerrarSesion = () => setHoja({
    titulo: 'Cerrar sesión',
    texto: 'Tu historial de entrenamiento se queda en este teléfono.',
    acciones: [{ texto: 'Cerrar sesión', onPress: () => { salir(); } }],
  });

  // Elegir y validar el archivo primero; recien si es valido se pide
  // confirmacion (reemplaza todo, no se puede deshacer) antes de escribir.
  const importar = async () => {
    setImportando(true);
    const elegido = await elegirRespaldo();
    setImportando(false);
    if (elegido.ok === 'cancelado') return;
    if (!elegido.ok) { haptico.error(); Alert.alert('Archivo no válido', elegido.motivo); return; }

    setHoja({
      titulo: 'Importar progreso',
      texto: 'Esto reemplaza tu progreso actual. No se puede deshacer.',
      acciones: [{
        texto: 'Importar', tipo: 'peligro',
        onPress: async () => {
          try {
            await aplicarRespaldo(elegido.respaldo);
            haptico.exito();
            Alert.alert(
              'Progreso importado',
              'Cierra la app por completo y vuelve a abrirla para verlo reflejado.',
            );
          } catch {
            haptico.error();
            Alert.alert(
              'No se pudo importar',
              'Algo falló al escribir el progreso. Tus datos actuales no deberían haber cambiado; intenta otra vez.',
            );
          }
        },
      }],
    });
  };

  const guardarMedida = (campo: 'pesoKg' | 'pesoObjetivoKg' | 'alturaCm') => (v: number) =>
    pedirConsentimientoMedidas(consentimientoMedidas, cambiarConsentimientoMedidas, () => guardarPerfil({ [campo]: v }));

  const cambiarVibracion = (v: boolean) => {
    setHapticosOn(v);
    if (v) haptico.placa();
  };

  const alternarEquipo = (id: string) => guardarPerfil({
    equipo: p.equipo.includes(id) ? p.equipo.filter(x => x !== id) : [...p.equipo, id],
  });
  const alternarLesion = (id: string) => guardarPerfil({
    contra: p.contra.includes(id) ? p.contra.filter(x => x !== id) : [...p.contra, id],
  });

  return (
    <>
      <PantallaColapsable
        titulo="Ajustes" onAtras={() => navigation.goBack()}
        superposicion={({ y, scroll, altoBarra, relleno }) => (
          <IndiceSecciones nombres={INDICE} arriba={arriba} y={y} scroll={scroll} altoBarra={altoBarra} relleno={relleno} />
        )}
        contenido={({ y }) => (
          <>
            <View style={{ height: ALTO_INDICE }} />

            <SeccionAjustes titulo="Tu plan" primera alMedir={medir(SEC.plan)}>
              <GrupoFilas animarAltura sangria={SANGRIA_CON_ICONO}>
                <FilaAjuste
                  key="objetivo" icono={ICONOS_OBJETIVO[p.objetivo] ?? 'flag-outline'}
                  titulo="Objetivo" valor={nombreGoal(p.objetivo)} valorApilado
                  derecha={<ChevronGiratorio abierto={objetivoAbierto} />}
                  onPress={() => setObjetivoAbierto(abierto => !abierto)}
                  estado={{ expanded: objetivoAbierto }} etiqueta={`Objetivo, ${nombreGoal(p.objetivo)}`}
                />
                {objetivoAbierto && GOALS.map(g => (
                  <Animated.View
                    key={g.id}
                    entering={anima ? FadeIn.duration(ENTRADA_OBJETIVOS_MS) : undefined}
                    exiting={anima ? FadeOut.duration(SALIDA_OBJETIVOS_MS) : undefined}
                  >
                    <FilaAjuste
                      icono={ICONOS_OBJETIVO[g.id] ?? 'flag-outline'} titulo={g.nombre} descripcion={g.sub}
                      derecha={p.objetivo === g.id ? <Ionicons name="checkmark" size={20} color={paleta.magnesia} /> : undefined}
                      rol="radio" estado={{ selected: p.objetivo === g.id }} etiqueta={`${g.nombre}, ${g.sub}`}
                      onPress={() => { guardarPerfil({ objetivo: g.id }); setObjetivoAbierto(false); }}
                    />
                  </Animated.View>
                ))}
                <BloqueControl key="minutos" titulo="Minutos por sesión" centrado>
                  <ContadorPlacas
                    compacto estilo={s.plano} valor={p.minPorSesion} min={MINUTOS.min} max={MINUTOS.max} sufijo="minutos"
                    onCambio={v => guardarPerfil({ minPorSesion: v })}
                    encima={<DialTiempo tamano={TAMANO_DIAL} activo animar={false} medida={{ valor: p.minPorSesion, maximo: MINUTOS.max }} />}
                  />
                </BloqueControl>
                <BloqueControl key="dias" titulo="Días por semana" centrado>
                  <ContadorPlacas
                    semana estilo={s.plano} valor={p.diasPorSemana} min={1} max={7} sufijo="días"
                    onCambio={v => guardarPerfil({ diasPorSemana: v })}
                  />
                </BloqueControl>
                <BloqueControl key="nivel" titulo="Nivel">
                  <SelectorNivel nivel={p.nivel} onCambio={n => guardarPerfil({ nivel: n })} />
                </BloqueControl>
              </GrupoFilas>
            </SeccionAjustes>

            <SeccionAjustes titulo="Dónde entrenas" alMedir={medir(SEC.donde)}>
              <GrupoFilas sangria={SANGRIA_CON_ICONO}>
                <FilaAjuste
                  key="sinsaltos" icono="footsteps-outline" titulo="Modo sin saltos"
                  descripcion="Quita impacto y ruido. Cada rutina tiene su versión silenciosa."
                  interruptor={{ activo: p.modoSinSaltos, onCambio: v => guardarPerfil({ modoSinSaltos: v }) }}
                />
                <BloqueControl key="espacio" titulo="Espacio">
                  <SegmentadoTres
                    opciones={[ETIQUETAS_ESPACIO.minimo, ETIQUETAS_ESPACIO.colchoneta, ETIQUETAS_ESPACIO.amplio]}
                    etiquetas={['Espacio mínimo', 'Espacio colchoneta', 'Espacio amplio']}
                    indice={indiceDeEspacio(p.espacio)}
                    onCambio={i => guardarPerfil({ espacio: ESPACIOS[i] })}
                  />
                </BloqueControl>
              </GrupoFilas>
            </SeccionAjustes>

            <SeccionAjustes
              titulo="Equipo" alMedir={medir(SEC.equipo)}
              derecha={<ContadorDe n={equipoMarcado} de={equipoOnb.length} />}
            >
              <GrupoFilas sangria={SANGRIA_CON_ICONO}>
                {equipoOnb.map(e => (
                  <FilaEquipo
                    key={e.id} id={e.id} nombre={e.name} sustituto={e.sustituto_casero || undefined}
                    marcado={p.equipo.includes(e.id)} onCambiar={() => alternarEquipo(e.id)}
                  />
                ))}
              </GrupoFilas>
            </SeccionAjustes>

            <SeccionAjustes
              titulo="Lesiones y condiciones" alMedir={medir(SEC.lesiones)}
              derecha={<ContadorMarcadas n={lesionesMarcadas} />}
            >
              <View style={s.nota}>
                <TarjetaLoQueSuelePasar
                  activo animar={false} compacto icono="shield-checkmark-outline" titulo="Filtro de seguridad"
                  texto="Este filtro nunca se relaja, aunque la app se quede sin ejercicios para un patrón."
                />
              </View>
              <GrupoFilas>
                {LESIONES.map(([id, texto]) => (
                  <FilaLesion key={id} texto={texto} marcada={p.contra.includes(id)} onCambiar={() => alternarLesion(id)} />
                ))}
              </GrupoFilas>
            </SeccionAjustes>

            <SeccionAjustes titulo="Sesión" alMedir={medir(SEC.sesion)}>
              <GrupoFilas sangria={SANGRIA_CON_ICONO}>
                <FilaAjuste
                  key="tonos" icono="volume-high-outline" titulo="Tonos durante la sesión"
                  descripcion="Tres tonos que suben al final de cada fase, y uno distinto al empezar, al terminar la serie y al acabarse el descanso. Sirve para entrenar sin mirar la pantalla."
                  interruptor={{ activo: p.sonido, onCambio: v => guardarPerfil({ sonido: v }) }}
                />
                <FilaAjuste
                  key="voz" icono="megaphone-outline" titulo="Voz"
                  descripcion="Dice el nombre del ejercicio y sus claves al empezar, la cuenta 3-2-1, y cada cambio de fase. Mientras habla, el botón para avanzar se desactiva un instante."
                  interruptor={{ activo: vozOn, onCambio: setVozOn }}
                />
                <FilaAjuste
                  key="vibracion" icono="phone-portrait-outline" titulo="Vibración"
                  descripcion="Un toque corto al completar una serie, uno largo al terminar la sesión. Útil con música puesta, cuando el sonido no llega."
                  interruptor={{ activo: hapticosOn, onCambio: cambiarVibracion }}
                />
              </GrupoFilas>
            </SeccionAjustes>

            <SeccionAjustes titulo="Qué quieres ver" alMedir={medir(SEC.ver)}>
              <GrupoFilas sangria={SANGRIA_CON_ICONO}>
                <FilaAjuste
                  key="kcal" icono="calculator-outline" titulo="Estimación de calorías"
                  descripcion="Es una estimación poblacional, no una medida de tu cuerpo. Puedes apagarla."
                  interruptor={{ activo: p.mostrarKcal, onCambio: v => guardarPerfil({ mostrarKcal: v }) }}
                />
                <FilaAjuste
                  key="peso" icono="resize-outline" titulo="Peso y medidas corporales"
                  descripcion="Si las apagas, desaparecen de toda la app. El plan funciona igual."
                  interruptor={{ activo: p.mostrarPeso, onCambio: v => guardarPerfil({ mostrarPeso: v }) }}
                />
              </GrupoFilas>
            </SeccionAjustes>

            <SeccionAjustes titulo="Peso y medidas" alMedir={medir(SEC.medidas)}>
              <GrupoFilas sangria={SANGRIA_CON_ICONO}>
                <FilaAjuste
                  key="consentimiento" icono="lock-closed-outline" titulo="Guardar peso y medidas"
                  descripcion="Peso, altura y mediciones son datos de salud: solo se guardan en este teléfono con tu consentimiento expreso, según el aviso de privacidad."
                  interruptor={{
                    activo: consentimientoMedidas,
                    onCambio: v => (v ? cambiarConsentimientoMedidas(true) : retirarConsentimientoMedidas()),
                  }}
                />
              </GrupoFilas>

              {p.mostrarPeso && (
                <Animated.View
                  key="peso-opcional"
                  entering={anima ? FadeIn.duration(ENTRADA_PESO_MS) : undefined}
                  exiting={anima ? FadeOut.duration(SALIDA_PESO_MS) : undefined}
                  layout={anima ? LinearTransition.duration(AJUSTE_ALTURA_MS) : undefined}
                >
                  <Text style={s.subtitulo} accessibilityRole="header" maxFontSizeMultiplier={1.3}>Peso (opcional)</Text>
                  <GrupoFilas>
                    <BloqueControl
                      key="ahora" centrado
                      descripcion="Solo se usa para estimar el gasto de la sesión. Sin él, la app funciona igual y no muestra kcal."
                    >
                      <ContadorPlacas
                        compacto estilo={s.plano} valor={p.pesoKg ?? PESO.defecto} min={PESO.min} max={PESO.max} sufijo="kg ahora"
                        onCambio={guardarMedida('pesoKg')}
                      />
                    </BloqueControl>
                    <BloqueControl
                      key="objetivo" centrado
                      descripcion="Peso de referencia. No cambia tu plan: no ponemos dietas, ni fechas, ni objetivos de calorías."
                    >
                      <ContadorPlacas
                        compacto estilo={s.plano} valor={p.pesoObjetivoKg ?? p.pesoKg ?? PESO.defecto} min={PESO.min} max={PESO.max}
                        sufijo="kg objetivo" onCambio={guardarMedida('pesoObjetivoKg')}
                      />
                    </BloqueControl>
                  </GrupoFilas>
                </Animated.View>
              )}

              <Animated.View layout={anima ? LinearTransition.duration(AJUSTE_ALTURA_MS) : undefined}>
                <Text style={s.subtitulo} accessibilityRole="header" maxFontSizeMultiplier={1.3}>Estatura (opcional)</Text>
                <GrupoFilas>
                  <BloqueControl centrado descripcion="Dato de tu perfil. No se usa en ningún cálculo del plan.">
                    <ContadorEstatura valor={p.alturaCm ?? ESTATURA_DEFECTO} onCambio={guardarMedida('alturaCm')} />
                  </BloqueControl>
                </GrupoFilas>
              </Animated.View>
            </SeccionAjustes>

            {p.vetos.length > 0 && (
              <SeccionAjustes titulo={`Ejercicios vetados (${p.vetos.length})`}>
                <View style={s.chips}>
                  {p.vetos.map(id => (
                    <ChipCategoria
                      key={id} texto={textoVisible(porId.get(id)?.name ?? id)} activo={false}
                      onPress={() => guardarPerfil({ vetos: p.vetos.filter(x => x !== id) })}
                    />
                  ))}
                </View>
                <Text style={s.pie}>Toca uno para volver a permitirlo.</Text>
              </SeccionAjustes>
            )}

            <SeccionAjustes titulo="Catálogo" alMedir={medir(SEC.catalogo)}>
              <RejillaCatalogo y={y} arriba={arriba[SEC.catalogo]} />
            </SeccionAjustes>

            <SeccionAjustes titulo="Tu cuenta" alMedir={medir(SEC.cuenta)}>
              <GrupoFilas sangria={SANGRIA_CON_ICONO}>
                <FilaCuenta
                  key="cuenta" google={cuenta?.proveedor === 'google'}
                  correo={cuenta?.email ?? cuenta?.nombre ?? 'Invitado'}
                />
                {cuenta?.proveedor === 'google' && (
                  <FilaAjuste key="salir" icono="log-out-outline" titulo="Cerrar sesión" onPress={confirmarCerrarSesion} />
                )}
                <FilaDestructiva key="eliminar" titulo="Eliminar mi cuenta" onPress={confirmarBorrarTodo} />
              </GrupoFilas>
            </SeccionAjustes>

            <SeccionAjustes titulo="Tus datos" alMedir={medir(SEC.datos)}>
              <NotaEntrenador colorBarra={paleta.magnesia3} estilo={s.notaDatos}>
                <View style={s.notaFila}>
                  <IconoTrazo nombre="telefono" activo animar={false} tamano={22} color={paleta.magnesia2} />
                  <Text style={[estiloNota, s.notaTexto]} maxFontSizeMultiplier={1.3}>
                    Todo vive en este teléfono, sin copia en la nube. Exporta un archivo para guardarlo tú o pasarlo a otro teléfono.
                  </Text>
                </View>
              </NotaEntrenador>
              <GrupoFilas sangria={SANGRIA_CON_ICONO}>
                <FilaAjuste
                  key="exportar" icono="arrow-up-circle-outline" titulo="Exportar mi progreso" chevron="derecha"
                  ocupada={exportando ? 'Exportando...' : undefined} onPress={exportar}
                />
                <FilaAjuste
                  key="importar" icono="arrow-down-circle-outline" titulo="Importar progreso" chevron="derecha"
                  ocupada={importando ? 'Leyendo archivo...' : undefined} onPress={importar}
                />
              </GrupoFilas>
            </SeccionAjustes>

            <SeccionAjustes titulo="Legal" alMedir={medir(SEC.legal)}>
              <GrupoFilas sangria={SANGRIA_CON_ICONO}>
                <FilaAjuste
                  key="privacidad" icono="document-text-outline" titulo="Aviso de privacidad" chevron="enlace" rol="link"
                  onPress={() => { Linking.openURL(URL_PRIVACIDAD); }}
                />
                <FilaAjuste
                  key="terminos" icono="document-text-outline" titulo="Términos y condiciones" chevron="enlace" rol="link"
                  onPress={() => { Linking.openURL(URL_TERMINOS); }}
                />
                <FilaDestructiva
                  key="borrar-web" titulo="Borrar cuenta y datos" enlaceExterno
                  onPress={() => { Linking.openURL(URL_BORRAR_CUENTA); }}
                />
              </GrupoFilas>
            </SeccionAjustes>

            <View style={s.cierre}>
              <GrupoFilas sangria={SANGRIA_CON_ICONO}>
                <FilaDestructiva titulo="Borrar todos mis datos" onPress={confirmarBorrarTodo} />
              </GrupoFilas>
              <Text style={s.aviso}>
                Contenido educativo y de entrenamiento. No sustituye diagnóstico ni consejo médico, fisioterapéutico o nutricional individual.
              </Text>
              <Text style={s.wordmark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">DARENOW</Text>
            </View>
          </>
        )}
      />
      <HojaConfirmacion
        visible={hoja !== null} onCerrar={() => setHoja(null)}
        titulo={hoja?.titulo ?? ''} texto={hoja?.texto ?? ''} acciones={hoja?.acciones ?? []}
      />
    </>
  );
}

const s = StyleSheet.create({
  plano: { flex: 0 },
  nota: { marginHorizontal: MARGEN_PANTALLA, marginBottom: 12 },
  notaDatos: { alignSelf: 'stretch', marginHorizontal: MARGEN_PANTALLA, marginBottom: 12 },
  notaFila: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  notaTexto: { flex: 1 },
  subtitulo: {
    marginHorizontal: MARGEN_PANTALLA, marginTop: 24, marginBottom: 12,
    fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia,
  },
  chips: { marginHorizontal: MARGEN_PANTALLA, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pie: {
    marginHorizontal: MARGEN_PANTALLA, marginTop: 12, fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20,
    color: paleta.magnesia3Texto,
  },
  cierre: { marginTop: 40 },
  aviso: {
    marginHorizontal: MARGEN_PANTALLA, marginTop: 16, textAlign: 'center',
    fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 19, color: paleta.magnesia3Texto,
  },
  wordmark: {
    marginTop: 32, textAlign: 'center', fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, letterSpacing: 2,
    color: paleta.gomaBorde,
  },
});
