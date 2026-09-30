import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { paleta, MARGEN_PANTALLA } from '@/theme';
import { etiquetasDeEstadisticas } from '@/utils/perfil';
import { PlacaDato } from '@/components/ui/PlacaDato';
import { Huella } from '@/components/fx/Huella';

const TAMANO_NUMERO = 32;
const ESCALONADO_MS = 80;
const LADO_HUELLA = 12;

/** Los numeros ya rodaron en esta sesion de la app: las siguientes veces aparecen puestos y solo ruedan si cambian. */
let numerosAnimados = false;

/**
 * Racha, sesiones, minutos y series como cuatro placas de dato en fila, con el filo de arriba neutro
 * (`magnesia3`) y el numero en Big Shoulders 800 de 32 que rueda. La racha no castiga: en 0 se ve como
 * cualquier otro numero (sin rojo, sin fuego apagado, sin texto de «perdiste») y, cuando es mayor que 0,
 * lleva una huella de magnesia de 12 px junto al numero. Los numeros ruedan escalonados 80 ms la primera vez
 * que se abre la pestana en la sesion (`activo`); despues, solo ruedan si el valor cambia. Las etiquetas
 * respetan el plural.
 */
export function EstadisticasPerfil({ racha, sesiones, minutos, series, activo }: {
  racha: number; sesiones: number; minutos: number; series: number; activo: boolean;
}) {
  const animar = useRef(!numerosAnimados).current;
  useEffect(() => { numerosAnimados = true; }, []);
  const etiquetas = etiquetasDeEstadisticas(sesiones, minutos, series);
  const numeros = [racha, sesiones, minutos, series];

  return (
    <View style={s.fila}>
      {numeros.map((n, i) => (
        <View key={i} style={s.celda}>
          <PlacaDato
            numero={n} etiqueta={etiquetas[i]} lector={i === 0 ? (n === 1 ? 'día de racha' : 'días de racha') : undefined}
            filo={paleta.magnesia3} retraso={i * ESCALONADO_MS} activo={activo} animar={animar} haptica={false}
            tamano={TAMANO_NUMERO} continuo adorno={i === 0 && racha > 0 ? <Huella lado={LADO_HUELLA} /> : undefined}
          />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 8, marginHorizontal: MARGEN_PANTALLA },
  celda: { flex: 1, flexDirection: 'row' },
});
