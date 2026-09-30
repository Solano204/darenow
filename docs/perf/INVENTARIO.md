# DARENOW · Inventario de estructura y código (R1)

Fecha: 2026-09-30 · Commit: `48b113b` · Solo lectura: esta fase no cambió código de la app.

## 0. Estado antes de medir

| Chequeo | Resultado |
|---|---|
| `npm ci` (con `.npmrc` legacy-peer-deps) | OK, 557 paquetes. Aviso: `@expo-google-fonts/big-shoulders-display@0.2.3` deprecado (fuente retirada de Google Fonts) |
| `npx tsc --noEmit` | **4 errores, todos en `tests/`**: `tests/player.test.ts` ×3 (`seg` no existe en `Partial<ItemSesion>`), `tests/ui.test.ts` ×1 (comparación `false`/`true` sin traslape). `src/` compila limpio |
| Lint | No hay ESLint configurado. Único lint: `npm run lint:color` → OK |
| `npx expo-doctor` | 19/21. Los 2 fallos son de red del contenedor (schema de config y React Native Directory no alcanzables), no del proyecto |
| Tests (11 suites, esbuild) | 511 pasan, **1 falla ya existente**: `test:aprender` «FORJA» aparece una sola vez en los textos de Aprender (falla igual sin los cambios de R1) |
| Restricciones del proyecto | `babel-preset-expo` en devDependencies ✔ · `expo-image` fuera de `plugins` ✔ · `.npmrc` ✔ · sin `sdkVersion` ✔ |

## 3.1 Estructura

### Árbol (archivos directos · líneas TS/TSX acumuladas)

| Carpeta | Archivos | Líneas |
|---|---|---|
| `/` (raíz) | 19 | — |
| `src/` | 1 (`legal.ts`) | 29 548 total |
| `src/components/` | 6 sueltos + 13 subcarpetas | 19 121 |
| `src/components/ui` | 33 | 3 125 |
| `src/components/fx` | 25 | 2 253 |
| `src/components/explore` | 20 | 1 506 |
| `src/components/session` | 16 | 1 910 |
| `src/components/profile` | 17 | 1 860 |
| `src/components/learn` | 17 | 1 163 |
| `src/components/settings` | 15 | 1 103 |
| `src/components/exercise` | 13 | 1 081 |
| `src/components/routine-detail` | 11 | 1 227 |
| `src/components/muscles` | 11 | 783 |
| `src/components/hoy` | 12 | 1 004 |
| `src/components/program-detail` | 8 | 570 |
| `src/components/routine-builder` | 7 | 790 |
| `src/screens` | 24 | 4 965 |
| `src/store` | 10 | 1 315 |
| `src/media` | 4 | 1 051 (generados) |
| `src/utils` | 10 | 703 |
| `src/session` | 2 | 533 |
| `src/data` | 4 | 517 |
| `src/engine` | 1 | 506 |
| `src/theme` | 7 | 381 |
| `src/hooks` | 7 | 371 |
| `assets/data` | 22 JSON | 552 KB |
| `assets/img/*` | 390 JPG + 1 PNG | 9,9 MB |
| `assets/video/ejercicios` | 190 MP4 | 32,4 MB |
| `assets/voz/*` | 198 MP3 | 8,4 MB |
| `assets/snd` | 9 MP3 | 52 KB |
| `scripts/` | 6 | — |
| `tests/` | 12 | 1 577 |

### ¿La carpeta de rutas solo tiene rutas?

No hay expo-router: las rutas se declaran en `App.tsx` (React Navigation) y viven en `src/screens/`.
Archivos o exports de `src/screens/` que **no son rutas**:

| Archivo | Qué es |
|---|---|
| `src/screens/PlanListo.tsx` | No es ruta: componente que usa solo `Onboarding.tsx` |
| `src/screens/Yo.tsx` → `Logros` | Segunda pantalla dentro del archivo de otra ruta |
| `src/screens/Onboarding.tsx:34` | Re-exporta lógica (`derivar`, `derivarNivel`, `elegirPrograma`, `avisosDe`) |
| `src/screens/Bienvenida.tsx:50` `partirSaludo` · `Presentacion.tsx:57` `lineasDeTitulo` | Utilidades de texto dentro de pantallas |
| `Acceso.tsx` (3 componentes), `Onboarding.tsx` (3), `EditorRutina.tsx` (2), `Presentacion.tsx` (2) | Subcomponentes definidos dentro del archivo de la pantalla |

