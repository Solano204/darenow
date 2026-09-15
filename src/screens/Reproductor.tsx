import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Modal, Alert, Animated, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { color, tipo, esp, radio, TOQUE, anim, sombra } from '../theme';
import {
  useSessionPlayer, leerSesionGuardada, borrarSesionGuardada, type SesionEnCurso,
} from '../session/useSessionPlayer';
import { useEstado, hoy } from '../store/store';
import { useHapticosActivos } from '../store/haptics';
import { useVozActiva } from '../store/voz';
import { useAjustesMaquina } from '../store/maquina';
import { sustituir, aItem, duracion, type Sesion, type ItemSesion } from '../engine/session';
import { reproducir, prepararSonido, soltarSonido } from '../media/sonido';
import { Boton, Toque, Chip, Tarjeta, Aparece, useMovimientoReducido } from '../components/ui';
import { useSinAnuncios } from '../components/RelojAnuncios';
import Clip from '../components/Clip';
import { VidrioFondo } from '../components/Vidrio';

/**
 * Reproductor.
 *
 * El fondo entero cambia de tinte con la fase: rojo trabajando, azul
 * descansando, gris preparandote. Se lee desde el suelo sin enfocar texto.
 *
 * La pantalla no se apaga durante la sesion (useKeepAwake).
 */

const TINTE = {
  preparado: color.preparadoFondo,
  trabajo: color.trabajoFondo,
  cambio_lado: color.preparadoFondo,
  descanso: color.descansoFondo,
  pausa: color.lienzo,
  fin: color.trabajoFondo,
} as const;

const ACENTO = {
  preparado: color.preparado,
  trabajo: color.trabajo,
  cambio_lado: color.preparado,
  descanso: color.descanso,
  pausa: color.textoSuave,
  fin: color.trabajo,
} as const;

const ETIQUETA = {
  preparado: 'Prepárate',
  trabajo: 'Trabaja',
  cambio_lado: 'Cambia de lado',
  descanso: 'Descansa',
  pausa: 'En pausa',
  fin: 'Terminaste',
} as const;

const reloj = (s: number) => {
  const m = Math.floor(s / 60), r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : String(r);
};

/** "1 minuto 5 segundos", para que un lector de pantalla no deletree "1:05". */
const segundosHablados = (s: number) => {
  const m = Math.floor(s / 60), r = s % 60;
  const min = m > 0 ? `${m} minuto${m === 1 ? '' : 's'}` : '';
  const seg = r > 0 || m === 0 ? `${r} segundo${r === 1 ? '' : 's'}` : '';
  return [min, seg].filter(Boolean).join(' ');
};

/**
 * Antes de montar el reproductor de verdad, revisa si quedo una sesion sin
 * terminar (la app se cerro o se fue a segundo plano en el camino). Si
 * hay una, pregunta; si no, o si el usuario prefiere empezar de nuevo, el
 * reproductor arranca con la sesion que llego por navegacion.
 */
