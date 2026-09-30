import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, familia } from '@/ui/theme';
import { useTick } from '@/ui/hooks/useTick';
import { useMiniMagnesia } from '@/ui/fx/MiniMagnesia';
import { FilaAjuste, type IconoAjuste } from './FilaAjuste';
import { CasillaMarca, useProgresoMarca } from './CasillaMarca';

const PARTICULAS = 6;
const OPACIDAD_ALTERNATIVA_MARCADA = 0.5;
const LADO_ICONO = 22;
const ICONO_GENERICO: IconoAjuste = 'disc-outline';

/** Un icono de linea por equipo (los que no tienen uno propio usan el disco generico). */
const ICONOS: Record<string, IconoAjuste> = {
  colchoneta: 'bed-outline',
  mancuernas: 'fitness-outline',
  barra: 'barbell-outline',
  kettlebell: 'bag-handle-outline',
  banda_larga: 'infinite-outline',
  banda_mini: 'ellipse-outline',
  barra_dominadas: 'reorder-two-outline',
  banco: 'tablet-landscape-outline',
  cuerda: 'link-outline',
  fitball: 'basketball-outline',
  rodillo: 'battery-full-outline',
  polea: 'sync-circle-outline',
  maquina_jalon: 'arrow-down-circle-outline',
  prensa: 'arrow-up-circle-outline',
  remo_maquina: 'boat-outline',
  chaleco_lastre: 'shirt-outline',
  anillas_trx: 'radio-button-off-outline',
};

const iconoDeEquipo = (id: string): IconoAjuste => ICONOS[id] ?? ICONO_GENERICO;

/**
 * Un equipo que se marca: icono de linea, nombre y «Si no tienes: …» en `magnesia3`. Al marcarlo la casilla se
 * rellena de `magnesia` con la palomita dibujada, el icono pasa a `magnesia`, la alternativa baja a la mitad (ya lo
 * tienes, importa menos), suena la haptica de seleccion y sale una nube de 6 particulas de magnesia. Al desmarcarlo
 * todo regresa en 180 ms.
 */
export function FilaEquipo({ id, nombre, sustituto, marcado, onCambiar }: {
  id: string;
  nombre: string;
  sustituto?: string;
  marcado: boolean;
  onCambiar: () => void;
}) {
  const tick = useTick();
  const mini = useMiniMagnesia();
  const t = useProgresoMarca(marcado);
  const icono = iconoDeEquipo(id);

  const iconoMarcado = useAnimatedStyle(() => ({ opacity: t.value }), [tick]);
  const atenuada = useAnimatedStyle(() => ({ opacity: 1 - OPACIDAD_ALTERNATIVA_MARCADA * t.value }), [tick]);

  return (
    <FilaAjuste
      izquierda={(
        <View style={s.icono} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name={icono} size={LADO_ICONO} color={paleta.magnesia3Texto} />
          <Animated.View style={[StyleSheet.absoluteFill, iconoMarcado]}>
            <Ionicons name={icono} size={LADO_ICONO} color={paleta.magnesia} />
          </Animated.View>
        </View>
      )}
      titulo={nombre}
      descripcion={sustituto ? (
        <Animated.Text style={[s.sustituto, atenuada]} maxFontSizeMultiplier={1.3}>
          <Text style={s.prefijo}>Si no tienes:</Text> {sustituto}
        </Animated.Text>
      ) : undefined}
      derecha={<CasillaMarca t={t} marcada={marcado} color={paleta.magnesia} refCaja={mini.ref} />}
      onPress={() => { onCambiar(); if (!marcado) mini.disparar(PARTICULAS); }}
      haptica="seleccion" rol="checkbox" estado={{ checked: marcado }}
      etiqueta={sustituto ? `${nombre}. Si no tienes: ${sustituto}` : nombre}
    />
  );
}

const s = StyleSheet.create({
  icono: { width: LADO_ICONO, height: LADO_ICONO, alignItems: 'center', justifyContent: 'center' },
  sustituto: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.magnesia3Texto, marginTop: 2 },
  prefijo: { fontFamily: familia.enfasis },
});
