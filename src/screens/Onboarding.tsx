/**
 * FORJA · onboarding
 *
 * Once pasos, definidos como datos. Objetivo y nombre son obligatorios.
 *
 * Animacion entre preguntas: la que sale se va hacia el lado y se desvanece,
 * la que entra llega desde el lado contrario. Al retroceder, al reves. Es
 * una pista de direccion, no un adorno: el usuario siente si avanza o vuelve.
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, Animated, Easing, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { color, tipo, esp, radio, TOQUE, anim, degradado, peso } from '../theme';
import { Boton, Opcion, Contador, Nota, Aparece } from '../components/ui';
import { EQUIPO, GOALS } from '../data/catalog';
import { derivar, derivarNivel, elegirPrograma, avisosDe, type Rs } from '../data/perfil';
import { fuente } from '../media/registry';
import type { PerfilUsuario } from '../store/store';
import { useCuenta } from '../store/cuenta';

export { derivar, derivarNivel, elegirPrograma, avisosDe };

const { width } = Dimensions.get('window');

type Tipo = 'unica' | 'multiple' | 'numero' | 'texto';
interface Paso {
  campo: string; tipo: Tipo; pregunta: string; ayuda?: string;
  opciones?: { id: string; texto: string; detalle?: string }[];
  obligatorio?: boolean; min?: number; max?: number; sufijo?: string;
  defecto?: unknown; saltarSi?: (r: Rs) => boolean;
  /** muestra un enlace para pasar sin responder */
  saltable?: boolean;
}

const EQUIPO_ONB = EQUIPO.filter(e => e.onboarding && e.id !== 'ninguno')
  .sort((a, b) => a.orden - b.orden)
  .map(e => ({
    id: e.id, texto: e.name,
    detalle: e.sustituto_casero ? `Si no tienes: ${e.sustituto_casero}` : undefined,
  }));

