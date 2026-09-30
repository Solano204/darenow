import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import { paleta, familia } from '@/theme';
import { textoVisible } from '@/utils/presentacion';
import { agruparPorLetra, textoDeLectura, type Termino } from '@/utils/aprender';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useHuecoAbajo } from '@/components/ui';
import { TextoVacio } from '@/components/explore/TextoVacio';
import { EncabezadoPegado } from '@/components/explore/EncabezadoPegado';
import { PROPS_FIJAS, type PropsLista } from '@/components/explore/listaBase';
import { PreguntaAcordeon } from './PreguntaAcordeon';
import { TituloBloque } from './TituloBloque';

const ALTO_LETRA = 44;
const AIRE_AL_MOSTRAR_PX = 16;

/**
 * El segmento Glosario: los terminos, con una letra pegajosa por cada tramo alfabetico **en el orden
 * del dato** (nada se reordena; el dato son dos bloques alfabeticos, asi que una letra puede volver
 * a salir), y despues las preguntas frecuentes con su acordeon. Sin animacion de entrada: es
 * consulta y la rapidez importa mas. `rellenoSuperior` es el aire fijo que la lista deja antes de
 * su primera fila (la letra pegajosa se queda al ras del principio de la lista).
 */
export function VistaGlosario({ terminos, preguntas, propsLista, scrollY, rellenoSuperior }: {
  terminos: Termino[];
  preguntas: { p: string; r: string }[];
  propsLista: PropsLista;
  scrollY: SharedValue<number>;
  rellenoSuperior: number;
}) {
  const reducido = useReducedMotion();
  const { height: ventana } = useWindowDimensions();
  const abajo = useHuecoAbajo();
  const scroll = useRef<Animated.ScrollView>(null);
  const tramos = useMemo(
    () => agruparPorLetra(terminos).map((t, i) => ({ ...t, clave: `${i}-${t.letra}-${t.terminos[0].termino}` })),
    [terminos],
  );

  // Donde empieza cada tramo en el contenido: se mide una vez pintado y se junta en una sola pasada.
  const medidas = useRef<Record<string, number>>({});
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [posiciones, setPosiciones] = useState<Record<string, number>>({});
  useEffect(() => () => clearTimeout(espera.current), []);
  const alMedir = (clave: string) => (e: LayoutChangeEvent) => {
    medidas.current[clave] = e.nativeEvent.layout.y - rellenoSuperior;
    clearTimeout(espera.current);
    espera.current = setTimeout(() => setPosiciones({ ...medidas.current }), 0);
  };
  const arriba = useMemo(() => tramos.map(t => posiciones[t.clave] ?? Number.POSITIVE_INFINITY), [tramos, posiciones]);

  // Al abrir una respuesta que queda por debajo del pie de la pantalla, la lista sube lo justo para mostrarla.
  const mostrar = useCallback((fila: View | null) => {
    fila?.measureInWindow((_x, top, _ancho, alto) => {
      const exceso = top + alto - (ventana - abajo) + AIRE_AL_MOSTRAR_PX;
      if (exceso > 0) scroll.current?.scrollTo({ y: scrollY.value + exceso, animated: !reducido });
    });
  }, [ventana, abajo, reducido, scrollY]);

  return (
    <View style={s.raiz}>
      <Animated.ScrollView ref={scroll} {...PROPS_FIJAS} {...propsLista}>
        {tramos.length === 0 && <TextoVacio texto="Ningún término coincide. Prueba con otra palabra." />}
        {tramos.map(t => (
          <View key={t.clave} onLayout={alMedir(t.clave)}>
            <EncabezadoLetra letra={t.letra} />
            {t.terminos.map(x => <FilaGlosario key={x.termino} termino={x} />)}
          </View>
        ))}

        <View style={s.preguntas}><TituloBloque>Preguntas frecuentes</TituloBloque></View>
        {preguntas.map((f, i) => <PreguntaAcordeon key={i} pregunta={f.p} respuesta={f.r} onAbierta={mostrar} />)}
      </Animated.ScrollView>

      <EncabezadoPegado
        arriba={arriba} scrollY={scrollY} top={0} recorrido={0}
        contenido={i => <EncabezadoLetra letra={tramos[i].letra} />}
      />
    </View>
  );
}

/** La letra de un tramo del glosario: Big Shoulders 800 de 32 en `magnesia3`, a la izquierda. */
function EncabezadoLetra({ letra }: { letra: string }) {
  return (
    <View style={s.letra} accessible accessibilityRole="header" accessibilityLabel={letra}>
      <Text style={s.letraTexto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{letra}</Text>
    </View>
  );
}

/** Un termino: en Big Shoulders 700 de 20 (las siglas como AMRAP se ven especialmente bien) y su definicion completa en Figtree 15/22. */
function FilaGlosario({ termino }: { termino: Termino }) {
  return (
    <View style={s.termino} accessible accessibilityLabel={`${textoVisible(termino.termino)}. ${textoDeLectura(termino.def)}`}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={s.nombre} maxFontSizeMultiplier={1.3}>{textoVisible(termino.termino)}</Text>
        <Text style={s.definicion} maxFontSizeMultiplier={1.3}>{textoDeLectura(termino.def)}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
  letra: { height: ALTO_LETRA, justifyContent: 'flex-end', paddingBottom: 4 },
  letraTexto: { fontFamily: familia.display, fontSize: 32, lineHeight: 36, color: paleta.magnesia3 },
  termino: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: paleta.gomaBorde },
  nombre: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, color: paleta.magnesia },
  definicion: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2, marginTop: 4 },
  preguntas: { marginTop: 40 },
});
