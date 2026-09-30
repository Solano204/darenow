# DARENOW · R3 Arranque y bundle

Rama: `claude/epic-thompson-id8smn`. Un commit por punto, prefijo `perf(R3)`:

| Commit | Punto |
|---|---|
| `e996df2` | 2 · Marcas de arranque para el desglose |
| `666d2b6` | 3.1 · Splash hasta la primera pantalla ya pintada |
| `995786d` | 3.2 · Fuentes incrustadas en Android, sin carga al arrancar |
| `2c3239e` | 3.3 · El lienzo de magnesia se monta después del arranque |
| `02b0263` | 3.4 · Catálogo: índice ligero + detalle bajo demanda |
| `ca0cfbd` | 3.5 · Lectura inicial en un solo `multiGet` |
| `1edb7bd` | 3.6 · Pantallas perezosas y `freezeOnBlur` |
| `754d7f6` | 3.7 · Ionicons por ruta directa (H-05) |
| `0af8685` | 3.8 · Build Android: R8, shrinkResources, bundle sin comprimir |

> **Lo que falta medir en el teléfono.** Este entorno no tiene teléfono ni Android SDK. No hay números en ms de arranque ni tamaño de APK/AAB en este reporte. Todo lo que dice **Medido** se midió aquí: export de Metro, Atlas, prebuild y el proxy de node. Lo que dice **Pendiente** se mide con `scripts/perf/README.md` §2 y §4 (3 arranques, promedio y peor), con el mismo teléfono de BASELINE. La tabla de §1 queda lista para pegar los números.

## 1. Línea de tiempo del arranque (antes / después)

Marcas: `src/dev/perfMarks.ts`, solo activas con `EXPO_PUBLIC_PERF=1`. Todas en ms desde `js-start`.

| Tramo | Qué pasa en el tramo | Antes (R2) | Después (R3) | Cambio en R3 |
|---|---|---|---|---|
| `bundle-start → js-start` | Hermes carga el `.hbc` | Pendiente | Pendiente | `.hbc` 5 636 325 → 5 275 599 B (−6,4 %). Sin comprimir en el APK (se mapea, no se descomprime) |
| `js-start → catalog-ready` | evaluar el catálogo | Pendiente | Pendiente | Proxy node: 2,1–3,3 → 1,4–1,7 ms (mediana) |
| `catalog-ready → app-render` | evaluar el resto de módulos de App | Pendiente | Pendiente | **308 → 105** módulos de la app evaluados. **782 → 384** assets registrados |
| `app-render → providers-montados` | primer render de los providers | Pendiente | Pendiente | — |
| `→ fonts-ready` | fuentes | Pendiente | Pendiente | Android: 0 (incrustadas en el APK). iOS: `useFonts` con los 6 archivos |
| `→ storage-ready` | leer estado y cuenta | Pendiente | Pendiente | 3 `getItem` → 1 `multiGet` |
| `→ primer-layout` | se oculta el splash | — (no existía) | Pendiente | El splash sigue hasta el layout de la primera pantalla con datos |
| `→ hoy-interactive` | Hoy pintado (rAF tras montar) | Pendiente | Pendiente | Magnesia (Skia a pantalla completa) ya no se monta en este tramo |

El tramo que más se redujo en lo medido aquí es **`catalog-ready → app-render`**. Antes, `App.tsx` importaba todas las pantallas y todo lo que usan. Ahora solo se evalúan Hoy, Bienvenida y lo compartido.

Cómo se midió "módulos evaluados al arrancar": se recorren los `import`/`export … from` estáticos desde `index.ts`. Se ignoran los `import type` y los `require` dentro de funciones, porque Metro los evalúa al llamarlos. `inlineRequires` está apagado en Expo y `lazyImports` también, así que cada import estático se evalúa al arrancar. Los números salen de ese recorrido en `e996df2~1`, que es el final de R2, y en `HEAD`.

## 2. Qué se difirió, qué se hizo perezoso y qué se quitó

