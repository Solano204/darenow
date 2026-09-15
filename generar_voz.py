#!/usr/bin/env python3
"""
FORJA · generador de voz con AWS Polly

Lee textos_voz.json y sintetiza cada texto con la voz generativa Andres
(es-MX). Guarda en assets/voz/{ejercicios,fases,num}/<id>.mp3 y normaliza
el lote con ffmpeg al mismo formato que assets/snd/ (mono, 44.1 kHz, 64 kbps).

Idempotente: assets/voz/.manifiesto.json guarda el sha256 del texto de cada
archivo ya generado. Si el texto no cambio, no se vuelve a sintetizar ni a
cobrar por el.

Uso, desde la carpeta app/:

    python3 generar_voz.py            # sintetiza y normaliza lo que falte
    python3 generar_voz.py --dry      # solo cuenta caracteres, no llama a Polly
"""

import hashlib
import json
import os
import subprocess
import sys

VOICE_ID = "Andres"
ENGINE = "generative"
REGION = "us-east-1"

RAIZ_VOZ = os.path.join("assets", "voz")
MANIFIESTO = os.path.join(RAIZ_VOZ, ".manifiesto.json")

# (clave en textos_voz.json, subcarpeta destino)
GRUPOS = [
    ("ejercicios", "ejercicios"),
    ("fases", "fases"),
    ("numeros", "num"),
]


def cargar_textos():
    with open("textos_voz.json", encoding="utf-8") as fh:
        return json.load(fh)


def cargar_manifiesto():
    if not os.path.isfile(MANIFIESTO):
        return {}
    with open(MANIFIESTO, encoding="utf-8") as fh:
        return json.load(fh)


def guardar_manifiesto(m):
    with open(MANIFIESTO, "w", encoding="utf-8") as fh:
        json.dump(m, fh, ensure_ascii=False, indent=2, sort_keys=True)


def hash_texto(texto):
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()


def normalizar(ruta):
    """mp3 mono 44.1kHz 64kbps, loudnorm, recorta silencio inicio/fin."""
    tmp = ruta + ".tmp.mp3"
    filtro = (
        "loudnorm=I=-16:TP=-1.5:LRA=11,"
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,"
        "areverse,"
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,"
        "areverse"
    )
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error", "-i", ruta,
        "-af", filtro,
        "-ac", "1", "-ar", "44100", "-b:a", "64k",
        tmp,
    ]
    subprocess.run(cmd, check=True)
    os.replace(tmp, ruta)


def sintetizar(texto, ruta):
    """Llama al AWS CLI (aws polly synthesize-speech) y escribe el mp3 en ruta."""
    cmd = [
        "aws", "polly", "synthesize-speech",
        "--voice-id", VOICE_ID,
        "--engine", ENGINE,
        "--output-format", "mp3",
        "--region", REGION,
        "--text", texto,
        ruta,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip() or r.stdout.strip())


def main():
    seco = "--dry" in sys.argv

    textos = cargar_textos()
    manifiesto = cargar_manifiesto()

    tareas = []
    for clave, carpeta in GRUPOS:
        for id_, texto in textos[clave].items():
            tareas.append((carpeta, id_, texto))

    total_chars = sum(len(t) for _, _, t in tareas)
    print(f"{len(tareas)} audios, {total_chars} caracteres en total.")

    if seco:
        return

    os.makedirs(RAIZ_VOZ, exist_ok=True)
    for _, carpeta in GRUPOS:
        os.makedirs(os.path.join(RAIZ_VOZ, carpeta), exist_ok=True)

    generados, saltados, fallidos = 0, 0, []

    for i, (carpeta, id_, texto) in enumerate(tareas, 1):
        clave_manifiesto = f"{carpeta}/{id_}"
        ruta = os.path.join(RAIZ_VOZ, carpeta, f"{id_}.mp3")
        h = hash_texto(texto)

        if manifiesto.get(clave_manifiesto) == h and os.path.isfile(ruta):
            saltados += 1
        else:
            try:
                sintetizar(texto, ruta)
                normalizar(ruta)
                manifiesto[clave_manifiesto] = h
                generados += 1
            except Exception as e:
                fallidos.append((clave_manifiesto, str(e)))

        if i % 20 == 0 or i == len(tareas):
            print(f"  {i}/{len(tareas)}  (nuevos: {generados}, sin cambio: {saltados}, fallidos: {len(fallidos)})")

    guardar_manifiesto(manifiesto)

    print(f"\nListo. {generados} generados, {saltados} sin cambio, {len(fallidos)} fallidos.")
    if fallidos:
        print("Fallidos:")
        for clave, err in fallidos:
            print(f"  {clave}: {err}")


if __name__ == "__main__":
    main()
