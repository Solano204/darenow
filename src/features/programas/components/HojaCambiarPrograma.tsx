import React from 'react';
import { StyleSheet } from 'react-native';
import { HojaInferior } from '@/ui/components/HojaInferior';
import { BotonPlaca } from '@/ui/components/BotonPlaca';
import { BotonSecundario } from '@/ui/components/BotonSecundario';

/**
 * «Cambiar de programa» como hoja inferior (la misma de salir de la sesion y de descartar
 * cambios: `gomaAlta`, esquinas superiores de 28) en lugar de la alerta del sistema. Mismo
 * texto y mismas dos salidas; confirmar es un `BotonPlaca` con el aplauso de magnesia.
 * Cerrarla con el boton atras de Android es «Cancelar».
 */
export function HojaCambiarPrograma({ visible, actual, nuevo, onConfirmar, onCancelar }: {
  visible: boolean;
  /** Nombre del programa que sigue hoy. */
  actual: string;
  /** Nombre del programa al que se quiere cambiar. */
  nuevo: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <HojaInferior
      visible={visible} onRequestClose={onCancelar} titulo="Cambiar de programa"
      texto={`Ahora sigues "${actual}". Solo se puede seguir un programa a la vez: para unirte a "${nuevo}" hay que dejarlo primero.`}
    >
      <BotonPlaca texto="Dejarlo y cambiar" aplauso onPress={onConfirmar} />
      <BotonSecundario texto="Cancelar" onPress={onCancelar} estilo={s.cancelar} />
    </HojaInferior>
  );
}

const s = StyleSheet.create({
  cancelar: { marginTop: 4 },
});
