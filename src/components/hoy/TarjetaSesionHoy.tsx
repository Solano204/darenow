import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation, cancelAnimation, interpolate, useAnimatedScrollHandler, useAnimatedStyle,
  useSharedValue, withDelay, withSpring, type SharedValue,
} from 'react-native-reanimated';
import {
  paleta, tinte, tipo, familia, esp, MARGEN_PANTALLA, resortePlaca, resorteMagnesia, haptico,
} from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import type { Sesion } from '../../engine/session';
import { TarjetaGoma } from '../ui/TarjetaGoma';
import { BotonPlaca } from '../ui/BotonPlaca';
import { BotonSecundario } from '../ui/BotonSecundario';
import { BotonFilaSecundario } from '../ui/BotonFilaSecundario';
import { NotaEntrenador } from '../ui/NotaEntrenador';
import { Entrada } from '../fx/Entrada';
import { Odometro } from '../fx/Odometro';
import { Huella } from '../fx/Huella';
import { MiniaturaEjercicio, PASO_MINIATURA } from './MiniaturaEjercicio';

const RADIO_TARJETA = 28;
const RELLENO = 20;
const MAX_MINIATURAS = 6;
const PLACAS_BARRA = [paleta.placaVerde, paleta.placaAmarilla, paleta.placaRoja] as const;
const ALTOS_PLACA = [12, 17, 22];
const ANCHO_BARRA = 84;
const ESCALONADO_PLACA_MS = 90;
const INICIO_CARGA_MS = 250;
const LADO_HUELLA = 120;
const RECORRIDO_TARJETA = 260;
const ESCALA_AL_SUBIR = 0.05;
const OPACIDAD_AL_SUBIR = 0.35;
const ESTILO_NUMERO = { ...tipo.numero, fontSize: 56, lineHeight: 56, color: paleta.magnesia };

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
 * «La barra de hoy»: la sesion del dia en una sola tarjeta. Arriba, sus
 * numeros (que ruedan) y la barra que se carga; en medio, los ejercicios en
 * orden; abajo, un unico boton azul. Al subir con el scroll la tarjeta se
 * encoge y se atenua un poco.
 */
export function TarjetaSesionHoy(p: TarjetaSesionHoyProps) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const animar = useRef(!barraCargadaEnEstaSesion).current;
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scrollX.value = e.contentOffset.x; });

  useEffect(() => { barraCargadaEnEstaSesion = true; }, []);

  const { y } = p;
  const alSubir = useAnimatedStyle(() => {
    const t = interpolate(y.value, [0, RECORRIDO_TARJETA], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: 1 - OPACIDAD_AL_SUBIR * t,
      transform: [{ scale: reducido ? 1 : 1 - ESCALA_AL_SUBIR * t }],
    };
  }, [reducido, tick]);

  const items = p.sesion.items.slice(0, MAX_MINIATURAS);

  return (
    <Animated.View style={[s.raiz, alSubir]}>
      <Entrada activo animar={animar} y={24} resorte={resorteMagnesia}>
        <TarjetaGoma estilo={s.tarjeta} relleno={RELLENO}>
          <View style={s.cabeza}>
            <View style={s.datos}>
              <Text style={s.objetivo} numberOfLines={1}>{p.objetivo}</Text>
              <View style={s.numeros}>
                <Dato n={p.sesion.minutosEstimados} unidad="min" animar={animar} retraso={INICIO_CARGA_MS} />
                <Dato n={p.sesion.items.length} unidad="ejercicios" animar={animar} retraso={INICIO_CARGA_MS + 120} />
              </View>
              {p.sinSaltos && <View style={s.etiqueta}><Text style={s.etiquetaTexto}>Sin saltos</Text></View>}
            </View>
            <View style={s.marca}>
              {p.entrenoHoy ? <SelloHuella clave={p.sello} /> : <BarraCargada animar={animar} />}
            </View>
          </View>

          <Animated.FlatList
            data={items}
            keyExtractor={it => it.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            getItemLayout={(_, i) => ({ length: PASO_MINIATURA, offset: PASO_MINIATURA * i, index: i })}
            initialNumToRender={MAX_MINIATURAS}
            style={s.carrusel}
            contentContainerStyle={s.carruselContenido}
            renderItem={({ item, index }) => <MiniaturaEjercicio item={item} indice={index} scrollX={scrollX} />}
          />

          {p.avisos.map((a, n) => (
            <NotaEntrenador key={n} estilo={s.nota}>{a}</NotaEntrenador>
          ))}

          <View style={s.acciones}>
            {p.entrenoHoy
              ? <BotonSecundario texto="Entrenar otra vez" onPress={p.onEmpezar} />
              : <BotonPlaca texto="Empezar" onPress={p.onEmpezar} aplauso />}
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

function Dato({ n, unidad, animar, retraso }: { n: number; unidad: string; animar: boolean; retraso: number }) {
  return (
    <View accessible accessibilityLabel={`${n} ${unidad}`}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Odometro valor={n} continuo animar={animar} retraso={retraso} estilo={ESTILO_NUMERO} />
      </View>
      <Text style={s.unidad}>{unidad}</Text>
    </View>
  );
}

/** Barra olimpica en miniatura: tres placas a cada lado se deslizan hasta su sitio una tras otra. */
function BarraCargada({ animar }: { animar: boolean }) {
  return (
    <View style={s.barra} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={s.varilla} />
      {PLACAS_BARRA.map((c, k) => (
        <PlacaDeBarra key={`i${k}`} lado={-1} k={k} color={c} animar={animar} />
      ))}
      {PLACAS_BARRA.map((c, k) => (
        <PlacaDeBarra key={`d${k}`} lado={1} k={k} color={c} animar={animar} />
      ))}
    </View>
  );
}

function PlacaDeBarra({ lado, k, color, animar }: { lado: -1 | 1; k: number; color: string; animar: boolean }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const estatico = reducido || !animar;
  const t = useSharedValue(estatico ? 1 : 0);

  useEffect(() => {
    if (estatico) { t.value = 1; return; }
    t.value = withDelay(INICIO_CARGA_MS + k * ESCALONADO_PLACA_MS, withSpring(1, resortePlaca));
    return () => cancelAnimation(t);
  }, [estatico]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 3),
    transform: [{ translateX: lado * (1 - t.value) * 30 }],
  }), [tick]);

  const alto = ALTOS_PLACA[k];
  const desde = 6 + k * 7;
  return (
    <Animated.View
      style={[s.placa, { height: alto, backgroundColor: color, top: (24 - alto) / 2 }, lado < 0 ? { left: desde } : { right: desde }, estilo]}
    />
  );
}

