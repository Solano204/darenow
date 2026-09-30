import React, { useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View, findNodeHandle } from 'react-native';
import { paleta, tipo, haptico } from '@/ui/theme';
import { HojaInferior } from '@/ui/components/HojaInferior';

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
  // El ultimo contenido que se vio abierto: mientras la hoja sale se sigue mostrando ese.
  const [ultimo, setUltimo] = useState<Contenido>(contenido);
  if (visible && (ultimo.titulo !== contenido.titulo || ultimo.texto !== contenido.texto
    || ultimo.acciones !== contenido.acciones || ultimo.textoCancelar !== contenido.textoCancelar)) {
    setUltimo(contenido);
  }
  const { titulo, texto, acciones, textoCancelar = 'Cancelar' } = visible ? contenido : ultimo;
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
    <HojaInferior visible={visible} onRequestClose={onCerrar} onShow={enfocarCancelar} titulo={titulo} texto={texto}>
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
    </HojaInferior>
  );
}

const s = StyleSheet.create({
  boton: { minHeight: 56, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, borderRadius: 16 },
  peligro: { backgroundColor: paleta.placaRoja },
  neutro: { backgroundColor: paleta.goma, borderWidth: 1, borderColor: paleta.gomaBorde },
  cancelar: { marginTop: 4, backgroundColor: 'transparent' },
  presionado: { opacity: 0.8 },
  botonTexto: { ...tipo.cuerpoEnfasis },
  textoPeligro: { color: paleta.blanco },
  textoNeutro: { color: paleta.magnesia },
});