Raíz del repo con archivos que no son de la app: `bash.exe.stackdump` (volcado de un crash de Git Bash, versionado), `generar_registry.py`, `generar_voz.py`, `revisar_medios.py`, `textos_voz.json` (scripts de generación sueltos fuera de `scripts/`).

### Archivos de más de 300 líneas

| Líneas | Archivo |
|---|---|
| 592 | `src/store/store.ts` |
| 526 | `src/screens/EditorRutina.tsx` |
| 525 | `src/components/session/ReproductorLayout.tsx` |
| 506 | `src/engine/session.ts` |
| 483 | `src/screens/Ajustes.tsx` |
| 466 | `src/media/registry.ts` (generado) |
| 381 | `src/components/ui/controles.tsx` |
| 370 | `src/screens/Hoy.tsx` |
| 343 | `src/screens/Reproductor.tsx` |
| 318 | `src/session/playerMachine.ts` |
| 311 | `src/screens/Explorar.tsx` |
| 305 | `src/components/routine-detail/RielVertical.tsx` |
| 303 | `src/screens/Presentacion.tsx` |

(Conteo sin la instrumentación de R1.)

### Componentes duplicados o casi duplicados · componentes sin usar

Ver §3.6.

## 3.2 Dependencias y código muerto

### knip

| Tipo | Resultado |
|---|---|
| Dependencias instaladas sin uso | `expo-crypto` |
| Usadas pero no declaradas | `expo-updates`, `expo-system-ui` (knip las infiere de `app.json`; probable falso positivo, verificar en R2) |
| Archivos sin usar | `scripts/contraste.js` |
| Exports sin usar | **96** (constantes de layout, `useAnuncios`, `TarjetaRelacionada`, `SwitchDarenow`, `TituloGrande`, 5 componentes de `ui/controles.tsx`: `BotonRedondo`, `Opcion`, `Contador`, `Interruptor`; 6 de `ui/datos.tsx`: `Fila`, `Insignia`, `Progreso`, `BarrasSemana`, `Esqueleto`, `Titulo`; `NumeroAnimado`, `Vidrio3D`…) |
| Tipos exportados sin usar | 7 |

Salida completa de knip reproducible con `npx knip`.

### Dependencias

| Paquete | Disco | Archivos que lo importan | Uso |
|---|---|---|---|
| @shopify/react-native-skia | 736 MB (binarios) | 18 | Partículas, trazos, fotos tratadas, gráficas |
| expo-image | 134 MB | 5 | Fotos de listas y fichas |
| react-native | 36 MB | 224 | — |
| react-native-reanimated | 12 MB | 151 | Animaciones |
| expo-video | 11 MB | 1 | Clips MP4 (`Clip.tsx`) |
| react-native-screens | 9,5 MB | 0 (vía navegación) | — |
| expo-file-system | 8,2 MB | 1 | Respaldo |
| @expo/vector-icons | 6,5 MB | 50 | **Solo Ionicons** |
| react-native-worklets | 2,9 MB | 0 (vía Reanimated) | — |
| expo | 2,5 MB | 1 | — |
| expo-font / @expo-google-fonts ×2 | 2,5 / 2,1 / 1,6 MB | 1–2 | 6 pesos usados de 23 empaquetados |
| expo-audio | 1,9 MB | 2 | Sonidos y voz |
| async-storage | 0,9 MB | 8 | Estado |
| google-signin | 0,7 MB | 1 | Cuenta |
| expo-blur | 0,5 MB | 5 | **Solo se pinta en iOS** (`Platform.OS === 'ios'`) |
| expo-linear-gradient | 0,4 MB | 18 | Velos |
| expo-speech | 0,4 MB | 1 | Voz de respaldo |
| expo-crypto | 0,8 MB | **0** | Sin uso |
| expo-asset, expo-dev-client, react-native-screens, react-native-worklets | — | 0 directos | Requeridos por plugins / nativos |
| expo-document-picker, expo-sharing | 0,5 / 0,9 MB | 1 | Importar/exportar respaldo |
| expo-haptics, keep-awake, navigation-bar, splash-screen, status-bar | < 0,5 MB c/u | 1–2 | — |

