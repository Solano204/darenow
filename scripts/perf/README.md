# Medición de rendimiento · DARENOW

Comandos exactos de la fase R1 (línea base). Se repiten **igual** en R7 para comparar.
Todo se corre desde la raíz del repo.

## 0. Estado del proyecto antes de medir

```bash
npm ci                         # .npmrc ya trae legacy-peer-deps=true
npx tsc --noEmit               # R1: 4 errores en tests/ · desde R2: 0
npm run lint                   # ESLint (desde R2): 0 errores
npm run lint:color
npm run test:unit              # Jest (desde R2)
npx expo-doctor
for t in player engine ui rutinas borrarTodo detalleRutina detallePrograma musculos aprender perfil ajustes; do npm run -s test:$t | tail -1; done
```

## 1. Bundle (Expo Atlas)

`expo export` con Atlas instala `expo-atlas` y lo agrega a `package.json`. Para no ensuciar
el repo, instálalo sin guardarlo y revierte al terminar:

```bash
npm install --no-save expo-atlas@^0.4.0
EXPO_UNSTABLE_ATLAS=true npx expo export --platform android --output-dir /tmp/darenow-dist
npx expo-atlas .expo/atlas.jsonl        # abre el visor en el navegador
git checkout package.json package-lock.json   # por si el CLI los tocó
```

En un contenedor sin red hacia api.expo.dev agrega `EXPO_OFFLINE=1`.

Tamaños a registrar:

```bash
ls -l /tmp/darenow-dist/_expo/static/js/android/*.hbc        # bundle Hermes
du -sh /tmp/darenow-dist/assets                                # assets empaquetados
# assets por tipo
python3 - <<'EOF'
import json, os, collections
d = '/tmp/darenow-dist'
m = json.load(open(f'{d}/metadata.json'))['fileMetadata']['android']['assets']
s = collections.Counter(); c = collections.Counter()
for a in m:
    s[a['ext']] += os.path.getsize(f"{d}/{a['path']}"); c[a['ext']] += 1
for e in s: print(e, c[e], round(s[e] / 1048576, 2), 'MB')
EOF
```

## 2. Build de release con marcas de arranque

Las marcas de `src/dev/perfMarks.ts` solo existen si la variable está activa **al empaquetar**:

```bash
EXPO_PUBLIC_PERF=1 npx expo run:android --variant release
```

Para medir el arranque "real" de producción (sin marcas), repite sin la variable.

## 3. Condiciones

- Mismo dispositivo físico de gama baja/media por USB (anotar modelo y versión de Android).
- Mismos datos (misma cuenta y progreso), sin otras apps abiertas, batería > 50 %.
- Cada medición 3 veces: se reporta promedio y peor valor.

## 4. Arranque en frío

```bash
PKG=app.forja.fitness
for i in 1 2 3; do
  adb shell am force-stop $PKG
  adb shell pm trim-caches 999G >/dev/null 2>&1   # opcional
  sleep 2
  adb logcat -c
  adb shell am start -W $PKG/.MainActivity | grep -E "TotalTime|WaitTime"
  sleep 8
  adb logcat -d -s ReactNativeJS | grep "\[perf\]"
done
```

La línea `[perf]` trae, en ms desde `js-start`: `catalog-ready`, `app-render`,
`providers-montados`, `fonts-ready`, `storage-ready`, `primer-layout` (se oculta el splash),
`hoy-interactive`, y `bundle-start->js-start`.

Proxy de laboratorio (sin teléfono) del costo de evaluar el catálogo:

```bash
node scripts/perf/medir-catalogo.mjs tests/unit/fixtures/catalogoViejo.ts 400   # antes de R3
node scripts/perf/medir-catalogo.mjs src/data/catalog.ts 400                    # ahora
```

Nota: `hoy-interactive` solo se marca si la app entra directo a Hoy. Si la Bienvenida
del día aún no se vio, abre la app una vez antes de medir (la Bienvenida se muestra una
vez al día).

## 5. Fluidez

Perf Monitor: en un build de release no hay menú de desarrollo; usa Flashlight.

```bash
# instalar Flashlight (una vez)
curl https://get.flashlight.dev | bash
# medir un escenario (manejarlo a mano en el teléfono mientras corre)
flashlight measure --bundleId app.forja.fitness
```

Escenarios fijos (3 corridas cada uno), definidos en `docs/perf/BASELINE.md` §5.

Si se necesita el Perf Monitor de RN (FPS UI/JS), usar un build `--variant release` con
`EXPO_PUBLIC_PERF=1` no basta: el Perf Monitor solo existe en debug. En ese caso se reporta
solo Flashlight (FPS UI, CPU por hilo, RAM) y se anota en BASELINE.md.

## 6. Memoria

```bash
adb shell dumpsys meminfo app.forja.fitness | grep -E "TOTAL PSS|TOTAL:" | head -1
```

Tomar: al arrancar, tras los 6 escenarios, y tras repetir el escenario 3 veinte veces.

## 7. Re-renders

React DevTools solo funciona con el build de desarrollo:

```bash
npx expo start --dev-client     # y en otra terminal: npx react-devtools
```

Profiler → "Highlight updates when components render". Exportar cada perfil a
`docs/perf/profiles/<escenario>-<n>.json`. Los tiempos absolutos de un build dev no se
comparan con release; lo que interesa es **qué** se re-renderiza y cuántas veces.

## 8. Animaciones, hilo JS y memoria (R6)

Build de release con `EXPO_PUBLIC_PERF=1`. En logcat (`adb logcat -s ReactNativeJS`):

- `[bloqueo-js] N ms`: el hilo JS llego N ms tarde a su reloj de 100 ms (bloqueos de más de 50 ms).
- `[players] vivos N · reproduciendo M`: la política de clips (R5).

Niveles de calidad: generar el build con `EXPO_PUBLIC_CALIDAD=alta`, `media` o `baja` para forzarlo (DESIGN.md, «Niveles de calidad»).

**Prueba de fugas** (por pantalla: Bienvenida, Hoy, Reproductor, Resumen, Ficha, Explorar, Detalle de rutina, Programa, Mitos, Yo, Ajustes): anotar la memoria, abrir y cerrar la pantalla 20 veces y anotar a las 10 y a las 20.

```bash
adb shell dumpsys meminfo app.forja.fitness | grep -E "TOTAL PSS|TOTAL:" | head -1
```

La parte que no necesita teléfono (temporizadores, escuchas, players y callbacks por cuadro que quedan vivos) la cubre `tests/unit/renders/fugas.test.tsx`.

**Sesión de 10 minutos**: pantalla encendida, reproductor corriendo. Flashlight durante toda la sesión (FPS UI/JS en los minutos 1, 5 y 10), memoria al inicio y al final con `dumpsys meminfo`, batería con `adb shell dumpsys battery | grep level` al inicio y al final, y temperatura al tacto.

## Quitar la instrumentación

Toda la instrumentación está en `src/dev/perfMarks.ts` (marcas de arranque y vigilancia de bloqueos del hilo JS) y en líneas marcadas con `// perf:R1`.
Un solo paso:

```bash
grep -rl "perf:R1" index.ts App.tsx src | xargs sed -i '/perf:R1/d' && rm -r src/dev
```

(En macOS: `sed -i ''`.) Después, `npx tsc --noEmit` debe seguir igual.
