# DARENOW · Goma y Magnesia

La app se siente como el piso de un gym a las 6 am: goma negra con motas de color, magnesia blanca en el aire y las placas olímpicas como única fuente de color.

Tokens en `src/theme/`. Cualquier color, tipografía, espacio o movimiento sale de ahí. `npm run lint:color` falla si aparece un hex o `rgba()` fuera de `src/theme/`.

## Principios

1. Una firma, no mil efectos: el aplauso de magnesia y la barra de placas. Lo demás es disciplinado.
2. El movimiento tiene masa: resortes pesados, overshoot mínimo. Las cosas caen y asientan.
3. El color significa algo. Azul = acción. Verde, amarillo y rojo = veredicto científico (Comprobado, Parcial, Mito) y placas de progreso. Nunca decorativo.
4. Foto a sangre, texto anclado abajo. Sin huecos muertos.
5. Sin brillos falsos, insignias «PRO», confeti ni gamificación que castigue.

## Color (`colors.ts`)

| Token | Hex | Uso |
|---|---|---|
| `goma` | `#1B1C1E` | Fondo base |
| `gomaAlta` | `#242528` | Tarjetas, hojas, tab bar |
| `gomaBorde` | `#34363A` | Divisores y bordes finos |
| `magnesia` | `#F2F1EC` | Texto principal, íconos activos |
| `magnesia2` | `#B9B7B0` | Texto secundario |
| `magnesia3` | `#7E7C77` | Íconos inactivos, bordes de control, texto no esencial |
| `placaAzul` | `#2553E8` | Acción: botón primario, indicador activo, foco |
| `placaAzulPresionado` | `#1C43C4` | Estado presionado |
| `placaVerde` | `#1FA463` | Comprobado, placa 1 |
| `placaAmarilla` | `#F2C230` | Parcial, placa 2 |
| `placaRoja` | `#E0412F` | Mito, placa 4 |

Reglas: verde, amarillo y rojo solo en insignias y en la barra de placas. Sin degradados de dos colores; solo foto → `goma` y variaciones de un mismo tono. Sombras grises suaves no existen: la profundidad es superficie más clara más borde de 1 px. Solo el botón primario lleva resplandor azul, y solo en iOS.

### Variantes medidas para AA

Medido con `node scripts/contraste.js`. Cuatro tokens del brief no pasan 4.5:1 como texto, así que existen variantes de texto y los originales se quedan para relleno, punto, borde e ícono.

| Caso | Original | Medido | Variante de texto | Medido |
|---|---|---|---|---|
| `magnesia3` sobre `gomaAlta` | `#7E7C77` | 3.68 | `magnesia3Texto` `#96948E` | 5.05 |
| `placaAzul` como texto sobre `gomaAlta` | `#2553E8` | 2.54 | `placaAzulTexto` `#6F8DFF` | 5.06 |
| Verde sobre su tinte al 16 % | `#1FA463` | 3.83 | `placaVerdeTexto` `#3DBE7A` | 5.18 |
| Rojo sobre su tinte al 16 % | `#E0412F` | 3.13 | `placaRojaTexto` `#FF6F5E` | 4.84 |

«Saltar» va en `magnesia2`, no en `magnesia3Texto`: cae sobre una foto y, con el scrim superior, `magnesia3Texto` mide ~3.5:1 y `magnesia2` ~5.2:1.

Blanco sobre `placaAzul`: 6.03. Sobre `placaAzulPresionado`: 7.93. Amarillo sobre su tinte: 6.34.

### Nombres antiguos

`color`, `degradado`, `insignia`, `sombra`, `radio` y `esp` conservan sus nombres y apuntan a la paleta nueva. Así las pantallas que no se rehacen heredan el sistema sin cambiar de API. `color.acento` es `placaAzulTexto` porque se usa como texto y glifo; el relleno de acción es `color.carbon`.

`colorSesion` (Reproductor) no se toca: fuera del alcance de este rediseño.

## Tipografía (`typography.ts`)

| Rol | Fuente | Tamaño / interlineado |
|---|---|---|
| `display` | Big Shoulders Display 800, tracking −0.5 | 46 / 44 |
| `h1` (título de sección o tarjeta) | Big Shoulders Display 700 | 26 / 28 |
| `numero` | Big Shoulders Display 800 | 40 / 40 |
| `cuerpo` | Figtree 400 | 16 / 24 |
| `cuerpoEnfasis`, botones | Figtree 600 | 17 / 22 |
| `etiqueta` | Figtree 500, tipo oración | 13 / 18 |
| `wordmark` | Big Shoulders Display 700, tracking 2 | 20 / 24 |

