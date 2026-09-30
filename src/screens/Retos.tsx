/**
 * FORJA · retos
 *
 * La lista de retos y su «Empezar reto» son los de siempre (ver `docs/FUNCIONALIDAD.md`, seccion 22); cambia
 * como se ve: cada reto trae su meta dibujada de antemano, su nivel en placas y un boton compacto, en vez de un
 * boton azul gigante repetido en cada tarjeta.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { RETOS } from '@/data/catalog';
import { useEstado } from '@/store/store';
import { PantallaColapsable } from '@/ui/components/PantallaColapsable';
import { NotaEntrenador } from '@/ui/components/NotaEntrenador';
import { BloqueRevela } from '@/ui/fx/BloqueRevela';
import { TarjetaRetoCompleta } from '@/components/profile/TarjetaRetoCompleta';

/** Las primeras tarjetas entran escalonadas; una que llega por scroll no espera a las de arriba. */
const TARJETAS_ESCALONADAS = 4;

export default function Retos({ navigation }: any) {
  const { estado, iniciarReto } = useEstado();

  return (
    <PantallaColapsable
      titulo="Retos" onAtras={() => navigation.goBack()}
      contenido={({ y }) => (
        <>
          <View style={s.nota}>
            <NotaEntrenador colorBarra={paleta.placaVerde} estilo={s.notaCaja}>
              <Text style={s.notaTexto} maxFontSizeMultiplier={1.3}>
                Ningún reto empuja a entrenar más días seguidos de los razonables, y los de constancia cuentan los días de movilidad como válidos.
              </Text>
            </NotaEntrenador>
          </View>
          {RETOS.map((r, i) => (
            <BloqueRevela key={r.id} y={y} sinMovimiento fraccion={0.15}>
              {activo => (
                <TarjetaRetoCompleta
                  reto={r} estadoReto={estado.retos[r.id]} indice={Math.min(i, TARJETAS_ESCALONADAS)} activo={activo}
                  onEmpezar={iniciarReto}
                />
              )}
            </BloqueRevela>
          ))}
        </>
      )}
    />
  );
}

const s = StyleSheet.create({
  nota: { marginHorizontal: MARGEN_PANTALLA, marginBottom: 24 },
  notaCaja: { alignSelf: 'stretch' },
  notaTexto: { fontFamily: familia.cuerpo, fontSize: 16, lineHeight: 24, color: paleta.magnesia },
});
