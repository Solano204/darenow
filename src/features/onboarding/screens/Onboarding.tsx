/**
 * Cuestionario de entrada. La logica (pasos, validacion, respuestas, plan)
 * vive en `useOnboarding`; aqui solo hay presentacion.
 *
 * Los botones inferiores y la barra de carga no se mueven al cambiar de paso:
 * lo unico que avanza es el contenido, con la coreografia de `TransicionPaso`.
 */

import React, { useEffect, useEffectEvent, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable, AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, tipo, familia, esp, degradado, MARGEN_PANTALLA, AREA_TACTIL_MIN, resorteMagnesia } from '@/ui/theme';
import { Boton } from '@/ui/components';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { OpcionCuestionario } from '@/ui/components/OpcionCuestionario';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';
import { ContadorPlacas } from '@/ui/components/ContadorPlacas';
import { CampoTexto } from '@/ui/components/CampoTexto';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { BarraCarga13 } from '@/ui/fx/BarraCarga13';
import { TituloMascara } from '@/ui/fx/TituloMascara';
import { Entrada } from '@/ui/fx/Entrada';
import { SaludoPreview } from '@/features/onboarding/components/SaludoPreview';
import { TransicionPaso, useTransicionPaso } from '@/features/onboarding/components/TransicionPaso';
import { useOnboarding, type TipoPaso } from '@/features/onboarding/hooks/useOnboarding';
import { useFirstView } from '@/features/onboarding/hooks/useFirstView';
import type { PerfilUsuario } from '@/state/store';
import PlanListo from './PlanListo';

type Cuestion = ReturnType<typeof useOnboarding>;
type Transicion = ReturnType<typeof useTransicionPaso>;

const PISTA_OBJETIVO = 'Elige un objetivo para continuar';
const PISTA_NOMBRE = 'Escribe tu nombre para continuar';
const PISTAS: Record<TipoPaso, string> = {
  unica: 'Elige una opción para continuar',
  multiple: 'Marca al menos una opción para continuar',
  numero: 'Elige un valor para continuar',
  texto: 'Escribe una respuesta para continuar',
};
const ESCALONADO_OPCIONES_MS = 45;
const DESPLAZAMIENTO_ZONA = 24;

export default function Onboarding({ onTerminar }: { onTerminar: (p: PerfilUsuario) => void }) {
  const transicion = useTransicionPaso();
  const o = useOnboarding(onTerminar, transicion.ir);

  if (o.preparando) return <Preparando total={o.pasos.length} />;
  if (o.plan) {
    return <PlanListo perfil={o.plan.perfil} avisos={o.plan.avisos} onEmpezar={o.empezar} onCambiar={o.cambiarAlgo} />;
  }
  return <Cuestionario o={o} transicion={transicion} />;
}