### Conteos de higiene

| Patrón | Ocurrencias | Archivos |
|---|---|---|
| `console.log` | 0 | 0 |
| `console.warn/error` | 0 | 0 |
| `TODO` | 0 reales (2 coincidencias son la palabra «TODO(S)» en español) | — |
| `FIXME` | 0 | 0 |
| `@ts-ignore` / `@ts-expect-error` | 0 | 0 |
| `any` explícito | 8 | 7 (`navigation: any` en 6 pantallas; `e: any` en `EditorRutina.tsx:125`) |
| `eslint-disable` | 0 | 0 |

## 3.3 Patrones que afectan rendimiento

| Patrón | Ocurrencias | Dónde / nota |
|---|---|---|
| `ScrollView` + `.map()` | 30 archivos con ScrollView; los de más `.map`: `EditorRutina` 7, `Presentacion` 6, `Favoritos` 6, `Yo` 5, `DetalleEjercicio` 5, `VistaGlosario` 5 | Listas > 20 elementos en ScrollView: `VistaGlosario` (glosario + FAQ completos), `Favoritos` (sin tope), `Historial` vía `FilaHistorialCompleta` (crece con el uso). El resto son listas cortas y fijas |
| `FlatList` / `SectionList` | 12 en 9 archivos | Ver tabla abajo |
| `key={index}` | 36 en 25 archivos | Casi todos listas estáticas (pasos, claves, celdas de calendario): inofensivo. A revisar: `VistaGlosario.tsx:73` (acordeones con estado), `EditorRutina.tsx:283`, `RutinaPropia.tsx:121` |
| `TouchableOpacity/Highlight` | **0** | 191 usos de `Pressable` en 51 archivos: ya migrado |
| `Platform.OS/select` en línea | 13 en 11 archivos | 5 son `BlurView` solo iOS, 4 `KeyboardAvoidingView behavior`, 1 sombra iOS, 1 NavigationBar Android |
| `Modal` de RN | 6 | `HojaDescartar`, `HojaConfirmacion`, `HojaSalida`, `Anuncio`, `HojaCambiarPrograma`, `EditorRutina:392` |
| `Animated` del core | 2 | ver §3.6 |
| `runOnJS` / `scheduleOnRN` | 33 en 16 archivos | ver §3.6 para los que corren por frame |
| `setInterval` | 3 | `useSessionPlayer.ts:85` (1 s, limpio), `RelojAnuncios.tsx:51` (5 s, limpio, apagado si `ANUNCIOS_ACTIVOS` es false), `Anuncio.tsx:62` (1 s) |
| `setTimeout` | 35 en 33 archivos | ver §3.6 |
| `useEffect` | 192 en 111 archivos | — |
| `<Canvas>` de Skia | 17 archivos | ver §3.6 |
| `withRepeat` (infinito) | 12 en 11 archivos | incluye `Esqueleto` (uno por foto de lista mientras carga) |
| `React.memo` | 5 | Solo `FilaEjercicio`, `FilaMito`, `TarjetaArticulo`, `FilaEjercicioRutina`, 1 en `EditorRutina` |
| `useMemo` / `useCallback` | 104 / 73 | — |
| **`useTick()`** | **103 llamadas en 85 archivos**, 149 arrays de dependencias con `tick` | Hook que cambia en **cada render** y se pasa como dependencia de `useAnimatedStyle`: cada render de React re-crea el mapper del worklet en el hilo UI. Multiplica el costo de cualquier re-render (ver H-03) |
| **`useReducedMotion()`** | **129 archivos** | Cada instancia hace una llamada nativa asíncrona (`isReduceMotionEnabled`) y registra un listener propio. Una fila de Explorar monta 2 (fila + esqueleto de foto) |

### FlatList

