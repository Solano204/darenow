# DARENOW · R6 Animaciones, hilo JS y memoria

Objetivo:
- que el rediseño «Goma y magnesia» corra a 60 fps en un Android de gama media;
- que nada bloquee el hilo JS;
- que la app no pierda memoria con el uso.

En calidad alta el aspecto no cambia.

> **Sin teléfono en este entorno.** Todas las columnas de FPS y memoria de este reporte están
> pendientes de medirse en el dispositivo de R1. El procedimiento exacto está en
> `scripts/perf/README.md` §8. Lo que sí se verifica aquí:
> - el código;
> - las pruebas de Jest de fugas, sesión larga, háptica y calidad;
> - la línea de tiempo idéntica del reproductor.

## Commits

| Commit | Punto |
|---|---|
| `453eb88` | 3.1 · Animaciones en el hilo de UI |
| `bea5e3d` | 3.2 · Presupuesto de Skia: pools, un Canvas por pantalla, loops en pausa |
| — | 3.3 · Textura de goma: ya estaba horneada; nada que cambiar (ver §3) |
| `1fa845f` | 3.4 · Overlay de magnesia montado solo durante el aplauso |
| `41220ff` | 3.5 · Una sola detección de visibilidad por pantalla |
| `e0ecf9f` | 3.6 · Háptica central con limitador de 40 ms |
| `94ce8cd` | 3.7 · Fugas corregidas y prueba de 20 aperturas por pantalla |
| `ff152b4` | 3.8 · Vigilancia de bloqueos del hilo JS |
| `fdbab0c` | 3.9 · Nivel de calidad visual adaptativo |
| `27968eb` | 3.10 · Prueba de sesión larga (10 minutos de reproductor) |

## 1. Catálogo de animaciones

**Tecnología.** «RN» = Reanimated; «UI» = worklet en el hilo de UI. Después de R6 no queda nada con
`Animated` del core ni con `useNativeDriver: false`. **FPS UI/JS mínimos: pendientes en el teléfono en
todas las filas** (Flashlight, escenarios de BASELINE §4).

**Problemas antes de R6 y qué se hizo:**

- **Aplauso de magnesia** (`MagnesiaOverlay`, raíz; Presentación, PlanListo, rutina, rutina propia, Resumen) — Skia `Points` + RN, hilo UI, sin loop.
  - Antes: 72 partículas; un array y un objeto nuevos por partícula en cada cuadro; `Canvas` a pantalla completa **montado siempre** encima de la app (H-10).
  - Después: el `Canvas` se monta solo mientras hay nube (y 1,5 s después); pools fijos por grupo; 40 % de partículas en calidad baja.
- **Nube mini** (Estrella, FilaSemana, FilaEquipo, Resumen) — Skia, UI, sin loop.
  - Antes: 10 partículas y la misma asignación por cuadro.
  - Después: pool fijo.
- **Polvo flotante de Bienvenida** — Skia + `useFrameCallback`, UI, **loop**.
  - Antes: 25 partículas, objetos nuevos por cuadro y un `Canvas` propio aparte del de la foto.
  - Después: pool fijo; dentro del `Canvas` de la foto; 60 % en media y apagado en baja.
- **«¿Listo?»** (`TextoDeParticulas`, Reproductor) — Skia + RN; el polvo va en loop mientras dura la pantalla (3 s).
  - Antes: 200 + 8 partículas; arrays nuevos por cuadro.
  - Después: pools fijos; tope de 220.
- **Textura de goma** (casi todas las pantallas) — `Image` teselada, sin hilo de animación.
  - Ya era un bitmap estático (no Skia): sin cambios.
- **Odómetros** (Bienvenida, Hoy, reproductor, Resumen, Yo, Ajustes…) — RN `translateY`, UI, sin loop.
  - Una animación por columna y termina sola: sin cambios.
- **Placas que caen: SieteDias, MapaCarga** (Yo, Hoy, Programa) — Skia `Path` + RN, UI, sin loop.
  - Antes: una ruta y un `RRect` nuevos por placa en cada cuadro. En MapaCarga, además, un `withTiming` dentro de `useDerivedValue` que se relanzaba en cada cuadro de scroll.
  - Después: una ruta reusada (`useRutaAnimada`), y la animación arranca solo cuando cambia su destino.
