import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { paleta, familia, haptico, MARGEN_PANTALLA } from '@/ui/theme';
import type { Logro } from '@/data/catalog';
import { textoVisible } from '@/utils/presentacion';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { NotaEntrenador } from '@/ui/components/NotaEntrenador';
import { PlacaMedalla } from '@/ui/components/PlacaMedalla';
import { BarraCarga13 } from '@/ui/fx/BarraCarga13';
import { Odometro } from '@/ui/fx/Odometro';

const COLUMNAS = 5;
const SEPARACION = 8;
const ESCALONADO_MS = 80;
const ESPERA_BARRA_MS = 700;

/**
 * La vitrina de logros: una rejilla de cinco por fila de `PlacaMedalla` de 56 px con el nombre debajo en
 * Figtree 500 de 12/16 (hasta dos lineas, centrado). Un logro ganado es la medalla completa y su nombre en
 * `magnesia`; uno pendiente, solo el aro de `gomaBorde` con el icono al 30 % y el nombre en `magnesia3`, sin
 * candados ni textos de «bloqueado». Se muestran los mismos logros que antes (`logros`). Debajo, el progreso
 * («1 de 20 logros» con el numero en Big Shoulders 700 de 20) sobre una barra de 20 placas delgadas, y la
 * nota de la marca con su barra verde.
 *
 * Al entrar en pantalla (`activo`) las medallas ganadas giran una vuelta en Y y se asientan escalonadas 80 ms,
 * las pendientes aparecen con un fundido y despues se llena la barra; un toque suave solo si hay alguna
 * ganada. Con movimiento reducido todo aparece en su estado final.
 */
export function VitrinaLogros({ logros, ganados, total, activo }: {
  /** Los logros que se muestran (los primeros 8, como siempre). */
  logros: Logro[];
  /** Los ids ganados (todos, no solo los que se muestran). */
  ganados: ReadonlySet<string>;
  /** Cuantos logros hay en total (20). */
  total: number;
  activo: boolean;
}) {
  const reducido = useReducedMotion();
  const { width } = useWindowDimensions();
  const ancho = (width - 2 * MARGEN_PANTALLA - (COLUMNAS - 1) * SEPARACION) / COLUMNAS;
  const nGanados = ganados.size;
  const visiblesGanados = logros.filter(l => ganados.has(l.id)).length;
  const [llena, setLlena] = useState(reducido ? nGanados : 0);

  useEffect(() => {
    if (!activo || visiblesGanados === 0) return;
    haptico.toque();
  }, [activo]);

  useEffect(() => {
    if (reducido) { setLlena(nGanados); return; }
    if (!activo) return;
    const id = setTimeout(() => setLlena(nGanados), visiblesGanados * ESCALONADO_MS + ESPERA_BARRA_MS);
    return () => clearTimeout(id);
  }, [activo, reducido, nGanados]);

  let rango = 0;
  return (
    <View style={s.raiz}>
      <View style={s.rejilla}>
        {logros.map(l => {
          const ganado = ganados.has(l.id);
          const nombre = textoVisible(l.name);
          return (
            <View
              key={l.id} style={[s.celda, { width: ancho }]} accessible
              accessibilityLabel={`${nombre}, ${ganado ? 'ganado' : 'pendiente'}`}
            >
              <View style={s.interior} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                <PlacaMedalla icono={l.icono} activo={activo} retraso={ganado ? rango++ * ESCALONADO_MS : 0} pendiente={!ganado} />
                <Text
                  style={[s.nombre, { color: ganado ? paleta.magnesia : paleta.magnesia3Texto }]}
                  numberOfLines={2} maxFontSizeMultiplier={1.3}
                >
                  {nombre}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={s.progreso}>
        <BarraCarga13
          total={total} actual={0} ganadas={llena} colorHecha={paleta.magnesia} compacta
          etiqueta={`${nGanados} de ${total} logros`}
        />
        <View style={s.cuenta} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Odometro valor={nGanados} continuo activo={activo} estilo={s.cuentaNumero} />
          <Text style={s.cuentaTexto} maxFontSizeMultiplier={1.3}>de {total} logros</Text>
        </View>
      </View>

      <NotaEntrenador colorBarra={paleta.placaVerde} estilo={s.nota}>
        <Text style={s.notaTexto} maxFontSizeMultiplier={1.3}>Ninguno depende de tu peso ni de una medida.</Text>
      </NotaEntrenador>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SEPARACION, rowGap: 16 },
  celda: { alignItems: 'center' },
  interior: { alignItems: 'center', gap: 6 },
  nombre: { fontFamily: familia.medio, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  progreso: { marginTop: 24, gap: 12 },
  cuenta: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  cuentaNumero: { fontFamily: familia.titulo, fontSize: 20, lineHeight: 24, color: paleta.magnesia },
  cuentaTexto: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
  nota: { alignSelf: 'stretch', marginTop: 16 },
  notaTexto: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 24, color: paleta.magnesia },
});
