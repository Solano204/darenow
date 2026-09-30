# DARENOW · Línea base de rendimiento (R1)

Fecha: 2026-09-30 · Commit medido: `48b113b` (+ instrumentación R1, que no cambia el bundle de producción)

## Condiciones de medición

| Campo | Valor |
|---|---|
| Entorno donde se hizo R1 | Contenedor Linux en la nube (Node 22.22.2, npm 10.9.7), **sin dispositivo Android, sin emulador, sin adb** |
| Build del bundle | `expo export --platform android` (producción, Hermes bytecode) |
| Dispositivo | **PENDIENTE**: modelo, versión de Android, RAM |
| Build en el dispositivo | **PENDIENTE**: `EXPO_PUBLIC_PERF=1 npx expo run:android --variant release` |

> **Importante.** Todo lo de §1 y §2 (bundle y assets) está medido de verdad en esta fase.
> Todo lo de §3 a §6 (arranque, FPS, memoria, re-renders) **necesita un teléfono físico por USB**
> y no se puede medir desde el contenedor donde corrió R1. Las tablas están listas con los
> escenarios fijos y marcadas `—`; el procedimiento exacto está en §7 y en
> `scripts/perf/README.md`. No hay números inventados en este documento.

---

## 1. Bundle JS

| Métrica | Valor |
|---|---|
| Bundle Android (Hermes `.hbc`) | **5,64 MB** (5 644 715 B) |
| Bundle con instrumentación R1 y sin `EXPO_PUBLIC_PERF` | 5 645 937 B (+1,2 KB: solo las llamadas; los cuerpos se eliminan y la cadena `[perf]` no está en el bundle) |
| Módulos en el grafo | 2 743 |
| Salida de Metro antes de Hermes (Atlas) | 9,0 MB |

### Top 15 por paquete (tamaño de salida de Metro, Atlas)

| # | Paquete | Tamaño | Módulos | Para qué se usa en DARENOW | Sospechoso |
|---|---|---|---|---|---|
| 1 | react-native-reanimated | 1 519 KB | 296 | Todas las animaciones. **474 KB son `layoutReanimation`** (Zoom, Flip, Bounce, Rotate… presets que la app no usa; solo FadeIn/FadeOut/LinearTransition) | ⚠️ R3 |
| 2 | react-native | 1 461 KB | 447 | Núcleo | — |
| 3 | app: `src/components` | 1 310 KB | 211 | UI propia | ⚠️ 211 módulos, ver INVENTARIO |
| 4 | @expo/vector-icons | 590 KB | 64 | **Solo se usa `Ionicons`**, pero `import { Ionicons } from '@expo/vector-icons'` (50 archivos) arrastra los 17 glyphmaps: **534 KB** (MaterialCommunityIcons.json solo, 213 KB) | 🔴 R3 |
| 5 | @shopify/react-native-skia | 531 KB | 251 | 17 componentes con `<Canvas>` (partículas, trazos, fotos tratadas). Incluye módulos `skia/web/*` que en Android no se ejecutan | ⚠️ R6 |
| 6 | app: `assets/data` (JSON catálogo) | 489 KB | 21 | Catálogo completo (190 ejercicios, etc.) evaluado al arrancar | ⚠️ R3 |
| 7 | app: stubs de `require()` de assets | 339 KB | 781 | `registry.ts`, `videos.ts`, `voz.ts`, `sonido.ts`: un módulo por archivo de medio | ⚠️ R3 |
| 8 | react-reconciler | 338 KB | 4 | **Segundo reconciliador de React**, lo trae Skia para su árbol declarativo | ⚠️ R6 |
| 9 | app: `src/screens` | 315 KB | 24 | 23 pantallas, **todas importadas de forma estática en `App.tsx`** | ⚠️ R3 |
| 10 | @react-navigation/core | 230 KB | 76 | Navegación | — |
| 11 | react-native-worklets | 203 KB | 43 | Runtime de worklets | — |
| 12 | expo | 185 KB | 39 | Incluye `expo/virtual/streams.js` 95 KB (polyfill de Web Streams) | ⚠️ R3 |
| 13 | react-native-screens | 118 KB | 50 | Navegación nativa | — |
| 14 | @react-native/virtualized-lists | 103 KB | 15 | FlatList | — |
| 15 | @react-navigation/elements | 78 KB | 37 | Cabeceras de stack | — |

Top de módulos individuales: `docs/perf/profiles/atlas-top-modulos.txt`.

### Módulos marcados como sospechosos

1. **@expo/vector-icons por barrel import**: 534 KB de glyphmaps + 19 fuentes de iconos en assets (§2) para usar 1 familia.
2. **Presets de layout animation de Reanimated**: 474 KB; la app usa 3 presets.
3. **Catálogo JSON en el bundle + evaluado en el arranque**: 489 KB; `catalog.ts` hace `flatMap`, construye 8 `Map` y 2 `filter` sobre 190 ejercicios en la evaluación del módulo.
4. **Todas las pantallas estáticas**: `App.tsx` importa las 23 pantallas y todo su árbol antes del primer frame, incluidas `Reproductor` (525 + 343 líneas), `EditorRutina`, `Ajustes`.
5. **react-reconciler duplicado** (Skia) y **polyfill de streams** (expo) — costo fijo, revisar si se puede evitar.

## 2. Assets empaquetados

