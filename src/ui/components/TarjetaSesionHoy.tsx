import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import {
  paleta, tinte, tipo, familia, esp, MARGEN_PANTALLA, resortePlaca, resorteMagnesia, haptico,
} from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { nombreVisible } from '@/data/nombresVisibles';
import type { Sesion } from '@/lib/engine/session';
import { TarjetaGoma } from './TarjetaGoma';
import { BotonPlaca } from './BotonPlaca';
import { BotonSecundario } from './BotonSecundario';
import { BotonFilaSecundario } from './BotonFilaSecundario';
import { NotaEntrenador } from './NotaEntrenador';
import { Entrada } from '@/ui/fx/Entrada';
import { Odometro } from '@/ui/fx/Odometro';
import { Huella } from '@/ui/fx/Huella';
import { MiniaturaEjercicio, medidasMiniatura, SEPARACION_MINIATURA } from './MiniaturaEjercicio';

const RADIO_TARJETA = 28;
const RELLENO = 20;
const MAX_MINIATURAS = 6;
const MINIATURAS_VISIBLES = 3;
const ESCALONADO_MINIATURA_MS = 70;
const INICIO_CARGA_MS = 250;
const INICIO_MINIATURAS_MS = 350;
const ASIENTO_MS = 300;
const BRILLO_EMPEZAR_MS = 450;
const SUBE_TARJETA_PX = 20;
const LADO_HUELLA_GRANDE = 120;
const OPACIDAD_HUELLA_GRANDE = 0.1;
const RECORRIDO_TARJETA = 260;
const ESCALA_AL_SUBIR = 0.03;
const OPACIDAD_AL_SUBIR = 0.15;
const ESTILO_NUMERO = { ...tipo.numero, fontSize: 36, lineHeight: 38, color: paleta.magnesia };

/** «Cargar la barra» ya se hizo en esta sesion de la app: las siguientes veces la tarjeta aparece puesta. */
let barraCargadaEnEstaSesion = false;

export interface TarjetaSesionHoyProps {
  sesion: Sesion;
  avisos: string[];
  objetivo: string;
  sinSaltos: boolean;
  entrenoHoy: boolean;
  /** Cambia cada vez que se vuelve a Hoy con una sesion nueva terminada hoy: dispara el sello de la huella. */
  sello: number;
  y: SharedValue<number>;
  onEmpezar: () => void;
  onCincoMinutos: () => void;
}

/**
 * «La barra de hoy»: la sesion del dia en una sola tarjeta. Arriba, el objetivo
 * y dos cifras (que ruedan); en medio, los ejercicios en orden, que entran desde
 * la derecha como discos que se cargan en una barra; abajo, un unico boton azul
 * que da un barrido de brillo al terminar. Al subir con el scroll la tarjeta
 * baja a 0.97 y 85 % de opacidad.
 */
export function TarjetaSesionHoy(p: TarjetaSesionHoyProps) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [animar] = useState(() => !barraCargadaEnEstaSesion);
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scrollX.set(e.contentOffset.x); });

  const items = useMemo(() => p.sesion.items.slice(0, MAX_MINIATURAS), [p.sesion.items]);
  const { lado, letra } = useMemo(() => medidasMiniatura(items.map(i => nombreVisible(i.name))), [items]);
  const paso = lado + SEPARACION_MINIATURA;
  const ultimaVisible = Math.min(items.length, MINIATURAS_VISIBLES) - 1;
  const asentada = INICIO_MINIATURAS_MS + Math.max(0, ultimaVisible) * ESCALONADO_MINIATURA_MS;

  const alCambiarMontar = useEffectEvent(() => {
    barraCargadaEnEstaSesion = true;
    if (!animar || reducido) return;
    const golpe = setTimeout(haptico.placa, asentada + ASIENTO_MS);
    return () => clearTimeout(golpe);
  });
  useEffect(() => alCambiarMontar(), []);

  const { y } = p;
  const alSubir = useAnimatedStyle(() => {
    const t = interpolate(y.value, [0, RECORRIDO_TARJETA], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: 1 - OPACIDAD_AL_SUBIR * t,
      transform: [{ scale: reducido ? 1 : 1 - ESCALA_AL_SUBIR * t }],
    };
  }, [reducido, tick]);

  return (
    <Animated.View style={[s.raiz, alSubir]}>
      <Entrada activo animar={animar} y={SUBE_TARJETA_PX} resorte={resorteMagnesia}>
        <TarjetaGoma estilo={s.tarjeta} relleno={RELLENO}>
          {p.entrenoHoy && <SelloHuella clave={p.sello} />}

          <View style={s.objetivoFila}>
            <Text style={s.objetivo} numberOfLines={1}>{p.objetivo}</Text>
            {p.entrenoHoy && (
              <View style={s.hecho} accessible accessibilityLabel="Hecho hoy">
                <Huella lado={12} />
                <Text style={s.hechoTexto}>Hecho hoy</Text>
              </View>
            )}
          </View>
          <View style={s.numeros}>
            <Dato n={p.sesion.minutosEstimados} unidad="min" animar={animar} retraso={INICIO_CARGA_MS} />
            <Dato n={p.sesion.items.length} unidad={p.sesion.items.length === 1 ? 'ejercicio' : 'ejercicios'} animar={animar} retraso={INICIO_CARGA_MS + 120} />
          </View>
          {p.sinSaltos && <View style={s.etiqueta}><Text style={s.etiquetaTexto}>Sin saltos</Text></View>}

          <Animated.FlatList
            data={items}
            keyExtractor={it => it.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            getItemLayout={(_, i) => ({ length: paso, offset: paso * i, index: i })}
            initialNumToRender={MAX_MINIATURAS}
            style={s.carrusel}
            contentContainerStyle={s.carruselContenido}
            renderItem={({ item, index }) => (
              <MiniaturaEjercicio
                item={item} indice={index} lado={lado} letra={letra} scrollX={scrollX}
                animar={animar && index <= ultimaVisible}
                retraso={INICIO_MINIATURAS_MS + index * ESCALONADO_MINIATURA_MS}
              />
            )}
          />

          {p.avisos.map((a, n) => (
            <NotaEntrenador key={n} estilo={s.nota}>{a}</NotaEntrenador>
          ))}

          <View style={s.acciones}>
            {p.entrenoHoy
              ? <BotonSecundario texto="Entrenar otra vez" onPress={p.onEmpezar} />
              : (
                <BotonPlaca
                  texto="Empezar" onPress={p.onEmpezar} aplauso
                  brillo={animar ? asentada + BRILLO_EMPEZAR_MS : undefined}
                />
              )}
            <BotonFilaSecundario texto="Hoy no tengo tiempo · sesión de 5 minutos" onPress={p.onCincoMinutos} />
          </View>
        </TarjetaGoma>
      </Entrada>
    </Animated.View>
  );
}

