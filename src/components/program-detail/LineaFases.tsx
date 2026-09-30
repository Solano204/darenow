import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { paleta, familia, resorteMagnesia, MARGEN_PANTALLA } from '@/ui/theme';
import { textoVisible } from '@/utils/presentacion';
import type { FasePrograma } from '@/utils/minutosPorSemana';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { Entrada } from '@/ui/fx/Entrada';
import { NotaEntrenador } from '@/ui/components/NotaEntrenador';
import { RielVertical, type SegmentoRiel } from '@/ui/components/RielVertical';
import { SANGRIA_RIEL } from '@/ui/components/EncabezadoBloque';
import { EncabezadoFase } from './EncabezadoFase';
import { TarjetaRutinaFase } from './TarjetaRutinaFase';

const ESCALONADO_MS = 50;
const DESDE_LA_DERECHA_PX = 40;
const RESPIRO_ENTRE_FASES = 32;
const SEPARACION_TARJETAS = 12;
const AIRE_SOBRE_CARRUSEL = 12;

/**
 * Las fases del programa en el riel de la Parte 8 (`RielVertical`), sin tarjeta envolviendo
 * cada una: el riel y 32 px de aire hacen la agrupacion. Cada fase lleva su encabezado (rango
 * de semanas y nombre), sus rutinas en un carrusel de tarjetas de 150 (las mismas, sin repetir,
 * y en el mismo orden de siempre) y su nota si la tiene. Si el usuario sigue el programa
 * (`semanaActual`), el nodo de su fase es azul y late, y el riel de las fases ya pasadas esta
 * lleno. Al entrar una fase por primera vez, su etiqueta se estampa y las tarjetas entran
 * desde la derecha una tras otra (50 ms). `resaltar` hace brillar una fase (al tocarla en el mapa).
 * Debe ser hijo directo del contenido del scroll.
 */
export function LineaFases({ fases, semanaActual, resaltar, y, zonas, onAbrirRutina }: {
  fases: FasePrograma[];
  semanaActual?: number;
  resaltar: { indice: number; n: number };
  y: SharedValue<number>;
  zonas: SharedValue<number[]>;
  onAbrirRutina: (id: string) => void;
}) {
  const reducido = useReducedMotion();

  const segmentos = useMemo<SegmentoRiel[]>(() => fases.map((f, i) => {
    const actual = semanaActual !== undefined && semanaActual >= f.desde && semanaActual <= f.hasta;
    const ids = [...new Set(f.rutinas)];
    return {
      clave: `${f.desde}-${f.hasta}-${i}`,
      color: actual ? paleta.placaAzul : paleta.magnesia3,
      pasado: semanaActual !== undefined && f.hasta < semanaActual,
      pulsa: actual,
      resalta: resaltar.indice === i ? resaltar.n : 0,
      alBorde: true,
      encabezado: ({ visto }) => <EncabezadoFase desde={f.desde} hasta={f.hasta} foco={f.foco} visto={visto} />,
      contenido: ({ visto }) => (
        <>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.carrusel} style={s.carruselCaja}
          >
            {ids.map((id, k) => (
              <Entrada
                key={id} activo={visto} animar={!reducido} retraso={k * ESCALONADO_MS} x={DESDE_LA_DERECHA_PX}
                resorte={resorteMagnesia}
              >
                <TarjetaRutinaFase id={id} onPress={() => onAbrirRutina(id)} />
              </Entrada>
            ))}
          </ScrollView>
          {f.nota ? (
            <View style={s.nota}>
              <NotaEntrenador colorBarra={paleta.magnesia3} estilo={s.notaCaja}>
                <Text style={s.notaTexto}>{textoVisible(f.nota)}</Text>
              </NotaEntrenador>
            </View>
          ) : null}
        </>
      ),
    };
  }), [fases, semanaActual, resaltar, reducido, onAbrirRutina]);

  return <RielVertical segmentos={segmentos} y={y} zonas={zonas} respiro={RESPIRO_ENTRE_FASES} />;
}

const s = StyleSheet.create({
  carruselCaja: { marginTop: AIRE_SOBRE_CARRUSEL },
  carrusel: { paddingLeft: SANGRIA_RIEL, paddingRight: MARGEN_PANTALLA, gap: SEPARACION_TARJETAS },
  nota: { marginTop: AIRE_SOBRE_CARRUSEL, marginLeft: SANGRIA_RIEL, marginRight: MARGEN_PANTALLA },
  notaCaja: { alignSelf: 'stretch' },
  notaTexto: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2 },
});
