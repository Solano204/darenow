/**
 * FORJA · anuncios
 *
 * Reglas, en orden de importancia:
 *
 *  1. NUNCA durante una rutina. Ni banner, ni intersticial, ni nada. La
 *     pantalla del reproductor es del usuario y punto.
 *  2. Banner fijo abajo, solo en la pantalla principal.
 *  3. Intersticial a pantalla completa: puede salir en cualquier seccion,
 *     como maximo uno al dia, nunca en el reproductor.
 *  4. Desbloqueo por categoria: para ver la lista completa de ejercicios,
 *     rutinas, programas o musculos, el usuario ve un anuncio UNA VEZ y esa
 *     categoria queda abierta para siempre.
 *
 * Los tres son maquetas con el tamaño real. Instrucciones para conectar
 * AdMob al final del archivo.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, tipo, esp, radio, degradado } from '../theme';
import { Boton } from './ui';
import Vidrio, { VidrioFondo } from './Vidrio';

/**
 * Interruptor maestro de anuncios. La app es nueva en la tienda; hasta que
 * haya trafico real, ni banner, ni intersticial, ni el muro de categoria
 * (que obligaba a ver un anuncio para "descargar"/desbloquear una
 * seccion). Cuando toque reactivarlos, este es el unico cambio: `true`.
 * El espacio de cada uno tampoco se reserva mientras esta en `false` (ver
 * `App.tsx` y `Hoy.tsx`): la app se ve como si nunca hubiera tenido anuncios.
 */
export const ANUNCIOS_ACTIVOS = false;

/* --------------------------------------------- 1. banner de la principal */

export function BannerAnuncio({ flotante }: { flotante?: boolean }) {
  if (!ANUNCIOS_ACTIVOS) return null;
  const cuerpo = (
    <View style={s.bannerInterior} accessibilityLabel="Anuncio">
      <Text style={[tipo.micro, { color: color.textoTenue }]}>Espacio publicitario</Text>
      <Text style={[tipo.micro, { color: color.textoTenue }]}>320 × 50</Text>
    </View>
  );
  if (!flotante) {
    return <View style={s.banner}>{cuerpo}</View>;
  }
  // Flotante: se apoya sobre el contenido que sigue pasando por detras.
  return <Vidrio estilo={s.bannerFlotante} intensidad={55} velo={0.62}>{cuerpo}</Vidrio>;
}

/* ------------------------------------------------- 2. intersticial */