function Cuestionario({ o, transicion }: { o: Cuestion; transicion: Transicion }) {
  const { paso, i, pasos, puedeSeguir } = o;
  const primeraVez = useFirstView();
  const animarLista = primeraVez.debeAnimar(i);
  const pista = paso.campo === 'objetivo' ? PISTA_OBJETIVO : paso.campo === 'nombre' ? PISTA_NOMBRE : PISTAS[paso.tipo];

  const alCambiarI = useEffectEvent(() => {
    primeraVez.marcarVisto(i);
    transicion.reponer();
    if (i > 0) AccessibilityInfo.announceForAccessibility(`Paso ${i + 1} de ${pasos.length}. ${paso.pregunta}`);
    return () => primeraVez.soltar(i);
  });
  useEffect(() => alCambiarI(), [i]);

  return (
    <View style={s.raiz}>
      <GomaTexture />
      <SafeAreaView style={s.contenido}>
        <BarraCarga13 total={pasos.length} actual={i + 1} />

        <KeyboardAvoidingView style={s.contenido} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TransicionPaso estilo={transicion.estilo}>
            <View style={s.cabeza}>
              <TituloMascara key={paso.campo} texto={paso.pregunta} estilo={s.pregunta} activo />
              {paso.ayuda && (
                <Entrada key={`ayuda-${paso.campo}`} activo retraso={200} y={8}>
                  <Text style={s.ayuda}>{paso.ayuda}</Text>
                </Entrada>
              )}
            </View>
            <Entrada
              key={`zona-${paso.campo}`} activo resorte={resorteMagnesia}
              x={DESPLAZAMIENTO_ZONA * transicion.ultima.current} estilo={s.zona}
            >
              <ZonaRespuesta o={o} animarLista={animarLista} />
            </Entrada>
          </TransicionPaso>

          <View style={s.pie}>
            {paso.saltable && <Boton texto="Prefiero no decirlo" variante="texto" onPress={o.saltarMedida} />}
            <View style={s.controles}>
              {i > 0 && (
                <Pressable
                  onPress={o.atras} hitSlop={8} style={s.atras}
                  accessibilityRole="button" accessibilityLabel="Atrás"
                >
                  <Text style={s.atrasTexto}>Atrás</Text>
                </Pressable>
              )}
              <BotonPlaca
                texto={o.esUltimo ? 'Ver mi plan' : 'Seguir'}
                onPress={o.avanzar} deshabilitado={!puedeSeguir} estilo={s.seguir}
              />
            </View>
            <Text style={s.pista} accessibilityLiveRegion="polite">{puedeSeguir ? '' : pista}</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function ZonaRespuesta({ o, animarLista }: { o: Cuestion; animarLista: boolean }) {
  const { paso, valor, set } = o;

  if (paso.tipo === 'numero') {
    return (
      <ContadorPlacas
        valor={Number(valor ?? 3)} min={paso.min ?? 1} max={paso.max ?? 7}
        sufijo={paso.sufijo} onCambio={o.cambiarNumero}
        semana={paso.campo === 'diasPorSemana'}
      />
    );
  }

  if (paso.tipo === 'texto') {
    return (
      <View style={s.zonaTexto}>
        <SaludoPreview nombre={String(valor ?? '')} />
        <CampoTexto valor={String(valor ?? '')} onCambio={set} placeholder="Tu nombre" etiqueta="Tu nombre" />
      </View>
    );
  }

  const multiple = paso.tipo === 'multiple';
  const marcadas = (valor as string[] | undefined) ?? [];

  return (
    <View style={s.lista}>
      <ScrollView
        contentContainerStyle={s.opciones}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {paso.opciones?.map((op, n) => {
          const activa = multiple ? marcadas.includes(op.id) : String(valor) === op.id;
          return (
            <Entrada key={op.id} activo animar={animarLista} retraso={n * ESCALONADO_OPCIONES_MS} y={12}>
              <OpcionCuestionario
                texto={op.texto} detalle={op.detalle} activa={activa} multiple={multiple}
                icono={paso.campo === 'objetivo' ? ICONOS_OBJETIVO[op.id] : undefined}
                onPress={() => {
                  if (multiple) set(activa ? marcadas.filter(x => x !== op.id) : [...marcadas, op.id]);
                  else set(paso.campo === 'minPorSesion' ? Number(op.id) : op.id);
                }}
              />
            </Entrada>
          );
        })}
      </ScrollView>
      <LinearGradient colors={degradado.desdeGoma} pointerEvents="none" style={s.fundeArriba} />
      <LinearGradient colors={degradado.haciaGoma} pointerEvents="none" style={s.fundeAbajo} />
    </View>
  );
}

/** Pantalla breve mientras el motor filtra el catalogo. */
function Preparando({ total }: { total: number }) {
  const [texto, setTexto] = useState('Revisando tus respuestas');

  useEffect(() => {
    const t1 = setTimeout(() => setTexto('Filtrando 190 ejercicios'), 380);
    const t2 = setTimeout(() => setTexto('Armando tu primera sesión'), 760);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <View style={s.preparando}>
      <GomaTexture />
      <View style={s.barraPreparando}><BarraCarga13 total={total} actual={total} /></View>
      <Text style={s.preparandoTexto} accessibilityLiveRegion="polite">{texto}</Text>
      <Text style={s.preparandoSub}>Un momento</Text>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  contenido: { flex: 1 },
  cabeza: { paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.lg },
  pregunta: { ...tipo.display, fontSize: 40, lineHeight: 40, color: paleta.magnesia },
  ayuda: { ...tipo.cuerpo, color: paleta.magnesia2, marginTop: esp.sm },
  zona: { flex: 1 },
  lista: { flex: 1 },
  opciones: { gap: 10, paddingHorizontal: MARGEN_PANTALLA, paddingTop: 24, paddingBottom: 48 },
  fundeArriba: { position: 'absolute', top: 0, left: 0, right: 0, height: 24 },
  fundeAbajo: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 48 },
  zonaTexto: { flex: 1, justifyContent: 'center', gap: esp.lg, paddingHorizontal: MARGEN_PANTALLA },
  pie: { paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.sm },
  controles: { flexDirection: 'row', alignItems: 'center', gap: esp.md },
  atras: { minWidth: AREA_TACTIL_MIN, minHeight: AREA_TACTIL_MIN, justifyContent: 'center' },
  atrasTexto: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia2 },
  seguir: { flex: 1 },
  pista: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto, minHeight: 18, marginTop: esp.sm, marginBottom: esp.sm },
  preparando: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: paleta.goma },
  barraPreparando: { alignSelf: 'stretch', marginBottom: esp.lg },
  preparandoTexto: { ...tipo.h3, color: paleta.magnesia },
  preparandoSub: { ...tipo.pie, color: paleta.magnesia2, marginTop: esp.xs },
});