export default function Reproductor({ route, navigation }: any) {
  const sesionInicial: Sesion = route.params.sesion;
  const [listo, setListo] = useState(false);
  const [restaurar, setRestaurar] = useState<SesionEnCurso | null>(null);
  const [mostrarListo, setMostrarListo] = useState(true);
  const [itemsConfirmados, setItemsConfirmados] = useState<ItemSesion[] | null>(null);

  // Se prepara aqui, no en useSessionPlayer: entre esta pantalla y el primer
  // "preparado" de verdad pasan la pantalla "Listo?" y, si aplica, el editor
  // previo. Ese margen es lo que evita que el primer tin de la cuenta 3-2-1
  // suene mudo por llegar antes de que el player termine de cargar.
  useEffect(() => {
    prepararSonido();
    return soltarSonido;
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const guardada = await leerSesionGuardada();
      if (!vivo) return;
      if (!guardada || guardada.items.length === 0) { setListo(true); return; }
      const minutos = Math.max(1, Math.round((Date.now() - guardada.guardadoEn) / 60000));
      Alert.alert(
        'Sesión sin terminar',
        `Tienes una sesión de hace ${minutos} minuto${minutos === 1 ? '' : 's'} sin cerrar. ¿La continúas donde te quedaste?`,
        [
          {
            text: 'Empezar de nuevo', style: 'cancel',
            onPress: () => { borrarSesionGuardada(); setListo(true); },
          },
          { text: 'Continuar', onPress: () => { setRestaurar(guardada); setListo(true); } },
        ],
      );
    })();
    return () => { vivo = false; };
  }, []);

  // Pantalla "listo para empezar", 3 segundos. Solo en un arranque de
  // verdad: si se esta continuando una sesion interrumpida, ya se estaba
  // entrenando, no hace falta el aviso.
  useEffect(() => {
    if (!listo) return;
    if (restaurar) { setMostrarListo(false); return; }
    const id = setTimeout(() => setMostrarListo(false), 3000);
    return () => clearTimeout(id);
  }, [listo, restaurar]);

  if (!listo) return <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }} />;

  if (mostrarListo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo, alignItems: 'center', justifyContent: 'center' }}>
        <Aparece estilo={{ alignItems: 'center' }}>
          <Text style={[tipo.display, { color: color.texto }]}>¿Listo?</Text>
          <Text style={[tipo.cuerpo, { color: color.textoSuave, marginTop: esp.sm }]}>Empezamos en un momento</Text>
        </Aparece>
      </SafeAreaView>
    );
  }

  // Revisar y ajustar series, repeticiones/tiempo y descanso de cada
  // ejercicio antes de arrancar. Solo en un arranque de verdad: al
  // continuar una sesion interrumpida ya se habia decidido todo eso.
  // Not for a rutina propia either: those numbers were already fixed when
  // the user built it, asking again would be the same step twice.
  if (!restaurar && !itemsConfirmados && !sesionInicial.origenPropia) {
    return <EditorAntesDeEmpezar items={sesionInicial.items} onConfirmar={setItemsConfirmados} />;
  }

  const sesionFinal: Sesion = itemsConfirmados ? { ...sesionInicial, items: itemsConfirmados } : sesionInicial;
  return <ReproductorActivo sesionInicial={sesionFinal} restaurar={restaurar} navigation={navigation} />;
}

/**
 * Revisar y ajustar la rutina antes de empezar.
 *
 * Series, repeticiones (o tiempo si el ejercicio es por tiempo) y
 * descanso quedan fijos aqui, una sola vez: el reproductor ya no pregunta
 * nada de esto durante la sesion, asi que la vista de cada ejercicio se
 * queda solo con el nombre, el numero y el video.
 */
