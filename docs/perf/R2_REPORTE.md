# DARENOW · Reporte R2 (limpieza y estructura)

Fecha: 2026-09-30 · Base: `8f6aaa2` (R1) · Rama de trabajo: `claude/epic-thompson-id8smn` (el entorno solo permite esta rama; es el equivalente de `perf-limpieza`).

## Resumen

| Métrica | Antes (R1) | Después (R2) |
|---|---|---|
| Líneas TS/TSX en `src/`, `App.tsx`, `index.ts` | 29 782 | 29 773 |
| Líneas de código sin comentarios ni vacías (sin `media/` generado) | 22 793 | 22 740 |
| Archivos TS/TSX en `src/` | 282 | 309 |
| Archivos de más de 300 líneas | 13 | 1 (`media/registry.ts`, generado) |
| `npx tsc --noEmit` | 4 errores (en `tests/`) | **0** |
| ESLint | no había | **0 errores**, 131 avisos (React Compiler, R4) |
| `npm run lint:color` | OK | OK |
| Ciclos (`madge --circular`) | 2 | **0** |
| knip | 1 dependencia, 96 exports, 7 tipos, 2 no listadas | **0** (2 excepciones documentadas) |
| `any` explícitos | 8 | **0** |
| Pruebas | 11 suites esbuild (1 fallaba) | 11 suites esbuild + Jest 77 pruebas, **todas en verde** |
| Bundle Android (Hermes `.hbc`) | 5 644 715 B | **5 636 325 B** (−8,4 KB) |
| Assets empaquetados | 825 archivos | 825 archivos (R2 no borra assets) |

Las líneas quedan casi iguales a propósito: el código muerto que se borró (≈ 400 líneas) se compensa con los encabezados e imports de los archivos nuevos que salieron de dividir los grandes. El objetivo de R2 era el orden, no el recorte.

**No verificado en esta fase** (no hay teléfono en este entorno): build de release en el dispositivo de R1, recorrido de `docs/perf/SMOKE.md` y FPS de los escenarios 1 y 2. Todo cambio de R2 es un movimiento o una extracción verificada línea a línea (ver «Cómo se verificó»), pero el recorrido en el teléfono es obligatorio antes de publicar: ver «Pendiente para ti».

## Commits

Un tipo de cambio por commit, todos con prefijo `R2` (`git log --oneline 8f6aaa2..HEAD`):

1. `test(R2)`: red de seguridad (Jest + SMOKE.md).
2. `chore(R2)`: código muerto · dependencias.
3. `refactor(R2)`: alias `@/` · ciclos · capa `ui` · capas `state`/`lib` · una feature por commit (12, de la más chica a la más grande) · `storage`.
4. `refactor(R2)`: duplicados (steppers, hojas inferiores) · `Tocable` (renombre y API) · archivos por plataforma.
5. `refactor(R2)`: un commit por archivo dividido (11).
6. `refactor(R2)`/`test(R2)`/`chore(R2)`/`fix(R2)`: `any`, tsc 0, ESLint, knip, `lint:color`.
7. `docs(R2)`: ARQUITECTURA, este reporte, HALLAZGOS.

## Cómo se verificó

- Después de cada commit: `tsc --noEmit` igual o mejor que antes y Jest en verde (el script de lotes no hacía commit si tsc empeoraba). Al cerrar cada bloque: las 11 suites esbuild, `madge`, knip y `expo export` de Android.
- Movimientos: `scripts/refactor/mover.py` (`git mv` + reescritura de imports resolviendo cada ruta) y `scripts/refactor/asignar.py` (decide la feature de cada archivo según quién lo importa). No se cambió texto de código al mover, solo la ruta de los imports.
- Extracciones (hooks, subcomponentes, secciones): se comparó con `diff` el bloque original contra el nuevo; en todos los casos el cuerpo, el JSX y los estilos son idénticos (solo cambian `export` y los imports). Herramientas: `scripts/refactor/extraer_hook.py` y `podar_imports.py`.
- Claves de AsyncStorage: se comprobó que el conjunto de strings `forja:*` es idéntico antes y después.

