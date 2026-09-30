#!/usr/bin/env python3
"""Revisa las reglas de capas de docs/ARQUITECTURA.md. Sale con 1 si alguna se rompe.
  - una feature no importa de otra feature
  - las capas compartidas (ui, state, storage, lib, data, media, dev) no importan de features
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from mover import RAIZ, ESPEC, archivos_codigo, resolver, sin_comentarios  # noqa: E402

todos = set(os.popen(f'cd {RAIZ} && git ls-files').read().split('\n'))
archivos = archivos_codigo()
existe = lambda p: p in todos or p in archivos
errores = []
for f in archivos:
    if not f.startswith('src/'):
        continue
    mia = f.split('/')[2] if f.startswith('src/features/') else None
    for m in ESPEC.finditer(sin_comentarios(open(os.path.join(RAIZ, f)).read())):
        d = resolver(m.group(3), f, existe)
        if not d or not d.startswith('src/features/'):
            continue
        suya = d.split('/')[2]
        if mia is None:
            errores.append(f'{f}: capa compartida importa {d}')
        elif suya != mia:
            errores.append(f'{f}: feature {mia} importa feature {suya} ({d})')
print('\n'.join(errores) or 'capas OK')
sys.exit(1 if errores else 0)
