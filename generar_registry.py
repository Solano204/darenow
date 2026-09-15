#!/usr/bin/env python3
"""
FORJA · generador de los registros de src/media/

Escanea assets/img/, assets/video/ y assets/snd/ y reescribe los bloques de require().
Resuelve el paso manual de "descomenta cada linea": corres esto y todo lo
que exista queda registrado.

Uso, desde la carpeta app/:

    python3 generar_registry.py            # escribe los tres registros
    python3 generar_registry.py --dry      # solo imprime lo que haria

Imagenes: .jpg, .jpeg, .webp, .png     -> assets/img/<carpeta>/<id>.<ext>
Clips:    .mp4, .m4v, .mov             -> assets/video/ejercicios/<id>.mp4
Sonidos:  .mp3, .m4a, .wav             -> assets/snd/<nombre>.mp3

Dos archivos por ejercicio: la imagen y el clip. No hay carpeta de thumbs, el
poster del video es la misma imagen. Al terminar, el script avisa de los
ejercicios a los que les falta alguno de los dos.

Si hay dos extensiones para el mismo id, gana el orden de esas listas.
"""

import os
import re
import sys

CARPETAS = [
    ("IMG_EJERCICIOS", "ejercicios"),
    ("IMG_MUSCULOS",   "musculos"),
    ("IMG_RUTINAS",    "rutinas"),
    ("IMG_PROGRAMAS",  "programas"),
    ("IMG_TIPS",       "tips"),
    ("IMG_MITOS",      "mitos"),
    ("IMG_MOTIVACION", "motivacion"),
    ("IMG_FONDOS",     "fondos"),
]

EXTS = [".jpg", ".jpeg", ".webp", ".png"]

# Video. Cada entrada: (constante, subcarpeta de assets/video/, extensiones)
CARPETAS_VIDEO = [
    ("VIDEO_EJERCICIOS", "ejercicios", [".mp4", ".m4v", ".mov"]),
]

CABECERA_VIDEO = """/**
 * FORJA · registro de clips
 *
 * ARCHIVO GENERADO por generar_registry.py. No lo edites a mano: copia tus
 * clips a assets/video/ejercicios/<id>.mp4 y vuelve a correr el script.
 *
 * Formato de cada clip: H.264, 480p, 30 fps, SIN audio, 6-10 s pensados para
 * verse en bucle, ~400 KB.
 *
 * No hay registro de thumbs: el poster que tapa el video mientras decodifica
 * es la misma imagen del ejercicio, que ya vive en registry.ts.
 */

type Registro = Record<string, number>;
"""

PIE_VIDEO = """
export type FuenteClip = number | { uri: string } | null;

/* ------------------------------------------------------------------ */
/* CDN opcional para packs descargados                                 */
/* ------------------------------------------------------------------ */

let baseRemota: string | null = null;

/**
 * Activa la resolucion remota de clips. Pasa la url base del manifiesto
 * (campo `cdn` de 50_packs_manifest.json) o null para desactivarla.
 *
 * Mientras no se llame, la app es 100% local y funciona sin internet.
 */
export function usarCDN(url: string | null): void {
  baseRemota = url ? url.replace(/\\/*$/, '/') : null;
}

/** Clip del ejercicio: local si esta en el bundle, remoto si hay CDN, si no null. */
export function clipFuente(id: string): FuenteClip {
  const local = VIDEO_EJERCICIOS[id];
  if (local != null) return local;
  if (baseRemota) return { uri: `${baseRemota}${id}.mp4` };
  return null;
}

/** Ruta que la app muestra en el hueco vacio, para saber que archivo falta. */
export function rutaClipEsperada(id: string): string {
  return `video/ejercicios/${id}.mp4`;
}

export function cuantosClips(): { clips: number; cdn: boolean } {
  return {
    clips: Object.keys(VIDEO_EJERCICIOS).length,
    cdn: baseRemota != null,
  };
}
"""

