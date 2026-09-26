import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { paleta, tinte, tipo } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTick } from '../../hooks/useTick';
import { Presionable } from '../ui/Presionable';
import { FotoOscura } from '../ui/FotoOscura';
import { CarruselProfundidad, type Progreso } from './CarruselProfundidad';
import { EstrellaFavorito } from './EstrellaFavorito';

export interface ProgramaPila { id: string; nombre: string; semanas: number; favorito: boolean }

const ANCHO = 200;
const ALTO = 250;
const SOLAPE = -40;
const ESCALA_FOTO = 1.2;
const PX_POR_PASO = 30;
const ID_VER_MAS = '__ver_mas__';

type Elemento = ProgramaPila | { id: typeof ID_VER_MAS };

/**
 * «Programas» como una pila de placas: las tarjetas se solapan 40 px, la primera
 * encima, y al deslizar cada una toma el frente con la profundidad del carrusel.
 * La ultima carta lleva a la lista completa, igual que antes.
 */
export function PilaProgramas({ items, onPress, onFavorito, onVerMas, textoVerMas }: {
  items: ProgramaPila[];
  onPress: (id: string) => void;
  onFavorito: (id: string) => void;
  onVerMas: () => void;
  textoVerMas: string;
}) {
  const datos: Elemento[] = [...items, { id: ID_VER_MAS }];
  return (
    <CarruselProfundidad
      data={datos}
      keyExtractor={e => e.id}
      ancho={ANCHO} alto={ALTO} separacion={SOLAPE} apilado
      renderItem={(e, _, progreso) => 'nombre' in e
        ? <Carta p={e} progreso={progreso} onPress={() => onPress(e.id)} onFavorito={() => onFavorito(e.id)} />
        : <CartaVerMas texto={textoVerMas} onPress={onVerMas} />}
    />
  );
}

function Carta({ p, progreso, onPress, onFavorito }: {
  p: ProgramaPila; progreso: Progreso; onPress: () => void; onFavorito: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const foto = useAnimatedStyle(() => {
    if (reducido) return { transform: [{ scale: 1 }] };
    const tope = (ANCHO * (ESCALA_FOTO - 1)) / 2;
    return {
      transform: [
        { scale: ESCALA_FOTO },
        { translateX: interpolate(progreso.value * PX_POR_PASO, [-tope, tope], [-tope, tope], Extrapolation.CLAMP) },
      ],
    };
  }, [reducido, tick]);

  return (
    <View style={s.carta}>
      <Presionable onPress={onPress} etiqueta={`${p.nombre}, ${p.semanas} semanas`}>
        <FotoOscura tipo="programa" id={p.id} ancho={ANCHO} alto={ALTO} radioEsquina={24} estiloImagen={foto} />
        <View style={s.insignia}><Text style={s.insigniaTexto}>{p.semanas} sem</Text></View>
        <Text style={s.nombre} numberOfLines={2}>{p.nombre}</Text>
      </Presionable>
      <View style={s.estrella}><EstrellaFavorito activo={p.favorito} onPress={onFavorito} nombre={p.nombre} /></View>
    </View>
  );
}

function CartaVerMas({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <View style={s.carta}>
      <Presionable onPress={onPress} etiqueta={texto}>
        <View style={s.verMas}>
          <View style={s.flecha}><Ionicons name="arrow-forward" size={22} color={paleta.magnesia} /></View>
          <Text style={s.verMasTexto}>{texto}</Text>
        </View>
      </Presionable>
    </View>
  );
}

const s = StyleSheet.create({
  carta: { width: ANCHO, height: ALTO },
  insignia: {
    position: 'absolute', top: 8, left: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
    backgroundColor: tinte.notaEntrenador, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  insigniaTexto: { ...tipo.dato, color: paleta.magnesia },
  estrella: { position: 'absolute', top: 4, right: 4 },
  nombre: { position: 'absolute', left: 14, right: 14, bottom: 14, ...tipo.h3, color: paleta.magnesia },
  verMas: {
    width: ANCHO, height: ALTO, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: paleta.gomaAlta, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  flecha: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: paleta.magnesia3,
  },
  verMasTexto: { ...tipo.h3, color: paleta.magnesia },
});
