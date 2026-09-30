/**
 * FORJA · historial
 *
 * Las sesiones, su orden (la mas reciente primero) y los datos de cada una son los de siempre (ver
 * `docs/FUNCIONALIDAD.md`, seccion 22). Cambia como se ven: agrupadas por mes bajo un encabezado pegajoso, cada
 * una como una fila sobre un riel con una huella en su nodo, la fecha legible y el estado y el motivo de salida en
 * palabras.
 *
 * R5: el historial crece sin tope (una sesion por dia de entrenamiento), asi que es una FlashList: meses y
 * sesiones son dos tipos de celda y solo se montan las que se ven.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { FlashListRef, ListRenderItemInfo } from '@shopify/flash-list';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { useSesiones, type SesionGuardada } from '@/state/store';
import { agruparPorMes } from '@/lib/perfil';
import { PantallaColapsableLista } from '@/ui/components/PantallaColapsableLista';
import { RANGO_SCROLL, RECORRIDO_PX } from '@/ui/fx/HeaderColapsable';
import { EncabezadoPegado } from '@/ui/components/EncabezadoPegado';
import { EncabezadoMes } from '@/features/perfil/components/EncabezadoMes';
import { EncabezadoMesHistorial, FilaSesion } from '@/features/perfil/components/FilaHistorialCompleta';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSharedValue } from 'react-native-reanimated';

/** Las primeras filas ya entraron escalonadas en esta sesion de la app: las siguientes veces aparecen puestas. */
let historialAnimado = false;

type Item =
  | { tipo: 'mes'; clave: string; nombre: string }
  | { tipo: 'sesion'; clave: string; sesion: SesionGuardada; ultima: boolean; indice: number };

export default function Historial({ navigation }: NativeStackScreenProps<ParamListBase, 'Historial'>) {
  const guardadas = useSesiones();
  const sesiones = useMemo(() => [...guardadas].reverse(), [guardadas]);
  const meses = useMemo(() => agruparPorMes(sesiones), [sesiones]);
  const [animar] = useState(() => !historialAnimado);
  useEffect(() => { historialAnimado = true; }, []);

  // Una fila por mes y una por sesion, en el orden de siempre. `indice` cuenta las sesiones de arriba
  // (solo las primeras llevan entrada).
  const { items, filaDeMes } = useMemo(() => {
    const salida: Item[] = [];
    const filas: number[] = [];
    let indice = 0;
    for (const mes of meses) {
      filas.push(salida.length);
      salida.push({ tipo: 'mes', clave: `mes:${mes.clave}`, nombre: mes.nombre });
      mes.items.forEach((sesion, i) => {
        salida.push({ tipo: 'sesion', clave: sesion.id, sesion, ultima: i === mes.items.length - 1, indice: indice++ });
      });
    }
    return { items: salida, filaDeMes: filas };
  }, [meses]);

  // Donde empieza cada mes en la lista, para el encabezado pegajoso: se lee de la FlashList cada vez
  // que termina de acomodar filas (los meses que aun no se ven llevan una posicion estimada, que se
  // corrige al acercarse).
  const lista = useRef<FlashListRef<Item>>(null);
  const [arribaDeMeses, setArribaDeMeses] = useState<number[]>([]);
  const alAcomodar = useCallback(() => {
    const nuevas = filaDeMes.map(i => lista.current?.getLayout(i)?.y ?? Number.POSITIVE_INFINITY);
    setArribaDeMeses(previas => (previas.length === nuevas.length && previas.every((v, k) => v === nuevas[k]) ? previas : nuevas));
  }, [filaDeMes]);

  const y = useSharedValue(0);
  const onEjercicio = useCallback((id: string) => navigation.navigate('Ejercicio', { id }), [navigation]);
  const renderItem = useCallback(({ item }: ListRenderItemInfo<Item>) => (
    item.tipo === 'mes'
      ? <EncabezadoMesHistorial nombre={item.nombre} />
      // `key` por sesion: la fila mide su alto y anima su entrada; si la celda se recicla para otra
      // sesion, se monta de nuevo y empieza limpia.
      : <FilaSesion
          key={item.clave} sesion={item.sesion} ultima={item.ultima} y={y}
          indice={item.indice} animar={animar} onEjercicio={onEjercicio}
        />
  ), [animar, onEjercicio, y]);

  return (
    <PantallaColapsableLista<Item>
      titulo="Historial" onAtras={() => navigation.goBack()}
      lista={lista} y={y}
      data={items}
      keyExtractor={claveDe}
      getItemType={tipoDe}
      renderItem={renderItem}
      onCommitLayoutEffect={alAcomodar}
      ListEmptyComponent={VACIO}
      superposicion={({ altoCabecera }) => (
        <EncabezadoPegado
          arriba={arribaDeMeses} scrollY={y} top={altoCabecera} rango={RANGO_SCROLL} recorrido={RECORRIDO_PX}
          contenido={i => <EncabezadoMes nombre={meses[i].nombre} />}
        />
      )}
    />
  );
}

const claveDe = (x: Item) => x.clave;
const tipoDe = (x: Item) => x.tipo;

const s = StyleSheet.create({
  vacio: { marginHorizontal: MARGEN_PANTALLA, fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2 },
});

const VACIO = <Text style={s.vacio}>Aún no hay sesiones registradas.</Text>;
