import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LogoG } from '@/ui/components/BotonGoogle';
import { FilaAjuste } from './FilaAjuste';

/**
 * La cuenta: con Google, el logo «G» oficial de 20 px, «Google» en Figtree 14 `magnesia2` y el correo en Figtree
 * 600 de 16 (una linea, con puntos suspensivos en medio si no cabe); sin cuenta, un icono de persona. No es tocable.
 */
export function FilaCuenta({ google, correo }: { google: boolean; correo: string }) {
  const titulo = google ? 'Google' : 'Sin cuenta';
  return (
    <FilaAjuste
      izquierda={google ? <View style={s.logo}><LogoG /></View> : undefined}
      icono={google ? undefined : 'person-outline'}
      titulo={titulo} valor={correo} valorApilado etiqueta={`${titulo}, ${correo}`}
    />
  );
}

const s = StyleSheet.create({
  logo: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
});
