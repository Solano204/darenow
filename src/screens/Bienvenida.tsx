/**
 * Bienvenida del dia: foto a sangre arriba fundida a goma, saludo, tarjeta con
 * el mensaje y tres numeros, y el boton Entrar fijo abajo. Se muestra una vez
 * al dia. Los datos y la accion de entrar viven en `useWelcomeData`.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { paleta, tipo, esp, degradado, MARGEN_PANTALLA } from '../theme';
import { BotonPlaca } from '../components/ui/BotonPlaca';
import { TarjetaGoma } from '../components/ui/TarjetaGoma';
import { GomaTexture } from '../components/fx/GomaTexture';
import { FotoTratada } from '../components/fx/FotoTratada';
import { BannerAnuncio, ANUNCIOS_ACTIVOS } from '../components/Anuncio';
import { useWelcomeData } from '../hooks/useWelcomeData';
import { fuente } from '../media/registry';
import Foto from '../components/Foto';

const FRACCION_FOTO = 0.55;
const ANCLAS_VELO = [0.2, 0.5, 0.78, 1] as const;
const FOCO_BIENVENIDA = { x: 0.55, y: 0.3 };
const ALTO_IMAGEN = 180;
const ALTO_IMAGEN_COMPACTO = 132;
const PANTALLA_COMPACTA = 700;
const SALUDO_LARGO = 14;

/** «Arriba, Carlos Josue» se parte en dos lineas cuando es largo. */
export function partirSaludo(saludo: string): string[] {
  const corte = saludo.indexOf(', ');
  return corte > 0 && saludo.length > SALUDO_LARGO ? [saludo.slice(0, corte + 1), saludo.slice(corte + 2)] : [saludo];
}

export default function Bienvenida({ navigation }: { navigation: { replace: (ruta: string) => void } }) {
  const w = useWelcomeData(navigation);
  const { width, height } = useWindowDimensions();
  const bg = fuente('fondo', 'bienvenida');
  const alturaFoto = height * FRACCION_FOTO;
  const altoImagen = height < PANTALLA_COMPACTA ? ALTO_IMAGEN_COMPACTO : ALTO_IMAGEN;

  return (
    <View style={s.raiz}>
      <View style={[s.foto, { width, height: alturaFoto }]} pointerEvents="none">
        {bg !== null && <FotoTratada fuente={bg} ancho={width} alto={alturaFoto} foco={FOCO_BIENVENIDA} />}
        <LinearGradient colors={degradado.velo} locations={ANCLAS_VELO} style={StyleSheet.absoluteFill} />
      </View>
      <GomaTexture />

      <SafeAreaView style={s.contenido}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={[tipo.etiqueta, s.fecha]}>{w.fecha}</Text>
          {partirSaludo(w.saludo).map(linea => (
            <Text key={linea} style={[tipo.display, s.saludo]} maxFontSizeMultiplier={1.2}>{linea}</Text>
          ))}

          <TarjetaGoma estilo={s.tarjeta}>
            <Foto tipo="motivacion" id={w.msg.id} nombre={w.msg.titulo} alto={altoImagen} ancho="100%" />
            <Text style={[tipo.h1, s.tituloTarjeta]}>{w.msg.titulo}</Text>
            <Text style={[tipo.cuerpo, s.mensaje]}>{w.msg.cuerpo}</Text>

            <View style={s.estadisticas}>
              <Dato n={w.racha} t={w.racha === 1 ? 'día seguido' : 'días seguidos'} />
              <View style={s.separador} />
              <Dato n={w.sesiones} t="sesiones" />
              <View style={s.separador} />
              <Dato n={w.diasEntrenados} t="días entrenados" />
            </View>
          </TarjetaGoma>
        </ScrollView>

        <View style={s.pie}>
          <BotonPlaca texto="Entrar" onPress={w.entrar} estilo={s.boton} />
          {ANUNCIOS_ACTIVOS && (
            <View style={{ marginTop: esp.md }}>
              <BannerAnuncio />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Dato({ n, t }: { n: number; t: string }) {
  return (
    <View style={s.dato} accessible accessibilityLabel={`${n} ${t}`}>
      <Text style={[tipo.numero, s.numero]} maxFontSizeMultiplier={1.2}>{n}</Text>
      <Text style={[tipo.etiqueta, s.etiquetaDato]}>{t}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: paleta.goma },
  foto: { position: 'absolute', top: 0, left: 0 },
  contenido: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.lg },
  fecha: { fontSize: 14, color: paleta.magnesia2 },
  saludo: { fontSize: 48, lineHeight: 46, color: paleta.magnesia },
  tarjeta: { marginTop: esp.md },
  tituloTarjeta: { color: paleta.magnesia, marginTop: esp.md - 4 },
  mensaje: { color: paleta.magnesia2, marginTop: esp.sm - 4 },
  estadisticas: { flexDirection: 'row', alignItems: 'flex-start', marginTop: esp.md },
  separador: { width: 1, alignSelf: 'stretch', backgroundColor: paleta.gomaBorde },
  dato: { flex: 1, alignItems: 'center' },
  numero: { color: paleta.magnesia },
  etiquetaDato: { color: paleta.magnesia2, textAlign: 'center' },
  pie: { paddingHorizontal: MARGEN_PANTALLA, paddingTop: esp.md, paddingBottom: MARGEN_PANTALLA },
  boton: { alignSelf: 'stretch' },
});
