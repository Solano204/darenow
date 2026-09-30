#!/usr/bin/env python3
"""
FORJA · generador de los registros de src/media/

Escanea assets/img/, assets/video/, assets/snd/ y assets/voz/ y reescribe
los bloques de require(). Resuelve el paso manual de "descomenta cada
linea": corres esto y todo lo que exista queda registrado.

Uso, desde la carpeta app/:

    python3 generar_registry.py            # escribe los cuatro registros
    python3 generar_registry.py --dry      # solo imprime lo que haria

Imagenes: .jpg, .jpeg, .webp, .png     -> assets/img/<carpeta>/<id>.<ext>
Clips:    .mp4, .m4v, .mov             -> assets/video/ejercicios/<id>.mp4
Sonidos:  .mp3, .m4a, .wav             -> assets/snd/<nombre>.mp3
Voz:      .mp3                         -> assets/voz/{ejercicios,fases,num}/<id>.mp3
          (generada por generar_voz.py, no a mano)

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
 * Hoy nadie la llama: se conserva como API publica para el CDN.
 *
 * @public
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

/** Fuente de una imagen, o null si el archivo todavia no esta. */
export function fuente(tipo: TipoFoto, id: string): number | null {
  return MAPAS[tipo][id] ?? null;
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
        partes.append(f"const {constante}: Registro = {{")
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
        partes.append(f"const {constante}: Registro = {{")
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

# Fases y numeros que la voz anuncia. Mismas claves que ETIQUETA/estado.fase
# en Reproductor.tsx ('pausa' nunca se habla, no va aqui).
FASES_ESPERADAS = ["preparado", "trabajo", "cambio_lado", "descanso", "fin"]
NUMEROS_ESPERADOS = ["3", "2", "1"]

EXTS_VOZ = [".mp3"]

CABECERA_VOZ = """/**
 * FORJA · registro de voz
 *
 * ARCHIVO GENERADO por generar_registry.py. No lo edites a mano: corre
 * generar_voz.py para sintetizar audio con AWS Polly (voz Andres,
 * generative, es-MX) y despues este script para volver a escribir el
 * registro.
 *
 * Si un mp3 todavia no existe, la linea queda comentada en vez de un
 * require() roto: Reproductor.tsx cae al respaldo de expo-speech para
 * ese audio.
 */

type Registro = Partial<Record<string, number>>;
"""

PIE_VOZ = """
export type TipoVoz = 'ejercicio' | 'fase' | 'numero';

const MAPAS_VOZ: Record<TipoVoz, Registro> = {
  ejercicio: VOZ_EJERCICIOS,
  fase: VOZ_FASES,
  numero: VOZ_NUM,
};

/** Fuente del audio de voz, o null si el archivo todavia no esta (respaldo: expo-speech). */
export function fuenteVoz(tipo: TipoVoz, id: string): number | null {
  return MAPAS_VOZ[tipo][id] ?? null;
}
"""


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


def ids_catalogo():
    """ids de ejercicios del catalogo real, en el orden de los archivos de datos."""
    import json
    ids = []
    datos = os.path.join("assets", "data")
    if not os.path.isdir(datos):
        return ids
    for archivo in sorted(os.listdir(datos)):
        if not archivo[:2].isdigit() or "exercises" not in archivo:
            continue
        with open(os.path.join(datos, archivo), encoding="utf-8") as fh:
            for e in json.load(fh)["items"]:
                ids.append(e["id"])
    return ids


def generar_voz(seco):
    """Escribe src/media/voz.ts a partir de lo que haya en assets/voz/.

    Ejercicios: uno por cada id del catalogo real (assets/data/1*_exercises*.json).
    Fases y numeros: listas fijas, iguales a lo que anuncia Reproductor.tsx.
    Lo que falte queda comentado, igual que hace generar_sonidos().
    """
    destino = os.path.join("src", "media", "voz.ts")

    hallados_ej = dict(escanear("voz", "ejercicios", EXTS_VOZ))
    hallados_fase = dict(escanear("voz", "fases", EXTS_VOZ))
    hallados_num = dict(escanear("voz", "num", EXTS_VOZ))
    ids_ejercicios = ids_catalogo()

    partes = [CABECERA_VOZ]

    puestos_ej = sum(1 for i in ids_ejercicios if i in hallados_ej)
    partes.append(f"\n/* ejercicios · {puestos_ej} de {len(ids_ejercicios)} */")
    partes.append("const VOZ_EJERCICIOS: Registro = {")
    for eid in ids_ejercicios:
        if eid in hallados_ej:
            partes.append(f"  '{eid}': require('../../assets/voz/ejercicios/{eid}{hallados_ej[eid]}'),")
        else:
            partes.append(f"  // '{eid}': falta assets/voz/ejercicios/{eid}.mp3")
    partes.append("};")

    puestos_fase = sum(1 for f in FASES_ESPERADAS if f in hallados_fase)
    partes.append(f"\n/* fases · {puestos_fase} de {len(FASES_ESPERADAS)} */")
    partes.append("const VOZ_FASES: Registro = {")
    for fase in FASES_ESPERADAS:
        if fase in hallados_fase:
            partes.append(f"  '{fase}': require('../../assets/voz/fases/{fase}{hallados_fase[fase]}'),")
        else:
            partes.append(f"  // '{fase}': falta assets/voz/fases/{fase}.mp3")
    partes.append("};")

    puestos_num = sum(1 for n in NUMEROS_ESPERADOS if n in hallados_num)
    partes.append(f"\n/* numeros · {puestos_num} de {len(NUMEROS_ESPERADOS)} */")
    partes.append("const VOZ_NUM: Registro = {")
    for n in NUMEROS_ESPERADOS:
        if n in hallados_num:
            partes.append(f"  '{n}': require('../../assets/voz/num/{n}{hallados_num[n]}'),")
        else:
            partes.append(f"  // '{n}': falta assets/voz/num/{n}.mp3")
    partes.append("};")

    salida = "\n".join(partes) + "\n" + PIE_VOZ
    print(f"  voz/ejercicios    {puestos_ej:4} de {len(ids_ejercicios)}")
    print(f"  voz/fases         {puestos_fase:4} de {len(FASES_ESPERADAS)}")
    print(f"  voz/num           {puestos_num:4} de {len(NUMEROS_ESPERADOS)}")
    if not seco:
        with open(destino, "w", encoding="utf-8") as fh:
            fh.write(salida)
    return destino, puestos_ej + puestos_fase + puestos_num


def main():
    if not os.path.isdir("assets/img"):
        sys.exit("Corre esto desde la carpeta app/ (no encuentro assets/img).")

    seco = "--dry" in sys.argv

    destino_img, total_img = generar_imagenes(seco)
    destino_vid, total_vid = generar_videos(seco)
    destino_snd, total_snd = generar_sonidos(seco)
    destino_voz, total_voz = generar_voz(seco)

    if seco:
        print(f"\n[dry] {total_img} imagenes, {total_vid} clips, {total_snd} "
              f"sonidos y {total_voz} audios de voz. No se escribio nada.")
        return

    print(f"\n{destino_img} escrito con {total_img} imagenes.")
    print(f"{destino_vid} escrito con {total_vid} clips.")
    print(f"{destino_snd} escrito con {total_snd} sonidos.")
    print(f"{destino_voz} escrito con {total_voz} audios de voz.")
    faltan = revisar_faltantes()
    if faltan:
        print(f"\nIncompletos: {len(faltan)} ejercicios. Los primeros:")
        for eid, que in faltan[:8]:
            print(f"  {eid}: falta {que}")


if __name__ == "__main__":
    main()
