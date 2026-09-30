# DARENOW · R4 Renders y estado

Objetivo: que tocar un chip, marcar un favorito o dejar correr el reloj de la sesión vuelva a dibujar solo lo
que cambió. Sin cambios de texto, diseño ni comportamiento; lo guardado en el teléfono conserva claves y formato.

## Commits

| Commit | Punto |
|---|---|
| `6474592` | 2 · Perfilado de re-renders (línea base, `tests/unit/renders/`) |
| `6f939d3` | 3.1 · React Compiler activo; reglas del compilador como error |
| `77df7a5` | 3.2 · Estado global en un store con selectores (Zustand) |
| `89d0d44` | 3.3–3.4 · Derivados; efectos y `exhaustive-deps` sin supresiones |
| `dac5de0` | 3.5 · Keys estables en listas que cambian |
| `9c900b8` | 3.6 · Filas `memo` con props estables; favoritos por estrella |
| `2b13a10` | 3.7 · Búsqueda y filtros de Explorar diferidos, sin re-renderizar la pantalla |
| `cd3d59d` | 3.8 · Reproductor: el segundo a segundo solo en componentes hoja |
| `edc054b` | 3.9 · Estadísticas del historial una vez por cambio de datos |
| `9cd5410` | 3.9 · Filas de Ajustes memorizadas por el compilador |

## 1. Cómo se midió

No hay teléfono en este entorno, así que los re-renders se cuentan con un **harness en Jest**
(`tests/unit/renders/`):

- Un `__REACT_DEVTOOLS_GLOBAL_HOOK__` falso cuenta cada fibra que de verdad se volvió a dibujar
  (bandera `PerformedWork`). Es la misma señal que usa el Profiler de React DevTools.
- La app se monta completa: proveedores, navegador y store, con los nativos simulados (Skia, video, audio,
  voz y háptica).
- **app** cuenta solo los componentes de `src/`. **total** incluye también los de React Native y las
  librerías.
- **ms** es el tiempo de render de React en Node. Sirve para comparar antes y después, no como tiempo del
  teléfono.
- Para repetir la grabación: `RENDERS_SALIDA=archivo.json npx jest tests/unit/renders/interacciones`.
  Las grabaciones de cada paso están en `docs/perf/renders/`:
  - `antes.json`
  - `compilador.json`
  - `store.json`
  - `listas.json`
  - `filtros.json`
  - `reproductor.json`
  - `despues.json`

Los 6 escenarios de R1 quedan cubiertos así:

| Escenario de R1 | Grabación |
|---|---|
| 1 Hoy | `montarHoy` |
| 2 Explorar | `chips`, `buscador`, `favorito` |
| 3 Ficha | `montarFicha` |
| 4 Reproductor | `reproductor30s` |
| 5 Aprender, Mitos | `aprenderMitos` |
| 6 Yo, Ajustes | `montarYo`, `ajustesDias` |

Las 5 interacciones que pide R4:

| Interacción | Grabación |
|---|---|
| 3 chips | `chips` |
| Teclear «sentadilla» | `buscador` |
| Favorito sí/no | `favorito`, `favorito4pestanas` |
| 30 s del reproductor en Trabaja | `reproductor30s` |
| Días por semana en Ajustes | `ajustesDias` |

## 2. Re-renders antes / después