function EditorAntesDeEmpezar({ items, onConfirmar }: {
  items: ItemSesion[]; onConfirmar: (items: ItemSesion[]) => void;
}) {
  const [lista, setLista] = useState<ItemSesion[]>(items);
  const [ajustesMaquina, guardarAjusteMaquina] = useAjustesMaquina();
  const { estado: app } = useEstado();

  const actualizar = (i: number, cambio: Partial<ItemSesion>) =>
    setLista(prev => prev.map((it, n) => (n === i ? { ...it, ...cambio } : it)));

  // Cambiar de ejercicio va aqui, antes de arrancar, no durante la sesion:
  // es la unica pantalla donde el usuario ya esta ajustando numeros, tiene
  // sentido que tambien decida aqui que ejercicio hace. Solo afecta a esta
  // sesion, igual que los ajustes de series/reps/descanso de aqui arriba.
  const cambiarEjercicio = (i: number) => {
    const it = lista[i];
    const nuevo = sustituir(app.perfil, it.id, lista.map(x => x.id));
    if (!nuevo) { Alert.alert('Sin alternativa', 'No encontramos otro ejercicio que sirva aqui.'); return; }
    setLista(prev => prev.map((x, n) => (n === i ? { ...aItem(nuevo, x.bloque), seriesPlan: x.seriesPlan } : x)));
  };

  // Se recalcula con cada ajuste: el usuario ve de inmediato como cambia
  // la duracion total al mover series, tiempo/reps o descanso.
  const minutos = useMemo(
    () => Math.max(1, Math.round(lista.reduce((s, it) => s + duracion(it), 0) / 60)),
    [lista],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Aparece estilo={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: esp.md, paddingBottom: esp.lg }}
        showsVerticalScrollIndicator={false}>
        <Text style={[tipo.h1, { color: color.texto }]}>Tu rutina de hoy</Text>
        <Text style={[tipo.cuerpo, { color: color.textoSuave, marginTop: esp.xs }]}>
          Ajusta series, {items.some(i => i.segPlan != null) ? 'tiempo' : 'repeticiones'} y descanso
          de cada ejercicio antes de empezar.
        </Text>
        <View style={{ marginTop: esp.sm }}>
          <Chip texto={`${minutos} min en total`} pequeno />
        </View>

        {lista.map((it, i) => (
          <Tarjeta key={`${it.id}_${i}`} estilo={{ marginTop: esp.md, gap: esp.xs }}>
            <Clip id={it.id} nombre={it.name} alto={140} ancho="100%" forma="tarjeta" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: esp.sm, marginTop: esp.xs }}>
              <Text style={[tipo.h3, { color: color.texto, flex: 1 }]}>{it.name}</Text>
              <Boton texto="Cambiar" variante="texto" onPress={() => cambiarEjercicio(i)} />
            </View>

            <FilaAjuste etiqueta="Series" valor={it.seriesPlan} min={1} max={10}
              onCambio={v => actualizar(i, { seriesPlan: v })} />

            {it.segPlan != null ? (
              <FilaAjuste etiqueta="Tiempo" valor={it.segPlan} min={5} max={300} paso={5} sufijo=" s"
                onCambio={v => actualizar(i, { segPlan: v })} />
            ) : (
              <FilaAjuste etiqueta="Repeticiones" valor={it.repsPlan ?? 10} min={1} max={50}
                onCambio={v => actualizar(i, { repsPlan: v })} />
            )}

            <FilaAjuste etiqueta="Descanso" valor={it.descansoPlan} min={0} max={300} paso={5} sufijo=" s"
              onCambio={v => actualizar(i, { descansoPlan: v })} />

            {esMaquina(it) && (
              <View style={{ marginTop: esp.xs }}>
                <Text style={[tipo.pie, { color: color.textoSuave, marginBottom: 4 }]}>
                  Ajuste de la maquina
                </Text>
                <TextInput
                  defaultValue={ajustesMaquina[it.id] ?? ''}
                  onEndEditing={e => guardarAjusteMaquina(it.id, e.nativeEvent.text.trim())}
                  placeholder="Asiento 4, respaldo 2, pin 8..."
                  placeholderTextColor={color.textoTenue}
                  style={s.inputMaquina}
                />
              </View>
            )}
          </Tarjeta>
        ))}
         <View style={s.pieEditor}>
        <Boton texto="Empezar rutina" onPress={() => onConfirmar(lista)} estilo={{ flex: 1 }} />
      </View>
      </ScrollView>
      </Aparece>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FilaAjuste({ etiqueta, valor, min, max, paso = 1, sufijo = '', onCambio }: {
  etiqueta: string; valor: number; min: number; max: number; paso?: number; sufijo?: string;
  onCambio: (v: number) => void;
}) {
  const [texto, setTexto] = useState(String(valor));
  useEffect(() => { setTexto(String(valor)); }, [valor]);

  // Escribir el numero gana a apretar +/- muchas veces (ej. descanso de 20 a 70).
  const confirmar = () => {
    const n = parseInt(texto, 10);
    const limpio = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : valor;
    setTexto(String(limpio));
    if (limpio !== valor) onCambio(limpio);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={[tipo.pie, { color: color.textoSuave }]}>{etiqueta}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: esp.sm }}>
        <Pressable onPress={() => onCambio(Math.max(min, valor - paso))} style={s.mini}
          accessibilityRole="button" accessibilityLabel={`Restar ${etiqueta.toLowerCase()}`}>
          <Text style={s.miniTxt}>−</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 60, justifyContent: 'center' }}>
          <TextInput
            value={texto} onChangeText={t => setTexto(t.replace(/[^0-9]/g, ''))}
            onEndEditing={confirmar} onSubmitEditing={confirmar}
            keyboardType="number-pad" returnKeyType="done"
            style={[tipo.dato, { color: color.texto, textAlign: 'center', padding: 0, minWidth: 24 }]}
            accessibilityLabel={`Escribir ${etiqueta.toLowerCase()}`}
          />
          {!!sufijo && <Text style={[tipo.dato, { color: color.texto }]}>{sufijo}</Text>}
        </View>
        <Pressable onPress={() => onCambio(Math.min(max, valor + paso))} style={s.mini}
          accessibilityRole="button" accessibilityLabel={`Sumar ${etiqueta.toLowerCase()}`}>
          <Text style={s.miniTxt}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ReproductorActivo({ sesionInicial, restaurar, navigation }: {
  sesionInicial: Sesion; restaurar: SesionEnCurso | null; navigation: any;
}) {
  useKeepAwake();
  useSinAnuncios();   // mientras se entrena no aparece ni un anuncio
  const { estado: app, guardarSesion } = useEstado();

  const [items, setItems] = useState<ItemSesion[]>(restaurar?.items ?? sesionInicial.items);
  const [salida, setSalida] = useState(false);
  const [anchoBarra, setAnchoBarra] = useState(0);

  const p = useSessionPlayer(items, app.perfil.sonido, restaurar);
  const { estado, ejercicio } = p;
  const acento = ACENTO[estado.fase];
  const [hapticosOn] = useHapticosActivos();

  // Crossfade del tinte de fondo: dos capas, la de abajo con el color
  // saliente (fijo) y la de arriba con el entrante, que sube de opacidad.
  // RN no anima backgroundColor con native driver, pero si opacity, y dos
  // capas solidas cruzando dan el mismo resultado sin tocar el hilo de JS.
  const reducidoTinte = useMovimientoReducido();
  const [tintePrevio, setTintePrevio] = useState(estado.fase);
  const [tinteActual, setTinteActual] = useState(estado.fase);
  const fundido = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (estado.fase === tinteActual) return;
    if (reducidoTinte) {
      setTintePrevio(estado.fase); setTinteActual(estado.fase); fundido.setValue(1);
      return;
    }
    setTintePrevio(tinteActual);
    setTinteActual(estado.fase);
    fundido.setValue(0);
    Animated.timing(fundido, { toValue: 1, duration: anim.lenta, useNativeDriver: true }).start();
  }, [estado.fase, reducidoTinte]);

  // Un toque corto cuando se registra una serie de verdad (no una omitida).
  useEffect(() => {
    if (!hapticosOn) return;
    const ultima = estado.hechas[estado.hechas.length - 1];
    if (ultima && !ultima.omitida) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [estado.hechas.length, hapticosOn]);

  // Serie completa: prende y se apaga. El fondo de la fila sube de golpe
  // (rapida) y baja despacio (lenta); el numero pulsa de escala y cruza a
  // acento. Nada de confeti: la recompensa es que el numero se enciende.
  const pulsoEscala = useRef(new Animated.Value(0)).current;
  const pulsoFondo = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ultima = estado.hechas[estado.hechas.length - 1];
    if (!ultima || ultima.omitida) return;
    if (reducidoTinte) return;
    pulsoEscala.setValue(0);
    Animated.sequence([
      Animated.timing(pulsoEscala, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(pulsoEscala, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
    pulsoFondo.setValue(0);
    Animated.sequence([
      Animated.timing(pulsoFondo, { toValue: 1, duration: anim.rapida, useNativeDriver: true }),
      Animated.timing(pulsoFondo, { toValue: 0, duration: anim.lenta, useNativeDriver: true }),
    ]).start();
  }, [estado.hechas.length, reducidoTinte]);

  // Cuenta final 3-2-1: mismas condiciones que disparan cuenta_3/2/1 en
  // useSessionPlayer. La cifra pulsa y el fondo sube de calor un instante,
  // volviendo antes de que llegue el siguiente segundo. Es la unica
  // animacion de la app que llama la atencion por si misma; no se replica
  // en ningun otro sitio.
  const pulsoCuenta = useRef(new Animated.Value(0)).current;
  const cuentaFinal =
    (estado.fase === 'preparado' || estado.fase === 'cambio_lado' || (estado.fase === 'trabajo' && p.esPorTiempo)) &&
    estado.restanteS >= 1 && estado.restanteS <= 3;
  useEffect(() => {
    if (!cuentaFinal || reducidoTinte) return;
    pulsoCuenta.setValue(0);
    Animated.sequence([
      Animated.timing(pulsoCuenta, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(pulsoCuenta, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [estado.restanteS, estado.fase, reducidoTinte]);

  /* ---------------------------------------------------------------- */
  /* Voz                                                               */
  /* ---------------------------------------------------------------- */

  const [vozOn] = useVozActiva();
  const [hablando, setHablando] = useState(false);

  // expo-speech no expone genero, solo nombre e identificador, y varian
  // por telefono. Busca una voz en español cuyo nombre suene a hombre
  // (funciona sobre todo en iOS, donde los nombres son legibles); el
  // tono mas grave de abajo es el respaldo que sí funciona en cualquier
  // telefono, tenga o no una voz masculina instalada.
  const vozMasculinaRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    let vivo = true;
    const NOMBRES_MASCULINOS = ['jorge', 'diego', 'juan', 'carlos', 'pablo', 'miguel', 'fernando', 'male', 'hombre'];
    Speech.getAvailableVoicesAsync()
      .then(voces => {
        if (!vivo) return;
        const match = voces.find(v =>
          v.language?.toLowerCase().startsWith('es') &&
          NOMBRES_MASCULINOS.some(n => v.name?.toLowerCase().includes(n) || v.identifier?.toLowerCase().includes(n)),
        );
        vozMasculinaRef.current = match?.identifier;
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  // Cada llamada corta la anterior (Speech.stop) y arranca una nueva. El
  // "onStopped" de la que se corta llega async, a veces DESPUES de que la
  // nueva ya arranco: sin este id, ese aviso tardio apaga `hablando` con
  // la voz nueva todavia sonando, y ahi "Seguir" se puede tocar a mitad de
  // frase. Solo el aviso de la llamada mas reciente cuenta.
  const hablaIdRef = useRef(0);
  function hablar(texto: string, alTerminar?: () => void) {
    if (!vozOn || !texto) { alTerminar?.(); return; }
    Speech.stop();
    const id = ++hablaIdRef.current;
    setHablando(true);
    const terminar = () => { if (hablaIdRef.current === id) { setHablando(false); alTerminar?.(); } };
    Speech.speak(texto, {
      language: 'es-MX',
      voice: vozMasculinaRef.current,
      pitch: 0.85,
      onDone: terminar,
      onStopped: terminar,
      onError: terminar,
    });
  }

  // Nombre del ejercicio y sus claves cada vez que se entra a "preparate"
  // (serie nueva o ejercicio nuevo, siempre igual). Cambios de fase (menos
  // pausa, que es accion del usuario) se anuncian con su etiqueta.
  //
  // Primero se dice todo, despues arranca la cuenta: se pausa la sesion
  // mientras habla (el reloj no corre en pausa) y se reanuda cuando
  // termina de leer el nombre y las claves. No hay boton para saltarse
  // esta fase: el avance a "trabajo" siempre llega solo, cuando termina
  // la cuenta.
  const faseVozRef = useRef<typeof estado.fase | null>(null);
  useEffect(() => {
    const antFase = faseVozRef.current;
    faseVozRef.current = estado.fase;
    if (!vozOn || antFase === null || antFase === estado.fase) return;
    if (antFase === 'pausa' || estado.fase === 'pausa') return;

    if (estado.fase === 'preparado') {
      const claves = ejercicio.cues?.length ? ` ${ejercicio.cues.join('. ')}` : '';
      p.pausar();
      hablar(`${ejercicio.name}.${claves}`, () => p.reanudar());
      return;
    }
    hablar(ETIQUETA[estado.fase]);
  }, [estado.fase, vozOn]);

  // Cuenta final hablada: la pulsada (preparate/cambio de lado/trabajo por
  // tiempo) mas el descanso, que no pulsa visualmente pero si se anuncia.
  const cuentaHablada = cuentaFinal ||
    (estado.fase === 'descanso' && estado.restanteS >= 1 && estado.restanteS <= 3);
  useEffect(() => {
    if (!cuentaHablada) return;
    hablar(String(estado.restanteS));
  }, [estado.restanteS, estado.fase, vozOn]);

  // Tic por segundo durante la espera: preparate, cambio de lado,
  // descanso y trabajo por tiempo (plancha, cardio...). Trabajo por
  // repeticiones no tiene reloj, asi que no aplica. Reusa el sonido
  // "toque" que ya existe, sin archivo nuevo.
  useEffect(() => {
    const enEspera = estado.fase === 'preparado' || estado.fase === 'cambio_lado' || estado.fase === 'descanso' ||
      (estado.fase === 'trabajo' && p.esPorTiempo);
    if (!enEspera) return;
    reproducir('toque');
  }, [estado.restanteS, estado.fase, p.esPorTiempo]);

  // Si se sale de la pantalla con la voz a mitad de frase, se corta:
  // nadie quiere seguir oyendo instrucciones de un ejercicio que ya dejo.
  useEffect(() => () => { Speech.stop(); }, []);

  // El clip se ve mientras hay un ejercicio delante del usuario, y sigue
  // visible congelado si pausa desde ahi. En descanso no: ahi la pantalla
  // es el reloj y el nombre del que viene.
  const enEjercicio =
    estado.fase === 'trabajo' || estado.fase === 'preparado' || estado.fase === 'cambio_lado';
  const verClip = enEjercicio ||
    (estado.fase === 'pausa' && estado.faseAnterior !== 'descanso' && estado.faseAnterior !== null);
  const clipActivo = enEjercicio;

  // Al terminar, guarda y pasa al resumen.
  React.useEffect(() => {
    if (estado.fase !== 'fin') return;
    if (hapticosOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    finalizar(true, null);
  }, [estado.fase]);

  function finalizar(completada: boolean, motivo: string | null) {
    p.limpiarGuardado();   // completa o abandonada, ya no hay nada que continuar
    const kcal = app.perfil.pesoKg
      ? Math.round(sesionInicial.kcalEstimadas ?? 0)
      : null;
    const res = guardarSesion({
      fecha: hoy(),
      iniciada: new Date().toISOString(),
      duracionS: estado.transcurridoS,
      rutinaId: sesionInicial.rutinaId,
      programaId: app.perfil.programaId,
      estado: completada ? 'completada' : 'abandonada',
      kcal, rpe: null, motivoAbandono: motivo,
      series: estado.hechas.map(h => ({
        ejercicioId: h.ejercicioId, serieNum: h.serieNum, lado: h.lado,
        reps: h.reps, segundos: h.segundos, pesoKg: h.pesoKg, omitida: h.omitida,
      })),
    });
    navigation.replace('Resumen', {
      estado, items, resultado: res, completada, kcal,
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: TINTE[tintePrevio] }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: TINTE[tinteActual], opacity: fundido }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
        backgroundColor: color.trabajo,
        opacity: pulsoCuenta.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
      }]} />
      <SafeAreaView style={{ flex: 1 }}>
      <Aparece estilo={{ flex: 1 }}>
      <View style={{ position: 'relative' }}>
        <View style={s.barra} onLayout={e => setAnchoBarra(e.nativeEvent.layout.width)}>
          <View style={[s.barraLlena, { width: `${p.progreso * 100}%`, backgroundColor: acento }]} />
        </View>
        {/* La chispa marca la posicion exacta de un vistazo desde el
            suelo. Fuera del View con overflow:hidden de la barra: su
            halo (sombra.brasa) necesita espacio para pintarse. */}
        {anchoBarra > 0 && p.progreso > 0 && p.progreso < 1 && (
          <View pointerEvents="none" style={[s.chispa, {
            left: esp.md + anchoBarra * p.progreso - 1.5,
            backgroundColor: acento,
          }]} />
        )}
      </View>

      <View style={s.cabecera}>
        <Pressable onPress={() => { p.pausar(); setSalida(true); }} hitSlop={12}
          accessibilityRole="button" accessibilityLabel="Salir">
          <Text style={[tipo.dato, { color: color.textoSuave }]}>Salir</Text>
        </Pressable>
        <Text style={[tipo.micro, { color: color.textoTenue }]}>
          {estado.indice + 1} de {items.length}
        </Text>
        <Pressable
          onPress={() => {
            if (estado.fase === 'pausa') { if (!hablando) p.reanudar(); return; }
            p.pausar();
          }}
          hitSlop={12}
          disabled={estado.fase === 'pausa' && hablando}
          accessibilityRole="button" accessibilityLabel={estado.fase === 'pausa' ? 'Seguir' : 'Pausa'}
          accessibilityState={{ disabled: estado.fase === 'pausa' && hablando }}
        >
          <Text style={[tipo.dato, { color: estado.fase === 'pausa' && hablando ? color.textoTenue : color.textoSuave }]}>
            {estado.fase === 'pausa' ? 'Seguir' : 'Pausa'}
          </Text>
        </Pressable>
      </View>

      <View style={s.centro}>
      {/* Vuelve a entrar (fundido + deslizamiento) cada vez que cambia el
          ejercicio: el `key` fuerza el remonte. No en cada serie del
          mismo ejercicio, solo al pasar al siguiente. */}
      <Aparece key={estado.indice} estilo={{ width: '100%', alignItems: 'center' }}>
        <Text style={[tipo.dato, { color: acento, letterSpacing: 0.4 }]} accessibilityLiveRegion="polite">
          {ETIQUETA[estado.fase]}
        </Text>

        <Animated.Text
          style={[tipo.reloj, {
            color: color.texto,
            transform: [{ scale: pulsoCuenta.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
          }]}
          maxFontSizeMultiplier={1.2}
          accessibilityLiveRegion="polite"
          accessibilityLabel={
            p.esPorTiempo || estado.fase !== 'trabajo'
              ? `${ETIQUETA[estado.fase]}, ${segundosHablados(estado.restanteS)} restantes`
              : `${ETIQUETA[estado.fase]}, ${ejercicio.repsPlan ?? 'sin definir'} repeticiones`
          }
        >
          {p.esPorTiempo || estado.fase !== 'trabajo'
            ? reloj(estado.restanteS)
            : (ejercicio.repsPlan ?? '—')}
        </Animated.Text>

        <Text style={[tipo.h2, { color: color.texto, textAlign: 'center' }]}>
          {estado.fase === 'descanso' ? siguiente(items, estado.indice, estado.serieNum) : ejercicio.name}
        </Text>

        <View style={{ marginTop: esp.xs }}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
            backgroundColor: color.acentoTinte, opacity: pulsoFondo, borderRadius: radio.chip,
          }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 2 }}>
            <Text style={[tipo.pie, { color: color.textoSuave }]}>Serie </Text>
            <Animated.View style={{
              transform: [{ scale: pulsoEscala.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
            }}>
              <View>
                <Text style={[tipo.pie, { color: color.textoSuave }]}>{estado.serieNum}</Text>
                <Animated.Text style={[tipo.pie, {
                  color: color.acento, opacity: pulsoEscala,
                  position: 'absolute', top: 0, left: 0,
                }]}>
                  {estado.serieNum}
                </Animated.Text>
              </View>
            </Animated.View>
            <Text style={[tipo.pie, { color: color.textoSuave }]}>
              {' '}de {ejercicio.seriesPlan}
              {estado.lado ? ` · lado ${estado.lado === 'izq' ? 'izquierdo' : 'derecho'}` : ''}
            </Text>
          </View>
        </View>

        {/* Que sigue, siempre visible mientras se trabaja o se prepara
            (en descanso ya ocupa el titulo de arriba): vale igual para el
            primer ejercicio que para cualquier otro, no solo a partir del
            segundo. */}
        {estado.fase !== 'descanso' && estado.fase !== 'fin' && items[estado.indice + 1] && (
          <Text style={[tipo.pie, { color: color.textoTenue, marginTop: 2 }]}>
            Sigue: {items[estado.indice + 1].name}
          </Text>
        )}

        {p.puedeDeshacer && (
          <Pressable onPress={p.deshacer} hitSlop={10} style={{ paddingVertical: esp.xs }}
            accessibilityRole="button" accessibilityLabel="Deshacer la última serie marcada">
            <Text style={[tipo.pie, { color: color.acento }]}>Deshacer última serie</Text>
          </Pressable>
        )}

        {/* Clip del ejercicio en bucle. El video dura 6-10 s y la serie lo
            que dure: se repite solo hasta que cambia la fase. En pausa se
            congela, y en descanso desaparece porque ahi lo que importa es
            el reloj y el nombre del que viene. Grande: es lo unico que
            hay que ver aqui, series/reps/tiempo/descanso ya se fijaron
            antes de empezar. */}
        {verClip && (
          <View style={{ marginTop: esp.md, width: '100%' }}>
            <Clip
              id={ejercicio.id} nombre={ejercicio.name}
              alto={280} ancho="100%" forma="tarjeta"
              activo={clipActivo}
            />
          </View>
        )}
      </Aparece>
      </View>

      <View style={s.acciones}>
        {estado.fase === 'descanso' && (
          <Boton texto="Ya estoy" onPress={p.avanzar} estilo={{ flex: 1 }} deshabilitado={hablando || cuentaHablada} />
        )}

        {estado.fase === 'trabajo' && !p.esPorTiempo && (
          <Boton
            texto="Listo"
            onPress={() => p.registrar(ejercicio.repsPlan ?? undefined)}
            estilo={{ flex: 1 }}
            deshabilitado={hablando || cuentaFinal}
          />
        )}

        {estado.fase === 'trabajo' && p.esPorTiempo && (
          <Boton texto="Terminar antes" variante="contorno" onPress={p.avanzar} estilo={{ flex: 1 }} deshabilitado={hablando || cuentaFinal} />
        )}

        {estado.fase === 'pausa' && (
          <Boton texto="Seguir" onPress={p.reanudar} estilo={{ flex: 1 }} deshabilitado={hablando} />
        )}
      </View>

      <Pressable
        onPress={() => { if (hablando) return; if (hapticosOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); p.omitir(); }}
        disabled={hablando}
        style={{ alignItems: 'center', paddingBottom: esp.sm, minHeight: 44, justifyContent: 'center', opacity: hablando ? 0.4 : 1 }}
        accessibilityRole="button" accessibilityLabel="Omitir este ejercicio"
        accessibilityState={{ disabled: hablando }}
      >
        <Text style={[tipo.pie, { color: color.textoTenue }]}>Omitir este ejercicio</Text>
      </Pressable>

      <Modal visible={salida} animationType="slide" transparent>
        <VidrioFondo intensidad={24} />
        <View style={s.modalFondo}>
          <View style={s.modal}>
            <Text style={[tipo.h2, { color: color.texto }]}>Guardamos lo que llevas</Text>
            <Text style={[tipo.cuerpo, { color: color.textoSuave, marginBottom: esp.md }]}>
              Cuéntanos qué pasó y ajustamos la próxima.
            </Text>
            {[
              ['sin_tiempo', 'No tengo tiempo hoy'],
              ['muy_dificil', 'Está muy difícil'],
              ['muy_facil', 'Está muy fácil'],
              ['molestia', 'Me molesta algo'],
              ['sin_ganas', 'Hoy no'],
            ].map(([id, txt]) => (
              <Pressable key={id} onPress={() => { setSalida(false); finalizar(false, id); }} style={s.opcionSalida}
                accessibilityRole="button" accessibilityLabel={txt}>
                <Text style={[tipo.cuerpo, { color: color.texto }]}>{txt}</Text>
              </Pressable>
            ))}
            <Boton texto="Mejor sigo" variante="texto" onPress={() => { setSalida(false); p.reanudar(); }} />
          </View>
        </View>
      </Modal>
      </Aparece>
      </SafeAreaView>
    </View>
  );
}

function siguiente(items: ItemSesion[], i: number, serie: number): string {
  const it = items[i];
  if (serie < it.seriesPlan) return it.name;
  return items[i + 1]?.name ?? 'Último esfuerzo';
}

function esMaquina(e: ItemSesion): boolean {
  return e.equipment.some(q =>
    ['polea', 'maquina_jalon', 'prensa', 'maquina_pecho', 'maquina_femoral', 'remo_maquina'].includes(q));
}

const s = StyleSheet.create({
  inputMaquina: {
    minHeight: TOQUE, borderWidth: 1, borderColor: color.borde,
    borderRadius: radio.tarjeta, paddingHorizontal: esp.md,
    color: color.texto, fontSize: 15, backgroundColor: color.lienzo,
  },
  barra: { height: 3, backgroundColor: color.borde, marginHorizontal: esp.md, borderRadius: 2, overflow: 'hidden' },
  barraLlena: { height: 3 },
  chispa: { position: 'absolute', top: 0, width: 3, height: 3, borderRadius: 1.5, ...sombra.brasa },
  cabecera: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: esp.md,
  },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: esp.md },
  acciones: { flexDirection: 'row', gap: esp.sm, paddingHorizontal: esp.md, paddingBottom: esp.sm },
  pieEditor: {
    padding: esp.md,
    borderTopWidth: 1, borderTopColor: color.borde, backgroundColor: color.fondo,
  },
  mini: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: color.bordeFuerte,
    alignItems: 'center', justifyContent: 'center', backgroundColor: color.fondo,
  },
  miniTxt: { fontSize: 22, color: color.textoSuave },
  modalFondo: { flex: 1, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: color.fondo, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: esp.lg, gap: esp.sm,
  },
  opcionSalida: {
    minHeight: TOQUE, justifyContent: 'center', paddingHorizontal: esp.md,
    borderWidth: 1, borderColor: color.borde, borderRadius: radio.tarjeta,
  },
});
