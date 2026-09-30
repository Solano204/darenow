import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { paleta, familia, MARGEN_PANTALLA } from '@/ui/theme';
import type { Programa } from '@/data/catalog';
import { nombreVisible } from '@/data/nombresVisibles';
import { ICONOS_OBJETIVO } from '@/ui/components/iconosObjetivo';
import { TituloLetras } from '@/ui/fx/TituloMascara';
import { BarraCarga13 } from '@/ui/fx/BarraCarga13';

/** El nombre ya entro por mascara de letras en esta sesion de la app: las siguientes veces aparece puesto. */
let nombreAnimado = false;

/**
 * Lo de arriba de Yo: el nombre en Big Shoulders 800 de 44, que entra por mascara de letras la primera vez
 * que se abre la pestana en la sesion; el objetivo con su icono en Figtree 500 de 15 y, debajo, el nombre
 * del programa en Figtree 600 de 16. Si el usuario sigue un programa, el avance: una placa por semana
 * (`BarraCarga13`, la actual en azul) y «Semana N de M» con el numero en Big Shoulders 700 de 16.
 * No es tocable: hoy tampoco lo era.
 */
export function EncabezadoPerfil({ nombre, objetivoId, objetivo, programa, semanaActual }: {
  nombre: string;
  objetivoId: string;
  /** El objetivo ya con sus tildes («Ganar músculo»). */
  objetivo: string;
  programa: Programa | undefined;
  semanaActual: number;
}) {
  const animar = useRef(!nombreAnimado).current;
  useEffect(() => { nombreAnimado = true; }, []);
  const total = programa ? Math.max(1, programa.semanas) : 0;
  const actual = Math.min(Math.max(semanaActual, 1), Math.max(total, 1));

  return (
    <View style={s.raiz}>
      <TituloLetras lineas={[nombre]} estilo={s.nombre} activo animar={animar} />
      <View style={s.objetivo} accessible accessibilityLabel={`Objetivo: ${objetivo}`}>
        <Ionicons name={ICONOS_OBJETIVO[objetivoId] ?? 'flag-outline'} size={16} color={paleta.magnesia2} />
        <Text style={s.objetivoTexto} maxFontSizeMultiplier={1.3}>{objetivo}</Text>
      </View>
      <Text style={programa ? s.programa : s.sinPrograma} maxFontSizeMultiplier={1.3}>
        {programa ? nombreVisible(programa.name) : 'Sin programa'}
      </Text>
      {programa ? (
        <View style={s.avance} accessible accessibilityLabel={`Semana ${actual} de ${total}`}>
          <View style={s.barra} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <BarraCarga13 total={total} actual={actual} compacta />
          </View>
          <Text style={s.semana} importantForAccessibility="no-hide-descendants" maxFontSizeMultiplier={1.3}>
            Semana <Text style={s.semanaNumero}>{actual}</Text> de {total}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { marginHorizontal: MARGEN_PANTALLA },
  nombre: { fontFamily: familia.display, fontSize: 44, lineHeight: 46, letterSpacing: -0.5, color: paleta.magnesia },
  objetivo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  objetivoTexto: { fontFamily: familia.medio, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
  programa: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia, marginTop: 4 },
  sinPrograma: { fontFamily: familia.enfasis, fontSize: 16, lineHeight: 22, color: paleta.magnesia3Texto, marginTop: 4 },
  avance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  barra: { flexShrink: 1 },
  semana: { fontFamily: familia.cuerpo, fontSize: 14, lineHeight: 20, color: paleta.magnesia2 },
  semanaNumero: { fontFamily: familia.titulo, fontSize: 16, color: paleta.magnesia },
});
