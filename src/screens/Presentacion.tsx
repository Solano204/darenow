/**
 * Presentacion: las cuatro laminas que ve quien abre la app por primera vez.
 * Foto a sangre arriba, texto anclado abajo y la zona de control fija.
 * La logica (indice, avanzar, saltar) vive en `usePresentacion`.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, color, tipo, esp, degradado, MARGEN_PANTALLA, AREA_TACTIL_MIN, peso } from '../theme';
import { BotonPlaca } from '../components/ui/BotonPlaca';
import { NotaEntrenador } from '../components/ui/NotaEntrenador';
import { BarraPlacas } from '../components/fx/BarraPlacas';
import { GomaTexture } from '../components/fx/GomaTexture';
import { FotoTratada } from '../components/fx/FotoTratada';
import { fuente } from '../media/registry';
import { usePresentacion } from '../hooks/usePresentacion';

const FRACCION_FOTO = 0.62;
const ANCLAS_VELO = [0.2, 0.5, 0.78, 1] as const;
const ALTO_VELO_ARRIBA = 120;

/** «Gratis. Todo. Sin trucos» se lee en tres golpes; el resto de titulos va en un solo bloque. */
export function lineasDeTitulo(titulo: string): string[] {
  return titulo.includes('. ') ? titulo.split('. ').map((t, n, todas) => (n < todas.length - 1 ? `${t}.` : t)) : [titulo];
}

export default function Presentacion({ onTerminar }: { onTerminar: () => void }) {
  const { width, height } = useWindowDimensions();
  const { i, laminas, esUltima, avanzar, saltar } = usePresentacion(onTerminar);
  const l = laminas[i];
  const foto = fuente('fondo', l.id);
  const alturaFoto = height * FRACCION_FOTO;

  return (
    <View style={s.raiz}>
      <View style={[s.foto, { width, height: alturaFoto }]} pointerEvents="none">
        {foto !== null && <FotoTratada fuente={foto} ancho={width} alto={alturaFoto} />}
        <LinearGradient colors={degradado.velo} locations={ANCLAS_VELO} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={degradado.veloArriba} style={s.veloArriba} />
      </View>
      <GomaTexture />

      <SafeAreaView style={s.contenido}>
        <View style={s.barraSuperior}>
          <Text style={[tipo.wordmark, { color: paleta.magnesia }]} maxFontSizeMultiplier={1.1}>DARENOW</Text>
          <Pressable
            onPress={saltar} hitSlop={12} style={s.saltar}
            accessibilityRole="button" accessibilityLabel="Saltar"
          >
            <Text style={s.saltarTexto}>Saltar</Text>
          </Pressable>
        </View>

        <View style={s.zonaTexto}>
          {lineasDeTitulo(l.titulo).map(linea => (
            <Text key={linea} style={[tipo.display, { color: color.texto }]}>{linea}</Text>
          ))}
          <Text style={[tipo.cuerpo, s.cuerpo]}>{l.cuerpo}</Text>
          {l.pie && <NotaEntrenador estilo={s.nota}>{l.pie}</NotaEntrenador>}
        </View>

        <View style={s.control}>
          <BarraPlacas paso={i} total={laminas.length} />
          <BotonPlaca texto={esUltima ? 'Empezar' : 'Seguir'} onPress={avanzar} estilo={s.boton} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  foto: { position: 'absolute', top: 0, left: 0 },
  veloArriba: { position: 'absolute', top: 0, left: 0, right: 0, height: ALTO_VELO_ARRIBA },
  contenido: { flex: 1 },
  barraSuperior: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.sm,
  },
  saltar: { minWidth: AREA_TACTIL_MIN, minHeight: AREA_TACTIL_MIN, alignItems: 'flex-end', justifyContent: 'center' },
  saltarTexto: { fontFamily: peso.semibold, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
  zonaTexto: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: MARGEN_PANTALLA },
  cuerpo: { color: paleta.magnesia2, marginTop: esp.md - 4 },
  nota: { marginTop: esp.md },
  control: {
    flexDirection: 'row', alignItems: 'center', gap: esp.md,
    paddingHorizontal: MARGEN_PANTALLA, paddingTop: MARGEN_PANTALLA, paddingBottom: MARGEN_PANTALLA,
  },
  boton: { flex: 1 },
});
