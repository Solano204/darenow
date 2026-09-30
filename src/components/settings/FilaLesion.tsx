import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { paleta } from '@/ui/theme';
import { useTick } from '@/ui/hooks/useTick';
import { FilaAjuste } from './FilaAjuste';
import { CasillaMarca, useProgresoMarca } from './CasillaMarca';

const ANCHO_FILO = 3;

/**
 * Una lesion o condicion: aqui marcar algo significa «cuidame esta zona», asi que la casilla se rellena de
 * `placaAmarilla` (no `magnesia`) y a la izquierda de la fila aparece un filo de 3 px del mismo color. Sin
 * particulas: es seguridad, no celebracion. El lector de pantalla oye «filtro de seguridad».
 */
export function FilaLesion({ texto, marcada, onCambiar }: {
  texto: string;
  marcada: boolean;
  onCambiar: () => void;
}) {
  const tick = useTick();
  const t = useProgresoMarca(marcada);
  const filo = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scaleY: t.value }] }), [tick]);

  return (
    <View>
      <FilaAjuste
        titulo={texto}
        derecha={<CasillaMarca t={t} marcada={marcada} color={paleta.placaAmarilla} />}
        onPress={onCambiar} haptica="seleccion" rol="checkbox" estado={{ checked: marcada }}
        etiqueta={`${texto}, filtro de seguridad`}
      />
      <Animated.View style={[s.filo, filo]} pointerEvents="none" />
    </View>
  );
}

const s = StyleSheet.create({
  filo: { position: 'absolute', left: 0, top: 0, bottom: 0, width: ANCHO_FILO, backgroundColor: paleta.placaAmarilla },
});
