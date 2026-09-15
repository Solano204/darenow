#!/usr/bin/env python3
"""
FORJA · revisar_medios.py

Compara una carpeta de archivos generados con los 190 ejercicios del catalogo
y dice exactamente que hay, que falta y que sobra.

El generador de video nombra los archivos con el nombre en ingles del
ejercicio ("Man_performing_sumo_squat_1080p_2026...mp4"), y el catalogo tiene
ese mismo nombre en el campo name_en. Con eso se puede emparejar solo.

Uso, desde la carpeta app/:

    python3 revisar_medios.py ~/Descargas/hoy              # informe
    python3 revisar_medios.py ~/Descargas/hoy --renombrar  # copia y renombra

Con --renombrar, los archivos reconocidos se copian a assets/video/ejercicios/
y assets/img/ejercicios/ con el nombre que la app espera (ex_1001.mp4). Los
originales no se tocan.

Las imagenes que se llaman image.png.<timestamp>.jpeg no llevan el nombre del
ejercicio, asi que no se pueden emparejar por nombre. Para esas hay un modo
aparte, --emparejar-por-hora, explicado abajo.
"""

import json
import os
import re
import shutil
import sys
import unicodedata
from collections import defaultdict

VIDEO = {".mp4", ".mov", ".m4v", ".webm"}
IMAGEN = {".jpg", ".jpeg", ".png", ".webp"}

# Palabras que aparecen en todos los nombres generados y no distinguen nada.
RUIDO = {
    "man", "woman", "hombre", "mujer", "doing", "performing", "executing",
    "holding", "using", "practicing", "realizando", "haciendo", "exercise",
    "ejercicio", "1080p", "720p", "2k", "4k", "mp4", "jpeg", "jpg", "png",
    "image", "video", "animate", "it", "de", "del", "la", "el", "con", "en",
    "para", "un", "una", "and", "the", "of", "with", "a",
}


def normalizar(texto):
    """minusculas, sin acentos, solo palabras."""
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


# Palabras pegadas que el generador escribe juntas y el catalogo separado.
COMPUESTAS = {
    "pushup": "push up", "pullup": "pull up", "chinup": "chin up",
    "situp": "sit up", "stepup": "step up", "pressup": "press up",
    "signup": "sign up", "warmup": "warm up", "wallsit": "wall sit",
    "deadbug": "dead bug", "birddog": "bird dog", "hipthrust": "hip thrust",
}

# El generador usa un sinonimo y el catalogo otro. Se traducen los dos lados
# a la misma palabra para que se encuentren.
SINONIMOS = {
    "backward": "reverse", "backwards": "reverse", "atras": "reverse",
    "inversa": "reverse", "inverso": "reverse",
    "chair": "box", "silla": "box",
    "stationary": "static", "estatica": "static", "estatico": "static",
    "quadriceps": "cuadriceps", "quad": "cuadriceps",
    "elevation": "raise", "elevacion": "raise",
    "heel": "calf", "talones": "calf", "talon": "calf",
    "bodyweight": "", "libre": "",
    "seated": "sentado", "standing": "pie",
    "abdominal": "ab", "abs": "ab",
}


def fichas(texto):
    """Palabras utiles de un texto, sin ruido, sin plurales y con sinonimos
    llevados a una sola forma, para que 'pushups' y 'Push-up' se encuentren."""
    crudo = normalizar(texto)
    for pegada, separada in COMPUESTAS.items():
        crudo = crudo.replace(pegada, separada)
    out = set()
    for p in crudo.split():
        if p in RUIDO or (p.isdigit() and len(p) > 4):
            continue
        # El sinonimo se busca antes y despues de quitar el plural: si no,
        # "quadriceps" se convierte en "quadricep" y ya no encuentra su
        # entrada en la tabla.
        p = SINONIMOS.get(p, p)
        if len(p) > 3 and p.endswith("s") and not p.endswith("ss"):
            p = p[:-1]
        p = SINONIMOS.get(p, p)
        if p and p not in RUIDO:
            out.add(p)
    return out