| Archivo | Datos | keyExtractor | getItemLayout | renderItem inline | ventana/batch |
|---|---|---|---|---|---|
| `explore/listas.tsx` ×3 | 190 ejercicios / 30 rutinas / 12 programas | ✔ | ✘ | ✔ (los 3) | `initialNumToRender 12`, `windowSize 7`, `removeClippedSubviews false` |
| `learn/ListaMitos.tsx` | 20 mitos | ✔ | ✘ | ✔ | por defecto |
| `learn/ListaTips.tsx` | 52 tips | ✔ | ✘ | ✔ | por defecto |
| `muscles/RejillaMusculos.tsx` | 52 músculos | ✔ | ✔ | ✘ | por defecto |
| `hoy/CarruselHoy.tsx` | ≤ 5 | ✔ | ✔ | ✔ | ✔ |
| `fx/CarruselProfundidad.tsx` | ≤ 5 | ✔ | ✔ | ✔ | ✔ |
| `ui/TarjetaSesionHoy.tsx` | ejercicios de la sesión | ✔ | ✔ | ✔ | ✔ |
| `screens/EditorRutina.tsx:441` | 190 (selector en Modal) | ✔ | ✘ | ✔ | parcial |
| `screens/DetalleEjercicio.tsx` ×2 | músculos / alternativas (horizontal) | ✔ | 1 de 2 | ✔ | ✘ |

En Explorar, `favorito(item.id)` se evalúa con `esFavorito`, cuya identidad cambia con cada cambio de `estado.favoritos`: marcar un favorito vuelve a renderizar la lista entera y, por `useTick`, re-crea el estilo animado de cada fila visible.

## 3.4 Estado global

Librería de estado: **ninguna** (solo Context + `useState`).

| Provider | Guarda | Consumidores | Frecuencia de cambio |
|---|---|---|---|
| `ProveedorEstado` (`src/store/store.ts`) | **Todo**: perfil, favoritos, sesiones, mediciones, racha, logros, retos, tips leídos/guardados, rutinas propias, flags de UI (bienvenida, anuncio, presentación, descargas) + 21 funciones | **22 archivos** (todas las pestañas, fichas, detalle, Reproductor, Resumen, Ajustes, `App.tsx/Raiz`) | Cada favorito, tip leído, sesión, ajuste, veto, «bienvenida vista», etc. |
| `ProveedorCuenta` (`store/cuenta.ts`) | Cuenta (Google/invitado), `cargando` | 4 | Rara vez |
| `ProveedorAnuncios` (`RelojAnuncios.tsx`) | `{ entrenando }` (objeto nuevo en cada render) | 3 (`useSinAnuncios`) | Al mostrar/cerrar intersticial |
| `ProveedorMagnesia` (`fx/MagnesiaOverlay.tsx`) | API de partículas (estable, `useMemo`) | 7 | Nunca |
| `ContextoScroll` (`ui/cabecera.tsx`) | SharedValue del scroll | local | Nunca (SharedValue) |

**Context gigante:** `ProveedorEstado` mezcla datos que cambian seguido (favoritos, tips leídos, sesiones) con datos estables (perfil, flags). El `value` se re-crea con cada cambio de `estado`, y `esFavorito`/`ultimaVezDe` cambian de identidad con `favoritos`/`sesiones`. Como las 4 pestañas siguen montadas (bottom tabs), **un solo toque de favorito re-renderiza Hoy, Explorar, Aprender, Yo, `Raiz`** y cualquier ficha abierta en el stack.

Otras lecturas de AsyncStorage fuera de providers: `store/haptics.ts` (al **evaluar el módulo**), `store/voz.ts`, `store/consentimientoMedidas.ts`, `store/maquina.ts`, `session/useSessionPlayer.ts` (sesión en curso), `store/respaldo.ts`.

## 3.5 Datos y medios

### Catálogo

- 21 JSON en `assets/data/` (552 KB en disco, 489 KB en el bundle), importados de forma estática por `src/data/catalog.ts`.
- **Se evalúa todo al arrancar**: `EJERCICIOS = flatMap` de 10 bloques, 8 índices `Map`, mutación `e.patron` sobre los 190, `ESTADISTICAS` con 2 `filter`. No hay `JSON.parse` en tiempo de ejecución (Metro los inyecta como objetos).
- Filtrado por render: Explorar y Hoy filtran con `useMemo` (bien); Hoy recalcula `sesiones.filter(...)` sin memo en cada render (`Hoy.tsx:75`, barato).
- `50_packs_manifest.json` no se importa.

