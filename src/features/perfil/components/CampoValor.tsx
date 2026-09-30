import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import { paleta, familia, easing, haptico } from '@/ui/theme';
import { useReducedMotion } from '@/ui/hooks/useReducedMotion';
import { useTick } from '@/ui/hooks/useTick';
import { PalomitaTrazo } from '@/ui/fx/PalomitaTrazo';

const ALTO = 56;
const SACUDIDA_PX = 6;
const SACUDIDA_MS = 60;
const SUBE_PX = 8;
const ESTAMPA_MS = 500;
const PALOMITA_MS = 1600;

/**
 * El campo «Valor» de un protocolo de medicion: 56 de alto, sobre `goma`, radio 16 y borde de 1 px `gomaBorde`
 * (azul de 2 px al enfocar), con el numero en Big Shoulders 700 de 24, teclado numerico y, si se conoce, la
 * unidad como sufijo dentro del campo (Figtree 15 `magnesia3`). Su etiqueta para el lector de pantalla incluye
 * la unidad.
 *
 * Al guardar con exito (`exito` sube) el valor se estampa: sube 8 px y se desvanece, aparece junto al campo una
 * palomita que se dibuja y suena la haptica de exito. Si el valor no es valido (`error` sube) el campo se
 * sacude, aparece «Escribe un número.» en `placaRoja` y suena la haptica de aviso. Con movimiento reducido no
 * hay sacudida ni subida: la palomita aparece ya dibujada y el valor solo se desvanece.
 */
export function CampoValor({ valor, onCambio, unidad, exito, error, onEnfocar }: {
  valor: string;
  onCambio: (texto: string) => void;
  unidad?: string;
  /** Sube cada vez que el valor se guarda. */
  exito: number;
  /** Sube cada vez que el valor no es valido. */
  error: number;
  onEnfocar?: () => void;
}) {
  const reducido = useReducedMotion();
  const tick = useTick();
  const [enfocado, setEnfocado] = useState(false);
  const [conError, setConError] = useState(false);
  const [conMarca, setConMarca] = useState(false);
  const ultimo = useRef(valor);
  const [fantasma, setFantasma] = useState('');
  const sacudida = useSharedValue(0);
  const estampa = useSharedValue(1);
  const exitoPrevio = useRef(exito);
  const errorPrevio = useRef(error);

  // El ultimo valor no vacio (el que «sube» al guardar). Antes del efecto de `exito`, que lo lee.
  useEffect(() => { if (valor !== '') ultimo.current = valor; }, [valor]);

  const alCambiarError = useEffectEvent(() => {
    if (error === errorPrevio.current) return;
    errorPrevio.current = error;
    setConError(true);
    haptico.aviso();
    if (reducido) return;
    sacudida.set(withSequence(
      withTiming(-SACUDIDA_PX, { duration: SACUDIDA_MS }), withTiming(SACUDIDA_PX, { duration: SACUDIDA_MS }),
      withTiming(-SACUDIDA_PX / 2, { duration: SACUDIDA_MS }), withTiming(0, { duration: SACUDIDA_MS }),
    ));
  });
  useEffect(() => alCambiarError(), [error]);

  const alCambiarExito = useEffectEvent(() => {
    if (exito === exitoPrevio.current) return;
    exitoPrevio.current = exito;
    setConError(false);
    setFantasma(ultimo.current);
    setConMarca(true);
    haptico.exito();
    estampa.set(0);
    estampa.set(withTiming(1, { duration: reducido ? 150 : ESTAMPA_MS, easing: easing.salida }));
    const id = setTimeout(() => setConMarca(false), PALOMITA_MS);
    return () => { clearTimeout(id); cancelAnimation(estampa); };
  });
  useEffect(() => alCambiarExito(), [exito]);

  const campo = useAnimatedStyle(() => ({ transform: [{ translateX: sacudida.value }] }), [tick]);
  const valorSube = useAnimatedStyle(() => ({
    opacity: 1 - estampa.value, transform: [{ translateY: reducido ? 0 : -SUBE_PX * estampa.value }],
  }), [reducido, tick]);

  return (
    <View style={s.raiz}>
      <View style={s.fila}>
        <Animated.View style={[s.campo, enfocado && s.enfocado, conError && s.conError, campo]}>
          <TextInput
            value={valor}
            onChangeText={t => { setConError(false); onCambio(t); }}
            onFocus={() => { setEnfocado(true); onEnfocar?.(); }}
            onBlur={() => setEnfocado(false)}
            placeholder="Valor" placeholderTextColor={paleta.magnesia3Texto}
            keyboardType="decimal-pad" keyboardAppearance="dark"
            cursorColor={paleta.placaAzul} selectionColor={paleta.placaAzul}
            style={s.entrada} maxFontSizeMultiplier={1.3}
            accessibilityLabel={unidad ? `Valor, ${unidad}` : 'Valor'}
          />
          {unidad ? <Text style={s.unidad} maxFontSizeMultiplier={1.3} importantForAccessibility="no-hide-descendants">{unidad}</Text> : null}
          {conMarca ? (
            <Animated.Text style={[s.fantasma, valorSube]} pointerEvents="none" importantForAccessibility="no-hide-descendants">
              {fantasma}
            </Animated.Text>
          ) : null}
        </Animated.View>
        {conMarca ? (
          <View style={s.marca} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <PalomitaTrazo visible tamano={24} color={paleta.placaVerde} />
          </View>
        ) : null}
      </View>
      {conError ? <Text style={s.error} accessibilityLiveRegion="polite">Escribe un número.</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  campo: {
    flex: 1, height: ALTO, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde,
  },
  enfocado: { borderWidth: 2, borderColor: paleta.placaAzul },
  conError: { borderColor: paleta.placaRoja },
  entrada: { flex: 1, height: ALTO, fontFamily: familia.titulo, fontSize: 24, color: paleta.magnesia, padding: 0 },
  unidad: { fontFamily: familia.cuerpo, fontSize: 15, lineHeight: 20, color: paleta.magnesia3Texto, marginLeft: 8 },
  fantasma: { position: 'absolute', left: 16, fontFamily: familia.titulo, fontSize: 24, color: paleta.magnesia },
  marca: { width: 24, height: 24 },
  error: { fontFamily: familia.cuerpo, fontSize: 13, lineHeight: 18, color: paleta.placaRojaTexto, marginTop: 6 },
});
