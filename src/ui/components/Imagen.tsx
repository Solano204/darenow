/**
 * FORJA · Imagen (R5)
 *
 * La unica puerta a `expo-image` de la app. Pone los valores de siempre para que ninguna pantalla
 * los olvide:
 * - `cachePolicy="memory-disk"`: la foto decodificada se reusa al volver a verla.
 * - `placeholder` con el blurhash del catalogo (`src/data/indice/blurhash.json`, lo escribe
 *   `npm run imagenes`) cuando la foto es del catalogo; se quita con `placeholder={null}` donde el
 *   diseno ya pinta su propio esqueleto.
 * - `transition={150}` y `contentFit="cover"`.
 * - `recyclingKey`: en una fila que se recicla (FlashList) nunca asoma la foto del elemento anterior.
 *
 * Con `tipo` e `id` resuelve la fuente del registro (`mini` pide la miniatura de lista); con
 * `source`, muestra esa (recortes, posters).
 */
import React from 'react';
import { Image as ImagenRN } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import { fuente, fuenteMini, type TipoFoto } from '@/media/registry';
import BLURHASH from '@/data/indice/blurhash.json';

const HASHES = BLURHASH as Record<string, string>;
const TRANSICION_IMAGEN_MS = 150;
/** Hasta este lado (dp) basta la miniatura de lista: 192 px a densidad 3. */
export const LADO_MINIATURA_MAX = 64;

type Base = Omit<ImageProps, 'source' | 'placeholder'> & {
  /** `null` quita el blurhash (el diseno ya tiene su esqueleto). */
  placeholder?: ImageProps['placeholder'] | null;
};

export type PropsImagen = Base & (
  | { tipo: TipoFoto; id: string; mini?: boolean; source?: undefined }
  | { source: ImageProps['source']; tipo?: undefined; id?: string; mini?: undefined }
);

/** El blurhash de una foto del catalogo, si lo hay. */
function blurhashDe(tipo: TipoFoto, id: string): string | undefined {
  return HASHES[`${tipo}/${id}`];
}

/** La fuente de una foto del catalogo, grande o miniatura. */
function fuenteImagen(tipo: TipoFoto, id: string, mini = false): number | null {
  return mini ? fuenteMini(tipo, id) : fuente(tipo, id);
}

export function Imagen(p: PropsImagen) {
  const { tipo, id, mini, source, placeholder, ...resto } = p;
  const src = tipo ? fuenteImagen(tipo, id, mini) : source;
  const hash = tipo ? blurhashDe(tipo, id) : undefined;
  return (
    <Image
      cachePolicy="memory-disk"
      transition={TRANSICION_IMAGEN_MS}
      contentFit="cover"
      recyclingKey={id}
      {...resto}
      source={src}
      placeholder={placeholder === null ? undefined : (placeholder ?? (hash ? { blurhash: hash } : undefined))}
    />
  );
}

/**
 * Precarga (decodifica a la cache) solo lo que se va a ver enseguida: el hero al presionar una
 * tarjeta, o la siguiente pantalla de filas de una lista. Nada de precargar el catalogo entero.
 */
export function precargar(fuentes: (number | null | undefined)[]): void {
  const uris = fuentes.flatMap(f => {
    if (f == null) return [];
    const uri = ImagenRN.resolveAssetSource(f)?.uri;
    return uri ? [uri] : [];
  });
  if (uris.length) Image.prefetch(uris, 'memory-disk').catch(() => {});
}