/** Huella de mano de 120 px. Al volver a Hoy con una sesion nueva se estampa: cae de 1.4 a 1 con un golpe medio. */
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
    t.value = 0;
    t.value = withSpring(1, resortePlaca);
  }, [clave, reducido]);

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 2.5),
    transform: [{ scale: 1.4 - 0.4 * t.value }],
  }), [tick]);

  return (
    <View style={s.sello} accessible accessibilityLabel="Hecho hoy">
      <Animated.View style={estilo}><Huella lado={LADO_HUELLA} /></Animated.View>
      <View style={s.hecho}><Text style={s.hechoTexto}>Hecho hoy</Text></View>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  tarjeta: { borderRadius: RADIO_TARJETA },
  cabeza: { flexDirection: 'row', justifyContent: 'space-between', gap: esp.sm },
  datos: { flex: 1, gap: 4 },
  objetivo: { ...tipo.etiqueta, color: paleta.magnesia2 },
  numeros: { flexDirection: 'row', gap: esp.lg },
  unidad: { ...tipo.pie, color: paleta.magnesia2 },
  etiqueta: {
    alignSelf: 'flex-start', marginTop: 4, paddingVertical: 2, paddingHorizontal: 10,
    borderRadius: 999, backgroundColor: tinte.neutra,
  },
  etiquetaTexto: { ...tipo.etiqueta, color: paleta.magnesia2 },
  marca: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  barra: { width: ANCHO_BARRA, height: 24, marginTop: 4 },
  varilla: { position: 'absolute', left: 4, right: 4, top: 11, height: 2, backgroundColor: paleta.magnesia3 },
  placa: { position: 'absolute', width: 5, borderRadius: 2 },
  sello: { alignItems: 'center', gap: 6 },
  hecho: { paddingVertical: 3, paddingHorizontal: 12, borderRadius: 999, backgroundColor: tinte.verde },
  hechoTexto: { ...tipo.dato, color: paleta.placaVerdeTexto },
  carrusel: { marginTop: esp.md, marginHorizontal: -RELLENO },
  carruselContenido: { paddingHorizontal: RELLENO },
  nota: { alignSelf: 'stretch', marginTop: esp.sm },
  acciones: { gap: esp.sm + 4, marginTop: esp.md },
  tituloVacio: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 24, color: paleta.magnesia },
  textoVacio: { ...tipo.cuerpo, color: paleta.magnesia2, marginTop: esp.sm },
  botonVacio: { marginTop: esp.md },
});