## Archivos

| Tipo | Cantidad |
|---|---|
| Movidos (`git mv`, detectados como renombre) | 272 |
| Nuevos (salen de dividir o fusionar) | 28 |
| Divididos | 11: `ReproductorLayout` (525→290), `EditorRutina` (526→216), `lib/engine/session` (506→265), `state/store` (477→121), `Ajustes` (483→263), `Hoy` (372→251), `Explorar` (311→131), `Reproductor` (343→106), `playerMachine` (318→263), `RielVertical` (305→262), `Presentacion` (303→277) |
| Equivalencia completa de rutas | `docs/perf/R2_MOVIMIENTOS.md` |

Orden de trabajo: se borró el código muerto y se rompieron los 2 ciclos **antes** de mover (distinto del orden de la consigna), para no mover archivos muertos y para que el cálculo de capas partiera de un grafo sin ciclos.

## Código muerto eliminado

- 12 componentes que nadie renderizaba: `BotonRedondo`, `Opcion`, `Contador`, `Interruptor` (ui/controles); `Fila`, `Insignia`, `Progreso`, `BarrasSemana`, `Esqueleto`, `Titulo` (ui/datos); `NumeroAnimado` (ui/movimiento); `TituloGrande` (ui/cabecera); `SwitchDarenow` (se conserva `PistaSwitch`, que sí se usa). Con sus estilos.
- Funciones y tokens sin uso: `insigniaDe`, `nombresMusculos`, `separarNumeroUnidad`, `marcador`, `escala`, `TOQUE`, `cuantosSonidos`; y en el generador de registros `rutaEsperada`, `cuantasHay`, `rutaClipEsperada`, `cuantosClips`, `CARPETA` (se editó `generar_registry.py` y se regeneró; antes se comprobó que el generador reproduce los archivos byte a byte).
- 60 exports que solo se usaban dentro de su archivo y re-exports sin uso.
- Imports y un estilo (`Yo.input`) sin uso.
- **Excepciones de knip (documentadas):** `usarCDN` (API pública para activar clips remotos, marcada `@public`); `measure`/`resumen` de `perfMarks` (`@public`, herramienta de medición); `expo-system-ui` y `expo-updates` (knip las infiere de `app.json`; instalarlas cambia el build nativo, ver «Dependencias»).
- `scripts/contraste.js` **no** se borró aunque knip lo marcó: lo usa `DESIGN.md` («Medido con `node scripts/contraste.js`»). Queda como entrada en `knip.json`.

## Dependencias

| Cambio | Paquete | Motivo |
|---|---|---|
| Quitada | `expo-crypto` | Se agregó en `656437b` y nunca se importó |
| Agregada (dev) | `jest`, `jest-expo`, `@jest/globals`, `@react-native/jest-preset` | Red de seguridad (Jest) |
| Agregada (dev) | `eslint`, `eslint-config-expo`, `eslint-plugin-react-hooks`, `globals` | ESLint con la config de Expo |
| Sin cambio | `babel-preset-expo` en devDependencies | Restricción del proyecto |
| No declarada a propósito | `expo-system-ui` | `app.json` usa `userInterfaceStyle: "dark"`, que en Android pide `expo-system-ui`. Instalarlo cambia el color de fondo nativo del arranque: es un cambio visible, se decide aparte (anotado para R3) |
| No declarada a propósito | `expo-updates` | knip lo infiere de `app.json`; la app no usa OTA |

- `npx expo install --check` y `expo-doctor` necesitan `api.expo.dev`, bloqueado en este entorno. Se hizo la misma verificación offline contra `expo/bundledNativeModules.json`: **todas las versiones dentro de rango**. `expo-doctor`: 19/21, los mismos 2 fallos de red que en R1, ningún problema nuevo.
- No se movió nada a devDependencies: `expo-dev-client` se queda en dependencies (el build de desarrollo de EAS lo necesita).