### Almacenamiento

| Qué | Dónde | Cuándo |
|---|---|---|
| Estado completo `forja:v1` | AsyncStorage | Al arrancar, bloquea `Raiz`. Se re-serializa **entero** en cada guardado (diferido 350 ms). Crece con sesiones/series (≈ 90 KB por semestre según el comentario del código) |
| Cuenta | AsyncStorage | Al arrancar, bloquea `Raiz` |
| Hápticos, voz, consentimiento, máquina | AsyncStorage | Al evaluar el módulo o al montar |
| Sesión en curso | AsyncStorage | Al abrir el reproductor; se escribe al pasar a segundo plano y en cada serie marcada |

No se usa SQLite, MMKV ni SecureStore.

### Imágenes

| Carpeta | Archivos | Resolución | Prom. | Máx. |
|---|---|---|---|---|
| ejercicios | 190 | 800×437 | 18 KB | 37 KB |
| musculos | 53 | 800×437 | 29 KB | 44 KB |
| tips | 52 | 800×423 | 34 KB | 45 KB |
| rutinas | 30 | 800×423 | 32 KB | 52 KB |
| programas | 12 | 800×423 | 35 KB | 56 KB |
| mitos / motivación / fondos | 20 / 21 / 5 | 800×423 · 447×800 | 22 / 19 / 24 KB | 30 / 22 / 29 KB |
| `goma-tile.png` | 1 | 512×512 | 135 KB | — |

- Rutas de pintado: `FotoOscura` (expo-image, `cachePolicy="memory-disk"`, `recyclingKey`, `transition 200`, esqueleto animado mientras carga) para listas; `Foto` (expo-image **sin** `cachePolicy` ni `recyclingKey`); `FotoTratada` / `FotoParallax` (**Skia `useImage`**, decodifica aparte, sin compartir caché con expo-image) para héroes y tarjetas grandes; `GomaTexture` (Image de RN, patrón repetido).
- Ningún `placeholder` (blurhash/thumbhash) en expo-image: el hueco lo tapa `Esqueleto`.
- Miniaturas de 56–72 px de lado se decodifican desde el JPG de 800 px.

### Clips MP4

- Librería: `expo-video` (`useVideoPlayer` + `VideoView`) en un solo componente, `Clip.tsx`.
- Montajes: `HeroEjercicio` (ficha) y `ReproductorLayout` (sesión). No hay clips en listas ni carruseles.
- **Pausa al salir de pantalla: no.** `Clip` solo pausa si recibe `activo={false}` (lo usa el reproductor al pausar). La ficha nunca lo pasa, y no usa `useIsFocused`. Como `DetalleEjercicio` y `DetalleMusculo` hacen `navigation.push('Ejercicio')` (alternativas, sustitutos, músculo → ejercicio), **cada ficha apilada deja un player decodificando en bucle** detrás. Cadena típica ficha → músculo → ficha → alternativa: 3 players vivos.
- Liberación: el hook de expo-video libera el player al desmontar (al ir atrás).

### Fuentes

6 pesos cargados con `useFonts` antes de ocultar el splash (2 Big Shoulders + 4 Figtree). Se empaquetan 23 pesos de texto + 19 fuentes de iconos (ver BASELINE §2).

## 3.6 Componentes, efectos, animaciones y Skia

### Duplicados o casi duplicados (18 grupos)

