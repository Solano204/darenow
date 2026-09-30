#!/usr/bin/env python3
"""
Pasa la logica de una pantalla (todo lo que va antes de su `return (`) a un hook.

    python3 scripts/refactor/extraer_hook.py <pantalla.tsx> <useNombre> <destino.ts>

El cuerpo se copia tal cual; el hook recibe los mismos parametros que la pantalla y devuelve los
nombres declarados en el cuerpo que el JSX usa. La pantalla llama al hook en el mismo lugar. El
hook arranca con todos los imports de la pantalla: `podar_imports.py` quita luego los que sobran
en los dos archivos.
"""
import re
import sys

pantalla, hook, destino = sys.argv[1:4]
src = open(pantalla).read()
m = re.search(r'^export default function (\w+)\((.*?)\) \{\n', src, re.M)
if not m:
    raise SystemExit('No encuentro la funcion por defecto')
ini_cuerpo = m.end()
ret = src.index('\n  return (\n', ini_cuerpo)
cuerpo = src[ini_cuerpo:ret + 1]
resto = src[ret:]
fin_componente = re.search(r'^\}\n', resto, re.M).end()
jsx = resto[:fin_componente]

# nombres declarados en el primer nivel del cuerpo (dos espacios de sangria)
declarados = []
for linea in cuerpo.split('\n'):
    d = re.match(r'^  (?:const|let|function) (\w+)', linea)
    if d:
        declarados.append(d.group(1))
        continue
    d = re.match(r'^  const [\[{]\s*(.*?)[\]}]\s*=', linea)
    if d:
        for parte in d.group(1).split(','):
            parte = parte.strip()
            if not parte or parte.startswith('...'):
                continue
            nombre = parte.split(':')[-1].split('=')[0].strip()
            if re.fullmatch(r'\w+', nombre):
                declarados.append(nombre)
# destructurados en varias lineas: `  const {\n    a, b,\n  } = x;`
for d in re.finditer(r'^  const \{\n((?:    .*\n)+?)  \} =', cuerpo, re.M):
    for parte in d.group(1).replace('\n', ' ').split(','):
        nombre = parte.strip().split(':')[-1].split('=')[0].strip()
        if re.fullmatch(r'\w+', nombre):
            declarados.append(nombre)

jsx_sin_atributos = re.sub(r'(?<=\s)\w+=(?=[{"\'])', '', jsx)  # `estado={...}` es un atributo, no la variable
jsx_sin_atributos = re.sub(r'"[^"\n]*"|\'[^\'\n]*\'', '""', jsx_sin_atributos)  # ni lo que va en un texto
usados = [n for n in dict.fromkeys(declarados) if re.search(r'(?<![\w.])' + n + r'\b', jsx_sin_atributos)]
import textwrap
lista = textwrap.fill(', '.join(usados), 100, initial_indent='    ', subsequent_indent='    ') + ','

imports = ''.join(re.findall(r'^import [\s\S]*?;[^\n]*\n', src, re.M))

# declaraciones de modulo (entre los imports y la pantalla) que usa el cuerpo: pasan al hook.
# Si el JSX o los estilos tambien las usan, el hook las exporta y la pantalla las importa.
ultimo_imp = list(re.finditer(r'^import [\s\S]*?;[^\n]*\n', src, re.M))[-1].end()
zona = src[ultimo_imp:m.start()]
despues = src[ret:]
bloques = list(re.finditer(r'^(?:/\*\*[\s\S]*?\*/\n)?(?:const|interface|type) (\w+)[\s\S]*?(?=^(?:/\*\*|const |interface |type |export )|\Z)', zona, re.M))
usa = lambda texto, nombre: re.search(r'(?<![\w.])' + nombre + r'\b', texto)
movidas = [bq.group(1) for bq in bloques if usa(cuerpo, bq.group(1))]
cambio = True
while cambio:  # lo que usan las declaraciones movidas tambien se mueve
    cambio = False
    texto_movido = ''.join(bq.group(0) for bq in bloques if bq.group(1) in movidas)
    for bq in bloques:
        if bq.group(1) not in movidas and usa(texto_movido, bq.group(1)):
            movidas.append(bq.group(1)); cambio = True
texto_queda = ''.join(bq.group(0) for bq in bloques if bq.group(1) not in movidas)
exportadas = [n for n in movidas if usa(despues, n) or usa(texto_queda, n)]
bloques_hook = ''
for bq in bloques:
    if bq.group(1) in movidas:
        t = bq.group(0)
        if bq.group(1) in exportadas:
            t = re.sub(r'^((?:/\*\*[\s\S]*?\*/\n)?)(const|interface|type) ', r'\1export \2 ', t, count=1)
        bloques_hook += t
zona_nueva = zona
for bq in reversed(bloques):
    if bq.group(1) in movidas:
        zona_nueva = zona_nueva[:bq.start()] + zona_nueva[bq.end():]
src = src[:ultimo_imp] + zona_nueva + src[m.start():]
m = re.search(r'^export default function (\w+)\((.*?)\) \{\n', src, re.M)
ini_cuerpo = m.end()
ret = src.index('\n  return (\n', ini_cuerpo)
params = m.group(2)
nombre_pantalla = m.group(1)
nombres_param = re.findall(r'\w+', params.split('}')[0]) if params.strip().startswith('{') else []
usa_params = any(re.search(r'(?<![\w.])' + n + r'\b', cuerpo) for n in nombres_param)
params_hook = params if usa_params else ''
hook_src = f"""{imports}
{bloques_hook.rstrip()}

/** La logica de `{nombre_pantalla}`: estado, datos derivados y manejadores. La pantalla solo dibuja. */
export function {hook}({params_hook}) {{
{cuerpo}
  return {{
{lista}
  }};
}}
"""
open(destino, 'w').write(hook_src)

args = re.sub(r':\s*[^,]+$', '', params.strip()) if params.strip() else ''
if args.startswith('{'):
    args = args[:args.rindex('}') + 1]
if not usa_params:
    args = ''
llamada = f"  const {{\n{lista}\n  }} = {hook}({args});\n"
modulo = '@/' + destino[len('src/'):].rsplit('.', 1)[0]
nuevo = src[:ini_cuerpo] + llamada + src[ret + 1:]
ultimo_import = list(re.finditer(r'^import [\s\S]*?;[^\n]*\n', nuevo, re.M))[-1]
extra = ''.join(', ' + n for n in exportadas)
nuevo = nuevo[:ultimo_import.end()] + f"import {{ {hook}{extra} }} from '{modulo}';\n" + nuevo[ultimo_import.end():]
open(pantalla, 'w').write(nuevo)
print(f'{len(usados)} nombres: {lista}')
print(f'movidas al hook: {movidas}; exportadas: {exportadas}')