/** Tarjeta de la sesion cuando el filtro de lesiones no deja ningun ejercicio seguro. */
export function TarjetaSesionVacia({ onRevisar }: { onRevisar: () => void }) {
  return (
    <View style={s.raiz}>
      <TarjetaGoma estilo={s.tarjeta} relleno={RELLENO}>
        <Text style={s.tituloVacio}>Tu filtro de lesión está activo</Text>
        <Text style={s.textoVacio}>
          Con las zonas que declaraste, hoy no queda ningún ejercicio seguro para armar tu sesión. Las
          contraindicaciones nunca se relajan solas.
        </Text>
        <BotonSecundario texto="Revisar mis lesiones en Ajustes" onPress={onRevisar} estilo={s.botonVacio} />
      </TarjetaGoma>
    </View>
  );
}

/** Numero de Big Shoulders 36 con su unidad al lado, en Figtree 14. */
function Dato({ n, unidad, animar, retraso }: { n: number; unidad: string; animar: boolean; retraso: number }) {
  return (
    <View style={s.dato} accessible accessibilityLabel={`${n} ${unidad === 'min' ? (n === 1 ? 'minuto' : 'minutos') : unidad}`}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Odometro valor={n} continuo animar={animar} retraso={retraso} estilo={ESTILO_NUMERO} />
      </View>
      <Text style={s.unidad}>{unidad}</Text>
    </View>
  );
}

/** Huella de mano de 120 px al 10 %, estampada en la esquina superior derecha. Al volver a Hoy con una sesion nueva cae de 1.3 a 1 con un golpe medio. */
function SelloHuella({ clave }: { clave: number }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const previa = useRef(clave);
  const t = useSharedValue(1);

  useEffect(() => {
    if (clave === previa.current) return;
    previa.current = clave;
    haptico.placa();
    if (reducido) return;
    t.set(0);
    t.set(withSpring(1, resortePlaca));
  }, [clave, reducido, t]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 2.5),
    transform: [{ scale: 1.3 - 0.3 * t.value }],
  }), [tick]);

  return (
    <Animated.View style={[s.sello, estilo]} pointerEvents="none">
      <Huella lado={LADO_HUELLA_GRANDE} opacidad={OPACIDAD_HUELLA_GRANDE} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  tarjeta: { borderRadius: RADIO_TARJETA },
  objetivoFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  objetivo: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.magnesia2, flexShrink: 1 },
  hecho: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2, paddingHorizontal: 8,
    borderRadius: 8, backgroundColor: paleta.goma,
  },
  hechoTexto: { fontFamily: familia.enfasis, fontSize: 13, lineHeight: 18, color: paleta.magnesia },
  numeros: { flexDirection: 'row', gap: esp.lg, marginTop: 4 },
  dato: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  unidad: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 18, color: paleta.magnesia2 },
  etiqueta: {
    alignSelf: 'flex-start', marginTop: 8, paddingVertical: 2, paddingHorizontal: 10,
    borderRadius: 999, backgroundColor: tinte.neutra,
  },
  etiquetaTexto: { ...tipo.etiqueta, color: paleta.magnesia2 },
  sello: { position: 'absolute', top: -RELLENO + 8, right: -RELLENO + 8 },
  carrusel: { marginTop: esp.md, marginHorizontal: -RELLENO },
  carruselContenido: { paddingHorizontal: RELLENO },
  nota: { alignSelf: 'stretch', marginTop: esp.sm },
  acciones: { gap: esp.sm + 4, marginTop: esp.md },
  tituloVacio: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 24, color: paleta.magnesia },
  textoVacio: { ...tipo.cuerpo, color: paleta.magnesia2, marginTop: esp.sm },
  botonVacio: { marginTop: esp.md },
});