## Componentes fusionados

| Quedó | Reemplaza | Nota |
|---|---|---|
| `ui/components/HojaInferior` | el armazón (Modal + velo + hoja + título + texto) repetido en `HojaSalida`, `HojaDescartar`, `HojaCambiarPrograma`, `HojaConfirmacion` | Mismos estilos y props de `Modal`; cada hoja conserva sus acciones |
| `ui/hooks/useNumeroEditable` + `useSacudida` | la lógica idéntica de «tocar para escribir» y la sacudida del límite en `ContadorPlacas` y `Stepper` | Los componentes no se fusionan: se ven distinto |
| `ui/components/DesenfoqueIos(.ios).tsx` | 4 `{Platform.OS === 'ios' ? <BlurView/> : null}` | Mismo resultado en cada plataforma |
| `ui/components/Tocable` | `Presionable` (renombre) | + `onLongPress`, `haptica`, `deshabilitado`, `hitSlop`, `pista`, `estado`; por defecto se comporta igual |

**No se fusionaron** (fusionarlos cambia lo que se ve o cómo responde; se revisaron uno por uno):

| Grupo | Por qué no |
|---|---|
| `BotonSecundario` / `BotonDuplicar` | alto 56 vs 58, icono y copia fantasma, otra fuente |
| `Boton` + `Toque` (legado, RN `Animated`) / `BotonPlaca` + `Tocable` | resorte distinto (RN `Animated.spring` vs `resorteTap` de Reanimated) y `oscurecer`; migrarlos es R6 (animaciones) |
| `ContadorPlacas` / `Stepper` | número de 120/56 vs 24/22, botones de 64/56 vs 44/36, en el límite uno llama `onCambio` y el otro no |
| `ListaClaves` / `ListaErrores` / `BloqueErrores` | palomita Skia vs X de dos trazos animados |
| `TarjetaConFilo` / `TarjetaEnSuLugar` | filo fijo vs filo animado desde arriba |
| `hoy/TarjetaRutina` / `explore/TarjetaRutina`, `TarjetaPrograma` ×2, `BarraRutina` ×2 | tamaños, pila de tarjetas y placas distintos. `hoy/BarraRutina` se renombró `BarraRutinaTarjeta` para que no choque de nombre en `ui/components` |
| 8 barras de progreso, 3 escalas de placas, 9 títulos, 5 cabeceras colapsables, chips, filas, insignias | cada una con medidas o animación propias; unificarlas es un cambio de diseño, no de limpieza |

Los 18 grupos completos con archivo y línea están en `docs/perf/INVENTARIO.md` §3.6.

## Toques, plataforma y calidad

- `TouchableOpacity/Highlight/WithoutFeedback`: **0** (ya lo eran en R1; 191 usos de `Pressable`).
- Archivos por plataforma: solo `DesenfoqueIos`. Los demás `Platform.OS` son ternarios de una línea (behavior de `KeyboardAvoidingView`, un color, una sombra) y se quedan.
- `console.log`: 0 → no hizo falta `src/dev/logger.ts`.
- TODO/FIXME: 0 reales (las 2 coincidencias de R1 eran la palabra «TODO» en español).
- `@ts-ignore`: 0. `any`: 8 → 0 (pantallas con `NativeStackScreenProps`/`BottomTabScreenProps`; `EditorRutina` con sus params tipados).
- `strict: true` ya estaba activo.
- ESLint: `eslint-config-expo` + `rules-of-hooks` y `exhaustive-deps` como **error**, `no-console` como aviso, y las reglas de capas de `docs/ARQUITECTURA.md` como `no-restricted-imports`.
- Pruebas antiguas arregladas (sin tocar la app): `player.test` usaba un campo `seg` que `ItemSesion` ya no tiene; `ui.test` tenía una comparación que TS estrechaba a `false`; `aprender.test` seguía buscando «FORJA» después del cambio de marca a DARENOW y fallaba desde entonces.

