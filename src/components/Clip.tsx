/**
 * FORJA · Clip
 *
 * El equivalente en video de <Foto>. Muestra el clip del ejercicio en bucle
 * continuo, sin audio y sin controles.
 *
 * La idea: el clip dura 6-10 segundos y la serie puede durar dos minutos.
 * El video no se acaba nunca, se repite hasta que el reproductor cambia de
 * fase. Por eso el clip se graba pensado para encadenar (misma posicion al
 * inicio y al final), no como una demostracion con principio y final.
 *
 * Son DOS archivos por ejercicio, no tres. La misma imagen que sale en las
 * listas (assets/img/ejercicios/<id>.jpg) hace de poster mientras el video
 * decodifica el primer fotograma. No existe un thumb aparte.
 *
 * Contrato de caida, en este orden:
 *   1. Clip local o remoto  -> video en bucle.
 *   2. Sin clip pero con foto -> la foto de siempre.
 *   3. Sin nada -> no se pinta nada.
 *
 * Los pasos 2 y 3 los resuelve <Foto>, asi que este componente no duplica
 * nada: si no hay clip, delega y ya.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { color, radio } from '@/theme';
import Foto from './Foto';
import { clipFuente } from '@/media/videos';
import { fuente } from '@/media/registry';

export interface ClipProps {
  id: string;
  nombre?: string;
  alto?: number;
  ancho?: number | '100%';
  forma?: 'redonda' | 'tarjeta';
  /**
   * true reproduce en bucle, false congela el fotograma actual.
   * El reproductor lo usa para parar el video cuando el usuario pausa.
   */
  activo?: boolean;
  /** muestra la ruta del archivo que falta, solo aplica al marcador */
  mostrarRuta?: boolean;
  estilo?: ViewStyle;
}

export default function Clip({
  id, nombre = '', alto = 150, ancho, forma = 'tarjeta',
  activo = true, mostrarRuta = false, estilo,
}: ClipProps) {
  const src = clipFuente(id);
  // El poster es la MISMA imagen del ejercicio que sale en las listas. No
  // hay un thumb aparte: un archivo menos por ejercicio, 190 menos en total.
  const poster = fuente('ejercicio', id);
  const [listo, setListo] = useState(false);

  // Si `setListo(false)` se hiciera en un efecto, el PRIMER render con el
  // nuevo `src` pintaria con `listo` todavia en true (el del ejercicio de
  // antes): el video nuevo, sin fotograma decodificado, se ve encima del
  // poster durante ese instante y asoma el clip anterior. Resetear durante
  // el render mismo evita que ese frame llegue a pintarse.
  const srcAnteriorRef = useRef(src);
  if (srcAnteriorRef.current !== src) {
    srcAnteriorRef.current = src;
    if (listo) setListo(false);
  }

  // El hook recrea el player cuando cambia la fuente, asi que basta con
  // pasarle el clip del ejercicio actual. Sin audio y en bucle desde el
  // primer fotograma.
  const player = useVideoPlayer(src, p => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0;   // no necesitamos eventos de progreso
    p.play();
  });

  // La imagen tapa el video hasta que el primer fotograma esta decodificado.
  // Sin esto se ve un rectangulo negro al cambiar de ejercicio.
  useEffect(() => {
    if (!src) return;
    let vivo = true;
    const sub = player.addListener('statusChange', ({ status }) => {
      if (vivo && status === 'readyToPlay') setListo(true);
    });
    return () => { vivo = false; sub?.remove?.(); };
  }, [player, src]);

  useEffect(() => {
    if (!src) return;
    try {
      if (activo) player.play();
      else player.pause();
    } catch {
      // el player ya se libero al cambiar de ejercicio; no hay nada que hacer
    }
  }, [activo, player, src]);

  if (!src) {
    return (
      <Foto
        tipo="ejercicio" id={id} nombre={nombre}
        alto={alto} ancho={ancho} forma={forma}
        mostrarRuta={mostrarRuta} estilo={estilo}
      />
    );
  }

  const base: ViewStyle = {
    height: alto,
    width: (ancho ?? alto) as ViewStyle['width'],
    borderRadius: forma === 'tarjeta' ? radio.tarjeta : radio.foto,
    overflow: 'hidden',
    backgroundColor: color.lienzo,
  };

  return (
    <View style={[base, estilo]}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
        // allowsFullscreen={false}
        allowsPictureInPicture={false}
        accessible={false}
      />
      {!listo && poster != null && (
        <Image
          source={poster}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={0}
        />
      )}
    </View>
  );
}