Big Shoulders no trae la característica `tnum`, así que `Odometro` mide cada celda de dígito con ancho fijo en vez de fiarse de `tabular-nums`. `@expo-google-fonts/big-shoulders-display` está marcado como deprecado (Google Fonts retiró ese nombre); los TTF van empaquetados y funcionan, solo que ya no reciben actualizaciones.

## Espacio y radios (`spacing.ts`)

Escala 4, 8, 12, 16, 24, 32, 48, 64. Margen lateral 24. Radios: foto en tarjeta 20, tarjeta 24, nota e insignia 8, botón primario 999 (alto 58).

## Movimiento (`motion.ts`)

| Token | Valor |
|---|---|
| `resortePlaca` | damping 15, stiffness 190, mass 1.2 |
| `resorteMagnesia` | damping 22, stiffness 120, mass 0.8 |
| `resorteTap` | damping 18, stiffness 400 |
| `dur` | rápido 140, medio 260, lento 480 ms |
| `easing.salida` | bezier(0.16, 1, 0.3, 1) |
| `easing.entrada` | bezier(0.7, 0, 0.84, 0) |

Todo corre en el hilo de UI con Reanimated. Solo se anima `transform` y `opacity` (la excepción es el ancho del botón, con layout animation). Cada efecto respeta `useReducedMotion`.

## Háptica (`haptics.ts`)

Respeta el ajuste existente de Ajustes (`forja:haptics`). Toque: Light. Aplauso: Heavy y, 90 ms después, Soft. Placa: Medium. Sello: Rigid. Pestaña: selección. Los dígitos del odómetro no vibran.

## Fotos

Las fotos actuales son claras y de baja resolución (447x800 y 800x423). Mientras no lleguen las nuevas (`docs/IMAGENES.md`), `FotoTratada` las dibuja con Skia `ColorMatrix`: -35 % de saturación, exposición 0.72 y sombras un poco hacia azul frío. Sobre eso, un degradado transparente → `goma` (anclas 0.2, 0.5, 0.78, 1) y un scrim oscuro de 120 px arriba para que se lea el encabezado. `TRATAR_FOTOS = false` (en `FotoTratada.tsx`) desactiva el tratamiento cuando llegan las fotos nuevas, ya oscuras. El sobrante del recorte se alinea con `foco` (arriba en el onboarding, 55 %/30 % en la bienvenida) para no cortar cabezas.

## Resto de la app

- **Barra de pestañas** (`TabBarGoma`): flotante, con margen de 12 a los lados y sobre el borde inferior (`separacionBarra`), radio 24, borde de 1 px, `gomaAlta` con desenfoque en iOS (color al 96 % en Android), íconos `magnesia` activos y `magnesia3` inactivos, y una barrita `placaAzul` de 16×3 que se desliza bajo la pestaña activa con `resortePlaca`. El ícono que se activa entra de 0.9 a 1 con un toque de selección. Mientras se baja por una lista baja 8 px y se vuelve un 10 % más transparente: `useScrollCabecera` escribe la dirección en `barraBajada` (`hooks/useBarraFlotante`) y la barra la lee. `useHuecoAbajo` cuenta el alto de la barra más su separación. Una revisión anterior había pedido «ya no flotante» y se resolvió pegada; la Parte 3 pide explícitamente la flotante, así que ese punto queda superado.
- **Tarjetas**: `gomaAlta`, borde de 1 px, radio 24, sin sombra. Al presionar, escala 0.98 y 5 % más oscura (`Toque` con `oscurecer`).
- **Insignias**: un solo componente, `InsigniaEvidencia`. `Insignia` (la de las fichas) lo envuelve.
- **Notas**: `Nota` ya no usa amarillo ni rojo; solo sube el borde. Los colores de veredicto quedan para las insignias.
- **Transiciones**: las pantallas del Stack entran con fundido y escala 0.98 → 1 (`screenLayout` en `App.tsx`); `Tabs` con 1.02 → 1. Reproductor, Resumen, Bienvenida y EditorRutina conservan la suya. No hay transición de elemento compartido: en Reanimated 4 con el Stack nativo todavía es experimental.
- **Cabeceras que se encogen**: Yo usa `TituloGrande` + `BarraCompacta`: el título grande se encoge y se desvanece (0 a 56 px de scroll) y aparece una barra compacta (40 a 72 px). Hoy usa `HeaderColapsable` (ver más abajo). Explorar y Aprender tienen su cabecera fija con buscador y pestañas internas, así que no se encoge.
- **Margen lateral** 24 en todas las pantallas de pestaña.
- Se quitó el barrido de luz (`Brillo`) y el resplandor de fondo: brillos falsos.

## Piso de goma

`GomaTexture` tesela `assets/img/goma-tile.png`: grano fino al 10 % de alfa máximo y 18 motas de color al 6 %. Un solo bitmap para todas las pantallas, sin trabajo por fotograma. Se regenera con `npm run goma` (semilla fija).

