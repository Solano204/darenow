import React from 'react';
import { FilaAjuste, type IconoAjuste } from './FilaAjuste';

/**
 * Una accion que borra o lleva a borrar: una fila (no un boton fantasma rojo) con el texto en Figtree 600 de 16 en
 * rojo y una papelera. Quien la usa decide que pasa al tocarla (una hoja de confirmacion, o abrir una pagina:
 * `enlaceExterno` cambia el chevron por el icono de enlace).
 */
export function FilaDestructiva({ titulo, descripcion, icono = 'trash-outline', onPress, enlaceExterno }: {
  titulo: string;
  descripcion?: string;
  icono?: IconoAjuste;
  onPress: () => void;
  enlaceExterno?: boolean;
}) {
  return (
    <FilaAjuste
      peligro icono={icono} titulo={titulo} descripcion={descripcion} onPress={onPress}
      chevron={enlaceExterno ? 'enlace' : undefined} rol={enlaceExterno ? 'link' : 'button'}
    />
  );
}
