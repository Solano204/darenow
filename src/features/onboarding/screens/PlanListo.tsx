/**
 * Plan listo: la pantalla con que termina el cuestionario. Foto a sangre
 * arriba, el saludo, tres placas con los datos del plan y Empezar abajo. Los
 * datos vienen de `derivar` (via `useOnboarding`); aqui solo hay presentacion.
 *
 * «Se forja el plan» (una vez, ~1.6 s, los botones se pueden tocar desde el
 * inicio): destello de magnesia, la foto llega, el nombre entra letra por
 * letra, las tres placas caen una tras otra con su golpe, los numeros ruedan
 * y al final aparecen la ayuda y el boton con un unico brillo.
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, tipo, familia, esp, degradado, easing, MARGEN_PANTALLA } from '@/ui/theme';
import { Boton, Nota } from '@/ui/components';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { PlacaDato } from '@/ui/components/PlacaDato';
import { GomaTexture } from '@/ui/fx/GomaTexture';
import { FotoTratada, ANCLAS_VELO } from '@/ui/fx/FotoTratada';
import { TituloLetras } from '@/ui/fx/TituloMascara';
import { Entrada } from '@/ui/fx/Entrada';
import { useMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { fuente } from '@/media/registry';
import type { PerfilUsuario } from '@/state/store';

const FRACCION_FOTO = 0.38;
const FOCO_FOTO = { x: 0.55, y: 0.3 };
const T_FOTO = 200;
const T_LISTO = 350;
const T_PLACAS = 700;
const T_ESCALONADO_PLACAS = 160;
const T_CIERRE = 1400;
const T_BRILLO = 1500;

interface Props {
  perfil: PerfilUsuario;
  avisos: string[];
  onEmpezar: () => void;
  onCambiar: () => void;
}

export default function PlanListo({ perfil, avisos, onEmpezar, onCambiar }: Props) {
  const { width, height } = useWindowDimensions();
  const magnesia = useMagnesia();
  const reducido = useReducedMotion();
  const alturaFoto = Math.round(height * FRACCION_FOTO);
  const foto = fuente('fondo', 'plan-listo') ?? fuente('fondo', 'bienvenida');

  const escala = useSharedValue(reducido ? 1 : 1.06);
  const opacidad = useSharedValue(0);

  useEffect(() => {
    magnesia.destello();
    if (reducido) { opacidad.value = withTiming(1, { duration: 150 }); return; }
    escala.value = withDelay(T_FOTO, withTiming(1, { duration: 1000, easing: easing.salida }));
    opacidad.value = withDelay(T_FOTO, withTiming(1, { duration: 400 }));
  }, []);

  const estiloFoto = useAnimatedStyle(() => ({ opacity: opacidad.value }));
  const nombre = perfil.nombre;

  return (
    <View style={s.raiz}>
      <Animated.View style={[s.foto, { width, height: alturaFoto }, estiloFoto]} pointerEvents="none">
        {foto !== null && <FotoTratada fuente={foto} ancho={width} alto={alturaFoto} foco={FOCO_FOTO} escala={escala} />}
        <LinearGradient colors={degradado.velo} locations={ANCLAS_VELO} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <GomaTexture />

      <SafeAreaView style={s.contenido}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} bounces={false}>
          {nombre ? (
            <>
              <Entrada activo retraso={T_LISTO} y={6}>
                <Text style={s.listo}>Listo,</Text>
              </Entrada>
              <TituloLetras lineas={[nombre]} estilo={[tipo.display, s.nombre]} activo retraso={T_LISTO + 100} />
            </>
          ) : (
            <TituloLetras lineas={['Tu plan']} estilo={[tipo.display, s.nombre]} activo retraso={T_LISTO} />
          )}

          <View style={s.placas}>
            <PlacaDato numero={perfil.diasPorSemana} etiqueta={'sesiones\npor semana'} filo={paleta.placaVerde} retraso={T_PLACAS} />
            <PlacaDato numero={perfil.minPorSesion} etiqueta={'minutos\npor sesión'} filo={paleta.placaAmarilla} retraso={T_PLACAS + T_ESCALONADO_PLACAS} />
            <PlacaDato numero={perfil.nivel} etiqueta={'de 3, nivel\nde arranque'} filo={paleta.placaAzul} retraso={T_PLACAS + 2 * T_ESCALONADO_PLACAS} />
          </View>

          {(perfil.modoSinSaltos || perfil.contra.length > 0) && (
            <Entrada activo retraso={T_CIERRE} y={8}>
              <View style={s.etiquetas}>
                {perfil.modoSinSaltos && <View style={s.etiqueta}><Text style={s.etiquetaTexto}>Sin saltos ni ruido</Text></View>}
                {perfil.contra.length > 0 && (
                  <View style={s.etiqueta}><Text style={s.etiquetaTexto}>Zonas protegidas: {perfil.contra.length}</Text></View>
                )}
              </View>
            </Entrada>
          )}

          {avisos.map((a, n) => (
            <Entrada key={n} activo retraso={T_CIERRE + n * 90} y={8}>
              <Nota titulo={n === 0 ? 'Antes de empezar' : undefined} texto={a} tono="cuidado" />
            </Entrada>
          ))}

          <Entrada activo retraso={T_CIERRE} y={8}>
            <Text style={s.ayuda}>Puedes cambiar cualquiera de estas respuestas en Ajustes, sin perder tu historial.</Text>
          </Entrada>
        </ScrollView>

        <View style={s.pie}>
          <Entrada activo retraso={T_CIERRE} escala={0.96} estilo={s.ancho}>
            <BotonPlaca texto="Empezar" aplauso brillo={T_BRILLO} onPress={onEmpezar} estilo={s.ancho} />
          </Entrada>
          <Boton texto="Cambiar algo" variante="texto" onPress={onCambiar} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  foto: { position: 'absolute', top: 0, left: 0 },
  contenido: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.lg },
  listo: { fontFamily: familia.cuerpo, fontSize: 18, lineHeight: 24, color: paleta.magnesia2 },
  nombre: { fontSize: 52, lineHeight: 50, color: paleta.magnesia },
  placas: { flexDirection: 'row', gap: esp.sm + 4, marginTop: esp.lg },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm, marginTop: esp.md },
  etiqueta: {
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
  },
  etiquetaTexto: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia },
  ayuda: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto, marginTop: esp.md },
  pie: { paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.md, paddingBottom: esp.md, gap: esp.xs },
  ancho: { alignSelf: 'stretch' },
});