Desviación del brief: pedía Skia. Un `Canvas` de Skia por pantalla son N superficies GPU vivas a la vez, porque el Stack nativo mantiene montadas las de abajo; un tile compartido cuesta un bitmap y se ve igual.

## Cuenta, cuestionario y plan listo (Parte 2)

- **Botón de Google** (`BotonGoogle`): variante oscura de la marca (`#131314`, borde `#8E918F`, texto `#E3E3E3`, tokens `google` en `colors.ts`), logo «G» oficial dibujado con Skia desde su ruta SVG, cápsula de 58. El texto va en Figtree, no en Roboto que sugiere la guía. Mientras espera, tres puntos de magnesia reemplazan al texto y el botón no cambia de tamaño.
- **Botón bloqueado** (`BotonPlaca`): superficie vacía (`gomaAlta` con borde) y texto `magnesia3Texto`. Al habilitarse, el azul lo llena de izquierda a derecha en 320 ms y da un toque Light; al bloquearse, se vacía al revés. Aplica a todos los botones primarios, no solo al del cuestionario. Con `brillo` da un único barrido de luz (solo lo usa «Empezar» del plan).
- **Barra de carga** (`BarraCarga13`): una placa por paso, con el total dinámico. El cuestionario tiene 14 pasos definidos y arranca contando 13 porque el peso objetivo se omite hasta responder el peso; con «gym» se omiten tres. Háptica Medium solo en los pasos 5, 9 y el último.
- **Transición**: `useTransicionPaso` saca el contenido actual (24 px y opacidad 0, 180 ms), cambia el paso y el contenido nuevo entra con sus propias animaciones (título por máscara, zona de respuesta desde 24 px). La barra y los botones no se mueven. Ignora toques mientras corre.
- **Opciones** (`OpcionCuestionario`): se hunden, borde y fondo pasan al azul, el indicador se llena, la palomita se dibuja de trazo (`PalomitaTrazo`, Skia) y sale una nube de 10 partículas. Esa nube reutiliza el motor de `MagnesiaOverlay` (`mini`); no hay un Canvas por fila. Íconos de objetivo: Ionicons de línea.
- **Contador** (`ContadorPlacas`): número de 120 que rueda hacia arriba o hacia abajo (`Odometro continuo`), botones de 64, sacudida y háptica de aviso en los límites, y la semana de siete placas solo para los días por semana. El número se sigue pudiendo tocar y escribir, con el mismo acotado de antes.
- **Nombre**: `SaludoPreview` muestra el saludo real (`saludo()` de `mensajes.ts`) mientras se escribe.
- **Plan listo** (`PlanListo`): tres `PlacaDato` que caen con su golpe. El filo verde, amarillo y azul es una excepción a la regla del color: representan las tres «cargas» del plan. Las etiquetas de «Sin saltos ni ruido», «Zonas protegidas» y los avisos se conservan bajo las placas; el contenido hace scroll si no cabe. El destello de magnesia (`destello()`) sustituye a la barra que se comprime.
- **Errores de Google**: el texto usa `placaRojaTexto` (AA), no el rojo puro.

## Hoy (Parte 3)

Un solo azul por vista en la tarjeta de la sesión: «Empezar». Lo demás es `goma`, `gomaAlta` y `magnesia`. Entre los tres primeros bloques hay 32 px y en el resto del feed 48. Los títulos de módulo son Big Shoulders 700: 26 en «Elige tu enfoque» y «¿Prefieres otra rutina?», 24 en el resto.