| Grabación | app antes | app después | Menos | total (con RN) | commits | ms (Node) |
|---|---|---|---|---|---|---|
| chips (3 toques) | 249 | 216 | 13 % | 2097 → 1443 | 7 → 13 | 168 → 96 |
| buscador («sentadilla», 10 teclas) | 386 | 141 | 63 % | 3343 → 861 | 13 → 24 | 106 → 66 |
| favorito (sí/no, en Explorar) | 86 | **4** | 95 % | 718 → 16 | 4 → 3 | 34 → 1 |
| favorito con las 4 pestañas montadas | 1084 | **50** | 95 % | 6044 → 250 | 5 → 3 | 241 → 24 |
| reproductor 30 s en Trabaja | 510 | 240 | 53 % | 2700 → 450 | 30 → 31 | 122 → 24 |
| Ajustes: días por semana | 306 | **46** | 85 % | 1383 → 205 | 2 → 2 | 21 → 12 |
| montar Hoy | 820 | 299 | 64 % | 4764 → 1733 | 5 → 3 | 289 → 161 |
| montar ficha de ejercicio | 257 | 132 | 49 % | 1154 → 612 | 4 → 3 | 93 → 58 |
| Aprender → Mitos | 266 | 264 | 1 % | 1478 → 1474 | 1 → 1 | 112 → 97 |
| montar Yo | 348 | 197 | 43 % | 1541 → 968 | 2 → 2 | 77 → 67 |

Lo que se dibuja ahora en cada interacción:

- **Favorito:** solo la estrella tocada (`EstrellaDe` → `EstrellaFavorito`, 2 renders por toque). Con las
  4 pestañas montadas aparecen además las estrellas del mismo elemento en otras pantallas y los contadores
  de favoritos de Yo. Ni la fila ni la lista ni las pantallas se vuelven a dibujar.
- **Chip:** el chip que cambia, el contador y la lista de resultados. Los 24 `FilaEjercicio` son filas que
  **entran** (el filtro trae otros ejercicios), no filas repetidas. Hay más commits porque el chip se
  marca en un commit urgente y la lista llega en uno diferido.
- **Buscador:** cada tecla dibuja solo el campo (`BuscadorExplorar` y `BuscadorVivo`, 10 renders). La
  lista y el contador se filtran con el valor diferido. Por eso hay más commits: el urgente del campo y el
  de la lista, que React puede saltar si llega otra tecla.
- **Reproductor:** por segundo se vuelven a dibujar 8 componentes hoja, que no pintan nada caro:
  - `NumeroSesion`, `NumeroTemporizador` y `Odometro` (el número);
  - `BarraSesionViva`, `BarraProgresoSesion` y una sola `Placa` (la barra de la serie en curso);
  - `RelojAtmosfera` y `SonidoDeSesion` (efectos, `return null`).

  `ReproductorLayout`, el Canvas y el clip ya no se vuelven a dibujar por segundo, solo al cambiar la
  fase, la serie o el ejercicio.
- **Ajustes:** las placas de días, el contador y la sección «Tu plan». Antes eran las 43 filas.
- **Aprender → Mitos:** es un montaje de lista nueva (todo lo que aparece es nuevo); no había trabajo que
  quitar.

## 3. React Compiler

- Activo en `app.json` con `experiments.reactCompiler: true`. En Jest se activa con la misma opción de
  `babel-preset-expo` (`supportsReactCompiler`); `SIN_COMPILADOR=1` lo apaga para comparar.
- Las reglas del compilador de `eslint-plugin-react-hooks` 7 están como **error**:
  - `refs`
  - `immutability`
  - `set-state-in-effect`
  - `purity`
  - `use-memo`
  - `exhaustive-deps`

  Ya no existe `eslint-suppressions.json`.
- `node scripts/perf/compilador.js`: **423 componentes y hooks compilados; 2 fuera.**

| Fuera del compilador | Por qué |
|---|---|
| `ui/hooks/useTick.ts` (`'use no memo'`) | El «tick» cambia en cada render a propósito, para que `useAnimatedStyle` vuelva a crear su mapper (el comentario del hook explica el estilo congelado que evita). Compilado, dejaría de cambiar. Quitarlo es R6 (H-03). |
| `ui/components/PantallaColapsable.tsx` (`'use no memo'`) | `contenido` y `superposicion` son render props que reciben `desplazarA`, que usa la ref del scroll. Solo la llaman manejadores, pero el compilador no puede saberlo. Es un marco sin estado propio. Ajustes saca su contenido a `CuerpoAjustes` para que sus filas sí se memoricen. |

