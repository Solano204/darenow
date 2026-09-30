# DARENOW · R5 Listas, imágenes y video

Objetivo: scroll fluido en las listas largas, imágenes que pesen lo justo y clips que no se coman la
memoria. Nada se mueve a internet: todo sigue empaquetado en la app.

## Commits

| Commit | Punto |
|---|---|
| `c7d87d7` | 3.4 · Imágenes WebP por uso, blurhash, `Imagen` y precarga del hero |
| `faf626e` | 3.5 · `ClipEjercicio`, política de players, pósters y clips preparados |
| `ae95095` | 3.1 + 3.2 · FlashList en listas largas y reciclado sin errores |
| `aa56842` | 3.3 · Carruseles virtualizados y snap consistente |
| `b721ebe` | 3.6 · El catálogo revisa sus medios; se borra el duplicado sin uso |

Los medios van primero porque la lista nueva (`recyclingKey`, miniaturas) se apoya en `Imagen`.

## 1. Inventario

### Listas

Listas con datos (no contenido fijo), de más a menos elementos.

| Lista | Pantalla | Antes | Máx. | Orient. | Pegajosos | Animación | Fotos | R5 |
|---|---|---|---|---|---|---|---|---|
| Historial (`Historial.tsx`) | Historial | ScrollView + map de meses y sesiones | sin tope | vertical | sí (`EncabezadoPegado`) | entrada 40 ms en las 8 primeras; riel por scroll | no | **FlashList** |
| Rutina propia (`EditorRutina.tsx`) | EditorRutina | ScrollView + map | ≤190 (en la práctica pocas) | vertical | no | `entering` / `exiting` / `layout` (reordenar) | sí | se queda (ver §2) |
| Selector de ejercicios | EditorRutina (modal) | FlatList | 190 | vertical | no | no | sí | **FlashList** |
| Ejercicios de Explorar | Explorar | Animated.FlatList | 190 | vertical | no | `entering` 8 filas, `exiting`, `itemLayoutAnimation` | sí | **FlashList** |
| Favoritos: ejercicios, músculos, rutinas, tips, programas (`Carrusel`) | Favoritos | ScrollView horizontal + map | ≤190 / 52 / 30+ / 38 / 12 | horizontal | no | `Aparece` i×55 ms **sin tope** | sí | **FlashList horizontal** |
| Ejercicios de un músculo, principal / secundario | DetalleMusculo | View + map dentro del ScrollView | 44 / 65 | vertical | no | `Entrada` 8 primeras | sí | se queda (ver §2) |
| Rejilla de músculos | Explorar | Animated.FlatList de filas de 3 | 52 fichas (37 celdas) | vertical | sí (`EncabezadoPegado`) | ola diagonal 5 filas; `itemLayoutAnimation` | sí | **FlashList** (2 tipos de celda) |
| Mis rutinas (cabecera de Rutinas) | Explorar | View + map en la cabecera | sin tope | vertical | no | pulso de la recién creada | sí | se queda (pocas, dentro de la cabecera) |
| Tips | Aprender | Animated.FlatList | 38 | vertical | no | `entering` 3 primeras | sí | **FlashList** |
| Glosario + FAQ | Aprender | Animated.ScrollView + map | 32 + 18 | vertical | sí (letra, `EncabezadoPegado`) | no | no | se queda (ver §2) |
| Rutinas de Explorar | Explorar | Animated.FlatList | 30 | vertical | no | `entering` 4, `exiting`, `itemLayoutAnimation` | sí (parallax) | **FlashList** |
| Mitos | Aprender | Animated.FlatList | 20 | vertical | no | sello y tachón al verse (una vez) | sí | **FlashList** |
| Logros | Logros | ScrollView + map | 20 | vertical | no | no | no | se queda (≤20) |
| Opciones de onboarding, equipo en Ajustes, FAQ, errores, nutrición, retos | varias | ScrollView / View + map | ≤20 | vertical | no | varias | pocas | se quedan (cortas y fijas) |
| Tu rutina de hoy (`EditorAntesDeEmpezar`) | Reproductor | ScrollView + map | catálogo ≤14 | vertical | sí (`stickyHeaderIndices`, total) | `Entrada` 4 | sí | se queda |
| Programas de Explorar | Explorar | Animated.FlatList | 12 | vertical | no | `entering` 4 | sí | **FlashList** (misma familia que las otras) |
| Carruseles de Hoy, ficha, programa, relacionados | Hoy, ficha, DetallePrograma, tip/mito | FlatList / ScrollView horizontal | ≤6 | horizontal | no | profundidad/parallax por scroll | sí | se quedan (≤10); snap consistente |