- **`HeaderColapsable`** (`fx`): saludo Figtree 500 15, título Big Shoulders 800 de 40 y botón de búsqueda de 44. De 0 a 80 px de scroll el título pasa a 22 px con `scale` y `translateY` (no cambia `fontSize`), el saludo se desvanece y todo sube hasta una barra de 52 px `goma` al 92 % con borde inferior (con desenfoque en iOS). Con movimiento reducido cambia en un solo paso al pasar de 80 px.
- **`TarjetaSesionHoy`** («la barra de hoy», `ui`): `TarjetaGoma` de radio 28. Objetivo en Figtree 600 15 y dos cifras de Big Shoulders 800 36 con su unidad (`Odometro continuo`). Debajo, los ejercicios (`MiniaturaEjercicio`, `FlatList` con `getItemLayout`): foto cuadrada de 112, número de orden, nombre a 2 líneas completas; el tamaño se decide por el nombre más largo de la lista (13 px, 12 px o miniatura de 128), nunca se trunca. La foto interior va al 85 % de la velocidad (desplazamiento máximo de 8 px). Los avisos del motor van como `NotaEntrenador`. `BotonPlaca` con aplauso es el único azul; `BotonFilaSecundario` es una fila de 48 con borde de 1 px y radio 16, sin relleno, con un dial de 20 px que marca 45 min y gira hasta 5 en 300 ms al tocar. Al subir con el scroll (0 a 260 px) la tarjeta baja a 0.97 y 85 % de opacidad.
- **Entrada «cargar la barra»** (una vez por sesión de la app, `barraCargadaEnEstaSesion` a nivel de módulo): la tarjeta sube 20 px con `resorteMagnesia`; los números ruedan; las miniaturas visibles llegan desde la derecha una tras otra (70 ms, `resortePlaca`) como discos que se cargan, con una sola háptica Medium al asentarse la última visible; al terminar, «Empezar» da un único barrido de brillo de 600 ms.
- **Hecho hoy**: la etiqueta «Hecho hoy» (Figtree 600 13, fondo `goma`, radio 8, huella de 12) va junto al objetivo, una huella de 120 al 10 % se estampa en la esquina superior derecha y «Entrenar otra vez» pasa a `BotonSecundario`. Al volver a Hoy con una sesión nueva terminada hoy la huella cae de 1.3 a 1 con háptica Medium (`useFocusEffect`, no al montar).
- **`TarjetaEnfoque`** (`ui`) 280×300 con `CarruselProfundidad` (`fx`): el enfocado a escala 1 y opacidad 1, los vecinos a 0.92 y 0.7; el atleta se adelanta a 1.2× y gira ±4° en Y. Si existe `<id>_recorte` el atleta rompe el marco 24 px por arriba sobre un foco de `magnesia` al 10 %; si no, la foto ocupa la tarjeta con un degradado a `gomaAlta`. Nombre en Big Shoulders 800 28, `NivelPlacas` (placas de 6×16: `magnesia` hasta el nivel, `gomaBorde` el resto, máximo 3) y `BotonCompacto` «Inicio» de 40. Al presionar se oscurece un 6 % y el atleta sube 6 px y escala 1.03 (`Presionable` con `presion` compartida).
- **`TarjetaRutina`** de 240: foto de 150 con el tratamiento de color, duración una sola vez en una insignia abajo a la izquierda (`goma` al 80 %, radio 8), título a 2 líneas y, en las del catálogo, su objetivo como subtítulo; las propias llevan «Mi rutina», `BarraRutina` y una `Huella` de 12 si ya se hicieron. Carrusel en versión suave (0.96) con parallax interior al 85 %. `EstrellaFavorito` de 40 (`goma` al 70 %): al marcar se llena (0 → 1.2 → 1, `resortePlaca`) con una nube chica de magnesia y háptica Light; al quitar se vacía (1 → 0.85 → 1) sin partículas.
- **Tu semana**: `FilaSemana` (siete columnas: inicial, número Big Shoulders 700 de 20 en una celda de 44×56; una huella de 14 bajo el número en los días con sesión, marco azul de 2 px que se dibuja en hoy con un único `Canvas` de Skia, los días sin sesión solo el número, los futuros en `gomaBorde`; columnas escalonadas 35 ms y huellas estampadas 60 ms, una vez por sesión de la app) y debajo, sin fondo, la racha en Big Shoulders 800 de 48 con «días seguidos» en minúscula y `SieteDias` (barras de 64 con piso en los días sin actividad y un punto azul en hoy).
- **`BloqueRevela`**: solo tres bloques bajo el pliegue se revelan con fundido y 24 px (Tu semana, Explorar todo y Tu programa), una sola vez, y arrancan sus cifras al entrar. El bloque de estadísticas solo activa sus números al entrar, sin movimiento propio. El resto es estático.
- **Explorar todo**: fila de 72 (`gomaAlta`, radio 20) con los tres conteos de `ESTADISTICAS` en Big Shoulders 700 de 18 separados por un punto; ruedan desde 0 la primera vez que entra; el chevron se adelanta 4 px al presionar.
- **Tu programa**: `TarjetaGoma` con foto de 72, nombre completo, descripción en 2 líneas que se desvanecen (`TextoDesvanecido`, sin puntos suspensivos) y «Semana N de M» sobre `BarraCarga13` (una placa por semana, la actual en azul).
- **Programas**: tarjetas de 240 con el efecto de pila compacto (dos tarjetas detrás, a 4 y 8 px), duración una sola vez en la insignia («12 sem»).
- **Ejercicios para ti**: fichas de 150 con foto de 150×120, nombre a 2 líneas, categoría con inicial en mayúscula, `NivelPlacas` y la insignia de evidencia pequeña si el ejercicio la tiene. **Músculos de hoy**: `FichaMusculo` cuadrada de 112 con radio 24 (usa `<id>_hoy` si existe). **Para leer hoy**: `TarjetaArticulo` de 240 con foto 240×130, la sala con un ícono y el título en Big Shoulders 700 de 18 hasta 3 líneas.
- **Estadísticas**: cuatro `PlacaDato` en una fila (número de 32), plurales correctos y 32 px de aire al final.
- **Fotos de lista** (`FotoOscura`): `expo-image` con `cachePolicy="memory-disk"`, exposición 0.8 sobre `gomaAlta`, velo a goma y `Esqueleto` (barrido de 1.2 s) mientras decodifica. El tratamiento con Skia se reserva para las fotos grandes: un `Canvas` por tarjeta no escala.
- **Arrastrar para actualizar**: `RefreshControl` nativo (sin spinner en iOS) más una nube de magnesia (`NubeRefresco`) que crece con el jalón donde hay desplazamiento negativo (iOS) y «explota» al soltar (`mini`). Los datos son locales; solo se vuelve a leer la fecha.
- **Ortografía**: los nombres y títulos de ejercicios, rutinas, programas, músculos, salas y tips se corrigen al mostrarse (`nombreVisible`); el dato no se toca porque es clave de búsqueda.
- **Movimiento reducido**: sin encogimiento del encabezado, parallax, giro del atleta ni escala al subir; sin carga escalonada, odómetro ni brillo; la barra de pestañas no baja. El atleta que rompe el marco se mantiene. Quedan los fundidos.
- **No construido**: la expansión de la tarjeta al reproductor con elemento compartido (el Stack nativo no la soporta de forma estable con Reanimated 4), el resalte muscular en la tarjeta de enfoque (no hay dos versiones de la imagen) y el elemento compartido de «Tu programa». `TextoDesvanecido`, `BarraRutina`, `SieteDias`, `Huella`, `NivelPlacas`, `FichaMusculo`, `TarjetaArticulo` y `AccionSeccion` se crearon aquí en su versión mínima porque las Partes 6 a 12 no existen en el repo; el «mini medidor de evidencia» es la `InsigniaEvidencia` pequeña.