| Grupo | Archivos | Solapamiento |
|---|---|---|
| Botones (8) | `ui/controles.tsx` `Boton` (legado, RN Animated, 6 usos) · `ui/BotonPlaca` (16 usos) · `ui/BotonCompacto` · `ui/BotonSecundario` · `routine-detail/BotonDuplicar` · `ui/BotonFilaSecundario` · `BotonRedondo` (muerto) · `ui/BotonGoogle` | `BotonSecundario` y `BotonDuplicar` son el mismo botón sólido con borde |
| Envoltorios de toque | `ui/controles.tsx:18` `Toque` (RN Animated) · `ui/Presionable` (Reanimated, 18 usos) | Ambos «se hunde al tocar + háptica» |
| Superficies | `ui/superficies` `Tarjeta`/`Vidrio3D` (legado) · `ui/TarjetaGoma` · `ui/TarjetaConFilo` · `components/Vidrio` · filo de 3 px re-implementado en `TarjetaLoQueSuelePasar`, `TarjetaQueEsperar`, `TarjetaEnSuLugar` | Misma tarjeta con filo |
| Tarjeta de rutina (mismo nombre) | `hoy/TarjetaRutina` · `explore/TarjetaRutina` | Foto + estrella + parallax copiado |
| Tarjeta de programa (mismo nombre) | `hoy/TarjetaPrograma` · `explore/TarjetaPrograma` | «Pila de tarjetas» con distinto offset |
| Colisiones de `hoy/TarjetasHoy.tsx` | exporta `FichaMusculo` (también `exercise/FichaMusculo`, `muscles/FichaMusculoNombre`) y `TarjetaArticulo` (también `learn/TarjetaArticulo`); `TarjetaEjercicioMini` ≈ `TarjetaAlternativa` ≈ `TarjetaRelacionada` ≈ `TarjetaRutinaFase` ≈ `MiniaturaEjercicio` | Foto + nombre + toque |
| Barra de placas (mismo nombre) | `hoy/BarraRutina` · `routine-builder/BarraRutina` | Segmento por ejercicio |
| Barras de progreso (8) | `ui/datos` `Progreso` (muerto) · `fx/BarraCarga13` · `fx/BarraPlacas` · `session/BarraProgresoSesion` · `learn/BarraProgresoLectura` · `profile/VitrinaLogros` · `profile/TarjetaReto` · `profile/VistaPreviaMeta` | «Una placa por paso» |
| Nivel/intensidad | `ui/NivelPlacas` · `settings/SelectorNivel` · `session/EscalaEsfuerzo` | Placas de altura creciente |
| Steppers (4) | `ui/controles` `Contador` (muerto) · `ui/ContadorPlacas` · `session/Stepper` · `settings/ContadorEstatura` | `ContadorPlacas` y `Stepper` tienen código idéntico |
| Interruptores / segmentados | `ui/controles` `Interruptor` (muerto) · `settings/SwitchDarenow` (sin uso) · `routine-builder/InterruptorTiempo` · `explore/InterruptorDos` ≈ `settings/SegmentadoTres` | Mismo pulgar deslizante |
| Chips | `ui/controles` `Chip` (legado) · `explore/ChipFiltro` · `explore/ChipCategoria` | — |
| Títulos de sección (≥ 9) | `ui/datos` `Titulo` y `ui/cabecera` `TituloGrande` (muertos) · `exercise/TituloSeccion` · `learn/TituloBloque` · `ui/AccionSeccion` · `explore/EncabezadoGrupo` · `muscles/EncabezadoRegion` · `profile/EncabezadoMes` · `settings/SeccionAjustes` | BigShoulders 20–26 + conteo |
| Cabeceras colapsables (5) | `fx/HeaderColapsable` · `exercise/BarraSuperiorColapsable` · `ui/cabecera` `BarraCompacta` · `ui/PantallaColapsable` · `explore/EncabezadoExplorar` | — |
| Hojas modales (4) | `HojaSalida` · `HojaDescartar` · `HojaCambiarPrograma` · `HojaConfirmacion` | Mismo `<Modal slide transparent>` a mano. `HojaSalida` no tiene `onRequestClose` (botón atrás de Android no hace nada) |
| Filas | `profile/FilaAjustes` vs `settings/FilaAjuste` · `profile/FilaHistorial` vs `FilaSesion` en `FilaHistorialCompleta` · `TarjetaReto` vs `TarjetaRetoCompleta` · `ListaClaves` vs `ListaErrores` vs `learn/BloqueErrores` | — |
| Evidencia | `exercise/MedidorEvidencia` vs `explore/MiniMedidorEvidencia` · `ui/datos` `Insignia` (muerto) vs `ui/InsigniaEvidencia` | — |
| Primitivas | Entrada: `ui/movimiento` `Aparece` · `fx/Entrada` · `fx/BloqueRevela`. Números: `NumeroAnimado` (muerto) vs `fx/Odometro`. Esqueletos: `ui/datos` vs `fx/Esqueleto`. Carruseles: `components/Carrusel` · `hoy/CarruselHoy` · `fx/CarruselProfundidad`. Notas: `ui/datos` `Nota` · `ui/NotaEntrenador` · `NotaEstimacion`. Buscadores, vacíos, semanas y estadísticas: 2 versiones cada uno | — |

