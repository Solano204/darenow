#!/usr/bin/env python3
"""
Calcula a donde va cada archivo de src/ en la estructura por feature (R2) y escribe el plan
completo en JSON: {"src/viejo.tsx": "src/nuevo.tsx"}.

Reglas:
  1. Las pantallas tienen feature fija (PANTALLAS).
  2. Las capas compartidas tienen destino fijo (FIJOS).
  3. Cualquier otro archivo va a la feature de quienes lo importan si todos son de UNA sola
     feature; si lo usan dos features, una capa compartida o App.tsx, va a la capa compartida
     que le toca por tipo (componente -> ui/components o ui/fx, hook -> ui/hooks, funcion -> lib).
  4. Una capa compartida nunca importa de una feature: si pasa, lo importado sube a compartido.
Se itera hasta que nada cambia.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from mover import RAIZ, ESPEC, archivos_codigo, resolver, sin_comentarios  # noqa: E402

PANTALLAS = {
    'Presentacion': 'onboarding', 'Onboarding': 'onboarding', 'PlanListo': 'onboarding',
    'Acceso': 'cuenta',
    'Bienvenida': 'hoy', 'Hoy': 'hoy',
    'Reproductor': 'sesion', 'Resumen': 'sesion',
    'DetalleEjercicio': 'ejercicio',
    'Explorar': 'explorar',
    'DetalleRutina': 'rutinas', 'RutinaPropia': 'rutinas', 'EditorRutina': 'rutinas',
    'DetallePrograma': 'programas',
    'DetalleMusculo': 'musculos',
    'Aprender': 'aprender', 'DetalleTip': 'aprender', 'DetalleMito': 'aprender',
    'Yo': 'perfil', 'Favoritos': 'perfil', 'Retos': 'perfil', 'Mediciones': 'perfil', 'Historial': 'perfil',
    'Ajustes': 'ajustes',
}

# prefijo viejo -> prefijo nuevo, para las capas que no dependen de quien las use
FIJOS = [
    ('src/theme/', 'src/ui/theme/'),
    ('src/components/ui/', 'src/ui/components/'),
    ('src/store/', 'src/state/'),
    ('src/storage/', 'src/storage/'),
    ('src/data/', 'src/data/'),
    ('src/media/', 'src/media/'),
    ('src/dev/', 'src/dev/'),
    ('src/engine/', 'src/lib/engine/'),
    ('src/utils/plural.ts', 'src/lib/plural.ts'),
    ('src/utils/presentacion.ts', 'src/lib/presentacion.ts'),
    ('src/utils/fechas.ts', 'src/lib/fechas.ts'),
    ('src/utils/textosVisibles.ts', 'src/lib/textosVisibles.ts'),
    ('src/legal.ts', 'src/lib/legal.ts'),
]
# archivos con el mismo nombre que otro que acaba en la misma carpeta: nombre nuevo
RENOMBRAR = {
    'src/components/hoy/BarraRutina.tsx': 'BarraRutinaTarjeta.tsx',
}


CAPAS = ('src/ui/', 'src/state/', 'src/storage/', 'src/lib/', 'src/data/', 'src/media/', 'src/dev/')


def destino_fijo(f):
    if f.startswith(CAPAS):
        return f
    for viejo, nuevo in FIJOS:
        if f == viejo or (viejo.endswith('/') and f.startswith(viejo)):
            return nuevo + f[len(viejo):] if viejo.endswith('/') else nuevo
    return None


def es_componente(f):
    return f.endswith('.tsx')


def es_hook(f):
    return os.path.basename(f).startswith('use')


def main():
    archivos = [f for f in archivos_codigo() if f.startswith('src/')]
    todos = set(os.popen(f'cd {RAIZ} && git ls-files').read().split('\n'))
    existe = lambda p: p in todos or p in archivos
    importa = {f: set() for f in archivos}      # f -> modulos de src que importa
    importadores = {f: set() for f in archivos}  # f -> quien lo importa ('APP' para App.tsx/index.ts)
    for f in archivos_codigo():
        src = sin_comentarios(open(os.path.join(RAIZ, f)).read())
        for m in ESPEC.finditer(src):
            d = resolver(m.group(3), f, existe)
            if d and d in importadores:
                if f.startswith('src/'):
                    importa[f].add(d)
                    importadores[d].add(f)
                elif f in ('App.tsx', 'index.ts'):
                    importadores[d].add('APP')

    # feature: nombre de feature, o 'shared'
    feature = {}
    for f in archivos:
        nombre = os.path.splitext(os.path.basename(f))[0]
        if f.startswith('src/features/'):
            feature[f] = f.split('/')[2]
        elif f.startswith('src/screens/'):
            feature[f] = PANTALLAS[nombre]
        elif destino_fijo(f):
            feature[f] = 'shared'
    cambio = True
    while cambio:
        cambio = False
        for f in archivos:
            if f.startswith(('src/screens/', 'src/features/')) or destino_fijo(f):
                continue
            usos = set()
            for i in importadores[f]:
                usos.add('shared' if i == 'APP' else feature.get(i, '?'))
            usos.discard('?')
            nuevo = usos.pop() if len(usos) == 1 else ('shared' if usos else feature.get(f))
            # regla 4: una capa compartida que me importa me obliga a ser compartido
            if any(i != 'APP' and feature.get(i) == 'shared' for i in importadores[f]):
                nuevo = 'shared'
            if nuevo and feature.get(f) != nuevo:
                feature[f] = nuevo
                cambio = True
        # regla 4 tambien hacia abajo: lo que importa un compartido es compartido
        for f in archivos:
            if feature.get(f) == 'shared':
                for d in importa[f]:
                    if feature.get(d) not in ('shared', None) and not d.startswith(('src/screens/', 'src/features/')):
                        feature[d] = 'shared'
                        cambio = True

    plan = {}
    for f in sorted(archivos):
        fijo = destino_fijo(f)
        base = RENOMBRAR.get(f, os.path.basename(f))
        feat = feature.get(f)
        if fijo:
            nuevo = fijo
        elif f.startswith('src/features/'):
            nuevo = f
        elif f.startswith('src/screens/'):
            nuevo = f'src/features/{feat}/screens/{base}'
        elif feat == 'shared':
            if f.startswith('src/components/fx/'):
                nuevo = f'src/ui/fx/{base}'
            elif es_componente(f):
                nuevo = f'src/ui/components/{base}'
            elif es_hook(f):
                nuevo = f'src/ui/hooks/{base}'
            elif f.startswith('src/components/'):
                nuevo = f'src/ui/components/{base}'
            else:
                nuevo = f'src/lib/{base}'
        elif feat is None:
            raise SystemExit(f'Sin importadores: {f}')
        else:
            if es_hook(f):
                sub = 'hooks'
            elif es_componente(f) or f.startswith('src/components/'):
                sub = 'components'
            else:
                sub = 'utils'
            nuevo = f'src/features/{feat}/{sub}/{base}'
        if nuevo != f:
            plan[f] = nuevo
    destinos = list(plan.values())
    dup = {d for d in destinos if destinos.count(d) > 1}
    if dup:
        raise SystemExit(f'Destinos repetidos: {dup}')
    json.dump(plan, sys.stdout, indent=1, ensure_ascii=False)


if __name__ == '__main__':
    main()