export function Intersticial({ visible, onCerrar, segundos = 5, motivo }: {
  visible: boolean; onCerrar: () => void; segundos?: number; motivo?: string;
}) {
  const [quedan, setQuedan] = useState(segundos);

  useEffect(() => {
    if (!visible) { setQuedan(segundos); return; }
    const id = setInterval(() => setQuedan(q => (q > 0 ? q - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [visible, segundos]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => quedan === 0 && onCerrar()}>
      <View style={s.interFondo}>
        <View style={s.interCabecera}>
          <Text style={[tipo.micro, { color: color.textoTenue }]}>
            {motivo ?? 'Publicidad'}
          </Text>
          {quedan > 0 ? (
            <View style={s.cuenta}>
              <Text style={[tipo.dato, { color: color.textoSuave }]}>{quedan}</Text>
            </View>
          ) : (
            <Pressable onPress={onCerrar} hitSlop={12} style={s.saltar}>
              <Text style={[tipo.dato, { color: color.texto }]}>Saltar ✕</Text>
            </Pressable>
          )}
        </View>

        <View style={s.interCuerpo}>
          <LinearGradient colors={degradado.carbon} style={s.interCaja}>
            <Text style={[tipo.h2, { color: color.textoSuave }]}>Anuncio</Text>
            <Text style={[tipo.pie, { color: color.textoTenue, textAlign: 'center' }]}>
              Aquí va el intersticial a pantalla completa.
            </Text>
          </LinearGradient>
        </View>

        <Text style={[tipo.pie, { color: color.textoTenue, textAlign: 'center', padding: esp.md }]}>
          Los anuncios mantienen la app gratis. Nunca aparecen mientras entrenas.
        </Text>
      </View>
    </Modal>
  );
}

/* ------------------------------------- 3. desbloqueo de una categoria */

/**
 * Pantalla de desbloqueo. Cubre la lista con vidrio: se ve que hay algo
 * detras, que es justo lo que motiva a desbloquear, pero no se puede usar.
 */
export function MuroCategoria({ visible, categoria, cuantos, onVerAnuncio, onVolver }: {
  visible: boolean; categoria: string; cuantos: number;
  onVerAnuncio: () => void; onVolver: () => void;
}) {
  if (!ANUNCIOS_ACTIVOS || !visible) return null;
  // pointerEvents 'auto': el muro captura todos los toques. Sin desbloquear
  // no se puede usar la lista de detras, solo verla borrosa.
  return (
    <View style={StyleSheet.absoluteFill}>
      <VidrioFondo intensidad={30}>
        <View style={s.muro}>
          <Vidrio estilo={s.muroCaja} intensidad={70} velo={0.8}>
            <View style={{ padding: esp.lg, gap: esp.sm }}>
              <View style={s.candado}>
                <Text style={{ fontSize: 22 }}>🔓</Text>
              </View>
              <Text style={[tipo.h2, { color: color.texto, textAlign: 'center' }]}>
                Desbloquea {categoria}
              </Text>
              <Text style={[tipo.cuerpo, { color: color.textoSuave, textAlign: 'center' }]}>
                Ve un anuncio una sola vez y los {cuantos} quedan abiertos para
                siempre, también sin internet. Es la única forma de abrir esta
                sección, y no se te vuelve a pedir.
              </Text>

              <View style={s.trato}>
                <Punto texto="Un anuncio, una vez" />
                <Punto texto="No se vuelve a pedir" />
                <Punto texto="Nunca mientras entrenas" />
              </View>

              <Boton texto="Ver anuncio y desbloquear" variante="acento" onPress={onVerAnuncio} />
              <Boton texto="Volver" variante="texto" onPress={onVolver} />
            </View>
          </Vidrio>
        </View>
      </VidrioFondo>
    </View>
  );
}

function Punto({ texto }: { texto: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: esp.sm, alignItems: 'center' }}>
      <View style={s.check}><Text style={{ color: color.sobreOscuro, fontSize: 11 }}>✓</Text></View>
      <Text style={[tipo.pie, { color: color.texto, flex: 1 }]}>{texto}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*
 * PARA CONECTAR ADMOB
 *
 *   npx expo install react-native-google-mobile-ads
 *
 * BannerAnuncio  -> <BannerAd unitId={...} size={BannerAdSize.BANNER} />
 * Intersticial   -> useInterstitialAd(); show() cuando visible pase a true.
 * MuroCategoria  -> usa un anuncio recompensado (useRewardedAd) y llama a
 *                   onVerAnuncio solo cuando llegue el evento EARNED_REWARD.
 *
 * AdMob necesita build nativa (npx expo run:android). No corre en Expo Go,
 * por eso estos huecos son maquetas mientras pruebas.
 */

const s = StyleSheet.create({
  banner: {
    height: 54, borderRadius: radio.chip, backgroundColor: color.lienzo,
    borderWidth: 1, borderColor: color.bordeFuerte, borderStyle: 'dashed',
    justifyContent: 'center',
  },
  bannerFlotante: {
    height: 54, borderRadius: radio.chip,
    borderWidth: 1, borderColor: color.borde, justifyContent: 'center',
  },
  bannerInterior: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: esp.md,
  },
  interFondo: { flex: 1, backgroundColor: color.fondo, paddingTop: 54 },
  interCabecera: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: esp.md, paddingBottom: esp.sm,
  },
  cuenta: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: color.lienzo,
    alignItems: 'center', justifyContent: 'center',
  },
  saltar: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: radio.pastilla, backgroundColor: color.lienzo,
  },
  interCuerpo: { flex: 1, padding: esp.md },
  interCaja: {
    flex: 1, borderRadius: radio.tarjeta, alignItems: 'center',
    justifyContent: 'center', gap: esp.sm, padding: esp.lg,
  },
  muro: { flex: 1, justifyContent: 'center', padding: esp.md },
  muroCaja: { borderWidth: 0 },
  candado: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: color.acentoTinte,
    borderWidth: 1, borderColor: color.acentoBorde,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  trato: { gap: esp.sm, paddingVertical: esp.md },
  check: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: color.carbon,
    alignItems: 'center', justifyContent: 'center',
  },
});