### Componentes del rediseño sin usar

Sin archivos inalcanzables desde `index.ts`. Componentes nunca renderizados (12): `ui/controles.tsx` → `BotonRedondo`, `Opcion`, `Contador`, `Interruptor`; `ui/datos.tsx` → `Insignia`, `Progreso`, `BarrasSemana`, `Esqueleto`, `Titulo`; `ui/movimiento.tsx` → `NumeroAnimado`; `ui/cabecera.tsx` → `TituloGrande`; `settings/SwitchDarenow.tsx` → `SwitchDarenow`.
Legado apenas usado: `Tarjeta`/`Pantalla` (solo Yo), `Seccion`/`Carrusel` (solo Favoritos), `Aparece` (solo Carrusel), `Pulso` (solo TarjetaRetoCompleta).
Funciones muertas: `insigniaDe`, `nombresMusculos`, `rutaEsperada`, `cuantasHay`, `usarCDN`, `rutaClipEsperada`, `cuantosClips`, `cuantosSonidos`, `separarNumeroUnidad`, `marcador`, `escala`; solo usadas por tests: `regionActiva`, `textoDeRango`.

### Efectos con temporizadores o suscripciones

≈ 46 encontrados (18 `setTimeout` con limpieza, 4 intervalos/frame callbacks, 6 listeners de AppState/AccessibilityInfo/Keyboard, 1 `beforeRemove`, 2 `useFocusEffect`, expo-video, expo-audio, Speech, 10 `withRepeat` infinitos). Sin limpieza o dudosos:

| # | Dónde | Problema |
|---|---|---|
| 1 | `ui/movimiento.tsx:45-51` `Pulso` | `Animated.loop().start()` nunca se detiene (vivo en Retos) |
| 2 | `profile/FilaMedicion.tsx:105` | `Keyboard.addListener` en cada foco; solo se quita si aparece el teclado. Se acumulan con focos repetidos y no se quitan al desmontar |
| 3 | `settings/HojaConfirmacion.tsx:44` | `setTimeout(accion.onPress)` sin guardar: la acción (destructiva o compartir) corre aunque la pantalla ya no exista |
| 4 | `learn/PreguntaAcordeon.tsx:78`, `screens/DetallePrograma.tsx:99`, `profile/FilaMedicion.tsx:92`, `fx/TransicionPaso.tsx:44` | `setTimeout` sin limpiar → `setState`/`measureInWindow` tras desmontar |
| 5 | `screens/EditorRutina.tsx:193`, `screens/Hoy.tsx` (refresco) | `ref.current = setTimeout(...)` sobrescribe sin limpiar el anterior |
| 6 | `screens/Reproductor.tsx` (limpieza de voz) | `Speech.stop()` al desmontar dispara `onStopped` → `setState` y `dispatch` sobre el componente que se desmonta |
| 7 | `ui/FotoOscura.tsx:57` + `fx/Esqueleto.tsx:33` | El brillo `withRepeat(-1)` solo para con `onLoad`; sin `onError`, una imagen fallida brilla para siempre |
| 8 | `routine-detail/RielVertical.tsx:206`, `exercise/FilaRespiracion.tsx:29` | Bucles infinitos que siguen corriendo con la pantalla tapada por otra del stack; no hay `freezeOnBlur` ni pausa por foco en ningún lado |
| 9 | `session/ReproductorLayout.tsx:198-207` | `withRepeat(-1)` sin `return` de limpieza (Reanimated cancela al liberar el shared value; riesgo bajo) |
| 10 | `RelojAnuncios.tsx:45,51` | `setTimeout` sin guardar; intervalo recreado con cada `visible`. Dormido (`ANUNCIOS_ACTIVOS=false`) |

### `useEffect` que solo derivan estado (8)

