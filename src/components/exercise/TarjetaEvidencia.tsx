import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { paleta, familia, resorteMagnesia } from '@/ui/theme';
import type { Evidencia } from '@/data/catalog';
import { textoDeAfirmacion, textoVisible } from '@/utils/presentacion';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { TarjetaGoma } from '@/ui/components/TarjetaGoma';
import { InsigniaEvidencia } from '@/ui/components/InsigniaEvidencia';
import { NotaEntrenador } from '@/ui/components/NotaEntrenador';
import { Entrada } from '@/ui/fx/Entrada';
import { Tachon, type Linea } from '@/ui/fx/TachadoMito';
import {
  MedidorEvidencia, COLOR_VEREDICTO, contarVeredictos, veredictoDominante,
} from '@/ui/components/MedidorEvidencia';

const RELLENO = 20;
const RETRASO_FILAS_MS = 700;
const ESCALONADO_FILA_MS = 70;
const RETRASO_SELLO_MS = 120;
const TACHADO_MS = 300;
const MAX_AFIRMACIONES_CON_HAPTICA = 5;
const PRIMERAS_CON_HAPTICA = 3;
const ETIQUETAS: Record<Evidencia, string> = { ok: 'comprobado', parcial: 'parcial', mito: 'mito', cuidado: 'cuidado' };

/**
 * «Qué dice la evidencia»: el medidor de veredictos, una fila por afirmacion con
 * su insignia y la nota. Lleva un filo izquierdo de 3 px del color del veredicto
 * dominante y la nota usa ese mismo color en su barra. Al activarse: el medidor
 * se llena, las filas entran escalonadas, cada insignia se estampa (con golpe
 * Rigid; con mas de 5 afirmaciones solo las primeras 3), el tachado de un «mito»
 * se dibuja despues de su sello y la nota entra al final.
 */
export function TarjetaEvidencia({ mapa, nota, activo }: {
  mapa: Record<string, Evidencia>;
  nota?: string;
  activo: boolean;
}) {
  const filas = Object.entries(mapa);
  const conteos = contarVeredictos(mapa);
  const dominante = COLOR_VEREDICTO[veredictoDominante(conteos)];
  const conHaptica = (i: number) => filas.length <= MAX_AFIRMACIONES_CON_HAPTICA || i < PRIMERAS_CON_HAPTICA;
  const retrasoNota = RETRASO_FILAS_MS + filas.length * ESCALONADO_FILA_MS + 200;

  return (
    <TarjetaGoma relleno={RELLENO}>
      <View style={[s.filo, { backgroundColor: dominante }]} />
      {filas.length > 0 && <MedidorEvidencia conteos={conteos} activo={activo} />}

      {filas.map(([clave, veredicto], i) => (
        <Fila
          key={clave} texto={textoDeAfirmacion(clave)} veredicto={veredicto} primera={i === 0} activo={activo}
          retraso={RETRASO_FILAS_MS + i * ESCALONADO_FILA_MS} haptica={conHaptica(i)}
        />
      ))}

      {nota ? (
        <Entrada activo={activo} retraso={retrasoNota} y={12} resorte={resorteMagnesia} estilo={s.nota}>
          <NotaEntrenador colorBarra={dominante} estilo={s.notaCaja}>
            <Text style={s.notaTexto}>{textoVisible(nota)}</Text>
          </NotaEntrenador>
        </Entrada>
      ) : null}
    </TarjetaGoma>
  );
}

function Fila({ texto, veredicto, primera, activo, retraso, haptica }: {
  texto: string; veredicto: Evidencia; primera: boolean; activo: boolean; retraso: number; haptica: boolean;
}) {
  return (
    <Entrada activo={activo} retraso={retraso} x={-8}>
      <View
        style={[s.fila, primera ? s.filaPrimera : s.filaBorde]} accessible
        accessibilityLabel={`${texto}, ${ETIQUETAS[veredicto]}`}
      >
        <View style={s.texto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {veredicto === 'mito'
            ? <TextoTachado texto={texto} activo={activo} retraso={retraso + RETRASO_SELLO_MS + TACHADO_MS} />
            : <Text style={s.afirmacion}>{texto}</Text>}
        </View>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <InsigniaEvidencia
            tipo={veredicto}
            estampar={{ activo, retraso: retraso + RETRASO_SELLO_MS, escala: 1.35, giro: -3, haptica }}
          />
        </View>
      </View>
    </Entrada>
  );
}

/** La afirmacion de un «mito» con un tachado fino `placaRoja` que se dibuja de izquierda a derecha. */
function TextoTachado({ texto, activo, retraso }: { texto: string; activo: boolean; retraso: number }) {
  const reducido = useReducedMotion();
  const [lineas, setLineas] = useState<Linea[]>([]);
  return (
    <View>
      <Text
        style={s.afirmacion}
        onTextLayout={e => setLineas(e.nativeEvent.lines.map(l => ({ x: l.x, y: l.y, width: l.width, height: l.height })))}
      >
        {texto}
      </Text>
      {lineas.map((l, n) => (
        <Tachon
          key={n} linea={l} activo={activo} estatico={reducido}
          duracion={TACHADO_MS / lineas.length} espera={retraso + (n * TACHADO_MS) / lineas.length}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  filo: { position: 'absolute', top: -RELLENO, bottom: -RELLENO, left: -RELLENO, width: 3 },
  fila: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  filaPrimera: { marginTop: 8 },
  filaBorde: { borderTopWidth: 1, borderTopColor: paleta.gomaBorde },
  texto: { flex: 1, paddingVertical: 10 },
  afirmacion: { fontFamily: familia.medio, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
  nota: { marginTop: 12 },
  notaCaja: { alignSelf: 'stretch' },
  notaTexto: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia },
});