| Qué | Antes | Ahora |
|---|---|---|
| Splash | `hideAsync` en cuanto terminaba la carga | `mantenerSplash()` a nivel de módulo, `ocultarSplash()` en el `onLayout` de la primera pantalla con datos. Respaldo de 8 s. Mismo fondo `goma` |
| Entrada animada de Hoy | Arrancaba debajo del splash | Arranca con `useSplashOculto()`: se ve completa |
| Fuentes (Android) | `useFonts` con los índices de `@expo-google-fonts` (23 pesos registrados) | Plugin `expo-font` con los 6 archivos que se usan; `fuentes.android.ts` devuelve `[true, null]`. iOS sigue con `useFonts`, porque resuelve por nombre PostScript |
| Lienzo de magnesia | Canvas de Skia montado desde el primer frame | Se monta tras `splashOculto` + `InteractionManager.runAfterInteractions` |
| Textos largos del catálogo | Evaluados al arrancar | Se evalúan la primera vez que se piden (ficha, Aprender, armar sesión) |
| Mitos, glosario, nutrición, retos, logros, mediciones | En `catalog.ts`, evaluados al arrancar | `data/aprender.ts` y `data/logros.ts`, que solo cargan las pantallas que los usan |
| 22 pantallas del Stack/pestañas | Import estático en `App.tsx` | `getComponent` + `require`. Presentación, Acceso y Onboarding solo se cargan si toca mostrarlas |
| Registro de clips (190) y de voz (199) | Evaluados al arrancar | Solo al abrir ficha o reproductor, porque ahora cuelgan de pantallas perezosas |
| Glyphmaps de 17 familias de íconos | En el bundle | Solo Ionicons |

## 3. Catálogo: cambios y equivalencia

- `scripts/build-catalogo.ts` (`npm run catalogo`) genera:
  - `src/data/indice/`: `ejercicios.json`, `musculos.json` y `tips.json` sin sus textos largos. Cada texto queda en `null` en su posición y `patron` ya viene puesto. También `salas.json` y `conteos.json`, que antes eran 2 `filter` al arrancar.
  - `src/data/detalle/<tipo>.json`: `id → textos`.
- `catalog.ts`:
  - `EJERCICIOS`, `MUSCULOS` y `TIPS` son el índice, con tipos `EjercicioIndice`, `MusculoIndice` y `TipIndice`.
  - `getEjercicio(id)`, `getMusculo(id)` y `getTip(id)` devuelven el objeto completo. Está memorizado y es `{...índice, ...detalle}`, así que el orden de claves es el de antes.
  - `tipsCompletos()` es para la lista de Aprender, que busca en el cuerpo.
  - El resto de las exportaciones y firmas (`porId`, `evidenciaDe`, `nombreEquipo`, `GOALS`, `ESTADISTICAS`…) no cambia.
- Quién pide el detalle:
  - `aItem` y `sesionDePropia`: el ítem de sesión lleva el ejercicio completo, así que **lo que se guarda en `forja:sesion_en_curso` es idéntico**.
  - Las fichas de ejercicio y de músculo, `DetalleTip` y la lista de Aprender.
- Diseño elegido tras medir tres opciones en el proxy:

  | Opción | Evaluar `catalog.ts` (mediana) |
  |---|---|
  | Antes (todo) | 2,1–3,3 ms |
  | Getters por campo (`defineProperty`) | 6,6 ms: peor, porque los objetos pasan a modo diccionario |
  | Un módulo de detalle por id (342 módulos) | 2,3–3,2 ms: registrar 342 módulos costaba lo que se ahorraba |
  | **Un JSON de detalle por tipo (elegida)** | **1,4–1,7 ms** |

- **Equivalencia** (`tests/unit/catalogo.test.ts`, contra `tests/unit/fixtures/catalogoViejo.ts`, que es el `catalog.ts` de R2 congelado): **8/8 en verde**. Cubre:
  - `getEjercicio`, `getMusculo` y `getTip` contra el objeto viejo, con `JSON.stringify` exacto, es decir mismos valores y mismo orden de claves.
  - El índice es el objeto viejo con los textos en `null`.
  - Equipo, rutinas, programas, salas y conteos.
  - Mitos, glosario, nutrición, FAQ, retos, logros y mediciones.
  - Los `Map` por id.
  - `evidenciaDe` y `nombreEquipo` para los 190 ejercicios.
  - `aItem` en los 3 bloques contra el `aItem` viejo, y las sesiones de las 30 rutinas y de una rutina propia.
- El catálogo viejo se queda como fixture de prueba, no como ruta de código: ya no hay dos caminos en la app.

## 4. Decisiones

**`freezeOnBlur`**: activo en las pestañas y en el Stack.

