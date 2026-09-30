import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import { paleta, familia } from '@/ui/theme';
import { NUTRICION } from '@/data/catalog';
import { textoDeLectura } from '@/utils/aprender';
import { BloqueRevela } from '@/ui/fx/BloqueRevela';
import { Entrada } from '@/ui/fx/Entrada';
import { IconoProhibido } from '@/components/fx/IconoProhibido';
import { PROPS_FIJAS, type PropsLista } from '@/ui/components/listaBase';
import { TarjetaAlimentacion } from './TarjetaAlimentacion';
import { TituloBloque } from './TituloBloque';

const SEPARACION_SECCIONES = 40;
const DESPLAZAMIENTO_POSTURA_PX = 12;
const ESCALONADO_ICONOS_MS = 80;
const FRACCION_TARJETA_PARA_ACTIVAR = 0.3;

/** La postura del producto se anima la primera vez que se ve en la sesion, no cada vez que se vuelve al segmento. */
let posturaVista = false;

/**
 * El segmento Alimentacion: la app explica lo que deliberadamente no hace, con seguridad y sin
 * disculpas. «Cómo funciona aquí» va como postura (texto principal con un filo de `magnesia`, sin
 * tarjeta), «Lo que esta app no hace» como una lista de decisiones (iconos «prohibido» dibujados en
 * `magnesia`, no en rojo: no son errores) y los conceptos como tarjetas con su consejo practico.
 * Mismo contenido, mismo orden y mismos textos de siempre.
 */
export function VistaAlimentacion({ propsLista, scrollY }: { propsLista: PropsLista; scrollY: SharedValue<number> }) {
  return (
    <Animated.ScrollView {...PROPS_FIJAS} {...propsLista}>
      <BloquePostura texto={textoDeLectura(NUTRICION.principio_de_diseno)} />

      <BloqueRevela y={scrollY} sinMovimiento estilo={s.seccion}>
        {activo => (
          <>
            <TituloBloque>Lo que esta app no hace</TituloBloque>
            <ListaNoHace items={NUTRICION.lo_que_la_app_no_hace} activo={activo} />
          </>
        )}
      </BloqueRevela>

      <View style={s.seccion}><TituloBloque>Información general</TituloBloque></View>
      {NUTRICION.conceptos.map((c, i) => (
        <BloqueRevela key={c.id} y={scrollY} sinMovimiento fraccion={FRACCION_TARJETA_PARA_ACTIVAR}>
          {activo => <TarjetaAlimentacion concepto={c} indice={i} activo={activo} />}
        </BloqueRevela>
      ))}
      <Text style={s.aviso} maxFontSizeMultiplier={1.3}>{textoDeLectura(NUTRICION.aviso)}</Text>
    </Animated.ScrollView>
  );
}

/** «Cómo funciona aquí»: etiqueta en tipo oracion y el texto principal (18/28) con un filo de 3 px a todo su alto. */
function BloquePostura({ texto }: { texto: string }) {
  const animar = useRef(!posturaVista).current;
  useEffect(() => { posturaVista = true; }, []);
  return (
    <Entrada activo animar={animar} y={DESPLAZAMIENTO_POSTURA_PX} escala={1}>
      <View style={s.postura} accessible accessibilityLabel={`Cómo funciona aquí. ${texto}`}>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={s.etiqueta} maxFontSizeMultiplier={1.3}>Cómo funciona aquí</Text>
          <Text style={s.posturaTexto} maxFontSizeMultiplier={1.3}>{texto}</Text>
        </View>
      </View>
    </Entrada>
  );
}

/** Lo que la app no hace: una fila por decision, con su icono «prohibido» que se dibuja escalonado 80 ms. */
function ListaNoHace({ items, activo }: { items: string[]; activo: boolean }) {
  return (
    <View>
      {items.map((x, i) => (
        <View key={i} style={[s.fila, i > 0 && s.borde]}>
          <View style={s.icono}>
            <IconoProhibido activo={activo} retraso={i * ESCALONADO_ICONOS_MS} tamano={18} color={paleta.magnesia2} />
          </View>
          <Text style={s.noHace} maxFontSizeMultiplier={1.3}>{textoDeLectura(x)}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  postura: { borderLeftWidth: 3, borderLeftColor: paleta.magnesia, paddingLeft: 16 },
  etiqueta: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 20, color: paleta.magnesia3Texto },
  posturaTexto: { fontFamily: familia.cuerpo, fontSize: 18, lineHeight: 28, color: paleta.magnesia, marginTop: 6 },
  seccion: { marginTop: SEPARACION_SECCIONES },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  borde: { borderTopWidth: 1, borderTopColor: paleta.gomaBorde },
  icono: { marginTop: 3 },
  noHace: { flex: 1, fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 24, color: paleta.magnesia },
  aviso: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 19, color: paleta.magnesia3Texto, marginTop: 24 },
});
