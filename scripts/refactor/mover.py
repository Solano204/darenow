#!/usr/bin/env python3
"""
Mueve modulos con `git mv` y reescribe los imports de todo el repo.

    python3 scripts/refactor/mover.py plan.json      # {"src/a.ts": "src/b/a.ts", ...}
    python3 scripts/refactor/mover.py --normalizar    # solo reescribe imports al estilo del repo

Estilo de import que deja:
  - mismo directorio: './Nombre'
  - cualquier otro modulo de src/: '@/ruta/sin/extension' (y sin '/index')
  - lo que no es codigo de src/ (assets, package.json): ruta relativa
Los imports de paquetes (`react`, `expo-image`...) no se tocan.
"""
import json
import os
import re
import subprocess
import sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
EXTS = ['.ts', '.tsx']
ESPEC = re.compile(r"""((?:\bfrom|\bimport|\brequire\(|\bimport\()\s*)(['"])([^'"\n]+)\2""")


def sin_comentarios(src):
    """Mismo largo que `src`, con los comentarios en blanco (los strings se respetan)."""
    out, i, n = list(src), 0, len(src)
    while i < n:
        c = src[i]
        if c in '\'"`':
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == '\\' else 1
            i = j + 1
        elif src.startswith('//', i):
            j = src.find('\n', i)
            j = n if j < 0 else j
            for k in range(i, j): out[k] = ' '
            i = j
        elif src.startswith('/*', i):
            j = src.find('*/', i + 2)
            j = n if j < 0 else j + 2
            for k in range(i, j):
                if out[k] != '\n': out[k] = ' '
            i = j
        else:
            i += 1
    return ''.join(out)


def archivos_codigo():
    salida = []
    for base in ['src', 'tests']:
        for d, _, fs in os.walk(os.path.join(RAIZ, base)):
            for f in fs:
                if os.path.splitext(f)[1] in EXTS:
                    salida.append(os.path.relpath(os.path.join(d, f), RAIZ))
    for f in ['App.tsx', 'index.ts']:
        if os.path.exists(os.path.join(RAIZ, f)):
            salida.append(f)
    return salida


def resolver(espec, desde, existe):
    if espec.startswith('@/'):
        base = os.path.join('src', espec[2:])
    elif espec.startswith('.'):
        base = os.path.normpath(os.path.join(os.path.dirname(desde), espec))
    else:
        return None
    for cand in [base] + [base + e for e in EXTS] + [os.path.join(base, 'index' + e) for e in EXTS]:
        if existe(cand) and not os.path.isdir(os.path.join(RAIZ, cand)):
            return cand
    raise SystemExit(f'No resuelvo {espec!r} desde {desde}')


def especificador(destino, desde):
    es_codigo = os.path.splitext(destino)[1] in EXTS
    if not (es_codigo and destino.startswith('src/')):
        rel = os.path.relpath(os.path.splitext(destino)[0] if es_codigo else destino, os.path.dirname(desde))
        return rel if rel.startswith('.') else './' + rel
    sin_ext = os.path.splitext(destino)[0]
    if os.path.basename(sin_ext) == 'index':
        sin_ext = os.path.dirname(sin_ext)
        if os.path.dirname(desde) == sin_ext:
            return '.'
    if os.path.dirname(sin_ext) == os.path.dirname(desde) and os.path.basename(destino).split('.')[0] != 'index':
        return './' + os.path.basename(sin_ext)
    return '@/' + sin_ext[len('src/'):]


def main():
    normalizar = '--normalizar' in sys.argv
    plan = {}
    if not normalizar:
        plan = json.load(open(sys.argv[1]))
    viejos = set(archivos_codigo())
    # todos los archivos del repo que podrian ser destino de un import (assets, json)
    todos = set(subprocess.check_output(['git', 'ls-files'], cwd=RAIZ, text=True).split('\n'))
    existe = lambda p: p in todos or p in viejos
    # 1) leer y resolver con las rutas viejas
    resuelto = {}
    for f in viejos:
        src = open(os.path.join(RAIZ, f)).read()
        resuelto[f] = (src, [(m.start(3), m.end(3), m.group(3), resolver(m.group(3), f, existe)) for m in ESPEC.finditer(sin_comentarios(src))])
    # 2) mover
    for viejo, nuevo in plan.items():
        assert viejo in viejos, viejo
        os.makedirs(os.path.dirname(os.path.join(RAIZ, nuevo)), exist_ok=True)
        subprocess.check_call(['git', 'mv', viejo, nuevo], cwd=RAIZ)
    # 3) reescribir
    cambiados = 0
    for f, (src, specs) in resuelto.items():
        nuevo_f = plan.get(f, f)
        salida, ultimo = [], 0
        for ini, fin, espec, destino in specs:
            if destino is None:
                continue
            destino_nuevo = plan.get(destino, destino)
            if not normalizar and destino_nuevo == destino and nuevo_f == f:
                continue
            nueva = especificador(destino_nuevo, nuevo_f)
            if nueva != espec:
                salida.append(src[ultimo:ini]); salida.append(nueva); ultimo = fin
        if salida:
            salida.append(src[ultimo:])
            open(os.path.join(RAIZ, nuevo_f), 'w').write(''.join(salida))
            cambiados += 1
    print(f'{len(plan)} movidos, {cambiados} archivos con imports reescritos')


if __name__ == '__main__':
    main()