`ui/ContadorPlacas.tsx:52`, `session/Stepper.tsx:51` (espejo de prop en estado), `screens/Reproductor.tsx:91`, `profile/VitrinaLogros.tsx:50`, `hooks/useOnboarding.ts:160` (context → estado), `components/Anuncio.tsx:60` (reset por prop; mejor `key`), `ui/movimiento.tsx:87` (muerto), `screens/Explorar.tsx:172` (limítrofe, retrasado para la animación).

### Estado duplicado

- `useOnboarding.ts:160`: `cuenta.nombre` del context de cuenta copiado a estado local.
- `ContadorPlacas` / `Stepper`: `valor` (prop) copiado a `texto` (estado).

### Mutaciones directas

**Ninguna sobre estado de React o del store.** Todos los `push`/`sort` son sobre copias locales. A vigilar:
- `session/useSessionPlayer.ts:74` `ctx.items = items` durante el render, leído por el reducer (`playerMachine.ts:106`): reducer impuro.
- `data/catalog.ts` `e.patron = …` muta los objetos del catálogo al importar (una vez).

### Animaciones fuera de worklets

- `Animated` del core en 3 archivos, 13 usos. Vivos: `ui/controles.tsx` `Toque` (spring nativo, en Boton/Chip/Carrusel/EditorRutina), **`Chip` con `useNativeDriver: false`** (color en el hilo JS cada frame), `PuntoOcupado`, `Favorito`; `ui/movimiento.tsx` `Aparece`, `Pulso`.
- Sin bucles `requestAnimationFrame`/`setInterval` de animación. Sin `runOnJS` por frame.
- `setState` desde reacciones de scroll al cambiar de sección: `settings/IndiceSecciones.tsx:48`, `explore/EncabezadoPegado.tsx:37`.
- `ReproductorLayout.tsx:146-148` cambia `setInhala` cada 4 s en descanso → re-render completo del layout.

### Skia por pantalla

17 archivos con `<Canvas>`. Además de los de cada pantalla, **`fx/MagnesiaOverlay` monta un Canvas a pantalla completa sobre toda la app, siempre**.

| Pantalla | Canvas propios | Animación continua |
|---|---|---|
| Hoy | `FilaSemana` (MarcoHoy), `SieteDias` (vía TuSemana) | Solo brillo de esqueletos hasta que cargan las fotos |
| Explorar | `FilaCrear` (segmento Rutinas) | Esqueletos en listas |
| Aprender | `IconoProhibido` ×N (Alimentación), `PalomitaTrazo` ×N (un Canvas por mito «ok» y por error; se monta al hacerse visible) | — |
| Yo | `SieteDias`, MarcoHoy (calendario), `IconoTrazo` (vacío de favoritos) | — |
| Reproductor | `ReproductorLayout` (+ anillo), `TextoDeParticulas` (3 s) | respiro (descanso), latido (trabajo), polvo `withRepeat(-1)` |

Otros: `MagnesiaParticles` (Bienvenida, `useFrameCallback` cada frame; pausa en blur/fondo/movimiento reducido), `FotoTratada` (Bienvenida, PlanListo, HeroRutina), `FotoParallax` y `DialTiempo` (Presentación, Ajustes), `PerfilRutina`, `RielVertical` (pulso infinito), `MapaCarga`, `BotonGoogle` (bucle infinito en Acceso).

### Temporizadores que re-renderizan

- **Reproductor**: único reloj de 1 Hz (`useSessionPlayer.ts:85`). Re-renderiza `ReproductorActivo`, `ReproductorLayout` y todos sus hijos cada segundo; **0 `React.memo` en `components/session/` y `Reproductor.tsx`**. Cada tick re-crea ≈ 10 estilos animados por `useTick`, y dispara los efectos de sonido (`Reproductor.tsx:262`) y de cuenta atrás por voz.
- Anuncios: `Anuncio.tsx:62` (1 Hz) y `RelojAnuncios.tsx:51` (5 s), dormidos con `ANUNCIOS_ACTIVOS=false`.
- No hay reloj por segundo en Hoy, Explorar, Aprender ni Yo. Efecto lateral: `fecha` de Hoy solo se fija al montar o al refrescar, así que la sesión del día no cambia a medianoche con la app abierta (funcional, no de rendimiento).