| Tipo | Archivos | Tamaño | % del total | Nota |
|---|---|---|---|---|
| mp4 (clips) | 188 | 31,73 MB | 59 % | 480p, H.264, prom. 173 KB, máx. 336 KB |
| jpg (fotos) | 370 | 8,66 MB | 16 % | 800×423–447 px; ejercicios prom. 18 KB (máx. 37 KB) |
| mp3 (voz + sonidos) | 207 | 7,85 MB | 15 % | 190 voces de ejercicio (8,3 MB en disco) + fases + 9 sonidos |
| ttf (fuentes) | 42 | 5,33 MB | 10 % | **Solo 6 se usan.** 9 pesos de Big Shoulders + 14 de Figtree + **19 fuentes de iconos** (MaterialCommunityIcons 1,3 MB, FontAwesome6 Solid 424 KB, Ionicons 390 KB…) |
| png | 18 | 0,14 MB | <1 % | `goma-tile.png` 512×512, 135 KB |
| **Total** | 825 | **53,71 MB** | | |

Fuentes que sí se cargan en `App.tsx`: BigShouldersDisplay 700/800, Figtree 400/500/600/700 (≈ 0,58 MB).
Fuentes empaquetadas que nunca se usan: 36 archivos, **≈ 4,75 MB** de APK/AAB.

## 3. Arranque en frío

Qué corre antes de la primera pantalla (análisis de código, `App.tsx` → `Raiz`):

1. Evaluación del bundle completo (23 pantallas y todos sus componentes, estáticos).
2. `catalog.ts`: 21 JSON (489 KB) + índices `Map` + estadísticas.
3. `registry.ts` / `videos.ts` / `voz.ts`: 781 `require()` de assets.
4. `haptics.ts` lee AsyncStorage **al evaluar el módulo** (efecto de importar).
5. `useFonts` (6 fuentes) → el splash no se oculta hasta que resuelven.
6. `ProveedorEstado`: `AsyncStorage.getItem('forja:v1')` + `JSON.parse` del estado completo (sesiones, mediciones, rutinas). Crece con el uso (≈ 90 KB por semestre según el propio código).
7. `ProveedorCuenta`: otra lectura de AsyncStorage.
8. `Raiz` muestra `ActivityIndicator` hasta que ambas lecturas terminan; luego Bienvenida (1 vez al día) o Tabs → Hoy.
9. Hoy: `armarSesion()` (motor de sesión), filtros sobre 190 ejercicios, 52 músculos, 30 rutinas.

| Métrica | Corrida 1 | Corrida 2 | Corrida 3 | Promedio | Peor |
|---|---|---|---|---|---|
| `am start -W` TotalTime (ms) | — | — | — | — | — |
| bundle-start → js-start (ms) | — | — | — | — | — |
| js-start → catalog-ready (ms) | — | — | — | — | — |
| js-start → fonts-ready (ms) | — | — | — | — | — |
| js-start → storage-ready (ms) | — | — | — | — | — |
| js-start → hoy-interactive (ms) | — | — | — | — | — |

## 4. Fluidez (Flashlight / Perf Monitor)

| # | Escenario | FPS UI prom. | FPS UI mín. | FPS JS prom. | FPS JS mín. | Flashlight |
|---|---|---|---|---|---|---|
| 1 | Arranque → Hoy → scroll completo del feed | — | — | — | — | — |
| 2 | Explorar → Ejercicios → scroll rápido 190 ida y vuelta | — | — | — | — | — |
| 3 | Ficha de ejercicio → scroll → atrás (×5 ejercicios) | — | — | — | — | — |
| 4 | Sesión → 2 min en reproductor (Prepárate/Trabaja/Descansa) → salir | — | — | — | — | — |
| 5 | Aprender → Mitos → scroll → abrir mito → atrás | — | — | — | — | — |
| 6 | Yo → scroll → Ajustes → scroll | — | — | — | — | — |

## 5. Memoria (TOTAL PSS)

| Momento | Corrida 1 | Corrida 2 | Corrida 3 | Promedio |
|---|---|---|---|---|
| Al arrancar (Hoy visible) | — | — | — | — |
| Tras los 6 escenarios | — | — | — | — |
| Tras escenario 3 ×20 | — | — | — | — |
| Crecimiento 1ª→20ª (umbral de fuga: > 15 %) | — | — | — | — |

## 6. Re-renders (React DevTools Profiler, build dev)

| Escenario | Top 10 por tiempo de render | Re-renders sin cambio visible | Renders/s |
|---|---|---|---|
| 1 Hoy | — | — | — |
| 2 Explorar | — | Esperado por código: todas las pestañas y filas visibles al marcar un favorito (ver H-01, H-11) | — |
| 4 Reproductor | — | Esperado por código: árbol completo del reproductor 1 vez por segundo (ver H-02, H-03) | — (esperado ≥ 1/s) |

Perfiles exportados: `docs/perf/profiles/` (por ahora solo el análisis de Atlas).

## 7. Qué necesito de ti para completar §3–§6

1. Conecta por USB un Android de gama baja/media con depuración USB activa y dime modelo y versión de Android.
2. En tu máquina: `EXPO_PUBLIC_PERF=1 npx expo run:android --variant release`.
3. Abre la app una vez hasta Hoy (para que la Bienvenida del día ya esté vista), ciérrala.
4. Corre el bloque de §4 de `scripts/perf/README.md` (3 arranques) y pégame la salida.
5. Para cada escenario de §4: `flashlight measure --bundleId app.forja.fitness`, haz el recorrido, y pégame el resumen.
6. `adb shell dumpsys meminfo app.forja.fitness | grep "TOTAL PSS"` en los tres momentos de §5.

Con eso relleno estas tablas y reordeno `HALLAZGOS.md` por impacto medido.
