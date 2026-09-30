/**
 * Fotos para Skia (heroes con el tratamiento de color) con una cache pequena (R5).
 *
 * `useImage` de Skia decodifica cada vez que se monta un hero y no comparte la cache de
 * `expo-image`. Aqui cada foto se decodifica una vez y se guarda entre las ultimas
 * `MAX_EN_CACHE` usadas (una foto de 800 px ocupa ~1,4 MB decodificada: la cache queda acotada
 * aunque se abran 20 fichas). `precargarSkia` la decodifica antes de tiempo: al presionar una
 * tarjeta, el hero de la pantalla de destino ya esta listo cuando la pantalla monta.
 */
import { useEffect, useState } from 'react';
import { Image as ImagenRN } from 'react-native';
import { Skia, type SkImage } from '@shopify/react-native-skia';

const MAX_EN_CACHE = 4;
const cache = new Map<number, SkImage>();
const enCamino = new Map<number, Promise<SkImage | null>>();

function recordar(fuente: number, imagen: SkImage) {
  cache.delete(fuente);
  cache.set(fuente, imagen);
  while (cache.size > MAX_EN_CACHE) cache.delete(cache.keys().next().value as number);
}

function cargar(fuente: number): Promise<SkImage | null> {
  const lista = cache.get(fuente);
  if (lista) { recordar(fuente, lista); return Promise.resolve(lista); }
  const pendiente = enCamino.get(fuente);
  if (pendiente) return pendiente;
  const uri = ImagenRN.resolveAssetSource(fuente)?.uri;
  if (!uri) return Promise.resolve(null);
  const promesa = Promise.resolve(Skia.Data.fromURI(uri))
    .then(datos => {
      const imagen = Skia.Image.MakeImageFromEncoded(datos);
      if (imagen) recordar(fuente, imagen);
      return imagen ?? null;
    })
    .catch(() => null)
    .finally(() => { enCamino.delete(fuente); });
  enCamino.set(fuente, promesa);
  return promesa;
}

/** Decodifica la foto a la cache sin pintarla (al presionar la tarjeta que abre su hero). */
export function precargarSkia(fuente: number | null | undefined): void {
  if (fuente != null) cargar(fuente);
}

/** Como `useImage` de Skia, pero con la cache: si la foto ya se decodifico, sale en el primer cuadro. */
export function useImagenSkia(fuente: number): SkImage | null {
  const [cargada, setCargada] = useState<{ fuente: number; imagen: SkImage | null } | null>(null);
  useEffect(() => {
    let vivo = true;
    cargar(fuente).then(imagen => { if (vivo) setCargada({ fuente, imagen }); });
    return () => { vivo = false; };
  }, [fuente]);
  if (cargada?.fuente === fuente) return cargada.imagen;
  return cache.get(fuente) ?? null;
}