### Clips

| Dónde | Players a la vez | ¿Solo? | ¿Pausa al salir? (antes → R5) |
|---|---|---|---|
| Ficha de ejercicio (`HeroEjercicio`) | 1 por ficha. Antes **N con N fichas apiladas** (alternativas, músculo → ficha → ficha…) | sí, en bucle y mudo | **no** (seguía decodificando tapada, H-04) → pausa y suelta el video en `blur`; al volver lo carga de nuevo |
| Reproductor (`ModeloEjercicio`) | 1 (más 1 preparado en el descanso) | sí, en trabajo, prepárate y cambio de lado; congelado en pausa | se desmonta en el descanso; ahora también pausa en segundo plano |
| Listas y carruseles | 0 (siempre foto) | — | — |

### Imágenes (originales, antes de R5)

Todas eran JPEG progresivos.

| Tipo | Archivos | Resolución | Peso | Dónde se ve |
|---|---|---|---|---|
| Ejercicio | 190 | 800 × 389–800 (algunas verticales) | 3 425 KB | miniatura de 50–72 dp en listas; póster del clip |
| Músculo (render) | 52 (+1 duplicado) | 800 × 437 | 1 487 KB | rejilla de 3 columnas, ficha |
| Rutina | 30 | 800 × 423 | 965 KB | tarjetas y hero (Skia) |
| Programa | 12 | 800 × 423 | 416 KB | tarjetas y hero (Skia) |
| Tip / alimentación | 52 | 800 × 423 | 1 783 KB | tarjetas, miniaturas y hero (Skia) |
| Mito | 20 | 800 × 423 | 437 KB | miniatura 72 dp y hero (Skia) |
| Motivación | 21 | 800 × 423 | 407 KB | Bienvenida |
| Fondo (hero) | 5 | 447 × 800 / 800 × 423 | 120 KB | onboarding, Bienvenida (Skia) |

No hay «modelos transparentes»: el código acepta un `<id>_recorte`, pero ningún archivo existe.

## 2. Listas: qué se migró y qué se quedó

**Se migraron a FlashList 2.0.2**, la versión que trae Expo SDK 57, compatible con la nueva
arquitectura; no hizo falta Legend List:

- los ejercicios, rutinas y programas de Explorar;
- la rejilla de músculos;
- los tips y los mitos;
- el selector de ejercicios del editor;
- el historial;
- los carruseles de Favoritos.

La base común está en `src/ui/components/listaVirtual.tsx`:

- `ListaAnimada`, que acepta el `onScroll` de Reanimated;
- `EntradaUnaVez`;
- `useFundidoAlCambiar`;
- `useReinicioPorId`;
- `useUnaVez`.

**Historial.** Es la lista que crece sin tope. `PantallaColapsableLista` es el mismo marco que
`PantallaColapsable` (título que colapsa, textura, rellenos) con una FlashList. Meses y sesiones son
dos tipos de celda (`getItemType`).

- El encabezado pegajoso sigue siendo `EncabezadoPegado`: se pega bajo la cabecera colapsable, algo
  que `stickyHeaderIndices` no hace. Lee la posición de cada mes con `getLayout` en
  `onCommitLayoutEffect`.
- El riel se llenaba sumando los `onLayout` del mes y de las filas de arriba. Ahora cada fila lee su
  posición en pantalla con `measure` en el worklet: la misma cuenta (`y + 60 % de la ventana` contra
  la posición del nodo), sin depender de las filas vecinas.

**Músculos.** Se quedan las filas de 3 calculadas (`armarFilas`) en lugar de `numColumns`: los
encabezados de región ocupan el ancho completo y cada fila tiene un alto calculado. Así el encabezado
pegajoso sigue exacto. Filas y encabezados son dos tipos de celda.

**Se quedaron como estaban:**