## Sesión de entrenamiento (Parte 4)

**Excepción a la regla del azul único: modo sesión.** Dentro del reproductor, la fase se lee de lejos por el color de su placa. Solo aquí:

| Fase | Color | Texto de la palabra |
|---|---|---|
| Prepárate (y «Cambia de lado») | `placaAmarilla` | `placaAmarilla` |
| Trabaja | `placaRoja` | `placaRojaTexto` |
| Descansa | `placaAzul` | `placaAzulTexto` |

Los textos usan la variante medida para AA (la roja y la azul puras no llegan sobre `goma`). El fondo es **siempre** `goma` + `GomaTexture`; el color vive en el anillo, la palabra, un resplandor difuminado al 14 % detrás del anillo y la placa actual de la barra de progreso. La pausa conserva el color de la fase que interrumpe. «Ya estoy» en Descansa no es azul (competiría con el ambiente): es sólido `magnesia` con texto `goma`. El mapa vive en `theme/fases.ts`.

- **«¿Listo?»** (`PantallaListo`, `TextoDeParticulas`): 200 partículas de magnesia viajan desde toda la pantalla hasta puntos del contorno (55 %, con `Skia.Path.MakeFromText` y `ContourMeasureIter`) y del relleno (`path.contains`) del texto en 700 ms; luego aparece el texto sólido y cae un polvo leve (8 partículas). Empieza a deshacerse hacia arriba 400 ms antes de terminar y, al vencer los 3000 ms de siempre, el aplauso de magnesia cubre el paso. La pantalla no espera ninguna carga: dura lo mismo que antes. El texto es un trazo de la fuente Big Shoulders 800.
- **Editor** («Tu rutina de hoy»): tarjetas de ~260 px (miniatura de 88, número de orden, nombre a 2 líneas, «Cambiar» con área de 44) con tres `Stepper` de 44 px, valor de Big Shoulders 24 que rueda, sacudida de 4 px y aviso en el límite, y el valor se sigue pudiendo escribir. El total (`TotalPegajoso`) es cabecera pegajosa del scroll y rueda con pulso 1.06. «Cambiar» hace un giro de tablero (`rotateX`, 2×130 ms). «Empezar rutina» va fijo abajo: hace lo mismo que antes y no exige haber recorrido la lista.
- **Reproductor** (`ReproductorLayout`): barra de una placa por ejercicio, cabecera, palabra de fase, anillo con el número dentro, nombre, serie, modelo, tarjeta «Sigue» y acciones. El anillo mide `clamp(29 % del alto, 227, 260)` y el número `160/260` de eso (140 px o más); con minutos («1:05») baja al 87.5 % para caber. Un solo `Canvas` de Skia dibuja anillo y resplandor.
- **El anillo no lleva reloj propio.** `restanteS` es la única fuente. Cada vez que cambia, el progreso se fija en `restanteS / total` y se anima linealmente hasta el valor del segundo siguiente en 1000 ms; en pausa se congela. Al cambiar de fase se rellena en 240 ms. `total` sale del propio ejercicio (`PREPARACION_S`, 5 de cambio de lado, `segPlan`, `descansoPlan`). Sin final previsible (trabajo por repeticiones) el anillo queda lleno.
- **Transición de fase.** Círculo del color nuevo que crece desde el anillo a 22 % (380 ms) y se apaga (300 ms) — es una vista circular escalada, no una máscara de Skia, para no tener un segundo `Canvas` a pantalla completa —; palabra estampada (1.3 → 1); número que entra rodando (se remonta por fase); háptica Heavy al entrar a Trabaja, Soft a Descansa y Medium a Prepárate. Nunca provoca ni retrasa el cambio: reacciona a él.
- **Últimos 3 segundos** (también en Descansa): golpe de escala 1 → 1.15 → 1 y háptica Rigid en 3, 2 y 1. A la mitad del trabajo la marca del anillo destella, sin háptica. Al terminar el último set de un ejercicio, su placa se asienta y la háptica es Medium (antes Light).
- **Descansa:** el anillo respira (8 s por ciclo, 1 → 1.08 → 1) y bajo el nombre se cruzan «Inhala» y «Exhala» al mismo ritmo. Solo visual. Sin el modelo, el contenido se centra en la pantalla.
- **Pausa** (`OverlayPausa`): solo en la pausa manual. La pausa que se abre mientras habla la voz conserva el aspecto de la fase, sin velo. Velo `goma` al 40 % con desenfoque en iOS y al 85 % en Android; el anillo y el número se congelan y el número baja a media opacidad. Con la hoja de salida abierta no se dibuja.
- **Salir** (`HojaSalida`): hoja inferior `gomaAlta` con esquinas superiores de 28; mismos motivos y texto. **Omitir**: el modelo sale hacia arriba con fundido (240 ms) y la háptica pasa de Warning a Light; la placa omitida queda con una diagonal (solo si todas las series de ese ejercicio se omitieron).
- **Resumen** (`ResumenSesion`): el último color de fase se contrae al centro y se vuelve polvo; título por máscara; racha de 120 en `magnesia` (deja de ser azul) que rueda (en 0 da una vuelta entera y cae en 0); tres `PlacaDato` con filo neutro y golpe solo la última; medalla del logro (`PlacaMedalla`, vistas y no Skia: un `Canvas` no gira bien en Y en Android) que cae girando una vuelta y media, con golpe Heavy y tres nubes chicas (30 partículas) y un brillo; «Cómo se sintió» como escala de esfuerzo (`EscalaEsfuerzo`: placas de 32, 44, 56 y 68 en verde, amarilla, azul y roja, con háptica creciente). La selección sigue siendo solo local (BUG-3).
- **Accesibilidad:** el número tiene una etiqueta exacta pero no anuncia cada segundo: la fase se anuncia al cambiar y el tiempo cada 10 s con `announceForAccessibility`. Todo lo tocable en sesión es de 48×48 o más.
- **Movimiento reducido:** «¿Listo?» solo aparece con un fundido; el número cambia sin rodar; el anillo sigue vaciándose (es información) pero sin respiración, destellos ni resplandor que respira; la fase cambia de color con un fundido de 150 ms, sin barrido ni estampado; el resumen aparece colocado; la medalla queda fija. La háptica se conserva.
- **Desviaciones del brief:** el modelo ocupa lo que sobra entre el nombre y las acciones (no el 40 % del alto: con el anillo de 227 px y el resto de controles no cabe); siempre va en una ficha `magnesia` de radio 24 porque los clips y las fotos tienen fondo claro, y no se construyó la variante de PNG transparente (no hay recortes). No hay horizontal: la app es solo vertical.