- **Placas de rutina** (`BarraRutina`, editor) — animaciones de layout, UI, sin loop.
  - Anima `height` en un subárbol pequeño (≤ 8 placas) y solo al agregar o quitar: se queda (ver §3.1).
- **BarraCarga13 / BarraPlacas** (onboarding, Hoy, Yo) — RN, UI, sin loop.
  - Solo anima la placa que cambia: sin cambios.
- **BarraProgresoSesion** (Reproductor) — RN `scaleX`, UI.
  - Sin cambios (R4 ya la dejó en una hoja).
- **Sellos y tachados** (`InsigniaEvidencia`, `AfirmacionTachada`, `TachadoMito`, SelloHuella) — RN, UI, sin loop.
  - Sin cambios. La háptica pasa por el limitador.
- **Barrido de color entre fases** (Reproductor) — RN, vista escalada, UI, sin loop.
  - Sin cambios.
- **Respiración del anillo** (Reproductor, descanso) — RN, UI, **loop**.
  - Antes: no se cancelaba al desmontar.
  - Después: `cancelAnimation` en la limpieza.
- **Latido del resplandor** (Reproductor, trabajo) — RN, UI, **loop**.
  - Antes: no se cancelaba al desmontar.
  - Después: `cancelAnimation`; apagado en calidad baja.
- **Anillo del temporizador** (Reproductor) — Skia + RN, UI.
  - Sin cambios: un solo `Canvas` con el resplandor.
- **Carruseles con profundidad y parallax** (Hoy; TarjetaRutina de Explorar) — RN (`measure` en worklet), UI.
  - Sin parallax en calidad baja.
- **Encabezados colapsables** (Hoy, Explorar, Aprender, fichas, `PantallaColapsable`) — RN `scale`/`translate`, UI.
  - Sin cambios.
- **Heroes que se estiran** (ficha, rutina, programa, tip, mito, músculo) — RN + FotoTratada (Skia), UI.
  - Sin cambios; la foto de Skia sale de una caché de 4 (R5).
- **Rieles con scroll** (RielVertical, PasosLineaTiempo, Historial) — RN, UI.
  - Antes: animaban `top` y `height` en cada cuadro de scroll. Historial medía 2 veces por fila y cuadro.
  - Después: `scaleY` desde arriba con alto fijo; una sola medición.
- **Pulso del nodo del riel** (Programa) — RN, UI, **loop**.
  - Antes: seguía corriendo con la pantalla tapada.
  - Después: se pausa con `useLoopActivo`; apagado en baja.
- **Respiración de la ficha** (`FilaRespiracion`) — RN, UI, **loop**.
  - Antes: seguía corriendo con la ficha tapada.
  - Después: se pausa con `useLoopActivo`.
- **Invitación de FilaCrear** (Explorar/Rutinas, editor) — RN + Skia, UI, **loop**.
  - Antes: seguía corriendo con la pantalla tapada.
  - Después: se pausa; apagado en baja.
- **Esqueleto** (fotos de lista) — RN, UI, **loop**.
  - Antes: brillaba para siempre si la foto fallaba (sin `onError`) y seguía con la pantalla tapada.
  - Después: se va también con `onError`; se pausa con `useLoopActivo`.
- **Pulso «en curso»** (`Pulso`, Retos) — antes **Animated del core**, loop.
  - Antes: el loop no se detenía nunca (H-20).
  - Después: Reanimated, cancelado al desmontar y en pausa con la pantalla tapada.
- **Toque, Chip, Favorito, PuntoOcupado** (Logros, Favoritos, SelectorEjercicio) — antes **Animated del core**.
  - Antes: el Chip usaba `useNativeDriver: false` e interpolaba colores en el hilo JS (H-21).
  - Después: Reanimated, con los mismos resortes (rigidez y amortiguación calculadas con la fórmula de RN) y la misma curva.