| Excepción | Por qué |
|---|---|
| `Reproductor` (`freezeOnBlur: false`) | Voz, vibración y cronómetro van por efectos. Un árbol congelado no corre efectos. Hoy nada se apila encima del reproductor, pero se deja explícito |

No hay otras excepciones:
- Ninguna otra pantalla hace trabajo que deba seguir mientras está tapada.
- Los cambios del store que llegan mientras una pantalla está congelada se pintan al volver a ella.

**Rutas asíncronas**: no aplica. La app usa React Navigation 7 sin expo-router. El equivalente es `getComponent`, y ya está hecho.

**Almacenamiento**:
- `storage/lecturaInicial.ts` lee `forja:v1` (estado), la cuenta y la vibración con un solo `multiGet`.
- Mismas claves y mismo texto. Cada módulo lo parsea igual que antes.
- Cada clave se entrega una vez; las lecturas siguientes van directo, para no devolver un valor viejo.
- Voz, ajustes de máquina, consentimiento y sesión en curso ya se leían solo al usarse.
- **MMKV: no se implementa.** Queda como propuesta P-R3-1.

**`inlineRequires` / `lazyImports`**: no se activan. Queda como propuesta P-R3-2.
- `babel-preset-expo` con `lazyImports: true` haría perezoso todo import que no sea relativo, incluidos los `@/…` de la app.
- Cambia el orden en que corren los efectos de módulo: `leerAlArrancar` de la vibración, `mantenerSplash`, las marcas. Eso no se puede verificar sin teléfono.
- Lo que daba el mayor beneficio (pantallas y textos fuera del arranque) ya está hecho de forma explícita.

**Módulos pesados (Atlas, tamaño de fuente antes de minificar)**:

| # | Módulo | Tamaño | Nota |
|---|---|---|---|
| 1 | `react-reconciler` (prod) | 345 KB | fijo |
| 2 | `ReactFabric-prod` | 332 KB | fijo |
| 3 | `src/data/indice/ejercicios.json` | 151 KB | índice: se evalúa al arrancar |
| 4 | `src/data/detalle/ejercicios.json` | 113 KB | en el bundle, **no se evalúa al arrancar** |
| 5 | reanimated `defaultAnimations/Zoom` | 52 KB | presets de layout (H-13) |
| 6 | `VirtualizedList` | 51 KB | fijo |
| 7 | reanimated `Flip` | 41 KB | H-13 |
| 8 | `whatwg-url-minimum` | 40 KB | polyfill de `URL` de Expo |
| 9 | reanimated `Bounce` | 39 KB | H-13 |
| 10 | reanimated `animation/util` | 39 KB | fijo |
| 11 | reanimated `Fade` | 37 KB | H-13 (la app usa `FadeIn`/`FadeOut`) |
| 12 | Ionicons glyphmap | 36 KB | la única familia que queda |
| 13 | reanimated `Rotate` | 36 KB | H-13 |
| 14 | Skia `Matrix4` | 35 KB | fijo |
| 15 | reanimated `Colors` | 35 KB | fijo |

- Por paquete: reanimated 1,56 MB, react-native 1,50 MB, `src/features` 1,16 MB, `src/ui` 0,59 MB, Skia 0,54 MB.
- **H-13** (presets de reanimated): el índice de reanimated los importa todos. Excluirlos requeriría parchear el paquete, así que queda como costo fijo.
- **Barriles**:
  - `@/ui/components` (index) reexporta 5 archivos que Hoy usa casi completos. Se deja.
  - `@expo/vector-icons` era el barril caro y ya se quitó.
- **Skia**: se importa en 18 archivos, todos dibujan con Skia. Hoy lo necesita para pintar (SieteDias, FilaSemana, MiniMagnesia), así que no se puede sacar del arranque sin cambiar el diseño.

## 5. Bundle, app y arranque (antes / después)