## Ficha de ejercicio (Parte 5)

**Extensión a la regla de color.** `placaVerde`, `placaAmarilla` y `placaRoja` siguen siendo los veredictos (Comprobado, Parcial, Mito). `placaRoja` también marca los **errores comunes**, porque significan lo mismo que «Mito»: «esto no». `placaAzul` solo aparece si hay una acción principal (hoy no la hay: el botón inferior es secundario). Los resaltes rojos y azules de músculos dentro de las imágenes 3D son parte de la ilustración y no se tocan.

- **Hero** (`HeroEjercicio`): 46 % del alto de la pantalla, sin cuadro. Con `<id>_recorte` (PNG transparente) va sobre `goma` con un foco de `magnesia` al 10 % y una elipse de piso; si solo hay el clip o la foto (fondo claro), en una ficha `magnesia` a sangre con esquinas inferiores de 28 y un degradado a `goma` en el 20 % de abajo. Un velo oscuro arriba deja leer la hora y los botones. Con el scroll el modelo sube a 0.5× y se desvanece entre 0 y 60 % de su alto; al jalar hacia abajo (iOS) se estira hasta 1.12 desde su base (en Android no hay overscroll elástico y se omite). Entra con escala 0.94 y fundido: la transición de elemento compartido no se usa (el Stack nativo no la soporta de forma estable con Reanimated 4).
- **`BarraSuperiorColapsable`**: atrás y favorito de 44 (`goma` al 70 %) flotan sobre el modelo; al salir el modelo aparece una barra `goma` al 92 % con borde inferior y el nombre en Figtree 600 16 (fundido y 8 px), y los botones pierden su fondo. Con movimiento reducido aparece en un solo paso. El encabezado nativo del Stack se oculta en esta ruta. Sin desenfoque en los botones (solo en la barra, en iOS).
- **Encabezado**: nombre en Big Shoulders 800 de 40, nombre en inglés en Figtree 15 `magnesia3`, metadatos en una línea (`NivelPlacas` + «Nivel N», categoría, «Por lado», «Impacto alto», «Ruidoso») separados por un punto dibujado de 3 px, y la descripción en Figtree 17/26.
- **Qué dice la evidencia** (`TarjetaEvidencia`, `MedidorEvidencia`): `TarjetaGoma` con un filo izquierdo de 3 px del veredicto dominante (el que más se repite; en un empate gana el más serio). Medidor de 10 px con un segmento proporcional por veredicto y un resumen solo con los conteos («3 comprobados, 1 parcial»). Cada afirmación es una fila de 48 con su `InsigniaEvidencia`; en un «mito» la afirmación lleva un tachado `placaRoja` (`Tachon` de `TachadoMito`, sin su sello: la insignia ya lo dice). La nota es una `NotaEntrenador` con la barra del color dominante. Al entrar el 40 % de la tarjeta: el medidor se llena segmento a segmento (600 ms), las filas entran escalonadas 70 ms (fundido y −8 px), cada insignia se estampa (1.35 → 1 y −3° → 0, `resortePlaca`, háptica Rigid; con más de 5 afirmaciones solo las 3 primeras), el tachado se dibuja 300 ms después de su sello y la nota entra al final. Con movimiento reducido todo aparece puesto y sin háptica.
- **Cómo se hace** (`PasosLineaTiempo`): línea de tiempo vertical con un círculo de 28 por paso. La línea se llena de `magnesia` conforme se baja (la «línea de lectura» está al 60 % de la pantalla) y cada círculo se rellena con `resortePlaca` cuando la línea lo alcanza; al subir se vacía. **Respiración** (`FilaRespiracion`): anillo de 44 que respira (8 s por ciclo), con el trazo alternando `magnesia` y `magnesia3` si el texto habla de inhalar y exhalar.
- **Claves y errores** (`ListaClaves`, `ListaErrores`): filas de 36 con una palomita `placaVerde` o una X `placaRoja` de 18, dibujadas de trazo y escalonadas 80 ms una vez; la X son dos barras que crecen desde su centro. Si solo existe una de las dos secciones, se muestra sola.
- **Músculos** (`FichaMusculo`): fichas cuadradas de 104 con radio 24. Los principales llevan un borde de 2 px `magnesia` y la marca «Principal». El nombre va en una línea completa: la ficha se ensancha a 120 o el texto baja a 13 px según el nombre más largo de la fila; solo si aun así no cabe (unos 19 caracteres o más, como «Flexores de cadera (psoas ilíaco)») se parte en dos líneas por palabras, nunca a medias. Si existe `<id>_neutra` se cruza de la neutra a la resaltada en 400 ms al entrar. Al presionar se hunde un 5 % y abre el músculo.
- **Detalles** (`RejillaDetalles`): rejilla de dos columnas de celdas `gomaAlta` con radio 16. Los números (series, descanso, MET) van en Big Shoulders 28 con su unidad aparte y ruedan con `Odometro`; los textos, en Figtree 600 16. Las zonas de riesgo (icono `placaAmarilla`: cuidado, como «Parcial») y la familia ocupan las dos columnas.
- **Progresiones, regresiones y sustitutos** (`TarjetaAlternativa`): tarjetas de 160 con foto de 160×120. Progresión y regresión muestran su nivel en placas; el sustituto, un icono de intercambio.
- **Botón inferior**: `BotonSecundario` al final del contenido (es una acción secundaria: alterna el veto del ejercicio).
- **Ortografía y mayúsculas** (`utils/presentacion.ts`, `data/nombresVisibles.ts`): solo en la vista; nunca se usa en lógica, búsqueda ni identificadores.
- **Movimiento reducido**: sin estiramiento ni parallax (la barra aparece en un solo paso), sin estampado, sin llenado del medidor, sin línea de tiempo que se llena, sin anillo que respira, sin trazos dibujados y sin odómetro. La háptica se conserva solo en las acciones del usuario.