const PASOS: Paso[] = [
  { campo: 'objetivo', tipo: 'unica', obligatorio: true, saltable: true,
    pregunta: 'Qué quieres trabajar',
    ayuda: 'Puedes cambiarlo cuando quieras, sin perder tu historial.',
    opciones: GOALS.map(g => ({ id: g.id, texto: g.nombre, detalle: g.sub })) },

  { campo: 'experiencia', tipo: 'unica', defecto: 'nada',
    pregunta: 'Cuánto llevas entrenando',
    opciones: [
      { id: 'nada', texto: 'Nunca, o hace años' },
      { id: 'pausa', texto: 'Entrenaba, llevo meses parado' },
      { id: 'algo', texto: 'Algunos meses seguidos' },
      { id: 'constante', texto: 'Más de un año constante' },
    ] },

  { campo: 'diasPorSemana', tipo: 'numero', min: 2, max: 6, defecto: 3, sufijo: 'días por semana',
    pregunta: 'Cuántos días a la semana, de verdad',
    ayuda: 'Piensa en tu semana real, no en la ideal. Tres días sostenidos ganan a seis que no ocurren.' },

  { campo: 'minPorSesion', tipo: 'unica', defecto: 20,
    pregunta: 'Cuánto tiempo tienes por sesión',
    ayuda: 'La sesión siempre cabe en el tiempo que digas. Si un día no lo tienes, hay una de cinco minutos.',
    opciones: [
      { id: '10', texto: '10 minutos' }, { id: '20', texto: '20 minutos' },
      { id: '30', texto: '30 minutos' }, { id: '45', texto: '45 minutos' },
      { id: '60', texto: 'Una hora o más' },
    ] },

  { campo: 'lugar', tipo: 'unica', defecto: 'casa',
    pregunta: 'Dónde vas a entrenar',
    opciones: [
      { id: 'casa', texto: 'En casa' }, { id: 'gym', texto: 'En un gimnasio' },
      { id: 'exterior', texto: 'Al aire libre' }, { id: 'mixto', texto: 'Depende del día' },
    ] },

  { campo: 'equipo', tipo: 'multiple', defecto: [], saltarSi: r => r.lugar === 'gym',
    pregunta: 'Qué tienes a mano',
    ayuda: 'Sin marcar nada quedan más de 130 ejercicios. No hace falta comprar nada para empezar.',
    opciones: EQUIPO_ONB },

  { campo: 'espacio', tipo: 'unica', defecto: 'colchoneta', saltarSi: r => r.lugar === 'gym',
    pregunta: 'Cuánto espacio tienes',
    opciones: [
      { id: 'minimo', texto: 'Lo justo para estar de pie', detalle: 'Un metro cuadrado' },
      { id: 'colchoneta', texto: 'Para tumbarme', detalle: 'Dos por uno' },
      { id: 'amplio', texto: 'Puedo desplazarme', detalle: 'Sala o patio' },
    ] },

  { campo: 'ruido', tipo: 'unica', defecto: 'si', saltarSi: r => r.lugar === 'gym',
    pregunta: 'Puedes hacer ruido',
    ayuda: 'Si vives en departamento o entrenas de noche, quitamos saltos e impacto. No pierdes nada: cada rutina tiene su versión silenciosa.',
    opciones: [
      { id: 'si', texto: 'Sí, sin problema' },
      { id: 'no', texto: 'Mejor sin ruido ni saltos' },
    ] },

  { campo: 'contra', tipo: 'multiple', defecto: [],
    pregunta: 'Alguna lesión o molestia',
    ayuda: 'Sacamos del plan todo lo que cargue esas zonas, y ese filtro no se relaja nunca.',
    opciones: [
      { id: 'lesion_cuello', texto: 'Cuello' }, { id: 'lesion_hombro', texto: 'Hombro' },
      { id: 'lesion_codo', texto: 'Codo' }, { id: 'lesion_muneca', texto: 'Muñeca' },
      { id: 'lesion_lumbar', texto: 'Espalda baja' }, { id: 'hernia_discal', texto: 'Hernia discal' },
      { id: 'lesion_cadera', texto: 'Cadera' }, { id: 'lesion_rodilla', texto: 'Rodilla' },
      { id: 'lesion_tobillo', texto: 'Tobillo' }, { id: 'problema_atm', texto: 'Mandíbula (ATM)' },
    ] },

  { campo: 'situacion', tipo: 'multiple', defecto: [],
    pregunta: 'Alguna de estas te aplica',
    ayuda: 'Cambia qué ejercicios entran. Si marcas alguna, conviene que lo hables también con tu médico o fisioterapeuta.',
    opciones: [
      { id: 'embarazo', texto: 'Estoy embarazada' },
      { id: 'postparto', texto: 'Postparto reciente' },
      { id: 'hipertension', texto: 'Tensión alta' },
      { id: 'vertigo', texto: 'Mareos o vértigo' },
    ] },

  { campo: 'alturaCm', tipo: 'numero', min: 120, max: 220, defecto: 170, sufijo: 'cm',
    pregunta: 'Cuánto mides',
    ayuda: 'Opcional. Es un dato de tu perfil, no cambia tu plan ni ningún cálculo.',
    saltable: true },

  { campo: 'pesoKg', tipo: 'numero', min: 35, max: 200, defecto: 70, sufijo: 'kg ahora',
    pregunta: 'Cuánto pesas',
    ayuda: 'Opcional. Solo se usa para estimar el gasto de la sesión. Si prefieres no ponerlo, puedes saltar este paso.',
    saltable: true },

  { campo: 'pesoObjetivoKg', tipo: 'numero', min: 35, max: 200, defecto: 70, sufijo: 'kg objetivo',
    pregunta: 'Tienes un peso en mente',
    ayuda: 'Opcional, y no cambia tu plan: no ponemos dietas ni fechas. Sirve solo como referencia tuya en la pantalla de progreso.',
    saltable: true,
    saltarSi: r => r.pesoKg === undefined },

  { campo: 'nombre', tipo: 'texto', defecto: '', obligatorio: true,
    pregunta: 'Cómo te llamamos',
    ayuda: 'Solo se usa para saludarte.' },
];

/* ------------------------------------------------------------------ */