## Bundle

| | R1 | R2 |
|---|---|---|
| `.hbc` Android | 5 644 715 B | 5 636 325 B (−8 390 B) |
| Módulos en el grafo | 2 736 | 2 762 (+26 por los archivos divididos) |
| Salida de Metro de `src/` (antes de Hermes) | 1 862,7 KB | 1 868,0 KB |

Baja poco y es lo esperado: R2 no toca el catálogo, los iconos ni las fuentes (eso es R3). Cada archivo nuevo agrega su envoltorio de módulo; aun así el bytecode final baja por el código muerto.

## Assets que parecen sin usar (para R5; no se borró ninguno)

| Asset | Evidencia |
|---|---|
| `assets/img/musculos/deltoide_posterior..jpg` (doble punto) | Copia de `deltoide_posterior.jpg`; queda registrado con el id `deltoide_posterior.`, que ningún dato usa. ~30 KB en el APK |
| 36 fuentes TTF de `@expo-google-fonts/*` | Se empaquetan 23 pesos de texto y solo se cargan 6 (BASELINE §2). Es R3 |
| 19 fuentes de iconos de `@expo/vector-icons` | Solo se usa Ionicons (BASELINE §2, H-05). Es R3 |
| `assets/data/50_packs_manifest.json` | Ningún `import`; solo lo citan comentarios de `usarCDN` |
| `assets/brand/logo-master.png` | Solo lo usa `scripts/generar-iconos.js` |
| `app.json` → `assetBundlePatterns: ["**/*"]` | Patrón que abarca todo el proyecto; revisar en R3/R5 qué termina en el binario |

## `exhaustive-deps` pendientes (para R4)

163 casos en 94 archivos. **No se agregó ni quitó ninguna dependencia**: cambiar un arreglo de dependencias cambia cuándo corre un efecto. La regla está como error; los casos existentes viven en `eslint-suppressions.json` (supresiones de ESLint 9), así que un caso nuevo sí falla el lint. Para ver cada caso con su línea: `echo '{}' > /tmp/vacio.json && npx eslint . --suppressions-location /tmp/vacio.json` (lee un archivo de supresiones vacío: 163 errores). Al arreglar casos en R4: `npx eslint . --prune-suppressions`.

Además, 131 avisos de las reglas del React Compiler que trae `eslint-plugin-react-hooks` 7: `refs` 82, `immutability` 32, `set-state-in-effect` 11, `purity` 5, `use-memo` 1. También son R4.

Por archivo (los más cargados arriba):

