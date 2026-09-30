import React, { useEffect, useEffectEvent, useState } from 'react';
import { Alert, View, useWindowDimensions } from 'react-native';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { paleta, haptico } from '@/ui/theme';
import {
  leerSesionGuardada, borrarSesionGuardada, type SesionEnCurso,
} from '@/features/sesion/hooks/useSessionPlayer';
import type { Sesion, ItemSesion } from '@/lib/engine/session';
import { prepararSonido, soltarSonido } from '@/media/sonido';
import { useMagnesia } from '@/ui/fx/MagnesiaOverlay';
import { PantallaListo } from '@/features/sesion/components/PantallaListo';
import { EditorAntesDeEmpezar } from '@/features/sesion/components/EditorAntesDeEmpezar';
import { ReproductorActivo } from '@/features/sesion/components/ReproductorActivo';

/**
 * Reproductor.
 *
 * Aqui vive la logica de la sesion (guardado, voz, sonido, vibracion, pantalla
 * encendida) y el paso de una pantalla a otra; lo que se ve esta en
 * `components/session`. El fondo es siempre `goma`: la fase se lee por el color
 * de su placa (ver DESIGN.md, «Modo sesion»).
 */

const DURACION_LISTO_MS = 3000;
const CENTRO_LISTO = 0.46;

type Props = NativeStackScreenProps<ParamListBase, 'Reproductor'>;

/**
 * Antes de montar el reproductor de verdad, revisa si quedo una sesion sin
 * terminar (la app se cerro o se fue a segundo plano en el camino). Si
 * hay una, pregunta; si no, o si el usuario prefiere empezar de nuevo, el
 * reproductor arranca con la sesion que llego por navegacion.
 */
export default function Reproductor({ route, navigation }: Props) {
  const sesionInicial = (route.params as { sesion: Sesion }).sesion;
  const [listo, setListo] = useState(false);
  const [restaurar, setRestaurar] = useState<SesionEnCurso | null>(null);
  const [mostrarListo, setMostrarListo] = useState(true);
  const [itemsConfirmados, setItemsConfirmados] = useState<ItemSesion[] | null>(null);
  const magnesia = useMagnesia();
  const { width: anchoVentana, height: altoVentana } = useWindowDimensions();

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
  // entrenando, no hace falta el aviso. Al vencer, el aplauso de magnesia
  // cubre el paso a lo siguiente.
  const alCambiarListo = useEffectEvent(() => {
    if (!listo || restaurar) return;
    const id = setTimeout(() => {
      haptico.aplauso();
      magnesia.aplaudir(anchoVentana / 2, altoVentana * CENTRO_LISTO);
      setMostrarListo(false);
    }, DURACION_LISTO_MS);
    return () => clearTimeout(id);
  });
  useEffect(() => alCambiarListo(), [listo, restaurar]);

  if (!listo) return <View style={{ flex: 1, backgroundColor: paleta.goma }} />;

  // Al continuar una sesion interrumpida no hay pantalla «Listo»: ya se estaba entrenando.
  if (mostrarListo && !restaurar) return <PantallaListo duracionMs={DURACION_LISTO_MS} />;

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
