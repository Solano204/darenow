import React, { useRef } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, Text, View, findNodeHandle } from 'react-native';
import { paleta, conAlfa, familia, tipo, MARGEN_PANTALLA, haptico } from '../../theme';

/** Tiempo que la hoja tarda en irse antes de ejecutar una accion que abre otra cosa (compartir, un selector). */
const ESPERA_CIERRE_MS = 280;

export interface AccionHoja {
  texto: string;
  onPress: () => void;
  /** `peligro`: boton solido `placaRoja` con texto blanco. Sin tipo: boton neutro. */
  tipo?: 'peligro';
}

interface Contenido {
  titulo: string;
  texto: string;
  acciones: readonly AccionHoja[];
  textoCancelar?: string;
}

/**
 * La confirmacion de una accion que no se puede deshacer, como hoja inferior (la misma de «Descartar cambios»:
 * `gomaAlta`, esquinas superiores de 28) en lugar de la alerta del sistema. Las acciones van arriba (la destructiva en
 * `placaRoja` solido con texto blanco) y «Cancelar» abajo, que es donde arranca el foco del lector de pantalla. Cerrarla
 * con el boton atras de Android es cancelar. Mientras se desliza hacia afuera conserva el ultimo contenido.
 */
export function HojaConfirmacion({ visible, onCerrar, ...contenido }: Contenido & {
  visible: boolean;
  onCerrar: () => void;
}) {
  const ultimo = useRef<Contenido>(contenido);
  if (visible) ultimo.current = contenido;
  const { titulo, texto, acciones, textoCancelar = 'Cancelar' } = ultimo.current;
  const cancelar = useRef<View>(null);

  const enfocarCancelar = () => {
    const nodo = findNodeHandle(cancelar.current);
    if (nodo !== null) AccessibilityInfo.setAccessibilityFocus(nodo);
  };
  const elegir = (accion: AccionHoja) => {
    haptico.toque();
    onCerrar();
    setTimeout(accion.onPress, ESPERA_CIERRE_MS);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar} onShow={enfocarCancelar}>
      <View style={[s.velo, { backgroundColor: conAlfa(paleta.goma, 0.6) }]}>
        <View style={s.hoja}>
          <Text style={s.titulo} accessibilityRole="header">{titulo}</Text>
          <Text style={s.texto}>{texto}</Text>
          {acciones.map(accion => {
            const peligro = accion.tipo === 'peligro';
            return (
              <Pressable
                key={accion.texto} onPress={() => elegir(accion)}
                accessibilityRole="button" accessibilityLabel={accion.texto}
                style={({ pressed }) => [s.boton, peligro ? s.peligro : s.neutro, pressed && s.presionado]}
              >
                <Text style={[s.botonTexto, peligro ? s.textoPeligro : s.textoNeutro]}>{accion.texto}</Text>
              </Pressable>
            );
          })}
          <Pressable
            ref={cancelar} onPress={() => { haptico.toque(); onCerrar(); }}
            accessibilityRole="button" accessibilityLabel={textoCancelar}
            style={({ pressed }) => [s.boton, s.cancelar, pressed && s.presionado]}
          >
            <Text style={[s.botonTexto, s.textoNeutro]}>{textoCancelar}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  velo: { flex: 1, justifyContent: 'flex-end' },
  hoja: {
    backgroundColor: paleta.gomaAlta, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderBottomWidth: 0, borderColor: paleta.gomaBorde,
    padding: MARGEN_PANTALLA, gap: 10,
  },
  titulo: { fontFamily: familia.titulo, fontSize: 22, lineHeight: 26, color: paleta.magnesia },
  texto: { ...tipo.cuerpo, color: paleta.magnesia2, marginBottom: 8 },
  boton: { minHeight: 56, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, borderRadius: 16 },
  peligro: { backgroundColor: paleta.placaRoja },
  neutro: { backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde },
  cancelar: { marginTop: 4, backgroundColor: 'transparent' },
  presionado: { opacity: 0.8 },
  botonTexto: { ...tipo.cuerpoEnfasis },
  textoPeligro: { color: paleta.blanco },
  textoNeutro: { color: paleta.magnesia },
});
