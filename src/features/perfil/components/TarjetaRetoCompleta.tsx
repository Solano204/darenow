import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia, haptico, MARGEN_PANTALLA } from '@/ui/theme';
import type { Reto } from '@/data/catalog';
import { textoVisible } from '@/lib/presentacion';
import { vistaPreviaDeReto, progresoAcotado } from '@/lib/perfil';
import { Entrada } from '@/ui/fx/Entrada';
import { useMiniMagnesia } from '@/ui/fx/MiniMagnesia';
import { BotonCompacto } from '@/ui/components/BotonCompacto';
import { NivelPlacas } from '@/ui/components/NivelPlacas';
import { TarjetaGoma } from '@/ui/components/TarjetaGoma';
import { TarjetaConFilo } from '@/ui/components/TarjetaConFilo';
import { Pulso } from '@/ui/components/movimiento';
import { PlacaMedalla } from '@/ui/components/PlacaMedalla';
import { LineaDeEtiquetas } from '@/ui/components/EtiquetasMusculo';
import { VistaPreviaMeta } from './VistaPreviaMeta';

const ESCALONADO_MS = 60;
const ALTO_BOTON = 44;
const LADO_MEDALLA = 28;
const ESCALA_MEDALLA = 0.5;

/** El progreso guardado de un reto que ya empezo (`estado.retos[id]`). */
export interface EstadoDeReto { iniciado: string; progreso: number; completado?: string }

/**
 * Un reto de la lista, con todo lo que hay que saber antes de aceptarlo: el titulo en Big Shoulders 700 de 24
 * con su nivel en placas a la derecha, la descripcion, la meta dibujada de antemano (`VistaPreviaMeta`, si se
 * puede leer de los datos), la meta en palabras (Figtree 600 de 16), una linea de metadatos («7 días · Constancia»)
 * y «Empezar reto» como un boton compacto de 44 a la derecha: hay azul en cada tarjeta, pero ninguno grita mas
 * que el contenido. Un reto en curso lleva un filo azul de 3 px y, en vez del boton, «En curso» con su pulso, como
 * hoy; uno completado, una medalla pequena junto al titulo. «Empezar reto» hace lo de siempre sin esperar; si el
 * usuario se queda en la pantalla, el primer elemento de la vista previa recibe una huella que se estampa, con un
 * golpe Medium y una nube de magnesia desde el boton. Las tarjetas entran escalonadas 60 ms.
 */
export function TarjetaRetoCompleta({ reto, estadoReto, indice, activo, onEmpezar }: {
  reto: Reto;
  /** El progreso del reto si ya empezo; `undefined` si no. */
  estadoReto: EstadoDeReto | undefined;
  indice: number;
  activo: boolean;
  onEmpezar: (id: string) => void;
}) {
  const { ref: magnesiaRef, disparar: dispararMagnesia } = useMiniMagnesia();
  const [sello, setSello] = useState(0);
  const completado = !!estadoReto?.completado;
  const enCurso = estadoReto !== undefined && !completado;
  const vista = vistaPreviaDeReto(reto);
  const hechos = vista && estadoReto ? progresoAcotado(estadoReto.progreso, vista.total) : 0;
  const nombre = textoVisible(reto.name);
  const etiquetas = [...(reto.duracion_dias ? [`${reto.duracion_dias} días`] : []), reto.tipo];

  const empezar = () => {
    dispararMagnesia();
    onEmpezar(reto.id);
    setSello(n => n + 1);
    haptico.placa();
  };

  const contenido = (
    <>
      <View style={s.encabezado}>
        <View style={s.tituloFila}>
          {completado && (
            <View style={s.medalla} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <View style={s.medallaInterior}><PlacaMedalla icono="bandera" activo={activo} /></View>
            </View>
          )}
          <Text style={s.titulo} accessibilityRole="header" maxFontSizeMultiplier={1.3}>{nombre}</Text>
        </View>
        <View style={s.nivel} accessible accessibilityLabel={`Nivel ${reto.dificultad}`}>
          <NivelPlacas nivel={reto.dificultad} alto={14} />
          <Text style={s.nivelTexto} maxFontSizeMultiplier={1.3} importantForAccessibility="no-hide-descendants">Nivel {reto.dificultad}</Text>
        </View>
      </View>

      <Text style={s.descripcion} maxFontSizeMultiplier={1.3}>{textoVisible(reto.desc)}</Text>

      {vista ? (
        <View style={s.vista} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <VistaPreviaMeta vista={vista} hechos={hechos} activo={activo} sello={sello} />
        </View>
      ) : null}

      <Text style={s.meta} maxFontSizeMultiplier={1.3}>{textoVisible(reto.objetivo)}</Text>
      <View style={s.etiquetas}><LineaDeEtiquetas etiquetas={etiquetas} /></View>

      <View style={s.accion} ref={magnesiaRef} collapsable={false}>
        {enCurso ? (
          <View style={s.enCurso} accessible accessibilityLabel="En curso">
            <Pulso tamano={7} tono={paleta.placaAzulTexto} />
            <Text style={s.enCursoTexto} importantForAccessibility="no-hide-descendants">En curso</Text>
          </View>
        ) : completado ? null : (
          <BotonCompacto texto="Empezar reto" alto={ALTO_BOTON} etiqueta={`Empezar reto: ${nombre}`} onPress={empezar} />
        )}
      </View>
    </>
  );

  return (
    <Entrada activo={activo} retraso={indice * ESCALONADO_MS} y={16} escala={1} estilo={s.caja}>
      {enCurso
        ? <TarjetaConFilo colorFilo={paleta.placaAzul}>{contenido}</TarjetaConFilo>
        : <TarjetaGoma>{contenido}</TarjetaGoma>}
    </Entrada>
  );
}

const s = StyleSheet.create({
  caja: { marginHorizontal: MARGEN_PANTALLA, marginBottom: 16 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  tituloFila: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  medalla: { width: LADO_MEDALLA, height: LADO_MEDALLA },
  medallaInterior: {
    position: 'absolute', top: -LADO_MEDALLA / 2, left: -LADO_MEDALLA / 2, width: 2 * LADO_MEDALLA, height: 2 * LADO_MEDALLA,
    alignItems: 'center', justifyContent: 'center', transform: [{ scale: ESCALA_MEDALLA }],
  },
  titulo: { flexShrink: 1, fontFamily: familia.titulo, fontSize: 24, lineHeight: 28, color: paleta.magnesia },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  nivelTexto: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  descripcion: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2, marginTop: 6 },
  vista: { marginTop: 16 },
  meta: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 23, color: paleta.magnesia, marginTop: 16 },
  etiquetas: { marginTop: 8 },
  accion: { alignItems: 'flex-end', marginTop: 16, minHeight: ALTO_BOTON },
  enCurso: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: ALTO_BOTON },
  enCursoTexto: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 20, color: paleta.placaAzulTexto },
});