export default function Onboarding({ onTerminar }: { onTerminar: (p: PerfilUsuario) => void }) {
  const [r, setR] = useState<Rs>({});
  const [i, setI] = useState(0);
  const [resumen, setResumen] = useState(false);
  const [preparando, setPreparando] = useState(false);

  const pasos = useMemo(() => PASOS.filter(p => !p.saltarSi?.(r)), [r]);
  const paso = pasos[Math.min(i, pasos.length - 1)];
  const valor = r[paso.campo] ?? paso.defecto;
  const respondido = r[paso.campo] !== undefined
    && !(paso.tipo === 'texto' && String(r[paso.campo]).trim() === '');
  const puedeSeguir = !paso.obligatorio || respondido;

  // Deslizamiento entre preguntas.
  const desliz = useRef(new Animated.Value(0)).current;
  const opacidad = useRef(new Animated.Value(1)).current;

  const transicion = (dir: 1 | -1, despues: () => void) => {
    Animated.parallel([
      Animated.timing(desliz, { toValue: -dir * width * 0.25, duration: anim.rapida, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
      Animated.timing(opacidad, { toValue: 0, duration: anim.rapida, useNativeDriver: true }),
    ]).start(() => {
      despues();
      desliz.setValue(dir * width * 0.25);
      Animated.parallel([
        Animated.timing(desliz, { toValue: 0, duration: anim.normal, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(opacidad, { toValue: 1, duration: anim.normal, useNativeDriver: true }),
      ]).start();
    });
  };

  const set = (v: unknown) => setR(prev => ({ ...prev, [paso.campo]: v }));

  // Con esto, "Como te llamamos" se llena solo en vez de escribirlo a mano.
  // No crea cuenta ni sincroniza nada: solo lee el nombre de Google.
  const { cuenta } = useCuenta();
  useEffect(() => {
    if (cuenta?.nombre) setR(prev => ({ ...prev, nombre: cuenta.nombre }));
  }, [cuenta?.nombre]);

  const avanzar = () => {
    if (r[paso.campo] === undefined && paso.defecto !== undefined) set(paso.defecto);
    if (i < pasos.length - 1) transicion(1, () => setI(i + 1));
    else {
      // Pausa breve armando el plan. No es humo: el motor esta filtrando
      // el catalogo entero contra las respuestas.
      setPreparando(true);
      setTimeout(() => { setPreparando(false); setResumen(true); }, 1100);
    }
  };

  if (preparando) return <Preparando />;

  if (resumen) {
    const { perfil, avisos } = derivar(r);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.fondo }}>
        <ScrollView contentContainerStyle={{ padding: esp.md, paddingBottom: esp.xl }}>
          <Aparece>
            <Text style={[tipo.display, { color: color.texto, marginTop: esp.lg }]}>
              {perfil.nombre ? `Listo, ${perfil.nombre}` : 'Tu plan'}
            </Text>
          </Aparece>

          <Aparece retraso={120}>
            <LinearGradient colors={degradado.paso} style={s.tarjeta}>
              <D e="Sesiones" v={`${perfil.diasPorSemana} por semana`} />
              <D e="Duración" v={`${perfil.minPorSesion} minutos`} />
              <D e="Nivel de arranque" v={`${perfil.nivel} de 3`} />
              {perfil.modoSinSaltos && <D e="Modo" v="Sin saltos ni ruido" />}
              {perfil.contra.length > 0 && <D e="Zonas protegidas" v={String(perfil.contra.length)} />}
            </LinearGradient>
          </Aparece>

          {avisos.map((a, n) => (
            <Aparece key={n} retraso={200 + n * 90}>
              <Nota titulo={n === 0 ? 'Antes de empezar' : undefined} texto={a} tono="cuidado" />
            </Aparece>
          ))}

          <Aparece retraso={420}>
            <Text style={[tipo.pie, { color: color.textoTenue, marginTop: esp.md }]}>
              Puedes cambiar cualquiera de estas respuestas en Ajustes, sin perder tu historial.
            </Text>
            <Boton texto="Empezar" onPress={() => onTerminar(perfil)} estilo={{ marginTop: esp.lg }} />
            <Boton texto="Cambiar algo" variante="texto" onPress={() => setResumen(false)} />
          </Aparece>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const bg = fuente('fondo', 'onboarding');

  return (
    <LinearGradient
      colors={bg ? ['transparent', 'transparent'] : degradado.portada}
      locations={[0, 0.4, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Progreso por segmentos: se ve cuanto falta de verdad. */}
        <View style={s.segmentos}>
          {pasos.map((_, n) => (
            <View key={n} style={[s.segmento, n <= i && { backgroundColor: color.carbon }]} />
          ))}
        </View>

        <Animated.View style={{ flex: 1, opacity: opacidad, transform: [{ translateX: desliz }] }}>
          <ScrollView
            contentContainerStyle={{ padding: esp.md, paddingTop: esp.lg }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[tipo.micro, { color: color.textoTenue }]}>
              PASO {i + 1} DE {pasos.length}
            </Text>
            <Text style={[tipo.h1, { color: color.texto, marginTop: esp.xs }]}>{paso.pregunta}</Text>
            {paso.ayuda && (
              <Text style={[tipo.cuerpo, { color: color.textoSuave, marginTop: esp.sm }]}>{paso.ayuda}</Text>
            )}

            <View style={{ marginTop: esp.lg, gap: esp.sm }}>
              {paso.tipo === 'unica' && paso.opciones?.map((o, n) => (
                <Aparece key={o.id} retraso={n * 35}>
                  <Opcion
                    texto={o.texto} detalle={o.detalle}
                    activa={String(valor) === o.id}
                    onPress={() => set(paso.campo === 'minPorSesion' ? Number(o.id) : o.id)}
                  />
                </Aparece>
              ))}

              {paso.tipo === 'multiple' && paso.opciones?.map((o, n) => {
                const sel = ((valor as string[]) ?? []).includes(o.id);
                return (
                  <Aparece key={o.id} retraso={n * 25}>
                    <Opcion
                      texto={o.texto} detalle={o.detalle} activa={sel} multiple
                      onPress={() => {
                        const act = (valor as string[]) ?? [];
                        set(sel ? act.filter(x => x !== o.id) : [...act, o.id]);
                      }}
                    />
                  </Aparece>
                );
              })}

              {paso.tipo === 'numero' && (
                <Contador
                  valor={Number(valor ?? 3)} min={paso.min ?? 1} max={paso.max ?? 7}
                  sufijo={paso.sufijo} onCambio={set}
                />
              )}

              {paso.tipo === 'texto' && (
                <View style={{ gap: esp.sm }}>
                  <TextInput
                    value={String(valor ?? '')} onChangeText={set}
                    placeholder="Tu nombre" placeholderTextColor={color.textoTenue}
                    style={s.input}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>

        {paso.saltable && (
          <Boton
            texto="Prefiero no decirlo" variante="texto"
            onPress={() => {
              setR(prev => { const n = { ...prev }; delete n[paso.campo]; return n; });
              if (i < pasos.length - 1) transicion(1, () => setI(i + 1)); else setResumen(true);
            }}
          />
        )}
        <View style={s.pie}>
          {i > 0 && (
            <Boton texto="Atrás" variante="texto" onPress={() => transicion(-1, () => setI(i - 1))} />
          )}
          <Boton
            texto={i === pasos.length - 1 ? 'Ver mi plan' : 'Seguir'}
            onPress={avanzar} deshabilitado={!puedeSeguir} estilo={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/** Pantalla breve mientras el motor filtra el catalogo. */
function Preparando() {
  const giro = useRef(new Animated.Value(0)).current;
  const [texto, setTexto] = useState('Revisando tus respuestas');

  useEffect(() => {
    Animated.loop(Animated.timing(giro, {
      toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.linear,
    })).start();
    const t1 = setTimeout(() => setTexto('Filtrando 190 ejercicios'), 380);
    const t2 = setTimeout(() => setTexto('Armando tu primera sesión'), 760);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <LinearGradient colors={[degradado.portada[0], degradado.portada[2]]} style={s.preparando}>
      <Animated.View style={[s.aro, {
        transform: [{ rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
      }]} />
      <Text style={[tipo.h3, { color: color.texto, marginTop: esp.lg }]}>{texto}</Text>
      <Text style={[tipo.pie, { color: color.textoSuave, marginTop: esp.xs }]}>Un momento</Text>
    </LinearGradient>
  );
}

function D({ e, v }: { e: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[tipo.cuerpo, { color: color.textoSuave }]}>{e}</Text>
      <Text style={[tipo.cuerpo, { color: color.texto, fontFamily: peso.semibold }]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  segmentos: { flexDirection: 'row', gap: 4, paddingHorizontal: esp.md, paddingTop: esp.sm },
  segmento: { flex: 1, height: 3, borderRadius: 2, backgroundColor: color.borde },
  pie: { flexDirection: 'row', alignItems: 'center', gap: esp.sm, padding: esp.md },
  input: {
    minHeight: TOQUE, borderWidth: 1, borderColor: color.borde,
    borderRadius: radio.tarjeta, paddingHorizontal: esp.md,
    color: color.texto, fontSize: 16, backgroundColor: color.fondo,
  },
  tarjeta: { borderRadius: radio.tarjeta, padding: esp.lg, marginTop: esp.lg, gap: esp.sm },
  preparando: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  aro: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 3,
    borderColor: color.borde, borderTopColor: color.carbon,
  },
});
