/**
 * FORJA · mediciones
 *
 * Los protocolos, lo que trae cada uno, la validacion del valor y el guardado (con el consentimiento de datos de
 * salud) son los de siempre (ver `docs/FUNCIONALIDAD.md`, seccion 22); cambia como se ven y se mueven: cada
 * protocolo es una fila con su icono y su frecuencia debajo del nombre, y al abrirse la tarjeta crece con las
 * condiciones como lista de verificacion, los pasos en un riel y la captura del valor con su unidad.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { type Protocolo } from '@/data/catalog';
import { MEDICIONES } from '@/data/logros';
import { useEstadoSel, hoy } from '@/state/store';
import { guardarMedicion } from '@/state/acciones';
import { useConsentimientoMedidas, pedirConsentimientoMedidas } from '@/state/consentimientoMedidas';
import { unidadDeMedicion } from '@/lib/textosVisibles';
import { PantallaColapsable } from '@/ui/components/PantallaColapsable';
import { NotaEntrenador } from '@/ui/components/NotaEntrenador';
import { FilaMedicion } from '@/features/perfil/components/FilaMedicion';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export default function Mediciones({ navigation }: NativeStackScreenProps<ParamListBase, 'Mediciones'>) {
  const mediciones = useEstadoSel(e => e.mediciones);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [valor, setValor] = useState('');
  const [exitos, setExitos] = useState<Record<string, number>>({});
  const [errores, setErrores] = useState<Record<string, number>>({});
  const [consentimientoMedidas, cambiarConsentimientoMedidas] = useConsentimientoMedidas();

  const sube = (mapa: Record<string, number>, id: string) => ({ ...mapa, [id]: (mapa[id] ?? 0) + 1 });

  /** Lo mismo de siempre: un valor que no es un numero no se guarda; si lo es, se pide el consentimiento y se guarda. */
  const guardar = (p: Protocolo) => () => {
    const n = parseFloat(valor.replace(',', '.'));
    if (!Number.isFinite(n)) { setErrores(e => sube(e, p.id)); return; }
    pedirConsentimientoMedidas(consentimientoMedidas, cambiarConsentimientoMedidas, () => {
      guardarMedicion({ protocolo: p.id, fecha: hoy(), valor: n, unidad: '' });
      setValor('');
      setExitos(e => sube(e, p.id));
    });
  };

  return (
    <PantallaColapsable
      titulo="Mediciones" onAtras={() => navigation.goBack()}
      contenido={({ y, desplazarA, altoBarra }) => (
        <>
          <View style={s.nota}>
            <NotaEntrenador colorBarra={paleta.magnesia3} estilo={s.notaCaja}>
              <Text style={s.notaTexto} maxFontSizeMultiplier={1.3}>
                Una medición sirve solo si es repetible. Cada protocolo fija las condiciones; si tomas una fuera de ellas, no entra en la tendencia.
              </Text>
            </NotaEntrenador>
          </View>
          {MEDICIONES.map(p => (
            <FilaMedicion
              key={p.id} p={p} abierta={abierto === p.id}
              onAlternar={() => setAbierto(abierto === p.id ? null : p.id)}
              y={y} altoBarra={altoBarra} desplazarA={desplazarA}
              valor={valor} onValor={setValor} unidad={unidadDeMedicion(p.id)}
              exito={exitos[p.id] ?? 0} error={errores[p.id] ?? 0} onGuardar={guardar(p)}
              previas={mediciones.filter(m => m.protocolo === p.id)}
            />
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