| Métrica | R1 | R2 | R3 | Tipo |
|---|---|---|---|---|
| `.hbc` Android | 5 644 715 B | 5 636 325 B | **5 275 599 B** (−360 726 B, −6,4 % vs R2) | Medido |
| Fuentes empaquetadas por Metro | 42 ttf / 5,33 MB | 42 / 5,33 MB | **2 ttf / 0,49 MB** | Medido |
| Fuentes incrustadas por `expo-font` (Android) | — | — | 6 ttf / 0,37 MB | Medido (prebuild) |
| Assets exportados | 825 archivos | 825 | 785 (51,2 MB; jpg 9,1 · mp3 8,2 · mp4 33,3) | Medido |
| Módulos de la app evaluados al arrancar | 308 | 308 | **105** | Medido (grafo estático) |
| Assets registrados al arrancar | 782 | 782 | **384** | Medido (grafo estático) |
| Evaluar catálogo (proxy node) | 2,1–3,3 ms | = | **1,4–1,7 ms** | Medido (proxy) |
| APK/AAB | Pendiente | Pendiente | Pendiente (R8 + shrinkResources activos) | Pendiente |
| Arranque en frío hasta Hoy (promedio / peor) | Pendiente | Pendiente | Pendiente | Pendiente |

- **Hermes**: confirmado. `hermesEnabled=true` en el prebuild y no hay `jsEngine` en `app.json`.
- **Bundle sin comprimir**: `android.enableBundleCompression=false`, explícito.
- **R8 y shrinkResources**:
  - Los paquetes nativos traen sus reglas de consumidor, y el `proguard-rules.pro` generado ya conserva reanimated y turbomodule.
  - Hay que probar el build de release completo con `docs/perf/SMOKE.md`, en especial Google Sign-In, Skia y audio. Si algo falla solo en release, se agrega `extraProguardRules`.
- **Sin precarga de medios (3.9)**:
  - Ni `Image.prefetch` ni `Asset.loadAsync` al arrancar.
  - Los sonidos se crean al montar el reproductor (`prepararSonido`).
  - Los clips solo se crean en `Clip`, que Hoy no monta.
  - Las fotos de Hoy se cargan al pintarse.
  - Lo único que queda al arrancar es **registrar** las 384 imágenes de `media/registry.ts`, que no las decodifica (ver P-R3-3).

## 6. Propuestas en espera de aprobación

| ID | Propuesta | Beneficio esperado | Riesgo |
|---|---|---|---|
| P-R3-1 | **MMKV** en lugar de AsyncStorage | Lecturas síncronas: se quita el spinner y el tramo `storage-ready` | **Alto**: los datos de los usuarios en revisión viven en AsyncStorage. Requiere migración probada y reversible (copiar, verificar, conservar el original), fuera de esta fase |
| P-R3-2 | `lazyImports: true` en `babel.config.js` | Menos evaluación al arrancar en `src/ui` y `node_modules` | Medio: cambia el orden de los efectos de módulo. Hay que medirlo en el teléfono con las marcas y pasar SMOKE completo |
| P-R3-3 | Registro de imágenes perezoso (`() => require(...)` en `generar_registry.py`) | 384 `registerAsset` fuera del arranque | Bajo, pero toca el generador de medios y `fuente()` |
| P-R3-4 (H-26) | `expo-system-ui` | Ninguno para el parpadeo: el prebuild ya pone `windowBackground` `#1B1C1E` sin él | **Cambio visible**: fuerza el modo oscuro en los diálogos nativos. Se probó y se revirtió; solo si el dueño quiere ese cambio |
| P-R3-5 | Big Shoulders 800 aparece dos veces (Skia en `TextoDeParticulas` + `expo-font` nativo) | −105 KB de APK | Bajo: Skia necesita el archivo; habría que leerlo del asset nativo |
| P-R3-6 | H-27: `assetBundlePatterns: ["**/*"]` y el jpg duplicado | Menos peso de APK | Bajo |

## 7. Verificación

- `npx tsc --noEmit`: 0 errores.
- `npm run lint`: 0 errores. Los avisos son del React Compiler y de `exhaustive-deps`, trabajo de R4.
- `npm run lint:color`, `npm run lint:capas`: OK.
- `npm run test:unit` (Jest): 87/87, con 9 de equivalencia del catálogo y 2 de `multiGet`.
- Suites esbuild (`player`, `engine`, `ui`, `rutinas`, `borrarTodo`, `detalleRutina`, `detallePrograma`, `musculos`, `aprender`, `perfil`, `ajustes`): todas en verde.
- `npm run circulares`: 0 ciclos.
- `npm run muerto` (knip): sin hallazgos. `Logros` va marcado `@public` porque se carga por `getComponent`.
- `expo-doctor`: los mismos 2 fallos de red que en R1 y R2.
- Claves de almacenamiento, formato de los datos, textos, estilos y orden de pantallas: sin cambios.
