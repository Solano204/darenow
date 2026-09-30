import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia, resorteMagnesia } from '@/ui/theme';
import type { Ejercicio } from '@/data/catalog';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { Entrada } from '@/ui/fx/Entrada';
import { FilaEjercicio } from '@/ui/components/FilaEjercicio';

/** Las primeras filas de un subgrupo entran escalonadas cuando el subgrupo llega a la pantalla; las de mas abajo no. */
const FILAS_CON_ENTRADA = 8;
const ESCALONADO_MS = 40;
const DESDE_ABAJO_PX = 8;
const ANCHO_MARCA = 3;
const ALTO_MARCA = 24;
/** La marca de jerarquia va en el margen, a la izquierda de la fila (que ya se estira sobre el margen 12 px). */
const MARCA_X = -14;

/** «Ejercicios»: el titulo de toda la seccion, en Big Shoulders 700 de 24. */
export function TituloEjercicios() {
  return <Text style={s.titulo} accessibilityRole="header">Ejercicios</Text>;
}

/**
 * Un subgrupo de ejercicios del musculo («Como principal» o «Como secundario») con su conteo como
 * numero aparte (Big Shoulders 700 de 18, sin parentesis en la vista). Los dos usan el mismo formato
 * de fila (`FilaEjercicio` de Explorar: miniatura, nombre, equipo, nivel en placas, mini medidor de la
 * evidencia y favorito); los principales llevan una marca de 3×24 `magnesia` a la izquierda y los
 * secundarios, `magnesia3`. Las primeras filas entran escalonadas 40 ms al llegar a la pantalla
 * (`activo`, una vez). Un subgrupo sin ejercicios no se dibuja.
 */
export function SubgrupoEjercicios({ titulo, ejercicios, principal, activo, favorito, onFav, onPress }: {
  titulo: string;
  ejercicios: Ejercicio[];
  principal: boolean;
  activo: boolean;
  favorito: (id: string) => boolean;
  onFav: (id: string) => void;
  onPress: (id: string) => void;
}) {
  const reducido = useReducedMotion();
  if (ejercicios.length === 0) return null;

  return (
    <View>
      <View style={s.cabecera} accessible accessibilityRole="header" accessibilityLabel={`${titulo}, ${ejercicios.length}`}>
        <Text style={s.subtitulo} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{titulo}</Text>
        <Text style={s.conteo} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>{ejercicios.length}</Text>
      </View>
      {ejercicios.map((e, i) => (
        <Entrada
          key={e.id} activo={activo} animar={!reducido && i < FILAS_CON_ENTRADA} retraso={i * ESCALONADO_MS} y={DESDE_ABAJO_PX}
          resorte={resorteMagnesia}
        >
          <View>
            <View style={s.zonaMarca} pointerEvents="none">
              <View style={[s.marca, { backgroundColor: principal ? paleta.magnesia : paleta.magnesia3 }]} />
            </View>
            <FilaEjercicio e={e} favorito={favorito(e.id)} onFav={onFav} onPress={onPress} />
          </View>
        </Entrada>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  titulo: { fontFamily: familia.titulo, fontSize: 24, lineHeight: 28, color: paleta.magnesia },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  subtitulo: { fontFamily: familia.enfasis, fontSize: 15, lineHeight: 22, color: paleta.magnesia2 },
  conteo: { fontFamily: familia.titulo, fontSize: 18, lineHeight: 22, color: paleta.magnesia },
  zonaMarca: { position: 'absolute', top: 0, bottom: 0, left: MARCA_X, width: ANCHO_MARCA, justifyContent: 'center' },
  marca: { width: ANCHO_MARCA, height: ALTO_MARCA, borderRadius: ANCHO_MARCA / 2 },
});
