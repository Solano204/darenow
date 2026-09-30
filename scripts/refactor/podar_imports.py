#!/usr/bin/env python3
"""
Quita de los archivos dados los imports que TypeScript marca sin uso (TS6133, TS6192, TS6196).

    python3 scripts/refactor/podar_imports.py src/a.tsx src/b.ts ...

Solo toca sentencias `import`. Deja el `React` por defecto aunque no se use (con el runtime
automatico de JSX es inofensivo y el resto del repo lo conserva).
"""
import os
import re
import subprocess
import sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
archivos = sys.argv[1:]


def diagnosticos():
    salida = subprocess.run(['npx', 'tsc', '--noEmit', '--noUnusedLocals'], cwd=RAIZ, capture_output=True, text=True).stdout
    out = {}
    for m in re.finditer(r'^(\S+)\((\d+),(\d+)\): error TS(6133|6192|6196): (.*)$', salida, re.M):
        f, linea, col, cod, msg = m.groups()
        if f in archivos:
            out.setdefault(f, []).append((int(linea), int(col), cod, msg))
    return out


for _ in range(3):
    diag = diagnosticos()
    if not diag:
        break
    for f, lista in diag.items():
        texto = open(os.path.join(RAIZ, f)).read()
        lineas = texto.split('\n')
        offs = [0]
        for l in lineas:
            offs.append(offs[-1] + len(l) + 1)
        sentencias = [(m.start(), m.end()) for m in re.finditer(r'^import [\s\S]*?;[^\n]*\n', texto, re.M)]
        quitar_nombres = {}
        quitar_sent = set()
        for linea, col, cod, msg in lista:
            pos = offs[linea - 1] + col - 1
            for i, (a, b) in enumerate(sentencias):
                if a <= pos < b:
                    if cod == '6192':
                        quitar_sent.add(i)
                    else:
                        nombre = re.search(r"'(\w+)'", msg).group(1)
                        if nombre != 'React':
                            quitar_nombres.setdefault(i, set()).add(nombre)
        partes, ultimo = [], 0
        for i, (a, b) in enumerate(sentencias):
            if i not in quitar_sent and i not in quitar_nombres:
                continue
            partes.append(texto[ultimo:a])
            ultimo = b
            if i in quitar_sent:
                continue
            s = texto[a:b]
            fuera = quitar_nombres[i]
            m = re.match(r'^import (type )?(?:(\w+)(?:, )?)?(?:\{([\s\S]*?)\})? from (\'[^\']+\');([^\n]*)\n$', s)
            if not m:
                partes.append(s)
                continue
            es_tipo, defecto, llaves, modulo, cola = m.groups()
            if defecto in fuera:
                defecto = None
            nombres = []
            if llaves:
                for n in llaves.split(','):
                    n = n.strip()
                    if not n:
                        continue
                    local = n.split(' as ')[-1].replace('type ', '').strip()
                    if local not in fuera:
                        nombres.append(n)
            if not defecto and not nombres:
                continue
            cabeza = 'import ' + (es_tipo or '')
            cuerpo = ', '.join(x for x in [defecto, ('{ ' + ', '.join(nombres) + ' }') if nombres else None] if x)
            linea = f'{cabeza}{cuerpo} from {modulo};{cola}\n'
            if len(linea) > 120 and nombres:
                linea = f"{cabeza}{(defecto + ', ') if defecto else ''}{{\n  {', '.join(nombres)},\n}} from {modulo};\n"
            partes.append(linea)
        partes.append(texto[ultimo:])
        open(os.path.join(RAIZ, f), 'w').write(''.join(partes))
print('imports podados')