- **Glosario + FAQ** (50 filas de solo texto). Virtualizarlo no ahorra casi nada. Su encabezado de
  letra pegado bajo la cabecera de Aprender funciona como el de músculos.
- **Ejercicios de un músculo** (hasta 65). Es una pantalla de contenido: un `ScrollView` con secciones
  (hero, función, relaciones, dos subgrupos). Una FlashList dentro de un `ScrollView` no virtualiza.
  Convertir la ficha entera en lista cambiaría su estructura. Queda como candidato si el Profiler lo
  señala.
- **Editor de rutina.** Sus filas usan `entering`/`exiting`/`layout` de Reanimated para reordenar;
  FlashList no los admite. Una rutina propia tiene típicamente menos de 20 ejercicios.
- Listas cortas y fijas (≤20) y los carruseles de ≤10 elementos.

## 3. Reciclado y animaciones de entrada

FlashList reusa las celdas: una fila que sale de pantalla recibe otro elemento. Se revisó cada fila.

| Qué | Riesgo | Decisión |
|---|---|---|
| Presión (`presion`, shared value) en `FilaEjercicio`, `TarjetaRutina`, `TarjetaPrograma`, `TarjetaArticulo` | quedar «hundida» con el estado de la fila anterior | `useReinicioPorId(id, presion)` |
| Estrella de favorito (`EstrellaDe`) | animar el relleno como si la hubieran tocado al pasar a un elemento favorito | `key={tipo/id}`: la estrella empieza de cero |
| Foto (`FotoOscura`) | ver la foto anterior; esqueleto oculto | `recyclingKey={id}` (lo pone `Imagen`); el esqueleto se reinicia en el render al cambiar el id |
| `TextoDesvanecido` (tips) | degradado medido para el texto anterior | reinicio en el render al cambiar el texto |
| Fila de mito (sello, tachón, líneas medidas) y de historial (riel, alto) | mucho estado interno | `key={id}` en `renderItem`: la fila se monta de nuevo y la lista sigue virtualizada |
| Entradas de las primeras filas | repetirse al volver arriba o al reciclar | `EntradaUnaVez` / `useUnaVez` con un `Set` de ids por lista: una vez por elemento en la sesión de la app |
| Ola de la rejilla de músculos | repetirse al reciclar | `FichaEnOla` con el mismo `Set` |
| Salidas y reacomodos al filtrar (`exiting`, `itemLayoutAnimation`) | FlashList no los admite; los de Reanimated saltan con celdas recicladas | **fundido simple de 150 ms** de la lista al cambiar el resultado (`useFundidoAlCambiar`), como pide la consigna |
| `Aparece` del carrusel de Favoritos (i×55 ms sin tope: la tarjeta 40 aparecía a los 2,2 s) | — | solo las 6 primeras, una vez |

Prueba en Jest (`tests/unit/renders/reciclado.test.tsx`), con la FlashList real, filas de 100 y
ventana de 900:

- Scroll rápido por los 190 ejercicios (pasos de 450 px), marcando o desmarcando un favorito en cada
  paso.
- Cada fila montada muestra su foto, su `recyclingKey` y su favorito.
- Se ven los 190.
- Nunca hay más de 40 filas montadas.
- No se monta ningún player en la lista.

## 4. Imágenes

`scripts/optimizar-imagenes.ts` (`npm run imagenes`), con sharp y blurhash como dependencias de
desarrollo:

- **WebP calidad 80**, a 800 px de ancho como máximo. Es la resolución de los originales y ya cubre
  el mayor tamaño en pantalla; nunca se agranda. Diferencia contra el JPEG en una muestra de 60:
  PSNR ≈ 42 dB, sin diferencia visible.
- **Miniaturas** (`-mini`) para ejercicios y músculos: lado corto de 192 px (64 dp a densidad 3),
  calidad 75. `Imagen` las usa cuando el recuadro mide ≤ 64 dp.
- **Blurhash** 4×3 por foto en `src/data/indice/blurhash.json` (19 KB), junto al índice del catálogo.
  `Imagen` lo pone como `placeholder`. `FotoOscura` lo quita (`placeholder={null}`) porque el diseño
  ya pinta su esqueleto encima.