Única excepción de lint en reglas de hooks: `useExplorar.tsx:68` (`set-state-in-effect`). El segmento
llega por parámetro de navegación (`navigate('Explorar', { tab })` con `merge: true`). Sincronizarlo es un
efecto de sistema externo; está documentado en el código.

`useMemo` y `useCallback` se dejaron donde estaban; no se borraron en masa.

Costo: el `.hbc` de Android pasa de 5 275 599 B (R3) a **5 590 419 B (+6 %)** por las cachés de memo que
inserta el compilador.

## 4. Stores y contextos

| Estado | Antes | Ahora |
|---|---|---|
| Estado global (`forja:v1`) | Un contexto con todo el estado; cada cambio re-renderizaba a sus 22 consumidores | `useTienda`, store de Zustand en `src/state/tienda.ts`. Se lee con selectores (`useEstadoSel`, `usePerfil`, `useSesiones`, `useRutinasPropias`, `useEsFavorito(tipo, id)`); `useShallow` cuando se leen varios valores |
| Acciones | Funciones dentro del `value` del contexto (cambiaban de identidad) | Funciones de módulo en `src/state/acciones.ts`, siempre estables |
| Filtros de Explorar | `useState` en la pantalla | `src/features/explorar/hooks/filtrosExplorar.ts` (Zustand). Cada chip y el contador leen su trozo |
| Reproductor | `useReducer` en `useSessionPlayer`, que re-renderizaba la pantalla por segundo | Un store por sesión (`createStore`). La pantalla lee la estructura (fase, ejercicio, serie, lado, series hechas); el tiempo lo leen las hojas con `useTiempoSesion` o `useDeSesion` |
| Voz del reproductor | Refs y estado mezclados en la pantalla | `crearControladorVoz` con `useSyncExternalStore` |

Contextos que quedan, pequeños y con valores estables: cuenta, anuncios, magnesia, háptica y voz.

**Persistencia sin cambios:**

- Misma clave `forja:v1`.
- Mismo JSON de `Estado`, sin el envoltorio `{ state, version }` de `persist`, que no se usa.
- Misma lectura con sus rellenos.
- Mismo guardado agrupado (350 ms) y el mismo volcado al pasar a segundo plano.

`tests/unit/persistencia.test.ts` (7 pruebas) carga un estado guardado por la versión anterior y comprueba
que se lee igual y se vuelve a guardar con el mismo formato. `CLAVE_SESION_EN_CURSO` guarda el mismo
`{ items, estado, guardadoEn }`.

## 5. Efectos

- Inventario: `node scripts/perf/efectos.js`, **184 `useEffect`**.
- 135 avisos de `exhaustive-deps`/compilador suprimidos → **0**:
  - 67 se resolvieron añadiendo dependencias estables (setters, shared values, funciones de módulo), sin
    cambiar cuándo corre el efecto.
  - 67 pasaron a `useEffectEvent` (el efecto corre con las mismas dependencias de antes y lee lo demás
    fresco).
  - Uno se reescribió con `claveRecorrido` (`Odometro`).
  - Ninguno se silenció.

| Tipo | Cuántos | Qué se hizo |
|---|---|---|
| Animación (Reanimated / Animated) | 115 | Sincronización con el hilo UI: se quedan, con `cancelAnimation` al limpiar donde aplica |
| Temporizador | 14 | Se quedan, con `clearTimeout`/`clearInterval` |
| Sonido, voz, vibración | 9 | Se quedan; en el reproductor pasan a `SonidoDeSesion` (ver §7) |
| Suscripción (AppState, teclado, listeners) | 7 | Se quedan, con `remove()` |
| Almacenamiento | 6 | Se quedan |
| Navegación o sistema | 2 | Se quedan (uno con la excepción documentada en §3) |
| Otros | 31 | Revisados uno por uno |