- **Medallas que giran** (Resumen, Yo, Retos) — RN `rotateY`, UI, sin loop.
  - Sin cambios.
- **Palomitas y huellas dibujadas** (varias) — Skia `Path` `end`, UI.
  - Sin cambios (lienzos pequeños que terminan).
- **ChipFiltro / ChipCategoria** (Explorar) — RN, UI.
  - Antes: `left`/`top` en el estilo animado.
  - Después: `translate`.
- **Switches, segmentados** (Ajustes, Explorar) — RN, UI.
  - `SegmentosIndicador` e `InterruptorDos` animan `width` de una píldora redondeada solo al tocar; un `scaleX` deformaría las esquinas, así que se quedan.
- **Visibilidad «al entrar en pantalla»** (`BloqueRevela`, en 10 pantallas) — RN `useAnimatedReaction`, UI.
  - Antes: una reacción al scroll por bloque (hasta 6 por pantalla).
  - Después: una por pantalla (`ProveedorRevela`) en Yo, Hoy, ficha y músculo.
- **Transiciones entre pantallas** — native-stack (nativo) + `Entrada`.
  - Sin cambios.

**Revisiones sin problemas:**

- No hay ningún `runOnJS` por cuadro: todos se disparan por evento (fin de animación, cambio de región o de fase).
- Ninguna lectura de `.value` durante el render.
- Ningún `setState` en `onScroll` ni en `useFrameCallback`.

## 2. Canvas de Skia por pantalla

Canvas **de efectos** (partículas, foto tratada, anillo, gráficos). No cuentan los íconos que se
trazan y quedan estáticos (palomitas, marco de hoy, logo).

| Pantalla | Antes | Después |
|---|---|---|
| Toda la app (overlay de magnesia) | +1 siempre montado | 0; 1 solo durante un aplauso |
| Bienvenida | 2 (foto + polvo) | **1** (foto, velo y polvo) |
| Hoy | 2 gráficos pequeños (SieteDias + marco) | igual |
| Reproductor | 1 («¿Listo?») y luego 1 (anillo) | igual |
| Detalle de rutina | 3 (hero + 2 PerfilRutina) | igual; el PerfilRutina compacto es la versión pegajosa del mismo gráfico (pendiente unirlos si el Profiler lo pide) |
| Programa | 2 (hero + MapaCarga) | igual |
| Presentación | 2 (fotos + dial) | igual |
| Resto | 0–1 | igual |

## 3. Decisiones por punto

**3.1.**
- Cero `Animated` del core.
- Los resortes `speed`/`bounciness` se pasaron a rigidez y amortiguación con la misma fórmula de React Native, así que se ven igual:
  - Toque: 937 / 47;
  - Favorito: 724 / 27.
- La curva de `Animated.timing` se mantiene (`Easing.inOut(Easing.ease)`).
- Se quedan con propiedades de layout, porque solo se disparan al tocar y en subárboles pequeños, y un `scale` deformaría esquinas redondeadas:
  - las placas de BarraRutina (`height`);
  - la píldora de SegmentosIndicador e InterruptorDos (`width`).

**3.2.**
- Pools: `src/ui/fx/particulas.ts` (`crearPuntos`, `aparcar`, `LIMITE_PARTICULAS`) con `sharedValue.modify`. Es el mismo mecanismo que usan los buffers de Skia.
- Rutas: `src/ui/fx/caminos.ts` (`useRutaAnimada`).
- Loops: `src/ui/hooks/useLoopActivo.ts` junta el foco de la pantalla y el primer plano, con una sola escucha nativa de AppState para toda la app. Antes había una por loop: 31 con Hoy abierta.
- Límites: ambiente 25, aplauso 80 (usa 72), «¿Listo?» 220 (usa 208). Ninguna pantalla los superaba.

**3.3.** `GomaTexture` ya era un PNG de 512 px teselado con `Image` de RN (`resizeMode="repeat"`),
generado por `scripts/generar-goma.js`; no había ningún `Canvas` de textura. Pasarlo a WebP sin
pérdida ahorraba 14 KB, así que se queda. No se hizo un solo fondo en la raíz: cada pantalla es
opaca (`goma`) y lo taparía.