- Los **originales** viven en `media-fuente/img/`, excluidos de Metro por `metro.config.js`. La app
  solo empaqueta lo generado. El script vuelve a escribir `src/media/registry.ts` con
  `generar_registry.py` y borra las salidas sin original.

| Tipo | Antes (JPEG) | Después (WebP) | Miniaturas |
|---|---|---|---|
| Ejercicio | 3 425 KB | 1 848 KB | 461 KB |
| Músculo | 1 487 KB | 580 KB | 143 KB |
| Rutina | 965 KB | 560 KB | — |
| Programa | 416 KB | 258 KB | — |
| Tip / alimentación | 1 783 KB | 1 035 KB | — |
| Mito | 437 KB | 219 KB | — |
| Motivación | 407 KB | 174 KB | — |
| Fondo | 120 KB | 61 KB | — |
| **Total** | **9 040 KB** | **4 735 KB (−48 %)** | +604 KB → **5 339 KB (−41 %)** |

**Tratamiento de color horneado (3.4.3): no aplica a las listas.** Las filas y tarjetas ya no usan
Skia: `FotoOscura` es `expo-image` con la foto al 80 % sobre `gomaAlta`, así que no hay filtro que
quitar. El tratamiento con Skia (`FotoTratada`) queda solo en los heroes a sangre: rutina, programa,
tip, mito, Bienvenida, onboarding.

- Para ellos, `useImagenSkia` decodifica cada foto una vez y guarda las 4 últimas (≈ 1,4 MB cada una),
  para que la memoria quede acotada aunque se abran 20 fichas (H-12).
- `precargarSkia` la decodifica al **presionar** la tarjeta (`onPressIn`) de rutina, programa, tip o
  mito.
- La fila de ejercicio precarga el póster de su ficha.
- Al cargar la lista de ejercicios se precargan solo las 10 miniaturas siguientes.

**Todas las imágenes pasan por `Imagen`** (`src/ui/components/Imagen.tsx`):

- `cachePolicy="memory-disk"`, `transition={150}`, `contentFit="cover"`, `recyclingKey`, blurhash;
- `Foto`, `FotoOscura`, `HeroEjercicio`, `TarjetaEnfoque` y el póster de `ClipEjercicio` la usan.

Excepción: la textura `goma-tile.png` sigue con `Image` de React Native porque necesita
`resizeMode="repeat"`, que `expo-image` no tiene.

Capturas lado a lado (original a la izquierda, WebP a la derecha) en `docs/perf/r5-capturas/`:

- `miniaturas.jpg`: 5 ejercicios a 192 px;
- `heroes.jpg`: rutina, programa y tip a 800 px;
- `musculos.jpg`: 3 renders.

No se ve diferencia. Falta la comparación en el teléfono.

## 5. Clips

`scripts/optimizar-clips.ts` (`npm run clips`), con ffmpeg-static:

- **Pósters:** el primer fotograma de cada clip, WebP q80 a 854 × 480: 190 pósters, 1 529 KB. Antes el
  póster era la foto del ejercicio, que es **otra imagen** (otra pose). Al empezar el video había un
  salto; ahora el póster es el mismo cuadro con el que arranca.
- **Recodificación:** se prueba H.264 perfil main, CRF 28, 24 fps, sin audio (`-an`), `+faststart`,
  480 p como máximo. Solo se usa si ahorra al menos un 10 %. **Ningún clip lo logra** (el mejor ahorra
  ~5 %), porque los originales ya son:
  - 854 × 480, H.264 High, 24 fps;
  - mudos (0 de 190 con pista de audio);
  - con `faststart` (190 de 190);
  - de ~140 kb/s (~173 KB por clip).

  Recodificarlos solo perdería calidad. Se empaquetan tal cual, byte a byte, así que no hay nada que
  comparar lado a lado.

| | Antes | Después |
|---|---|---|
| Clips | 190 · 32 787 KB | 190 · 32 787 KB (sin cambios) |
| Pósters | — (foto del ejercicio) | 190 · 1 529 KB |

**Política de players:**

- `ClipEjercicio` es el único componente de clip.
- Todo player se crea y se suelta en `src/media/players.ts`.
- Con `EXPO_PUBLIC_PERF=1`, cada cambio imprime `[players] vivos N · reproduciendo M`
  (`adb logcat -s ReactNativeJS | grep "\[players\]"`).
