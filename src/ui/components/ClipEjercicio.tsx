/**
 * FORJA · ClipEjercicio (R5)
 *
 * El unico componente que muestra un clip. El clip del ejercicio en bucle continuo, sin audio y
 * sin controles: dura 6-10 segundos y la serie puede durar dos minutos, asi que se repite hasta que
 * el reproductor cambia de fase (se graba para encadenar: misma posicion al inicio y al final).
 *
 * Politica de players (ver `media/players.ts` y `docs/ARQUITECTURA.md`):
 * - Un player por clip en pantalla; en listas y carruseles no se monta ninguno (se ve la foto).
 * - `activo` false congela el fotograma (el reproductor en pausa).
 * - Al salir de la pantalla (blur) se pausa y suelta el video; al volver se carga de nuevo. Al
 *   desmontar se libera. Con la app en segundo plano, en pausa.
 * - Si el reproductor dejo preparado este clip en el descanso (`prepararClip`), lo usa: empieza
 *   sin espera.
 * - El poster es el primer fotograma del clip (`assets/video/posters`), asi que al empezar el
 *   video no hay salto; tapa el video hasta que el primer cuadro esta decodificado (sin el, un
 *   rectangulo negro al cambiar de ejercicio).
 *
 * Contrato de caida, en este orden:
 *   1. Clip -> video en bucle.
 *   2. Sin clip pero con foto -> la foto de siempre (`Foto`).
 *   3. Sin nada -> no se pinta nada.
 */
import React, { useEffect, useEffectEvent, useState } from 'react';
import { AppState, View, StyleSheet, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { VideoView, type VideoPlayer, type VideoSource } from 'expo-video';
import { color, radio } from '@/ui/theme';
import Foto from './Foto';
import { Imagen } from './Imagen';
import { clipFuente, posterFuente } from '@/media/videos';
import { fuente } from '@/media/registry';
import { crearPlayer, soltarPlayer, tomarPreparado } from '@/media/players';

export interface ClipEjercicioProps {
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
  estilo?: ViewStyle;
}

export default function ClipEjercicio(p: ClipEjercicioProps) {
  const src = clipFuente(p.id);
  if (src == null) {
    return (
      <Foto
        tipo="ejercicio" id={p.id} nombre={p.nombre ?? ''}
        alto={p.alto ?? ALTO} ancho={p.ancho} forma={p.forma ?? 'tarjeta'} estilo={p.estilo}
      />
    );
  }
  // Un player por ejercicio: al cambiar de ejercicio se monta de nuevo (poster incluido), como
  // antes, que el hook de expo-video recreaba el player al cambiar la fuente.
  return <ClipVivo key={p.id} {...p} src={src} />;
}

const ALTO = 150;

function ClipVivo({
  id, src, alto = ALTO, ancho, forma = 'tarjeta', activo = true, estilo,
}: ClipEjercicioProps & { src: VideoSource }) {
  const [player] = useState<VideoPlayer>(() => tomarPreparado(id) ?? crearPlayer(src));
  const [listo, setListo] = useState(() => player.status === 'readyToPlay');
  const [enPantalla, setEnPantalla] = useState(true);
  const navigation = useNavigation();
  const poster = posterFuente(id) ?? fuente('ejercicio', id);

  // Se libera al desmontar.
  useEffect(() => () => soltarPlayer(player), [player]);

  // El poster tapa el video hasta que el primer fotograma esta decodificado.
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setListo(true);
      else if (status === 'idle') setListo(false);
    });
    return () => sub.remove();
  }, [player]);

  // Reproduce solo si el reproductor lo pide y la pantalla se ve.
  const aplicar = useEffectEvent((visible: boolean) => {
    try {
      if (activo && visible) player.play();
      else player.pause();
    } catch {
      // el player ya se libero; no hay nada que hacer
    }
  });
  useEffect(() => aplicar(enPantalla), [activo, enPantalla]);

  // Al salir de la pantalla: pausa y suelta el video (el decodificador), para que una ficha
  // tapada por otra no siga gastando. Al volver, se carga otra vez (el poster tapa mientras).
  const alSalir = useEffectEvent(() => {
    player.pause();
    player.replace(null);
    setEnPantalla(false);
  });
  const alVolver = useEffectEvent(() => {
    player.replace(src);
    setEnPantalla(true);
    aplicar(true);
  });
  useEffect(() => {
    const blur = navigation.addListener('blur', () => alSalir());
    const focus = navigation.addListener('focus', () => alVolver());
    return () => { blur(); focus(); };
  }, [navigation]);

  // En segundo plano, en pausa; al volver, sigue si tocaba.
  useEffect(() => {
    const sub = AppState.addEventListener('change', estado => aplicar(estado === 'active' && enPantalla));
    return () => sub.remove();
  }, [enPantalla]);

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
        style={s.llena}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        accessible={false}
      />
      {!listo && poster != null && (
        <Imagen source={poster} id={id} style={StyleSheet.absoluteFill} transition={0} placeholder={null} />
      )}
    </View>
  );
}

const s = StyleSheet.create({ llena: { width: '100%', height: '100%' } });
