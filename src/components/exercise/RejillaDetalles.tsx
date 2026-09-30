import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paleta, tipo, familia } from '@/ui/theme';
import { nombreEquipo, type Ejercicio, type Familia } from '@/data/catalog';
import { capitalizar, textoDeZonas, textoVisible } from '@/lib/presentacion';
import { Entrada } from '@/ui/fx/Entrada';
import { Odometro } from '@/ui/fx/Odometro';

const ESCALONADO_MS = 40;
const ESTILO_NUMERO = { ...tipo.numero, fontSize: 28, lineHeight: 30, color: paleta.magnesia };

type Parte = number | string;

interface Celda {
  etiqueta: string;
  /** Valor numerico: partes (los enteros ruedan) y unidad, separados solo en la vista. */
  numeros?: { partes: Parte[]; unidad?: string };
  /** Valor de texto. */
  texto?: string;
  ancha?: boolean;
  icono?: boolean;
}

function celdasDe(e: Ejercicio, fam?: Familia): Celda[] {
  const serie = e.default.seg != null ? e.default.seg : e.default.reps;
  const celdas: Celda[] = [
    { etiqueta: 'Series por defecto', numeros: { partes: [e.default.series, '×', serie ?? '—'], unidad: e.default.seg != null ? 's' : undefined } },
    { etiqueta: 'Descanso', numeros: { partes: [e.default.rest_s], unidad: 's' } },
    { etiqueta: 'Equipo', texto: capitalizar(nombreEquipo(e.equipment)) },
    { etiqueta: 'Espacio', texto: textoVisible(e.space) },
    { etiqueta: 'MET', numeros: { partes: [e.met] } },
  ];
  if (e.risk_zones.length > 0) celdas.push({ etiqueta: 'Zonas de riesgo', texto: textoDeZonas(e.risk_zones), ancha: true, icono: true });
  if (fam) celdas.push({ etiqueta: 'Familia', texto: textoVisible(fam.name), ancha: true });
  return celdas;
}

const leer = (c: Celda) =>
  c.numeros ? `${c.numeros.partes.join(' ')}${c.numeros.unidad ? ` ${c.numeros.unidad}` : ''}` : c.texto ?? '';

/**
 * «Detalles» como una rejilla de dos columnas (ya no una tabla): etiqueta arriba y
 * valor abajo. Los numeros van en Big Shoulders 28 con su unidad aparte (solo en la
 * vista) y ruedan al activarse; los textos en Figtree 600 16. Las zonas de riesgo y la
 * familia ocupan las dos columnas; el aviso de riesgo lleva un icono `placaAmarilla`
 * (cuidado, como «Parcial»).
 */
export function RejillaDetalles({ ejercicio, familia: fam, activo }: {
  ejercicio: Ejercicio; familia?: Familia; activo: boolean;
}) {
  const celdas = celdasDe(ejercicio, fam);
  return (
    <View style={s.rejilla}>
      {celdas.map((c, i) => (
        <Entrada
          key={c.etiqueta} activo={activo} retraso={i * ESCALONADO_MS} y={8}
          estilo={c.ancha ? s.ancha : s.mitad}
        >
          <View style={s.celda} accessible accessibilityLabel={`${c.etiqueta}, ${leer(c)}`}>
            <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={s.contenido}>
              <Text style={s.etiqueta}>{c.etiqueta}</Text>
              {c.numeros ? (
                <Numeros partes={c.numeros.partes} unidad={c.numeros.unidad} activo={activo} />
              ) : (
                <View style={s.fila}>
                  {c.icono && <Ionicons name="warning-outline" size={18} color={paleta.placaAmarilla} />}
                  <Text style={s.valor}>{c.texto}</Text>
                </View>
              )}
            </View>
          </View>
        </Entrada>
      ))}
    </View>
  );
}

function Numeros({ partes, unidad, activo }: { partes: Parte[]; unidad?: string; activo: boolean }) {
  return (
    <View style={s.numeros}>
      {partes.map((p, i) => (
        typeof p === 'number' && Number.isInteger(p)
          ? <Odometro key={i} valor={p} activo={activo} retraso={i * 80} estilo={ESTILO_NUMERO} />
          : <Text key={i} style={[ESTILO_NUMERO, i > 0 && s.separador]}>{String(p)}</Text>
      ))}
      {unidad ? <Text style={s.unidad}>{unidad}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mitad: { width: '48.8%', flexGrow: 1 },
  ancha: { width: '100%' },
  celda: { borderRadius: 16, padding: 14, backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde },
  contenido: { gap: 4 },
  etiqueta: { fontFamily: familia.medio, fontSize: 13, lineHeight: 18, color: paleta.magnesia2 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valor: { flex: 1, fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia },
  numeros: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  separador: { marginHorizontal: 2 },
  unidad: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 18, color: paleta.magnesia2 },
});