**3.4.**
- El overlay monta su `Canvas` al disparar (`aplaudir`, `mini`, `destello`) y lo desmonta 1,5 s después de la última nube.
- El fin de cada nube avisa una vez con `runOnJS` (un evento, no un cuadro).
- Disparar no espera nada: la navegación sigue en el mismo toque.
- El primer cuadro de la nube puede llegar un cuadro después del toque, mientras monta el `Canvas`; en el teléfono hay que confirmar que no se nota.

**3.5.**
- `ProveedorRevela`: los bloques anotan su umbral y una sola reacción revisa todos.
- Las placas que caen ya tenían un reloj por grupo, y los odómetros una animación por columna que termina sola.

**3.6.** `haptico` es la única puerta al motor:
- respeta el ajuste de hápticas;
- no dispara dos vibraciones con menos de 40 ms entre sí;
- nunca se llama desde un loop (solo por eventos);
- la de fin de sesión, que iba directa a `expo-haptics`, ahora pasa por ahí.

**3.9.** Umbrales y reglas en DESIGN.md, «Niveles de calidad».

| Nivel | Condición | Qué cambia |
|---|---|---|
| Alta | ≥ 6 GB y de 2019 en adelante (o sin datos) | nada |
| Media | < 6 GB o anterior a 2019 | polvo al 60 % |
| Baja | < 3 GB o anterior a 2016 | sin polvo, latido ni pulsos de invitación; aplauso al 40 %; sin parallax en listas |

- El ahorro de batería y reducir movimiento bajan un nivel cada uno.
- `EXPO_PUBLIC_CALIDAD` fuerza el nivel.
- `expo-device` y `expo-battery` son nativos: hace falta un build nuevo.

**H-03 (`useTick`) se queda.** DESIGN.md documenta el caso real que lo motivó (`useCapa` en
Presentación, con esta misma versión de Reanimated). Quitarlo de los 88 archivos sin ver el
resultado en un teléfono podría devolver estilos congelados. Con el compilador de R4 los re-renders
bajaron mucho, y con ellos lo que cuesta `useTick`. **Pendiente:** probar en el teléfono quitándolo
fuera de `useCapa`.

## 4. Fugas encontradas y corregidas (3.7)

| Archivo | Causa | Solución |
|---|---|---|
| `features/ajustes/components/HojaConfirmacion.tsx` | La acción confirmada quedaba en un `setTimeout` sin guardar; un segundo toque la repetía y podía correr sobre otra pantalla (H-20) | `useTemporizador({ alDesmontar: 'ejecutar' })`: un solo pendiente, sin segundo toque; al desmontar, la acción ya confirmada corre en ese momento |
| `features/perfil/components/FilaMedicion.tsx` | `Keyboard.addListener` que solo se quitaba si el teclado subía (se acumulaban, H-20) y un `setTimeout` de desplazamiento sin cancelar | Una sola escucha en ref, quitada antes de otra y al desmontar; `useTemporizador` |
| `features/aprender/components/PreguntaAcordeon.tsx`, `features/programas/screens/DetallePrograma.tsx`, `features/ajustes/components/IndiceSecciones.tsx` | `setTimeout` de manejador sin guardar (desplazamientos y resaltes apilados) | `useTemporizador` |
| `features/rutinas/hooks/useEditorRutina.ts` | La ref del temporizador se pisaba: al salir solo se cancelaba el último agregado | Un `Set` de esperas, todas canceladas al salir |
| `storage/lecturaInicial.ts` | La promesa del `multiGet` retenía el JSON completo del estado toda la vida de la app | Se suelta al entregar la última clave |
| `ui/components/FotoOscura.tsx` + `ui/fx/Esqueleto.tsx` | El brillo seguía para siempre si la foto fallaba (sin `onError`) y también con la pantalla tapada (H-19) | `onError` y `useLoopActivo` |
| `ui/components/movimiento.tsx` (`Pulso`) | `Animated.loop` sin detener (H-20) | Reanimated con `cancelAnimation` y pausa por foco |
| `features/sesion/hooks/useAtmosferaFase.ts` | Respiración y latido sin `cancelAnimation` al desmontar | Limpieza en los dos efectos |
| `features/ejercicio/components/FilaRespiracion.tsx`, `ui/components/RielVertical.tsx`, `ui/components/FilaCrear.tsx` | Loops en el hilo de UI con la pantalla tapada (H-19) | `useLoopActivo` |
| `ui/hooks/useLoopActivo.ts` | Una escucha nativa de AppState por loop (31 con Hoy abierta) | Una sola, compartida con `useSyncExternalStore` |
| `state/voz.ts`, `state/consentimientoMedidas.ts`, `state/maquina.ts` | La lectura de AsyncStorage pisaba un cambio hecho mientras llegaba y escribía tras desmontar | Bandera `vivo` y `tocado`; en `maquina`, lo leído va debajo de lo nuevo |
| `ui/fx/MagnesiaOverlay.tsx` | `Canvas` a pantalla completa vivo siempre (H-10) | Solo durante el aplauso |