| Archivo | Casos |
|---|---|
| `src/state/acciones.ts` | 18 |
| `src/features/sesion/hooks/useAtmosferaFase.ts` | 7 |
| `src/ui/components/BarraRutina.tsx` | 5 |
| `src/features/rutinas/components/TarjetaEjercicioRutina.tsx` | 4 |
| `src/features/sesion/components/ReproductorActivo.tsx` | 4 |
| `src/ui/components/BotonPlaca.tsx` | 4 |
| `src/ui/fx/DialTiempo.tsx` | 4 |
| `src/ui/fx/Odometro.tsx` | 4 |
| `src/features/rutinas/components/CampoTitulo.tsx` | 3 |
| `src/ui/components/FilaSemana.tsx` | 3 |
| `src/ui/components/SieteDias.tsx` | 3 |
| `src/features/ajustes/components/FilaAjuste.tsx` | 2 |
| `src/features/cuenta/screens/Acceso.tsx` | 2 |
| `src/features/musculos/components/RelacionMuscular.tsx` | 2 |
| `src/features/onboarding/components/BarraPlacas.tsx` | 2 |
| `src/features/onboarding/components/SaludoPreview.tsx` | 2 |
| `src/features/onboarding/components/TransicionPaso.tsx` | 2 |
| `src/features/onboarding/screens/Presentacion.tsx` | 2 |
| `src/features/perfil/components/CampoValor.tsx` | 2 |
| `src/features/perfil/components/VistaPreviaMeta.tsx` | 2 |
| `src/features/perfil/components/VitrinaLogros.tsx` | 2 |
| `src/features/sesion/components/EscalaEsfuerzo.tsx` | 2 |
| `src/features/sesion/components/TextoDeParticulas.tsx` | 2 |
| `src/ui/components/PlacaMedalla.tsx` | 2 |
| `src/ui/components/RielVertical.tsx` | 2 |
| `src/ui/components/TabBarGoma.tsx` | 2 |
| `src/ui/components/TarjetaSesionHoy.tsx` | 2 |
| `src/ui/components/controles.tsx` | 2 |
| `src/ui/components/movimiento.tsx` | 2 |
| `src/ui/fx/BarraCarga13.tsx` | 2 |
| `src/ui/fx/MagnesiaOverlay.tsx` | 2 |
| `src/ui/fx/TachadoMito.tsx` | 2 |
| `src/features/ajustes/components/CasillaMarca.tsx` | 1 |
| `src/features/ajustes/components/ContadorEstatura.tsx` | 1 |
| `src/features/ajustes/components/IndiceSecciones.tsx` | 1 |
| `src/features/ajustes/components/SegmentadoTres.tsx` | 1 |
| `src/features/ajustes/components/SelectorNivel.tsx` | 1 |
| `src/features/aprender/components/AfirmacionTachada.tsx` | 1 |
| `src/features/aprender/components/CitaLoQueSeDice.tsx` | 1 |
| `src/features/aprender/components/IconoProhibido.tsx` | 1 |
| `src/features/aprender/components/MarcaFin.tsx` | 1 |
| `src/features/aprender/components/PreguntaAcordeon.tsx` | 1 |
| `src/features/aprender/components/TarjetaEnSuLugar.tsx` | 1 |
| `src/features/aprender/screens/DetalleTip.tsx` | 1 |
| `src/features/ejercicio/components/FichaMusculo.tsx` | 1 |
| `src/features/ejercicio/components/FilaRespiracion.tsx` | 1 |
| `src/features/ejercicio/components/ListaErrores.tsx` | 1 |
| `src/features/explorar/components/FilaMiRutina.tsx` | 1 |
| `src/features/explorar/components/InterruptorDos.tsx` | 1 |
| `src/features/explorar/hooks/useExplorar.tsx` | 1 |
| `src/features/hoy/components/MagnesiaParticles.tsx` | 1 |
| `src/features/hoy/screens/Bienvenida.tsx` | 1 |
| `src/features/musculos/components/ConectorRelacion.tsx` | 1 |
| `src/features/onboarding/components/FotoParallax.tsx` | 1 |
| `src/features/onboarding/components/TituloEstampado.tsx` | 1 |
| `src/features/onboarding/screens/Onboarding.tsx` | 1 |
| `src/features/onboarding/screens/PlanListo.tsx` | 1 |
| `src/features/perfil/components/CalendarioHuellas.tsx` | 1 |
| `src/features/perfil/components/FilaMedicion.tsx` | 1 |
| `src/features/perfil/components/TarjetaReto.tsx` | 1 |
| `src/features/programas/components/EncabezadoFase.tsx` | 1 |
| `src/features/programas/components/MapaCarga.tsx` | 1 |
| `src/features/rutinas/components/PerfilRutina.tsx` | 1 |
| `src/features/sesion/components/BarraProgresoSesion.tsx` | 1 |
| `src/features/sesion/components/GuiaRespiracion.tsx` | 1 |
| `src/features/sesion/components/ModeloEjercicio.tsx` | 1 |
| `src/features/sesion/components/OverlayPausa.tsx` | 1 |
| `src/features/sesion/components/PalabraFase.tsx` | 1 |
| `src/features/sesion/components/PantallaListo.tsx` | 1 |
| `src/features/sesion/components/ResumenSesion.tsx` | 1 |
| `src/features/sesion/components/TarjetaAjusteEjercicio.tsx` | 1 |
| `src/features/sesion/components/TotalPegajoso.tsx` | 1 |
| `src/features/sesion/hooks/useSessionPlayer.ts` | 1 |
| `src/features/sesion/screens/Reproductor.tsx` | 1 |
| `src/ui/components/BarraRutinaTarjeta.tsx` | 1 |
| `src/ui/components/BotonGoogle.tsx` | 1 |
| `src/ui/components/CampoTexto.tsx` | 1 |
| `src/ui/components/ChipFiltro.tsx` | 1 |
| `src/ui/components/ContadorPlacas.tsx` | 1 |
| `src/ui/components/EstrellaFavorito.tsx` | 1 |
| `src/ui/components/FichaRender.tsx` | 1 |
| `src/ui/components/FilaCrear.tsx` | 1 |
| `src/ui/components/InsigniaEvidencia.tsx` | 1 |
| `src/ui/components/ListaClaves.tsx` | 1 |
| `src/ui/components/MedidorEvidencia.tsx` | 1 |
| `src/ui/components/OpcionCuestionario.tsx` | 1 |
| `src/ui/components/PlacaDato.tsx` | 1 |
| `src/ui/components/SegmentosIndicador.tsx` | 1 |
| `src/ui/components/SwitchDarenow.tsx` | 1 |
| `src/ui/fx/Entrada.tsx` | 1 |
| `src/ui/fx/Esqueleto.tsx` | 1 |
| `src/ui/fx/IconoTrazo.tsx` | 1 |
| `src/ui/fx/PalomitaTrazo.tsx` | 1 |
| `src/ui/fx/TituloMascara.tsx` | 1 |