- En el descanso, el reproductor deja **preparado y pausado** el clip de lo que viene (la misma serie o
  el siguiente ejercicio, igual que decide la máquina). Al mostrarse lo toma y empieza sin espera. No
  cambian ni los tiempos ni el orden de la sesión: la línea de tiempo de 5 min de R4 sigue idéntica.

Pruebas:

| Prueba | Resultado |
|---|---|
| `clips.test.tsx`: ficha sobre ficha | solo reproduce la de arriba; la de abajo, en pausa y con el video soltado; al volver, la de abajo sigue y la de arriba se libera |
| `temporizador.test.tsx`: 5 min del reproductor | nunca más de 1 reproduciendo ni más de 2 vivos; en el descanso hay 1 preparado en pausa |

## 6. FPS, memoria y tamaño

| Medida | Antes (R4) | Después (R5) | |
|---|---|---|---|
| Export Android (`expo export`, todo) | 56 869 KB | 55 017 KB | **−3,3 %** |
| Imágenes en el export (deduplicadas por Metro) | 8 868 KB | 6 745 KB (con pósters) | −24 % |
| Clips en el export | 32 496 KB | 32 496 KB | = |
| `.hbc` | 5 594 456 B | 5 889 446 B | +295 KB (FlashList, blurhash, código nuevo) |
| FPS UI/JS en Explorar (190), músculos, mitos, glosario, historial | — | — | **pendiente en el teléfono** |
| Memoria tras 5 scrolls + 20 fichas | — | — | **pendiente en el teléfono** |
| AAB / APK | — | — | **pendiente** (`scripts/build-local-aab.sh`) |

El export es la mejor aproximación sin build nativo: el AAB lleva los mismos assets, sin comprimir los
medios.

## 7. Verificación

| Chequeo | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npm run lint` | 0 errores, 0 avisos |
| `npm run test:unit` | 131 pruebas OK |
| Pruebas de `test:*` (player, engine, ui…) | 463 OK |
| `lint:color`, `lint:capas`, `circulares`, `muerto` (knip) | OK |
| `npm run catalogo` (con la revisión de medios) | OK: referencias completas, 0 sin uso |
| `expo-doctor` | 19/21: los mismos 2 fallos de red de R1–R4 |

**Reglas del proyecto:**

- `babel-preset-expo` en `devDependencies`: sí.
- `expo-image` fuera de `plugins`: sí.
- `legacy-peer-deps=true`: sí.
- Sin `sdkVersion`: sí.
- `merge: true` al ir a pestañas: sí (el nuevo «Explorar» de Favoritos ya lo usaba).

**Pendiente en el teléfono:**

- FPS UI/JS en las 5 listas (3 corridas).
- Memoria tras 5 scrolls y 20 fichas.
- Contador de players en release.
- Reciclado a mano: scroll rápido marcando favoritos.
- Capturas de clips y heroes en el teléfono.
- Tamaño del AAB.
- SMOKE completo en modo avión.

## 8. Assets sin uso

- `build-catalogo` falla si un ejercicio apunta a una imagen o un clip que no existe, o si un
  original no tiene su versión empaquetada. Avisa de los originales que nadie usa.
- Resultado: **solo `deltoide_posterior..jpg`** (el duplicado de H-27), borrado.
- Las 6 fuentes incrustadas existen y se cargan.
- `assets/data/50_packs_manifest.json` y `assets/brand/logo-master.png` no se empaquetan (nadie los
  importa desde la app) y se quedan: el primero documenta el CDN previsto y el segundo lo usa
  `scripts/generar-iconos.js`.

## 9. Pendiente y observaciones

- **Dos `position: absolute` con porcentaje**, anteriores a esta serie (solo se movieron en R2):
  - `TarjetaEnfoque.tsx:125` (`height: '62%'`);
  - `BarraProgresoSesion.tsx:78` (`left: '50%'`).

  Rompen la regla del proyecto para Android. No se tocaron en R5 porque cambiar su valor es un cambio
  de diseño: queda para decidir.
- Ejercicios de un músculo (hasta 65) y editor de rutina: se quedan sin virtualizar (ver §2).
- `ANIMADOS` y los `Set` de entradas viven en memoria mientras la app está abierta (unos cientos de
  ids).
