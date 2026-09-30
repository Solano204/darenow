import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { paleta, tipo, familia, AREA_TACTIL_MIN, resorteMagnesia, haptico } from '@/theme';
import type { ItemSesion } from '@/engine/session';
import { nombreVisible } from '@/data/nombresVisibles';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTick } from '@/hooks/useTick';
import { TarjetaGoma } from '@/components/ui/TarjetaGoma';
import { FotoOscura } from '@/components/ui/FotoOscura';
import { Entrada } from '@/components/fx/Entrada';
import { Stepper } from './Stepper';

const LADO_MINIATURA = 88;
const MEDIO_GIRO_MS = 130;
const PERSPECTIVA = 700;

export interface AjusteMaquina { valor: string; onGuardar: (texto: string) => void }

/**
 * Un ejercicio del editor previo: miniatura, numero de orden, nombre, «Cambiar»
 * y tres ajustes con `Stepper` (series, tiempo o repeticiones, descanso). Los
 * limites son los de siempre. Al cambiar de ejercicio, la miniatura y el nombre
 * dan la vuelta como un tablero de salidas.
 */
export function TarjetaAjusteEjercicio({ item, indice, animar, retraso, onCambiar, onAjuste, maquina }: {
  item: ItemSesion;
  indice: number;
  animar: boolean;
  retraso: number;
  onCambiar: () => void;
  onAjuste: (cambio: Partial<ItemSesion>) => void;
  /** Solo en ejercicios con maquina. */
  maquina?: AjusteMaquina;
}) {
  return (
    <Entrada activo animar={animar} retraso={retraso} y={16} resorte={resorteMagnesia}>
      <TarjetaGoma relleno={16}>
        <Cabeza item={item} indice={indice} onCambiar={onCambiar} />

        <View style={s.filas}>
          <FilaAjuste etiqueta="Series">
            <Stepper etiqueta="Series" valor={item.seriesPlan} min={1} max={10} onCambio={v => onAjuste({ seriesPlan: v })} />
          </FilaAjuste>
          <FilaAjuste etiqueta={item.segPlan != null ? 'Tiempo' : 'Repeticiones'}>
            {item.segPlan != null ? (
              <Stepper etiqueta="Tiempo" valor={item.segPlan} min={5} max={300} paso={5} sufijo="s" onCambio={v => onAjuste({ segPlan: v })} />
            ) : (
              <Stepper etiqueta="Repeticiones" valor={item.repsPlan ?? 10} min={1} max={50} onCambio={v => onAjuste({ repsPlan: v })} />
            )}
          </FilaAjuste>
          <FilaAjuste etiqueta="Descanso">
            <Stepper etiqueta="Descanso" valor={item.descansoPlan} min={0} max={300} paso={5} sufijo="s" onCambio={v => onAjuste({ descansoPlan: v })} />
          </FilaAjuste>
        </View>

        {maquina && (
          <View style={s.maquina}>
            <Text style={s.etiquetaMaquina}>Ajuste de la máquina</Text>
            <TextInput
              defaultValue={maquina.valor}
              onEndEditing={e => maquina.onGuardar(e.nativeEvent.text.trim())}
              placeholder="Asiento 4, respaldo 2, pin 8..."
              placeholderTextColor={paleta.magnesia3Texto}
              keyboardAppearance="dark"
              style={s.entradaMaquina}
            />
          </View>
        )}
      </TarjetaGoma>
    </Entrada>
  );
}

function Cabeza({ item, indice, onCambiar }: { item: ItemSesion; indice: number; onCambiar: () => void }) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [visto, setVisto] = useState({ id: item.id, name: item.name });
  const giro = useSharedValue(0);

  const entrar = (id: string, name: string) => {
    setVisto({ id, name });
    haptico.placa();
    giro.value = -90;
    giro.value = withTiming(0, { duration: MEDIO_GIRO_MS });
  };

  useEffect(() => {
    if (item.id === visto.id) return;
    if (reducido) { setVisto({ id: item.id, name: item.name }); return; }
    giro.value = withTiming(90, { duration: MEDIO_GIRO_MS }, fin => { if (fin) runOnJS(entrar)(item.id, item.name); });
  }, [item.id]);

  const vuelta = useAnimatedStyle(() => ({
    transform: [{ perspective: PERSPECTIVA }, { rotateX: `${giro.value}deg` }],
  }), [tick]);

  const nombre = nombreVisible(visto.name);
  return (
    <View style={s.cabeza}>
      <Animated.View style={[s.giro, vuelta]}>
        <FotoOscura tipo="ejercicio" id={visto.id} ancho={LADO_MINIATURA} alto={LADO_MINIATURA} radioEsquina={16} velo={false} />
        <View style={s.textos}>
          <View style={s.titulo}>
            <Text style={s.orden}>{indice + 1}</Text>
            <Text style={s.nombre} numberOfLines={2} maxFontSizeMultiplier={1.2}>{nombre}</Text>
          </View>
        </View>
      </Animated.View>
      <Pressable
        onPress={() => { haptico.toque(); onCambiar(); }}
        accessibilityRole="button" accessibilityLabel={`Cambiar ${nombre}`}
        style={s.cambiar} hitSlop={4}
      >
        <Ionicons name="swap-horizontal" size={18} color={paleta.magnesia2} />
        <Text style={s.cambiarTexto}>Cambiar</Text>
      </Pressable>
    </View>
  );
}

function FilaAjuste({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <View style={s.fila}>
      <Text style={s.etiqueta} maxFontSizeMultiplier={1.2}>{etiqueta}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  cabeza: { position: 'relative' },
  giro: { flexDirection: 'row', gap: 12 },
  textos: { flex: 1, paddingBottom: AREA_TACTIL_MIN },
  titulo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  orden: { fontFamily: familia.titulo, fontSize: 16, lineHeight: 22, color: paleta.magnesia3Texto },
  nombre: { flex: 1, fontFamily: familia.enfasis, fontSize: 17, lineHeight: 22, color: paleta.magnesia },
  cambiar: {
    position: 'absolute', left: LADO_MINIATURA + 12, bottom: 0, minHeight: AREA_TACTIL_MIN,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  cambiarTexto: { fontFamily: familia.enfasis, fontSize: 14, lineHeight: 18, color: paleta.magnesia2 },
  filas: { marginTop: 12 },
  fila: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etiqueta: { ...tipo.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia2 },
  maquina: { marginTop: 8, gap: 6 },
  etiquetaMaquina: { ...tipo.pie, color: paleta.magnesia2 },
  entradaMaquina: {
    minHeight: 48, borderRadius: 16, paddingHorizontal: 16, fontSize: 15, color: paleta.magnesia,
    backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
});