Ejemplos de efectos que eran acciones del usuario o valores derivados:

- **Acceso con Google:** el login corría en un efecto que miraba el resultado; ahora va en el manejador
  (`iniciar()` devuelve el perfil).
- **`VistaPreviaMeta`:** `sellado` era estado sincronizado por un efecto; ahora es un valor derivado.
- **`useHoy`:** `ultimaVezDe` se deriva de `sesiones` con `ultimaVezEn`, sin estado propio.
- **`GuiaRespiracion`:** guarda su `inhala` (antes era un `setState` que re-renderizaba el layout entero
  cada 4 s, H-24).

## 6. Listas y keys

- Filas en `memo` sin comparador propio, con callbacks por id (`onPress(id)`):
  - las tarjetas de Explorar y Hoy;
  - `TarjetaEjercicioMini`, `FichaMusculo`, `TarjetaArticulo` y `TarjetaAlternativa`.
- `renderItem` y `keyExtractor` fuera del JSX.
- La estrella de cada fila es `EstrellaDe({ tipo, id })` y se suscribe a su propio favorito.
- Keys por contenido en listas que cambian: avisos, chips de `SelectorEjercicio`, FAQ.
- **Keys por índice que quedan (28, en listas estáticas que nunca se reordenan):**
  - `CuerpoLectura`, `PreguntaAcordeon`, `VistaAlimentacion`: párrafos fijos del texto.
  - `ListaErrores`, `RejillaDetalles`, `ListaClaves`, `PasosLineaTiempo`: pasos y claves de un ejercicio.
  - `EstadisticasHoy`, `EstadisticasPerfil`, `VistaPreviaMeta`, `ResumenSesion`: celdas fijas.
  - `CalendarioHuellas`: 7 iniciales y las celdas del mes, por posición.
  - `MapaCarga`, `PerfilRutina`, `BarraProgresoSesion`, `BarraRutinaTarjeta`, `NivelPlacas`, `PlacaMedalla`,
    `Huella`, `Odometro`: placas y trazos por posición.

## 7. Búsqueda (3.7) y reproductor (3.8)

**Búsqueda.**

- `scripts/build-catalogo.ts` genera `src/data/indice/busqueda.json` con los textos ya normalizados.
- Los filtros son funciones puras (`features/explorar/utils/filtrar.ts`).
- El campo responde en cada tecla. La lista usa `useDeferredValue`, sin debounce: no hizo falta.
- El chip se marca al instante (commit urgente) y la lista llega diferida.
- Aprender filtra con `useDeferredValue(q)`.
- `tests/unit/busqueda.test.ts` (21 pruebas): 10 búsquedas y 10 combinaciones de filtros dan exactamente
  los mismos resultados que el código de antes.

**Reproductor.**

- Se mantienen:
  - la misma máquina (`playerMachine`);
  - el mismo intervalo único de 1 s;
  - las mismas transiciones;
  - el mismo guardado en `CLAVE_SESION_EN_CURSO`;
  - el mismo avance con `Date.now()` al volver de segundo plano.
- Lo que cambia es quién se entera de cada segundo:
  - `NumeroSesion` para el número;
  - `BarraSesionViva` para la placa en curso;
  - `RelojAtmosfera` para el anillo que se vacía, el golpe y la háptica de 3-2-1, el destello de la
    mitad y los anuncios del lector de pantalla;
  - `SonidoDeSesion` para los tonos, la cuenta sonora, la voz y el tic.
- El anillo se anima en el hilo UI a partir de `restanteS` (`withTiming` sobre un shared value). Su
  escala y su brillo son `useDerivedValue`.
- La pantalla completa se vuelve a dibujar solo al cambiar de fase, serie o ejercicio.

**Prueba de precisión** (`tests/unit/renders/temporizador.test.tsx`), con reloj falso:

- 300 s de sesión con estos pasos:
  - pausa en el segundo 20 y reanudar en el 35;
  - omitir en el 60;
  - «Listo» o avanzar en el 90, 150 y 230;
  - segundo plano en el 120 y volver en el 140 (el caso de bloquear la pantalla);
  - pausa en el 200 y reanudar en el 205.
- Cada segundo se anotan:
  - fase, ejercicio, serie, lado;
  - segundos restantes, transcurridos, series hechas;
  - el número en pantalla;
  - todo lo que sonó, vibró o se dijo, en orden.
- La línea de tiempo del código anterior se grabó con la misma prueba desde `HEAD` antes del cambio:
  `tests/unit/fixtures/temporizador-antes.json`.
- **Resultado: idéntica en los 300 segundos, incluido el orden de los 370 eventos.**

## 8. Cálculos pesados (3.9)

- Estadísticas, últimos 7 días, minutos por día y días entrenados se guardan junto al arreglo de sesiones
  (`WeakMap` en `state/derivados.ts`). Hoy, Yo y Bienvenida comparten un mismo cálculo por cada cambio
  de datos; `tests/unit/derivados.test.ts` lo comprueba.
- Logros y retos se evalúan una vez, al guardar la sesión (`guardarSesion`).
- Calendario, `MapaCarga` y `PerfilRutina` ya estaban en `useMemo` por sus datos. Lo demás lo memoriza el
  compilador.
- Lo no urgente (lista filtrada de Explorar y de Aprender) va con `useDeferredValue`, que usa la misma
  prioridad que `startTransition`.

## 9. FPS

Pendiente en el teléfono (build de release, Perf Monitor o Flashlight, escenarios de BASELINE §4). En Node
el tiempo de render por interacción bajó hasta 34× (favorito) y en todas las grabaciones (tabla §2). El FPS de JS, objetivo ≥ 55 y
nunca < 30, solo se puede medir en el dispositivo.

| Escenario | JS FPS prom. antes | después | JS FPS mín. antes | después |
|---|---|---|---|---|
| 1–6 (BASELINE §4) | — | — | — | — |

## 10. Verificación final

| Chequeo | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npm run lint` (reglas del compilador como error) | 0 errores, 0 supresiones |
| `npm run test:unit` (Jest) | 10 suites, 129 pruebas OK |
| `test:player/engine/ui/rutinas/borrarTodo/detalleRutina/detallePrograma/musculos/aprender/perfil/ajustes` | 463 pruebas OK |
| `npm run circulares` / `npm run muerto` / `lint:color` / `lint:capas` | OK |
| Prueba de precisión del temporizador (5 min) | Idéntica a la de antes |
| Persistencia (carga de datos guardados por la versión anterior) | OK |
| `expo-doctor` | 19/21: los mismos 2 fallos de red de R1–R3 (el proxy no deja consultar el esquema ni React Native Directory) |
| `.hbc` Android | 5 590 419 B |

**Pendiente en el teléfono:**

- FPS de JS en release (§9).
- SMOKE completo.
- Prueba de actualización: instalar la versión anterior con datos, actualizar y comprobar que todo sigue.
- Prueba del temporizador con la pantalla bloqueada de verdad durante 5 minutos (la prueba en Jest
  simula `AppState`).

## 11. Pendiente para otras fases

- **`useTick` (H-03), R6.** Sigue como dependencia de `useAnimatedStyle` y fuera del compilador. Quitarlo
  exige resolver antes el estilo congelado que evita.
- **`PantallaColapsable`, R6.** Si deja de pasar `desplazarA` por render prop, puede volver al compilador.
- **`IndiceSecciones` y `EncabezadoPegado` (resto de H-24), R6.** Llaman a `setState` solo cuando cambia
  la sección visible, no en cada frame. Se quedan.
- **Retos, Mediciones e Historial.** Usan también `PantallaColapsable` con contenido en línea. Son
  pantallas de poca interacción; se pueden pasar a un componente como Ajustes si el Profiler lo pide.