Ya estaban bien y no se tocaron:
- 31 temporizadores, 15 escuchas y 11 operaciones asíncronas;
- los reproductores de sonido, voz y video;
- las cachés acotadas.

`Speech.stop` con `setState` al desmontar (H-20) ya no existe: la voz vive en `controladorVoz` desde R4.

**Prueba de fugas en Jest** (`tests/unit/renders/fugas.test.tsx`):
- Bienvenida, Hoy, Explorar, Aprender, Yo, Ajustes, ficha, rutina y programa se abren y se cierran **20 veces cada una**.
- Al final quedan **0** temporizadores, **0** escuchas de AppState y del teclado, **0** players y **0** callbacks por cuadro.
- La prueba verifica que con las pantallas abiertas sí había escuchas y temporizadores, así que el cero cuenta.
- El reproductor y Resumen los cubre `sesionLarga.test.tsx`.

**Memoria en el teléfono** (`dumpsys meminfo`: al inicio, a las 10 y a las 20 aperturas por pantalla): **pendiente**.

## 5. Sesión de 10 minutos (3.10)

`tests/unit/renders/sesionLarga.test.tsx`:
- 10 minutos de la rutina más larga (rt_010), con reloj falso y marcando «Listo» en las series por repeticiones.
- Se toma una muestra por minuto.

| Minuto | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Temporizadores vivos | 1 | 1 | 2 | 2 | 2 | 2 | 1 | 1 | 1 | 1 |
| Escuchas de AppState | 4 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 4 |
| Players de video (el preparado) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Renders de la app en el minuto | 1 200 | 1 388 | 1 275 | 1 619 | 1 185 | 1 184 | 1 212 | 834 | 812 | 834 |

Nada crece con el tiempo. Pendiente en el teléfono, con la pantalla encendida:
- FPS UI/JS en los minutos 1, 5 y 10;
- memoria al inicio y al final;
- batería consumida;
- temperatura.

## 6. Verificación

| Chequeo | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npm run lint` | 0 errores, 0 avisos |
| `npm run test:unit` | 16 suites, 146 pruebas |
| Pruebas `test:*` | 463 |
| `circulares`, `muerto`, `lint:color`, `lint:capas` | OK |
| Línea de tiempo del reproductor (5 min, R4) | idéntica |
| `expo-doctor` | 19/21: los mismos 2 fallos de red |
| `.hbc` Android | 5 889 446 → 5 934 745 B (+45 KB: pools, calidad, `useLoopActivo`, `useTemporizador`) |

**Pendiente en el teléfono:**
- FPS UI/JS de cada animación del catálogo (antes y después, 3 corridas).
- Memoria de la prueba de fugas.
- Sesión de 10 minutos.
- Capturas o videos lado a lado en calidad alta: aplauso, textura (el archivo no cambió), barrido de fase, carrusel con profundidad, mapa de carga.
- Reducir movimiento activado y los tres niveles de calidad (`EXPO_PUBLIC_CALIDAD`).
- SMOKE completo.
- `[bloqueo-js]` en logcat durante las interacciones.
