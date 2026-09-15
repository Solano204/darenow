/**
 * FORJA · calendario
 *
 * Rejilla mensual con los dias entrenados marcados, navegable mes a mes.
 * Debajo, el total de dias del mes y el total historico, que es el numero
 * que de verdad le importa a alguien despues de tres meses.
 *
 * El dia de hoy se marca con un anillo, no con relleno: asi no se confunde
 * con un dia entrenado.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { color, tipo, esp, radio, peso } from '../theme';
import { Toque } from './ui';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface Props {
  /** fechas YYYY-MM-DD en las que hubo sesion */
  entrenados: string[];
  /** minutos por fecha, para pintar mas fuerte los dias largos */
  minutosPor?: Record<string, number>;
}

function ymd(a: number, m: number, d: number) {
  return `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function Calendario({ entrenados, minutosPor = {} }: Props) {
  const hoyD = new Date();
  const [ver, setVer] = useState({ a: hoyD.getFullYear(), m: hoyD.getMonth() });

  const set = useMemo(() => new Set(entrenados), [entrenados]);

  const celdas = useMemo(() => {
    const primero = new Date(ver.a, ver.m, 1);
    // getDay(): 0 domingo. La semana empieza en lunes, asi que se desplaza.
    const hueco = (primero.getDay() + 6) % 7;
    const dias = new Date(ver.a, ver.m + 1, 0).getDate();
    const out: (number | null)[] = Array(hueco).fill(null);
    for (let d = 1; d <= dias; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [ver]);

  const delMes = useMemo(
    () => celdas.filter(d => d && set.has(ymd(ver.a, ver.m, d))).length,
    [celdas, set, ver],
  );

  // Se cambia de mes con un desvanecido corto. LayoutAnimation ya no hace
  // nada en la arquitectura nueva de React Native, asi que se usa Animated.
  const fade = React.useRef(new Animated.Value(1)).current;
  const mover = (n: number) => {
    Animated.timing(fade, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      const d = new Date(ver.a, ver.m + n, 1);
      setVer({ a: d.getFullYear(), m: d.getMonth() });
      Animated.timing(fade, {
        toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.quad),
      }).start();
    });
  };

  const esFuturo = ver.a > hoyD.getFullYear() ||
    (ver.a === hoyD.getFullYear() && ver.m >= hoyD.getMonth());

  return (
    <View style={s.caja}>
      <View style={s.cabecera}>
        <Toque onPress={() => mover(-1)} estilo={s.flecha as never}>
          <Text style={{ color: color.texto, fontSize: 17 }}>‹</Text>
        </Toque>
        <View style={{ alignItems: 'center' }}>
          <Text style={[tipo.h3, { color: color.texto }]}>{MESES[ver.m]}</Text>
          <Text style={[tipo.micro, { color: color.textoTenue }]}>{ver.a}</Text>
        </View>
        <Toque onPress={() => !esFuturo && mover(1)} estilo={[s.flecha, esFuturo && { opacity: 0.25 }] as never}>
          <Text style={{ color: color.texto, fontSize: 17 }}>›</Text>
        </Toque>
      </View>

      <View style={s.semana}>
        {DIAS.map((d, i) => (
          <Text key={i} style={[tipo.micro, s.celda, { color: color.textoTenue }]}>{d}</Text>
        ))}
      </View>

      <Animated.View style={[s.rejilla, { opacity: fade }]}>
        {celdas.map((d, i) => {
          if (!d) return <View key={i} style={s.celda} />;
          const f = ymd(ver.a, ver.m, d);
          const marcado = set.has(f);
          const esHoy = f === ymd(hoyD.getFullYear(), hoyD.getMonth(), hoyD.getDate());
          const min = minutosPor[f] ?? 0;
          const fuerte = min >= 25;
          return (
            <View key={i} style={s.celda}>
              <View style={[
                s.dia,
                marcado && (fuerte
                  ? { backgroundColor: color.carbon }
                  : { backgroundColor: color.acentoTinte, borderWidth: 1, borderColor: color.acentoBorde }),
                esHoy && !marcado && { borderWidth: 1.5, borderColor: color.carbon },
              ]}>
                <Text style={[tipo.pie, {
                  color: marcado ? (fuerte ? color.sobreOscuro : color.acento) : color.textoSuave,
                  fontFamily: marcado || esHoy ? peso.semibold : peso.regular,
                }]}>{d}</Text>
              </View>
            </View>
          );
        })}
      </Animated.View>

      <View style={s.pie}>
        <View style={s.total}>
          <Text style={[tipo.h2, { color: color.texto }]}>{delMes}</Text>
          <Text style={[tipo.micro, { color: color.textoSuave }]}>días este mes</Text>
        </View>
        <View style={s.separador} />
        <View style={s.total}>
          <Text style={[tipo.h2, { color: color.texto }]}>{set.size}</Text>
          <Text style={[tipo.micro, { color: color.textoSuave }]}>días en total</Text>
        </View>
      </View>

      <View style={s.leyenda}>
        <View style={[s.punto, {
          backgroundColor: color.acentoTinte, borderWidth: 1, borderColor: color.acentoBorde,
        }]} />
        <Text style={[tipo.micro, { color: color.textoTenue }]}>sesión corta</Text>
        <View style={[s.punto, { backgroundColor: color.carbon, marginLeft: esp.sm }]} />
        <Text style={[tipo.micro, { color: color.textoTenue }]}>25 min o más</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    backgroundColor: color.lienzo, borderRadius: radio.tarjeta, padding: esp.md,
    borderWidth: 1, borderColor: color.borde,
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flecha: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: color.crema,
    alignItems: 'center', justifyContent: 'center',
  },
  semana: { flexDirection: 'row', marginTop: esp.md },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
  celda: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dia: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pie: { flexDirection: 'row', alignItems: 'center', marginTop: esp.md },
  total: { flex: 1, alignItems: 'center' },
  separador: { width: 1, height: 30, backgroundColor: color.borde },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: esp.sm },
  punto: { width: 8, height: 8, borderRadius: 4 },
});