## TODO / FIXME pendientes

Ninguno en el código.

## Observaciones que no se corrigieron (cambiarían comportamiento)

- `HojaSalida` no tiene `onRequestClose`: el botón atrás de Android no cierra la hoja de salida de la sesión (H-23). Sigue igual.
- `textoDePregunta('¿Que es?')` no acentúa el interrogativo cuando la pregunta ya trae «¿». Quedó fijado como prueba de caracterización en `tests/unit/texto.test.ts`.
- `expo-system-ui` no instalado aunque `app.json` pide modo oscuro (ver «Dependencias»).

## Hallazgos R2 de HALLAZGOS.md

| ID | Estado |
|---|---|
| H-14 Código muerto | **Resuelto** (ver «Código muerto eliminado»; knip en 0 con 2 excepciones documentadas) |
| H-15 Pantallas con lógica/otros componentes y archivos > 300 líneas | **Resuelto**: 11 archivos divididos; pantallas con la lógica en `hooks/`. Quedan `Yo.tsx` exportando `Logros` (dos pantallas pequeñas en un archivo, 187 líneas) y `media/registry.ts` (generado) |
| H-16 TypeScript y pruebas | **Resuelto**: tsc 0, `any` 0, todas las pruebas en verde |
| H-17 `expo-blur` solo en iOS con `Platform.OS` en línea | **Resuelto** con `DesenfoqueIos.ios.tsx`. `expo-blur` sigue en el bundle de Android porque `Vidrio.tsx` lo usa en ambas plataformas |
| H-22 Componentes duplicados | **Parcial**: 3 fusiones sin cambio visual (hojas, lógica de steppers, desenfoque) + renombre a `Tocable`. Los demás grupos se ven distinto y se dejaron, explicado arriba |
| H-23 `HojaSalida` sin `onRequestClose` | **Sin cambio** (arreglarlo cambia comportamiento) |

## Pendiente para ti (necesita el teléfono)

1. `npx expo run:android --variant release` en el mismo dispositivo de R1.
2. Recorrido completo de `docs/perf/SMOKE.md` (A–G). Cualquier diferencia contra el build anterior: dime qué pantalla y la reviso contra el commit que la tocó.
3. Flashlight en los escenarios 1 y 2 de R1 (`scripts/perf/README.md` §5): no deben empeorar.