CABECERA = """/**
 * FORJA · registro de imagenes
 *
 * ARCHIVO GENERADO por generar_registry.py. No lo edites a mano: copia tus
 * imagenes a assets/img/<carpeta>/<id>.jpg y vuelve a correr el script.
 *
 * React Native no permite require() con ruta variable, por eso cada archivo
 * se declara aqui una vez. Lo que no este registrado se dibuja con un
 * marcador generado del id, asi que la app funciona con cero imagenes.
 *
 * La imagen del ejercicio hace doble funcion: miniatura en las listas y
 * poster del video mientras decodifica el primer fotograma. Por eso no hay
 * carpeta de thumbs.
 */

type Registro = Record<string, number>;
"""

PIE = """
export type TipoFoto = 'ejercicio' | 'musculo' | 'rutina' | 'programa' | 'tip' | 'mito' | 'fondo' | 'motivacion';

const MAPAS: Record<TipoFoto, Registro> = {
  ejercicio: IMG_EJERCICIOS,
  musculo: IMG_MUSCULOS,
  rutina: IMG_RUTINAS,
  programa: IMG_PROGRAMAS,
  tip: IMG_TIPS,
  mito: IMG_MITOS,
  fondo: IMG_FONDOS,
  motivacion: IMG_MOTIVACION,
};

const CARPETA: Record<TipoFoto, string> = {
  ejercicio: 'ejercicios', musculo: 'musculos', rutina: 'rutinas',
  programa: 'programas', tip: 'tips', mito: 'mitos', fondo: 'fondos',
  motivacion: 'motivacion',
};

/** Fuente de una imagen, o null si el archivo todavia no esta. */
export function fuente(tipo: TipoFoto, id: string): number | null {
  return MAPAS[tipo][id] ?? null;
}

/** Ruta que la app muestra en el hueco vacio, para saber que archivo falta. */
export function rutaEsperada(tipo: TipoFoto, id: string): string {
  return `img/${CARPETA[tipo]}/${id}.jpg`;
}

export function cuantasHay(): { puestas: number; tipos: number } {
  const puestas = Object.values(MAPAS).reduce((n, m) => n + Object.keys(m).length, 0);
  return { puestas, tipos: Object.keys(MAPAS).length };
}
"""


def escanear(raiz, carpeta, exts=EXTS):
    ruta = os.path.join("assets", raiz, carpeta) if raiz else os.path.join("assets", carpeta)
    if not os.path.isdir(ruta):
        return []
    vistos = {}
    for archivo in os.listdir(ruta):
        base, ext = os.path.splitext(archivo)
        ext = ext.lower()
        if ext not in exts:
            continue
        if base in vistos and exts.index(ext) >= exts.index(vistos[base]):
            continue
        vistos[base] = ext
    return sorted(vistos.items())


def generar_imagenes(seco):
    partes = [CABECERA]
    total = 0
    for constante, carpeta in CARPETAS:
        encontrados = escanear("img", carpeta)
        total += len(encontrados)
        partes.append(f"\n/* {carpeta} · {len(encontrados)} */")
        partes.append(f"export const {constante}: Registro = {{")
        for base, ext in encontrados:
            partes.append(f"  '{base}': require('../../assets/img/{carpeta}/{base}{ext}'),")
        partes.append("};")
        print(f"  img/{carpeta:12} {len(encontrados):4}")

    salida = "\n".join(partes) + "\n" + PIE
    destino = os.path.join("src", "media", "registry.ts")
    if not seco:
        with open(destino, "w", encoding="utf-8") as fh:
            fh.write(salida)
    return destino, total


def generar_videos(seco):
    partes = [CABECERA_VIDEO]
    total = 0
    for constante, carpeta, exts in CARPETAS_VIDEO:
        encontrados = escanear("video", carpeta, exts)
        total += len(encontrados)
        partes.append(f"\n/* {carpeta} · {len(encontrados)} */")
        partes.append(f"export const {constante}: Registro = {{")
        for base, ext in encontrados:
            partes.append(f"  '{base}': require('../../assets/video/{carpeta}/{base}{ext}'),")
        partes.append("};")
        print(f"  video/{carpeta:10} {len(encontrados):4}")

    salida = "\n".join(partes) + "\n" + PIE_VIDEO
    destino = os.path.join("src", "media", "videos.ts")
    if not seco:
        with open(destino, "w", encoding="utf-8") as fh:
            fh.write(salida)
    return destino, total


