/**
 * FORJA · historial
 *
 * Las sesiones, su orden (la mas reciente primero) y los datos de cada una son los de siempre (ver
 * `docs/FUNCIONALIDAD.md`, seccion 22). Cambia como se ven: agrupadas por mes bajo un encabezado pegajoso, cada
 * una como una fila sobre un riel con una huella en su nodo, la fecha legible y el estado y el motivo de salida en
 * palabras.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import { useEstado } from '@/store/store';
import { agruparPorMes } from '@/utils/perfil';
import { PantallaColapsable } from '@/ui/components/PantallaColapsable';
import { RANGO_SCROLL, RECORRIDO_PX } from '@/ui/fx/HeaderColapsable';
import { EncabezadoPegado } from '@/ui/components/EncabezadoPegado';
import { EncabezadoMes } from '@/components/profile/EncabezadoMes';
import { MesHistorial } from '@/components/profile/FilaHistorialCompleta';

/** Las primeras filas ya entraron escalonadas en esta sesion de la app: las siguientes veces aparecen puestas. */
let historialAnimado = false;

export default function Historial({ navigation }: any) {
  const { estado } = useEstado();
  const sesiones = useMemo(() => [...estado.sesiones].reverse(), [estado.sesiones]);
  const meses = useMemo(() => agruparPorMes(sesiones), [sesiones]);
  const animar = useRef(!historialAnimado).current;
  useEffect(() => { historialAnimado = true; }, []);

  // Donde empieza cada mes en el contenido: se mide una vez pintado y se junta en una sola pasada.
  const medidas = useRef<Record<string, number>>({});
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [posiciones, setPosiciones] = useState<Record<string, number>>({});
  useEffect(() => () => clearTimeout(espera.current), []);
  const medir = (clave: string, arriba: number) => {
    medidas.current[clave] = arriba;
    clearTimeout(espera.current);
    espera.current = setTimeout(() => setPosiciones({ ...medidas.current }), 0);
  };
  const arribaDeMeses = useMemo(
    () => meses.map(m => posiciones[m.clave] ?? Number.POSITIVE_INFINITY), [meses, posiciones],
  );

  let previas = 0;
  return (
    <PantallaColapsable
      titulo="Historial" onAtras={() => navigation.goBack()}
      contenido={({ y, relleno }) => (
        <>
          {sesiones.length === 0 && <Text style={s.vacio}>Aún no hay sesiones registradas.</Text>}
          {meses.map(mes => {
            const indiceInicial = previas;
            previas += mes.items.length;
            return (
              <MesHistorial
                key={mes.clave} mes={mes} y={y} indiceInicial={indiceInicial} animar={animar}
                onMedir={arriba => medir(mes.clave, arriba - relleno)}
                onEjercicio={id => navigation.navigate('Ejercicio', { id })}
              />
            );
          })}
        </>
      )}
      superposicion={({ y, altoCabecera }) => (
        <EncabezadoPegado
          arriba={arribaDeMeses} scrollY={y} top={altoCabecera} rango={RANGO_SCROLL} recorrido={RECORRIDO_PX}
          contenido={i => <EncabezadoMes nombre={meses[i].nombre} />}
        />
      )}
    />
  );
}

const s = StyleSheet.create({
  vacio: { marginHorizontal: MARGEN_PANTALLA, fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 22, color: paleta.magnesia2 },
});