## Componentes

| Carpeta | Piezas |
|---|---|
| `components/ui` | `BotonPlaca`, `BotonCompacto`, `BotonFilaSecundario`, `NotaEntrenador`, `InsigniaEvidencia`, `TarjetaGoma`, `TabBarGoma`, `TarjetaSesionHoy`, `MiniaturaEjercicio`, `TarjetaEnfoque`, `FotoOscura`, `NivelPlacas`, `Presionable`, `TextoDesvanecido`, `AccionSeccion` (y `CabeceraSeccion`), `cabecera` (`TituloGrande`, `BarraCompacta`) |
| `components/fx` | `HeaderColapsable`, `CarruselProfundidad`, `Esqueleto`, `TextoDeParticulas`, `GomaTexture`, `FotoTratada`, `FotoParallax`, `MagnesiaParticles`, `MagnesiaOverlay` (`ProveedorMagnesia`, `useMagnesia`), `Odometro`, `TituloEstampado`, `TituloMascara` (y `TituloLetras`), `BarraPlacas`, `DialTiempo`, `TachadoMito`, `Entrada`, `Huella` |
| `components/hoy` | `CarruselHoy`, `TarjetaRutina`, `TarjetaPrograma`, `BarraRutina`, `EstrellaFavorito`, `FilaSemana`, `TuSemana`, `BloqueRevela`, `FilaExplorar`, `TuPrograma`, `TarjetasHoy` (`TarjetaEjercicioMini`, `FichaMusculo`, `TarjetaArticulo`), `EstadisticasHoy`, `NubeRefresco` |
| `components/session` | `PantallaListo`, `EditorAntesDeEmpezar`, `TarjetaAjusteEjercicio`, `Stepper`, `TotalPegajoso`, `ReproductorLayout`, `AnilloTemporizador`, `NumeroTemporizador`, `PalabraFase`, `TarjetaSigue`, `BarraProgresoSesion`, `OverlayPausa`, `HojaSalida`, `ResumenSesion`, `PlacaMedalla`, `EscalaEsfuerzo` |
| `components/exercise` | `HeroEjercicio`, `BarraSuperiorColapsable`, `MetadatosEjercicio`, `TarjetaEvidencia`, `MedidorEvidencia`, `PasosLineaTiempo`, `FilaRespiracion`, `ListaClaves`, `ListaErrores`, `FichaMusculo`, `RejillaDetalles`, `TarjetaAlternativa`, `TituloSeccion` |
| `utils` | `presentacion` (`capitalizar`, `textoVisible`, `textoDeAfirmacion`, `textoDeZonas`, `separarNumeroUnidad`) |
| `hooks` | `useReducedMotion`, `useFirstView`, `useWelcomeData`, `usePresentacion`, `useOnboarding`, `useTick`, `useBarraFlotante` |