def revisar_faltantes():
    """Ejercicios sin imagen o sin clip. Lee los ids del catalogo real."""
    import json
    faltan = []
    imgs = os.path.join("assets", "img", "ejercicios")
    vids = os.path.join("assets", "video", "ejercicios")
    hay_img = {os.path.splitext(f)[0] for f in os.listdir(imgs)} if os.path.isdir(imgs) else set()
    hay_vid = {os.path.splitext(f)[0] for f in os.listdir(vids)} if os.path.isdir(vids) else set()
    datos = os.path.join("assets", "data")
    if not os.path.isdir(datos):
        return []
    for archivo in sorted(os.listdir(datos)):
        if not archivo[:2].isdigit() or "exercises" not in archivo:
            continue
        with open(os.path.join(datos, archivo), encoding="utf-8") as fh:
            for e in json.load(fh)["items"]:
                falta = []
                if e["id"] not in hay_img: falta.append("imagen")
                if e["id"] not in hay_vid: falta.append("clip")
                if falta:
                    faltan.append((e["id"], " y ".join(falta)))
    return faltan


SONIDOS_ESPERADOS = [
    "cuenta_3", "cuenta_2", "cuenta_1", "inicio_serie", "fin_serie",
    "cambio_lado", "fin_descanso", "fin_sesion", "toque",
]

EXTS_SND = [".mp3", ".m4a", ".wav"]


def generar_sonidos(seco):
    """Reescribe el bloque de requires de src/media/sonido.ts.

    Solo toca ese bloque: el resto del archivo (los players, el interruptor,
    reproducir()) es codigo estable y se conserva tal cual.
    """
    destino = os.path.join("src", "media", "sonido.ts")
    if not os.path.isfile(destino):
        print("  snd          (falta src/media/sonido.ts, se omite)")
        return destino, 0

    encontrados = escanear("", "snd", EXTS_SND)
    hallados = dict(encontrados)

    lineas = [f"/* snd · {len(encontrados)} */",
              "const SONIDOS: Partial<Record<Sonido, number>> = {"]
    for nombre in SONIDOS_ESPERADOS:
        if nombre in hallados:
            lineas.append(f"  '{nombre}': require('../../assets/snd/{nombre}{hallados[nombre]}'),")
        else:
            lineas.append(f"  // '{nombre}': falta assets/snd/{nombre}.mp3")
    lineas.append("};")

    sobra = [n for n in hallados if n not in SONIDOS_ESPERADOS]
    for n in sobra:
        print(f"  aviso: assets/snd/{n} no lo usa ninguna fase, se ignora")

    with open(destino, encoding="utf-8") as fh:
        actual = fh.read()

    patron = re.compile(r"/\* snd · \d+ \*/\nconst SONIDOS[^;]*?\n\};", re.S)
    if not patron.search(actual):
        print("  aviso: no encontre el bloque SONIDOS en sonido.ts, no lo toco")
        return destino, len(encontrados)

    nuevo = patron.sub("\n".join(lineas), actual)
    print(f"  snd                {len(encontrados):4}")
    if not seco:
        with open(destino, "w", encoding="utf-8") as fh:
            fh.write(nuevo)
    return destino, len(encontrados)


def main():
    if not os.path.isdir("assets/img"):
        sys.exit("Corre esto desde la carpeta app/ (no encuentro assets/img).")

    seco = "--dry" in sys.argv

    destino_img, total_img = generar_imagenes(seco)
    destino_vid, total_vid = generar_videos(seco)
    destino_snd, total_snd = generar_sonidos(seco)

    if seco:
        print(f"\n[dry] {total_img} imagenes, {total_vid} clips y {total_snd} "
              f"sonidos. No se escribio nada.")
        return

    print(f"\n{destino_img} escrito con {total_img} imagenes.")
    print(f"{destino_vid} escrito con {total_vid} clips.")
    print(f"{destino_snd} escrito con {total_snd} sonidos.")
    faltan = revisar_faltantes()
    if faltan:
        print(f"\nIncompletos: {len(faltan)} ejercicios. Los primeros:")
        for eid, que in faltan[:8]:
            print(f"  {eid}: falta {que}")


if __name__ == "__main__":
    main()