def cargar_ejercicios(datos):
    """Los 190 ejercicios con todas sus formas de nombrarse."""
    ejercicios = []
    for archivo in sorted(os.listdir(datos)):
        if not archivo[:2].isdigit() or "exercises" not in archivo:
            continue
        with open(os.path.join(datos, archivo), encoding="utf-8") as fh:
            for e in json.load(fh)["items"]:
                nombres = [e["name_en"], e["name"], e.get("slug", "")]
                nombres += e.get("aliases", [])
                ejercicios.append({
                    "id": e["id"],
                    "name": e["name"],
                    "name_en": e["name_en"],
                    # cada forma de nombrarlo, por separado: basta con que una
                    # encaje para reconocer el archivo
                    "formas": [fichas(n) for n in nombres if n],
                })
    return ejercicios


def emparejar(nombre_archivo, ejercicios):
    """(ejercicio, puntuacion, empatados). Puntuacion 1.0 = coincidencia total."""
    tf = fichas(os.path.splitext(nombre_archivo)[0])
    if not tf:
        return None, 0.0, []

    puntuaciones = []
    for ej in ejercicios:
        mejor = 0.0
        for forma in ej["formas"]:
            if not forma:
                continue
            # cuanto del nombre del ejercicio aparece en el del archivo
            cubierto = len(forma & tf) / len(forma)
            # penaliza que el archivo traiga muchas palabras ajenas
            extra = len(forma & tf) / max(len(tf), 1)
            mejor = max(mejor, cubierto * 0.8 + extra * 0.2)
        puntuaciones.append((mejor, ej))

    puntuaciones.sort(key=lambda x: -x[0])
    top, ej = puntuaciones[0]
    if top < 0.5:
        return None, top, []
    # empates: otro ejercicio con practicamente la misma puntuacion
    empatados = [e["id"] for p, e in puntuaciones[1:4] if top - p < 0.06]
    return ej, top, empatados


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    carpeta = os.path.expanduser(sys.argv[1])
    renombrar = "--renombrar" in sys.argv
    if not os.path.isdir(carpeta):
        sys.exit(f"No encuentro la carpeta: {carpeta}")
    datos = os.path.join("assets", "data")
    if not os.path.isdir(datos):
        sys.exit("Corre esto desde la carpeta app/ (no encuentro assets/data).")

    ejercicios = cargar_ejercicios(datos)
    por_id = {e["id"]: e for e in ejercicios}

    videos = defaultdict(list)      # id -> [archivo, ...]
    imagenes = defaultdict(list)
    sin_nombre = []                 # imagenes tipo image.png.<hora>.jpeg
    sin_reconocer = []
    dudosos = []

    for archivo in sorted(os.listdir(carpeta)):
        ruta = os.path.join(carpeta, archivo)
        if not os.path.isfile(ruta):
            continue
        ext = os.path.splitext(archivo)[1].lower()
        if ext not in VIDEO and ext not in IMAGEN:
            continue

        ej, punt, empatados = emparejar(archivo, ejercicios)
        if ej is None:
            if re.match(r"^image[._]", archivo, re.I) or re.match(r"^descarga", archivo, re.I):
                sin_nombre.append(archivo)
            else:
                sin_reconocer.append(archivo)
            continue
        if empatados:
            dudosos.append((archivo, ej["id"], empatados, punt))
        (videos if ext in VIDEO else imagenes)[ej["id"]].append(archivo)

    # ---------------------------------------------------------------- informe
    n_ej = len(ejercicios)
    con_video = sum(1 for e in ejercicios if videos[e["id"]])
    con_imagen = sum(1 for e in ejercicios if imagenes[e["id"]])
    total_v = sum(len(v) for v in videos.values())
    total_i = sum(len(v) for v in imagenes.values())

    print("=" * 66)
    print(f"CARPETA: {carpeta}")
    print("=" * 66)
    print(f"\nEjercicios en el catalogo:        {n_ej}")
    print(f"Con al menos un video:            {con_video:3}  "
          f"({n_ej - con_video} sin video)")
    print(f"Con al menos una imagen:          {con_imagen:3}  "
          f"({n_ej - con_imagen} sin imagen)")
    print(f"\nArchivos de video reconocidos:    {total_v}")
    print(f"Archivos de imagen reconocidos:   {total_i}")
    print(f"Imagenes sin nombre util:         {len(sin_nombre)}")
    print(f"Archivos no reconocidos:          {len(sin_reconocer)}")

    repetidos = [(i, len(v)) for i, v in videos.items() if len(v) > 1]
    if repetidos:
        sobran = sum(n - 1 for _, n in repetidos)
        print(f"\nEjercicios con VIDEO REPETIDO:    {len(repetidos)} "
              f"({sobran} archivos de mas)")
        for i, n in sorted(repetidos, key=lambda x: -x[1])[:12]:
            print(f"   {i}  {por_id[i]['name'][:40]:40} {n} copias")

    faltan_v = [e for e in ejercicios if not videos[e["id"]]]
    if faltan_v:
        print(f"\nSIN VIDEO ({len(faltan_v)}):")
        for e in faltan_v[:30]:
            print(f"   {e['id']}  {e['name'][:38]:38} ({e['name_en']})")
        if len(faltan_v) > 30:
            print(f"   ... y {len(faltan_v) - 30} mas")

    if dudosos:
        print(f"\nDUDOSOS, revisalos a mano ({len(dudosos)}):")
        for a, i, emp, p in dudosos[:15]:
            print(f"   {a[:52]:52} -> {i} (o {', '.join(emp)}) {p:.2f}")

    if sin_reconocer:
        print(f"\nNO RECONOCIDOS ({len(sin_reconocer)}):")
        for a in sin_reconocer[:15]:
            print(f"   {a}")

    if sin_nombre:
        print(f"\nIMAGENES SIN NOMBRE UTIL ({len(sin_nombre)}):")
        print("   Se llaman image.png.<hora>.jpeg y no dicen a que ejercicio")
        print("   pertenecen. No hay forma de emparejarlas automaticamente por")
        print("   nombre. Opciones:")
        print("     1. Sacar la imagen del propio video, que ya esta identificado:")
        print("        ffmpeg -ss 0.9 -i ex_1001.mp4 -vframes 1 \\")
        print("          -vf scale=800:-2 -q:v 3 ex_1001.jpg")
        print("     2. Renombrarlas a mano segun el orden en que las generaste.")

    # ---------------------------------------------------------------- copiar
    if renombrar:
        destino_v = os.path.join("assets", "video", "ejercicios")
        destino_i = os.path.join("assets", "img", "ejercicios")
        os.makedirs(destino_v, exist_ok=True)
        os.makedirs(destino_i, exist_ok=True)
        n = 0
        for mapa, destino, ext_final in (
            (videos, destino_v, ".mp4"), (imagenes, destino_i, ".jpg")):
            for eid, archivos in mapa.items():
                if not archivos:
                    continue   # el informe consulta ids sin archivos y los crea
                # si hay repetidos se queda el mas reciente por nombre
                origen = sorted(archivos)[-1]
                shutil.copy2(os.path.join(carpeta, origen),
                             os.path.join(destino, eid + ext_final))
                n += 1
        print(f"\n{n} archivos copiados y renombrados.")
        print("Ahora: python3 generar_registry.py")
    else:
        print("\nEsto ha sido solo un informe. Para copiar y renombrar:")
        print(f"   python3 revisar_medios.py {sys.argv[1]} --renombrar")


if __name__ == "__main__":
    main()