Las imágenes nuevas, con nombre, tamaño y prompt, están en `docs/IMAGENES.md`.

## Reanimated 4 en este proyecto

- Todo estilo animado se escribe con un worklet inline que depende de valores primitivos. Un worklet creado por una función (`useAnimatedStyle(factoria(1))`) se recrea en cada render.
- `useAnimatedStyle` congela el estilo inicial al montar y un commit de React puede volver a aplicarlo. Donde una capa depende de un valor compartido que cambia fuera de su propio ciclo (`useCapa` en `Presentacion`), se cuentan los renders y se pasa el contador como dependencia: el mapper se reevalúa tras cada commit y la capa vuelve a su sitio.
- No se anidan vistas animadas cuando el padre solo aporta un desplazamiento: la barra de placas aplica el temblor a cada elemento, no a un contenedor.
- Un callback de UI que toca JS (`haptico`) se pasa por una función suelta y `runOnJS`, nunca un método de un objeto capturado.
- Un worklet no debe capturar el objeto de props completo: se desestructura antes (`const { y } = p`), o Reanimated intenta serializar las funciones y los datos de la sesión.

## Dependencias añadidas

`react-native-reanimated` 4.5.1, `react-native-worklets` 0.10.1, `@shopify/react-native-skia` 2.6.2, `@expo-google-fonts/big-shoulders-display`, `@expo-google-fonts/figtree`. No se instalan `react-native-gesture-handler` ni `react-native-svg`: ningún gesto ni SVG nuevo los necesita. Requiere un build nativo nuevo (dev client o EAS); no corre en Expo Go.
